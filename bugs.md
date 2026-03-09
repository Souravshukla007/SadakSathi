# 🐛 SadakSathi — Known Bugs & Issues

> **Last Audited:** 2026-03-09  
> **Source:** Static code analysis of all API routes, pages, components, and lib files.

---

## Severity Legend

| Level | Meaning |
|---|---|
| 🔴 **CRITICAL** | Will cause crashes, auth bypass, or data corruption |
| 🟠 **HIGH** | Broken functionality, incorrect behavior users will encounter |
| 🟡 **MEDIUM** | Logic issues, missing features, or degraded UX |
| 🟢 **LOW** | Minor issues, code smells, potential future problems |

---

## BUG-001 🔴 CRITICAL — JWT Payload Key Mismatch Between Signup and Google OAuth

**File:** `src/app/api/auth/signup/route.ts` (L33) vs `src/app/api/auth/google/callback/route.ts` (L78)

**Problem:**  
Signup creates a JWT with `{ userId: user.id, role: user.role }`, but Google OAuth creates one with `{ id: user.id, email, fullName, role }`. All downstream API routes (complaints/my, complaints/vote, account/profile, etc.) read `payload.id` — **not** `payload.userId`.

**Impact:**  
Users who sign up via email/password will get a JWT where `payload.id` is **undefined**. Every authenticated API call will fail with `401 Unauthorized` for email-signup users.

**Fix:**  
In `signup/route.ts`, change:
```diff
- const token = await signToken({ userId: user.id, role: user.role });
+ const token = await signToken({ id: user.id, email: user.email, fullName, role: user.role });
```

**Same bug also exists in:**  
`src/app/api/auth/login/route.ts` (L29) — uses `{ userId: user.id, role: user.role }`.

---

## BUG-002 🔴 CRITICAL — Middleware File Named Incorrectly (`proxy.ts`)

**File:** `src/proxy.ts`

**Problem:**  
Next.js App Router requires middleware to be in a file named `middleware.ts` (or `.js`) at the project root or `src/` directory. The file is named `proxy.ts` and exports a function named `proxy`, not `middleware`.

**Impact:**  
The middleware **never executes**. All route protection (auth checks, admin guard, redirect logic) is completely inactive. Protected pages like `/dashboard` and `/admin` are accessible without authentication.

**Fix:**
1. Rename `src/proxy.ts` → `src/middleware.ts`
2. Rename the exported function from `proxy` to `middleware`

---

## BUG-003 🟠 HIGH — Google OAuth Creates Users with Invalid Role Value

**File:** `src/app/api/auth/google/callback/route.ts` (L70)

**Problem:**  
Google OAuth creates new users with `role: 'Citizen Contributor'`. However:
- The Prisma schema has `@default("user")` for the role field.
- Signup uses `'user'`, `'admin'`, or `'contractor'`.
- The middleware admin check compares `role !== 'admin'`.

There is no `'Citizen Contributor'` role used anywhere else in the codebase.

**Impact:**  
Google-authenticated users will have an inconsistent role that may cause unexpected behavior in any role-based logic.

**Fix:**
```diff
- role: 'Citizen Contributor',
+ role: 'user',
```

---

## BUG-004 🟠 HIGH — Complaint Submission Modal Does NOT Submit to Backend

**File:** `src/app/complaints/page.tsx` (L169)

**Problem:**  
The complaint submission form's `onSubmit` handler is:
```tsx
onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}
```
It just closes the modal. No API call is made. No data is sent to any backend endpoint.

**Impact:**  
Users think they've submitted a complaint, but nothing is saved. Complete data loss.

**Fix:**  
Collect form data, POST to a complaint creation endpoint (needs to be created — currently no `POST /api/complaints` route exists).

---

## BUG-005 🟠 HIGH — Complaints Page Uses Entirely Hardcoded Data

**File:** `src/app/complaints/page.tsx` (L46-62, L87-148)

**Problem:**  
The stats section shows hardcoded values (`1,284` total issues, `452` pending, `128` in progress, `704` resolved) and the complaints grid shows three hardcoded complaint cards with Unsplash placeholder images. No data is fetched from the API.

**Impact:**  
The page is purely presentational. Users see fake data, not real complaints.

**Fix:**  
Fetch from `/api/complaints/feed` and compute stats from the response data.

---

## BUG-006 🟠 HIGH — Upload Page Simulates Progress Without Actually Uploading

**File:** `src/app/upload/page.tsx` (L31-45)

**Problem:**  
The `handleDropzoneClick` function simulates fake progress with `setInterval` incrementing by 5% every 150ms. No actual file is selected, no file input element exists, and no upload request is made.

The "Browse Files" button and the "Run AI Detection" link (`/results`) are both non-functional in terms of actual file handling.

**Impact:**  
Users see a fake upload animation but no file is ever uploaded or processed.

**Fix:**  
- Add a hidden `<input type="file">` element
- Handle file selection and upload to FastAPI's detection endpoint
- Show real progress from the upload/inference process

---

## BUG-007 🟠 HIGH — Feed Search Searches by Complaint ID, Not Content

**File:** `src/app/api/complaints/feed/route.ts` (L33)

**Problem:**  
The search filter applies `{ id: { contains: search, mode: 'insensitive' } }`. This searches the CUID complaint ID, not the description, location, or issue type.

Additionally, `contains` on a CUID `id` field with `mode: 'insensitive'` may not work correctly with all Prisma adapters since CUIDs are case-sensitive identifiers.

**Impact:**  
The "Search" functionality in the community feed is effectively useless — no user would search by internal CUID.

**Fix:**
```diff
- ...(search ? { id: { contains: search, mode: 'insensitive' as const } } : {}),
+ ...(search ? {
+   OR: [
+     { description: { contains: search, mode: 'insensitive' as const } },
+     { street: { contains: search, mode: 'insensitive' as const } },
+     { city: { contains: search, mode: 'insensitive' as const } },
+     { issueType: { contains: search, mode: 'insensitive' as const } },
+   ]
+ } : {}),
```

---

## BUG-008 🟠 HIGH — `/api/auth/me` Returns JWT Payload, Not User Data

**File:** `src/app/api/auth/me/route.ts` (L19)

**Problem:**  
Returns `{ authenticated: true, user: payload }` where `payload` is the raw JWT payload (contains `iat`, `exp`, `id`, etc.). It does NOT query the database for the actual user record.

**Impact:**  
If the user's profile is updated (name, role, etc.) after login, the `/api/auth/me` response will show stale data until the user re-authenticates. Also, the payload structure differs between email signup (`userId`, `role`) and Google OAuth (`id`, `email`, `fullName`, `role`), causing inconsistent responses.

**Fix:**  
Query the database using `payload.id` (or `payload.userId`) and return the actual user record.

---

## BUG-009 🟡 MEDIUM — Fake `reportsGenerated` Stat in Profile API

**File:** `src/app/api/account/profile/route.ts` (L51)

**Problem:**
```ts
reportsGenerated: Math.floor(complaintCount * 0.6),
```
This is a made-up number — just 60% of complaint count. There's no "reports generated" concept in the system.

**Impact:**  
Displays misleading fake data in the user's profile stats.

**Fix:**  
Either remove this stat or implement an actual reports feature.

---

## BUG-010 🟡 MEDIUM — Avatar Stored as Base64 in Database

**File:** `src/app/api/account/upload-avatar/route.ts` (L29)

**Problem:**  
The avatar is stored as a full base64 data URI string directly in the `profileImageUrl` column. A typical avatar image can be 500KB–2MB of base64 text.

**Impact:**
- Database bloat — every `SELECT` including `profileImageUrl` transfers megabytes.
- The leaderboard endpoint (`/api/leaderboard/route.ts` L13) selects `profileImageUrl` for ALL users — could return 50 × 2MB = 100MB of JSON.
- Performance degradation at scale.

**Fix:**  
Upload images to a file storage service (S3, Cloudinary, etc.) and store only the URL.

---

## BUG-011 🟡 MEDIUM — Leaderboard Fetches Base64 Avatars for All Users

**File:** `src/app/api/leaderboard/route.ts` (L13)

**Problem:**  
Selects `profileImageUrl: true` for all users in the leaderboard query. Combined with BUG-010, this can produce enormous JSON responses.

**Impact:**  
Extreme response payload size, slow page loads, potential browser memory issues.

**Fix:**  
Either exclude `profileImageUrl` from the select or fix BUG-010 first to use URL references.

---

## BUG-012 🟡 MEDIUM — No Pagination on Feed or Leaderboard

**File:** `src/app/api/complaints/feed/route.ts`, `src/app/api/leaderboard/route.ts`

**Problem:**  
Both endpoints return ALL matching records (feed) or top 50 (leaderboard) with no `skip`/`take`/`cursor` pagination support.

**Impact:**  
As the database grows, response times will degrade significantly. The feed could return thousands of complaints in a single response.

**Fix:**  
Add `page` and `limit` query parameters with defaults (e.g., `limit=20`).

---

## BUG-013 🟡 MEDIUM — Vote Endpoint Only Allows Upvoting, No Unvoting

**File:** `src/app/api/complaints/vote/route.ts`

**Problem:**  
If a user has already voted, they get a `409 Conflict` error. There's no mechanism to remove a vote (toggle behavior).

**Impact:**  
Users cannot undo accidental upvotes. The `VoteButton` component might not handle this gracefully.

**Fix:**  
Implement toggle behavior — if an upvote exists, delete it; if not, create it.

---

## BUG-014 🟡 MEDIUM — Traffic Upload Endpoint Returns Mock Data

**File:** `src/app/api/traffic/upload/route.ts`

**Problem:**  
The entire endpoint is a placeholder that returns hardcoded mock results:
```json
{ "framesAnalyzed": 1200, "violationsDetected": 24, "avgConfidence": 92.4, "heatmapUrl": null }
```
No actual processing occurs.

**Impact:**  
Traffic violation detection is non-functional. The frontend shows fake results.

**Fix:**  
Connect to FastAPI backend for actual ML inference.

---

## BUG-015 🟡 MEDIUM — Traffic Endpoints Have No Authentication

**Files:** All files in `src/app/api/traffic/*`

**Problem:**  
None of the traffic endpoints (`upload`, `detections`, `challan`, `analytics`) require authentication. Anyone can:
- Issue challans (fines) against violations
- View all traffic detection data

**Impact:**  
Sensitive enforcement actions (issuing fines) are publicly accessible without authorization.

**Fix:**  
Add JWT verification and role-based access control (at minimum, admin/authority roles) to `challan` and `upload` endpoints.

---

## BUG-016 🟡 MEDIUM — `api-client.ts` Endpoints Don't Match Actual Routes

**File:** `src/lib/api-client.ts` (L33-37)

**Problem:**  
The `api` object defines:
- `api.getComplaints()` → calls `/complaints` (should be `/api/complaints/feed`)
- `api.getLeaderboard()` → calls `/leaderboard` (should be `/api/leaderboard`)
- `api.raiseComplaint()` → calls `POST /complaints` (no such route exists)

**Impact:**  
These client helper methods will all fail with 404 errors.

**Fix:**  
Update paths to match actual API routes:
```diff
- getComplaints: () => apiFetch("/complaints"),
+ getComplaints: () => apiFetch("/api/complaints/feed"),
- getLeaderboard: () => apiFetch("/leaderboard"),
+ getLeaderboard: () => apiFetch("/api/leaderboard"),
- raiseComplaint: (payload) => apiFetch("/complaints", { method: "POST", body: JSON.stringify(payload) }),
+ raiseComplaint: (payload) => apiFetch("/api/complaints", { method: "POST", body: JSON.stringify(payload) }),
```

---

## BUG-017 🟡 MEDIUM — No Complaint Creation Endpoint

**Missing:** `src/app/api/complaints/route.ts` (POST handler)

**Problem:**  
There is no API route to create a new complaint. The `api.raiseComplaint()` client helper and the complaint submission modal both expect one, but it doesn't exist.

**Impact:**  
It is impossible to programmatically submit a complaint. The entire core workflow is broken at the API level.

**Fix:**  
Create `src/app/api/complaints/route.ts` with a POST handler that:
1. Validates auth
2. Accepts `issueType`, `description`, `street`, `city`, `state`, `zipcode`, `latitude`, `longitude`, `evidenceUrl`
3. Creates a `Complaint` record
4. Optionally triggers ML detection and duplication check via FastAPI

---

## BUG-018 🟡 MEDIUM — No Chat API Routes Exist

**Schema:** `ChatThread` and `ChatMessage` models exist in Prisma.  
**Component:** `ChatModal.tsx` exists in the dashboard.

**Problem:**  
There are no API routes for creating threads, sending messages, or fetching chat history. The `ChatModal` component likely makes fetch calls that will fail.

**Impact:**  
The chat feature is non-functional despite having both DB schema and frontend UI.

**Fix:**  
Create `/api/chat/thread` (GET/POST) and `/api/chat/message` (GET/POST) routes.

---

## BUG-019 🟢 LOW — Insecure JWT Fallback Secret

**File:** `src/lib/jwt.ts` (L3)

**Problem:**
```ts
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
```
If `JWT_SECRET` is not set in production, all JWTs are signed with a known, hardcoded key.

**Impact:**  
In production without `JWT_SECRET` set, anyone can forge valid JWTs and impersonate any user.

**Fix:**  
Throw an error if `JWT_SECRET` is not set in production:
```ts
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
}
```

---

## BUG-020 🟢 LOW — Signup Uses Inconsistent bcrypt Salt Rounds

**Files:**  
- `src/lib/auth.ts` (L4) — uses salt rounds `10`
- `src/app/api/account/change-password/route.ts` (L39) — uses salt rounds `12`

**Problem:**  
The `hashPassword` utility uses 10 rounds, but the change-password endpoint uses `bcrypt.hash(newPassword, 12)` directly, bypassing the utility function entirely.

**Impact:**  
Minor inconsistency. Both are valid, but using different salt rounds means different performance characteristics for initial signup vs password change.

**Fix:**  
Use the `hashPassword` utility in the change-password route:
```diff
- const newHash = await bcrypt.hash(newPassword, 12);
+ const newHash = await hashPassword(newPassword);
```

---

## BUG-021 🟢 LOW — Google OAuth Sets Empty String as `passwordHash`

**File:** `src/app/api/auth/google/callback/route.ts` (L71)

**Problem:**
```ts
passwordHash: "",
```
Google OAuth users are created with an empty string password hash instead of `null`. The login route checks `if (!user.passwordHash)` — but an empty string `""` is **falsy** in JavaScript, so this happens to work. However, it's semantically wrong and fragile.

**Impact:**  
Currently works by coincidence. If any code changes to check `=== null`, Google users could theoretically "login" with any password via bcrypt comparing against an empty hash.

**Fix:**  
Use `null` explicitly:
```diff
- passwordHash: "",
+ passwordHash: null,
```

---

## BUG-022 🟢 LOW — Leaderboard `upvotes` Count Is Actually "Upvotes Cast BY User", Not "Received"

**File:** `src/app/api/leaderboard/route.ts` (L16-18)

**Problem:**  
The Prisma query counts `_count.upvotes` on the `User` model. Based on the schema, `User.upvotes` is the relation of upvotes **cast by** the user, not upvotes **received on** their complaints.

**Impact:**  
Leaderboard points from upvotes reward users for upvoting others, not for having their reports upvoted. This misaligns the incentive structure.

**Fix:**  
To count upvotes received, aggregate upvotes on the user's complaints instead:
```ts
const upvotesReceived = await prisma.upvote.count({
    where: { complaint: { userId: user.id } }
});
```

---

## BUG-023 🟢 LOW — Profile Leaderboard Rank Off-By-One for New Users

**File:** `src/app/api/account/profile/route.ts` (L50)

**Problem:**
```ts
const rank = usersRanked.findIndex((u) => u.userId === userId) + 1;
```
If the user has zero complaints, they won't appear in the `groupBy` result. `findIndex` returns `-1`, so `rank` becomes `0`. The fallback on L50 is `rank || 1`, which shows them as rank 1.

**Impact:**  
Users with zero complaints are shown as "Rank #1" on the leaderboard, which is misleading.

**Fix:**
```diff
- leaderboardRank: rank || 1,
+ leaderboardRank: rank > 0 ? rank : null, // or "Unranked"
```

---

## BUG-024 🟢 LOW — Complaints Page Filter Buttons Do Nothing

**File:** `src/app/complaints/page.tsx` (L66-77)

**Problem:**  
The filter buttons (`All Issues`, `Pending`, `Resolved`) update `activeFilter` state, but this state is never used to filter the displayed cards — because the cards are hardcoded HTML, not rendered from data.

**Impact:**  
Filters appear clickable but have no effect.

**Fix:**  
Wire up filters when dynamic data fetching is implemented (after fixing BUG-005).

---

## BUG-025 🟢 LOW — Complaints Page Search Input Does Nothing

**File:** `src/app/complaints/page.tsx` (L80)

**Problem:**  
The search input has no `onChange` handler, no state binding, and no search logic.

**Impact:**  
Users can type in the search box with no result.

**Fix:**  
Wire up to a search handler when dynamic data is implemented.

---

## Summary Table

| Bug ID | Severity | Area | One-liner |
|---|---|---|---|
| BUG-001 | 🔴 CRITICAL | Auth | JWT payload uses `userId` in signup/login, but all routes expect `id` |
| BUG-002 | 🔴 CRITICAL | Middleware | File named `proxy.ts` instead of `middleware.ts` — never executes |
| BUG-003 | 🟠 HIGH | Auth | Google OAuth uses non-standard role `'Citizen Contributor'` |
| BUG-004 | 🟠 HIGH | Complaints | Submit modal doesn't actually submit data |
| BUG-005 | 🟠 HIGH | Complaints | Complaints page shows entirely hardcoded data |
| BUG-006 | 🟠 HIGH | Upload | Upload page simulates progress with no real file handling |
| BUG-007 | 🟠 HIGH | Complaints | Feed search operates on complaint ID, not description/location |
| BUG-008 | 🟠 HIGH | Auth | `/api/auth/me` returns JWT payload, not DB user data |
| BUG-009 | 🟡 MEDIUM | Account | `reportsGenerated` stat is a fake formula (60% of complaints) |
| BUG-010 | 🟡 MEDIUM | Account | Avatar stored as multi-MB base64 string in database |
| BUG-011 | 🟡 MEDIUM | Leaderboard | Fetches base64 avatars for all users (massive response) |
| BUG-012 | 🟡 MEDIUM | API | No pagination on feed or leaderboard endpoints |
| BUG-013 | 🟡 MEDIUM | Complaints | No unvote mechanism (toggle upvote not supported) |
| BUG-014 | 🟡 MEDIUM | Traffic | Upload endpoint returns hardcoded mock data |
| BUG-015 | 🟡 MEDIUM | Traffic | No authentication on traffic endpoints (challan issuance is public) |
| BUG-016 | 🟡 MEDIUM | Client | `api-client.ts` paths don't match actual API routes |
| BUG-017 | 🟡 MEDIUM | API | No POST endpoint exists for creating complaints |
| BUG-018 | 🟡 MEDIUM | Chat | Chat schema + UI exist but no API routes |
| BUG-019 | 🟢 LOW | Security | JWT uses hardcoded fallback secret |
| BUG-020 | 🟢 LOW | Auth | Inconsistent bcrypt salt rounds (10 vs 12) |
| BUG-021 | 🟢 LOW | Auth | Google OAuth sets `passwordHash: ""` instead of `null` |
| BUG-022 | 🟢 LOW | Leaderboard | Upvotes count is "cast by" user, not "received on" complaints |
| BUG-023 | 🟢 LOW | Account | Zero-complaint users shown as Rank #1 |
| BUG-024 | 🟢 LOW | UI | Complaint filter buttons don't filter anything |
| BUG-025 | 🟢 LOW | UI | Complaint search input has no handler |
