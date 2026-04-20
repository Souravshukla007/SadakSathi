# 🐛 SadakSathi — Bug Report

> **Audit Date:** 2026-04-11
> **Auditor:** @devgu + Antigravity
> **Scope:** Full-stack audit — Next.js frontend, FastAPI backend, CI/CD, auth, ML pipeline

---

## Legend

| Severity | Meaning |
|----------|---------|
| 🔴 **CRITICAL** | Security vulnerability, data loss, or app-breaking crash |
| 🟠 **HIGH** | Feature is broken or produces incorrect results |
| 🟡 **MEDIUM** | Functional issue, degraded UX, or maintenance hazard |
| 🟢 **LOW** | Code smell, inconsistency, or minor cosmetic issue |

---

## 🔴 CRITICAL

### BUG-001: JWT Payload Key Mismatch — Signup & Login silently break all authenticated routes

**Files:**
- `src/app/api/auth/signup/route.ts` (line 33)
- `src/app/api/auth/login/route.ts` (line 72)

**Problem:** The signup and citizen login routes sign the JWT with `{ userId: user.id }`, but **every single authenticated API route** reads `payload.id` (not `payload.userId`). This means:
- After a citizen signs up or logs in, `GET /api/complaints/my`, `POST /api/complaints/vote`, `GET /api/account/profile`, `POST /api/account/change-password`, and `POST /api/account/upload-avatar` **all return 401 Unauthorized** because `payload.id` is `undefined`.
- Only Google OAuth callback (`src/app/api/auth/google/callback/route.ts` line 78-83) correctly signs with `{ id: user.id }`.

**Impact:** Email+password signup/login is fundamentally broken for all post-auth features.

**Fix:** Change `signToken({ userId: user.id, role: user.role })` → `signToken({ id: user.id, role: user.role })` in both files.

---

### BUG-002: Hardcoded Credentials Committed to Source Control

**File:** `src/lib/credentials.ts`

**Problem:** Municipal and traffic authority credentials are hardcoded in plaintext:
```
municipal-admin / municipal123
traffic-officer / traffic123
```
This is committed to the public GitHub repository. Anyone can log in as a municipal authority or traffic officer.

**Impact:** Full authority-level access for anyone who reads the source code.

**Fix:** Move credentials to environment variables or implement a proper admin user system backed by the database.

---

### BUG-003: Insecure JWT Secret Fallback in Production

**File:** `src/lib/jwt.ts` (line 3)

**Problem:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
```
If `JWT_SECRET` is not set in production, anyone can forge valid JWTs using the publicly-visible fallback key. There is no runtime warning or crash if the env var is missing.

**Impact:** Complete authentication bypass in production if the env var isn't configured.

**Fix:** Throw an error at startup if `JWT_SECRET` is not set in production.

---

## 🟠 HIGH

### BUG-004: Middleware File Named `proxy.ts` — Never Executes

**File:** `src/proxy.ts`

**Problem:** Next.js App Router requires the middleware file to be named `middleware.ts` (or `middleware.js`) at the project root or `src/` directory. The file is named `proxy.ts` and exports a function named `proxy` instead of the required default export named `middleware`. **This middleware never runs.** All route protection (`/dashboard`, `/admin`, `/complaints/new`, `/profile`) is completely inactive.

**Impact:** All "protected" routes are accessible without authentication. The admin role check (`payload.role !== 'admin'`) on `/admin` never fires.

**Fix:** Rename `src/proxy.ts` → `src/middleware.ts` and rename the exported function from `proxy` to `middleware`.

---

### ~~BUG-005: Duplicate `TrafficAssessmentResponse` Schema Definition~~ ✅ FIXED

**File:** `backend/models/schemas.py`

**Problem:** `TrafficAssessmentResponse` is defined **twice** in the same file:
1. Lines 29-35 — old version (used by the removed PaddleOCR flow), uses `TrafficDetectionResult` with no `overall_priority`.
2. Lines 105-114 — new version (used by the current EasyOCR router), uses `TrafficDetection` with `overall_priority`, `priority_counts`, `class_counts`.

The second definition silently shadows the first. The old `TrafficDetectionResult` class (lines 21-27) is now dead code — nothing imports it.

**Impact:** Confusing codebase; the old schema may be accidentally imported. Python will use whichever class is imported last but the file has two classes with the same name.

**Fix:** Remove the old `TrafficAssessmentResponse` (lines 29-35) and `TrafficDetectionResult` (lines 21-27).

---

### ~~BUG-006: `vitest.config.ts` Deleted — Frontend Tests Cannot Run~~ ✅ FIXED

**Files:** `package.json` (line 10), deleted `vitest.config.ts`

**Problem:** The `package.json` still has `"test": "vitest run"`, but the `vitest.config.ts` was deleted in the latest merge. Running `npm test` will fail because vitest has no configuration file telling it where to find test files and how to resolve TypeScript paths.

**Impact:** Frontend CI (`npm test`) is broken. The GitHub Actions `frontend` job will fail.

**Fix:** Recreate a `vitest.config.ts` with the correct path aliases and test file globs.

---

### BUG-007: Complaints Page Uses Entirely Hardcoded Data

**File:** `src/app/complaints/page.tsx`

**Problem:** The complaints page displays 3 hardcoded complaint cards with static data (fabricated stats: "1,284 Total Issues", "452 Pending", etc.). The filter buttons and search bar are cosmetic — they don't filter anything. The page never calls `/api/complaints/feed`.

**Impact:** Users see fake data instead of real complaints from the database. Filters/search do nothing.

**Fix:** Replace the static cards with a `useEffect` fetch to `/api/complaints/feed` and render real data.

---

### BUG-008: Complaint Submit Modal Doesn't Actually Create a Complaint

**File:** `src/app/complaints/page.tsx` (lines 74-85)

**Problem:** The "Submit Complaint" form's `onSubmit` handler just closes the modal and redirects the user to `/Municipal` or `/traffic-violations` based on issue type. It does **not** POST any data to an API. No complaint is ever created in the database. The evidence upload dropzone accepts no files. The description textarea value isn't even captured in state.

**Impact:** Users think they're submitting complaints, but nothing is saved.

---

### BUG-009: `api-client.ts` Points to Non-Existent Endpoints

**File:** `src/lib/api-client.ts` (lines 33-37)

**Problem:** The `api` helper object defines:
- `api.getComplaints()` → fetches `/complaints` — this endpoint doesn't exist (should be `/api/complaints/feed`)
- `api.raiseComplaint()` → POSTs to `/complaints` — this endpoint doesn't exist (no POST handler for complaints)

**Impact:** Any component using these helpers will get 404 errors.

---

### ~~BUG-010: OCR Dependency Conflict — Both EasyOCR and PaddleOCR in `requirements.txt`~~ ✅ FIXED

**File:** `requirements.txt`

**Problem:** The file includes both:
- `easyocr>=1.7.0` (line 30) — what the current code actually uses (`ml/traffic.py`)
- `paddlepaddle>=2.6.1` + `paddleocr>=2.7.3` (lines 41-42) — leftover from the previous PaddleOCR implementation that was removed

Both packages are huge (~2GB combined). PaddleOCR is completely unused after the merge resolution.

**Impact:** Massively inflated install times and disk usage. CI takes much longer than necessary. Potential version conflicts.

**Fix:** Remove `paddlepaddle` and `paddleocr` from `requirements.txt`.

---

### ~~BUG-011: `backend/requirements-test.txt` Uses Relative Path That Only Works From Root~~ ✅ FIXED

**File:** `backend/requirements-test.txt` (line 1)

**Problem:** Contains `-r requirements.txt` which tries to include `./requirements.txt` relative to the file being installed. But `requirements.txt` now lives at the **project root**, not inside `backend/`. So `pip install -r backend/requirements-test.txt` fails because it resolves to `backend/requirements.txt` which doesn't exist.

**Impact:** Cannot use `backend/requirements-test.txt` standalone.

**Fix:** Change to `-r ../requirements.txt` or inline the deps.

---

## 🟡 MEDIUM

### BUG-012: Vote Endpoint Doesn't Support Unvoting (Toggle)

**File:** `src/app/api/complaints/vote/route.ts`

**Problem:** The vote endpoint only creates upvotes. If a user has already voted, it returns `409 Conflict`. There's no way to remove a vote. The frontend `VoteButton.tsx` is described as having "toggle" behavior but the API doesn't support it.

**Impact:** Once a user upvotes, they can never undo it.

---

### BUG-013: Leaderboard Rank Calculation Is Inefficient (N+1-ish)

**File:** `src/app/api/account/profile/route.ts` (lines 38-43)

**Problem:** To compute a user's leaderboard rank, the code groups ALL complaints by userId, sorts them, then does a `findIndex`. This entire dataset is loaded into memory for every single profile request.

**Impact:** Performance degrades as complaint count grows. Each profile view triggers a full table scan and sort.

---

### BUG-014: Fabricated `reportsGenerated` Stat

**File:** `src/app/api/account/profile/route.ts` (line 51)

**Problem:**
```typescript
reportsGenerated: Math.floor(complaintCount * 0.6),
```
The "Reports Generated" stat shown on user profiles is just 60% of the complaint count — a made-up number with no basis in actual data.

**Impact:** Misleading user statistics.

---

### BUG-015: Google OAuth Creates Users with Empty `passwordHash`

**File:** `src/app/api/auth/google/callback/route.ts` (line 71)

**Problem:** Google OAuth users are created with `passwordHash: ""`. This is an empty string, not `null`. If any code path (present or future) tries to verify a password for this user using `bcrypt.compare(password, "")`, the behavior is unpredictable and could allow authentication bypass.

**Impact:** Potential security risk. A user signing up via Google could theoretically log in via email+password if the empty hash matches somehow.

**Fix:** Set `passwordHash: null` instead of `""`, and ensure the login route checks for `null` (it already does on line 63-64).

---

### BUG-016: Prisma Pool Created Eagerly at Module Level — Crashes if `DATABASE_URL` Missing

**File:** `src/lib/prisma.ts` (lines 5-8)

**Problem:**
```typescript
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
```
This runs at import time. If `DATABASE_URL` isn't set, `connectionString` becomes the string `"undefined"`, and `pg.Pool` will try to connect to a database named "undefined", causing cryptic connection errors instead of a clear missing-env-var message.

**Impact:** Hard-to-debug startup failures. Misleading error messages.

---

### BUG-017: `package.json` Still Named `"temp-next"`

**File:** `package.json` (line 2)

**Problem:** `"name": "temp-next"` — the project name was never updated from its initial scaffold name.

**Impact:** Cosmetic, but shows up in logs, bundle metadata, and Capacitor builds.

---

### BUG-018: Admin Page and Unified Detector are Empty Stubs

**Files:**
- `src/app/admin/page.tsx` — renders `<div>Admin Page</div>`
- `src/app/unified-detector/page.tsx` — renders `<div>Unified Detector Page</div>`

**Problem:** These routes are reachable by users but show blank pages with no functionality. There is no "coming soon" indicator or redirect.

**Impact:** Users navigating to these pages see a broken, empty page.

---

### BUG-019: Traffic Upload API Route Returns Hardcoded Mock Data

**File:** `src/app/api/traffic/upload/route.ts`

**Problem:** The entire handler returns a static mock response (`framesAnalyzed: 1200`, `violationsDetected: 24`, etc.) with no actual processing. This is the Next.js route — the real inference lives in the FastAPI backend, but the frontend traffic dashboard page may still call this dead mock endpoint.

**Impact:** Any traffic page relying on this Next.js route gets fake data.

---

### BUG-020: `apiFetch` Always Sets `Content-Type: application/json` — Breaks File Uploads

**File:** `src/lib/api-client.ts` (line 16)

**Problem:**
```typescript
headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) }
```
The `Content-Type` header is hardcoded. If any caller tries to use this utility for `FormData` / file uploads, the browser won't set the correct `multipart/form-data` boundary, and the request will fail.

**Impact:** The api-client utility cannot be used for file uploads without explicitly overriding headers.

---

## 🟢 LOW

### ~~BUG-021: Console Logs Left in Production Auth Code~~ ✅ FIXED

**File:** `src/app/api/auth/login/route.ts` (lines 18, 21, 24, 38)

**Problem:** Debug `console.log` statements with emoji (`🔍`, `❌`, `🚀`) are left in the authority login path. These log credentials and tokens to stdout.

**Impact:** Credential leakage in server logs.

---

### ~~BUG-022: `.idea/` Directory Committed to Repository~~ ✅ FIXED

**Problem:** JetBrains IDE configuration files (`.idea/`) for Android Studio are committed to the repo. These are user-specific IDE settings and shouldn't be in version control.

**Fix:** Add `.idea/` to `.gitignore` and remove from tracking.

---

### ~~BUG-023: Signup Generates Weak Random Usernames~~ ✅ FIXED

**File:** `src/app/api/auth/signup/route.ts` (line 25)

**Problem:**
```typescript
username: email.split('@')[0] + Math.random().toString(36).substring(7)
```
`Math.random().toString(36).substring(7)` produces only 4-5 random characters. With enough signups, username collisions are likely and will cause Prisma unique constraint errors (500 Internal Server Error).

**Fix:** Use `crypto.randomUUID()` or a longer random suffix.

---

### ~~BUG-024: Google OAuth Username Collision Risk~~ ✅ FIXED

**File:** `src/app/api/auth/google/callback/route.ts` (lines 62-63)

**Problem:** Same issue as BUG-023: `Math.floor(1000 + Math.random() * 9000)` produces only 4-digit suffixes (1000-9999). With >9000 Google users sharing the same email prefix, username collisions will cause 500 errors.

---

### ~~BUG-025: Frontend Test Files Import Missing Vitest Config~~ ✅ FIXED

**Files:** `src/lib/api-client.test.ts`, `src/lib/auth.test.ts`, `src/lib/jwt.test.ts`

**Problem:** Test files exist next to source files but `vitest.config.ts` was deleted (see BUG-006). These tests reference vitest APIs that won't resolve.

**Impact:** `npm test` fails completely.

---

### ~~BUG-026: `backend/check_imports.py` — Orphaned Utility Script~~ ✅ FIXED

**File:** `backend/check_imports.py`

**Problem:** This debugging script was added by the other contributor and left in the repo. It's a development-only utility and shouldn't be in the production codebase.

---

### BUG-027: Auth Page Leaks Debug Logs with Credentials to Browser Console

**File:** `src/app/auth/page.tsx` (lines 39, 48, 55, 58, 66)

**Problem:** The `handleLogin` function contains multiple `console.log` statements that output the user's email, password, authority type, and full API response to the **browser DevTools console**:
```typescript
console.log('🔍 Login attempt:', { email, password, authorityType });
console.log('🔍 Login response:', { status: res.status, data });
```
Unlike server-side logs (which were fixed in BUG-021), these run in the **client browser** where any XSS attack or browser extension can read them.

**Impact:** Credential exposure in client-side console. Passwords visible in browser DevTools.

---

### BUG-028: Auth Page Displays Hardcoded Credentials in the UI

**File:** `src/app/auth/page.tsx` (lines 217-223)

**Problem:** When a user selects "Municipal Authority" or "Traffic Authority" login mode, the page renders a literal box showing the credentials in the UI:
```html
<strong>Hard-coded credentials:</strong>
Municipal: username: municipal-admin, password: municipal123
```
And the placeholder text on the password field is literally the password (`municipal123` / `traffic123`).

**Impact:** Even without reading source code, any user who visits the auth page can see the admin credentials in the rendered UI.

---

### BUG-029: AppHeader Navigation Links Point to Wrong Routes

**File:** `src/components/AppHeader.tsx` (lines 60-61)

**Problem:** Multiple navigation links in the header point to incorrect routes:
1. **"Traffic AI"** link → points to `/auth` (the login page) instead of `/traffic-violations` or `/dashboard/traffic`.
2. **"Dashboard"** link (desktop) → points to `/#` (hash link, does nothing) instead of `/dashboard`.
3. **"Dashboard"** link (mobile) → points to `/my-account` instead of `/dashboard`.

**Impact:** Users clicking "Traffic AI" get redirected to the login page. Clicking "Dashboard" on desktop does nothing.

---

### BUG-030: `/login` and `/signup` Pages Are Empty Stubs — Orphaned Routes

**Files:**
- `src/app/login/page.tsx` — renders `<div>Login Page</div>`
- `src/app/signup/page.tsx` — renders `<div>Signup Page</div>`

**Problem:** The real auth flow lives at `/auth`, but these legacy routes exist and display empty pages. The middleware file (`src/proxy.ts`) references `/login` and `/signup` as auth routes that should redirect authenticated users, but the pages themselves are non-functional stubs.

**Impact:** Users reaching `/login` or `/signup` directly see a blank page with no forms.

---

### BUG-031: Complaint Submit Modal Ignores Description Text and Severity Selection

**File:** `src/app/complaints/page.tsx` (lines 316-319, 261-274)

**Problem:** The complaint submission form has a description `<textarea>` and severity radio buttons, but:
1. The `<textarea>` has no `value`/`onChange` binding — its contents are never captured in React state.
2. The severity radio buttons have no `onChange` handler — the selected severity is never read.
3. The evidence upload dropzone has **no file input** — users can't actually attach images/videos.

The `handleComplaintSubmit` function only reads `issueType` and `location`, then navigates away.

**Impact:** Even if the form were connected to an API, description, severity, and evidence would be lost.

---

### BUG-032: Prisma Schema Missing `url` in Datasource Block

**File:** `prisma/schema.prisma` (lines 5-7)

**Problem:**
```prisma
datasource db {
  provider = "postgresql"
}
```
The `url` field is missing from the datasource block. Normally this would be `url = env("DATABASE_URL")`. This works at runtime because the code uses `@prisma/adapter-pg` with a manual `pg.Pool`, which bypasses `prisma.schema`'s datasource URL. However:
- `npx prisma migrate dev` and `npx prisma db push` **will fail** because Prisma CLI requires `url` in the datasource to connect to the database.
- `npx prisma studio` won't work either.

**Impact:** All Prisma CLI commands that require a database connection fail. Schema migrations cannot be run.

---

### ~~BUG-033: Backend `config.py` — `DEBUG=True` Hardcoded for Production~~ ✅ FIXED

**File:** `backend/config.py` (line 15)

**Problem:** `DEBUG: bool = True` is the default value. While the Settings class reads from `.env`, if no `.env` file is present in production, the backend runs with debug mode enabled by default. FastAPI in debug mode may expose stack traces and internal errors in API responses.

**Impact:** Potential information disclosure in production via detailed error messages.

---

### ~~BUG-034: Backend `get_settings()` Creates a New `Settings` Instance Every Call~~ ✅ FIXED

**File:** `backend/config.py` (lines 51-52)

**Problem:**
```python
def get_settings() -> Settings:
    return Settings()
```
Each call to `get_settings()` instantiates a new `Settings()` object, which re-reads the `.env` file from disk every time. This is called in many hot paths (every health check, every request via `UPLOAD_PATH` reference, etc.).

**Impact:** Unnecessary I/O on every request. Should use `@lru_cache` or `functools.cache` as recommended by FastAPI's official docs.

---

### ~~BUG-035: Backend Health Endpoint Crashes Without `torch` Installed~~ ✅ FIXED

**File:** `backend/routers/health.py` (line 19)

**Problem:** The health check endpoint does `import torch` **inside the handler function** without a try/except. If the server is running in a lightweight deployment where `torch` isn't installed (e.g., just testing the health route), the entire endpoint crashes with an `ImportError`.

**Impact:** Health probes used by load balancers / orchestrators (K8s, Docker) will fail, potentially causing restart loops.

**Fix:** Move torch import to a guarded block or use the already-imported model state to determine GPU status.

---

### BUG-036: Prisma Schema Allows Duplicate Upvotes (No Unique Constraint)

**File:** `prisma/schema.prisma` (lines 62-69)

**Problem:** The `Upvote` model has no `@@unique([complaintId, userId])` constraint. While the API route (`vote/route.ts`) does a manual `findFirst` check before creating, this is a race condition: two concurrent requests from the same user can both pass the check and create duplicate upvotes.

**Impact:** Users can double-upvote via concurrent requests, inflating complaint rankings. The leaderboard scoring would also be affected.

**Fix:** Add `@@unique([complaintId, userId])` to the `Upvote` model.

---

### ~~BUG-037: GitHub Actions CI Will Fail on Backend Tests~~ ✅ FIXED

**File:** `.github/workflows/tests.yml` (lines 42-47)

**Problem:** The backend test job runs:
```yaml
pip install -r requirements.txt
pytest backend/tests
```
But `requirements.txt` includes heavy ML dependencies (`torch`, `ultralytics`, `easyocr`, `sentence-transformers`, `xgboost`) that are ~5GB+ combined. On a free GitHub Actions runner with limited disk and time:
1. Installation may timeout or run out of disk space.
2. The test imports `ml.detection` which tries to load YOLO — this requires model `.pt` files that aren't in the repo (they're in `.gitignore`).
3. Conftest or test setup may fail if CUDA-related libraries aren't present.

**Impact:** Backend CI is effectively broken — it's extremely likely to timeout or crash.

**Fix:** Create a `requirements-test.txt` with only the test/API deps (no torch/ultralytics). Mock the ML model loading in tests.

---

### BUG-038: GitHub OAuth Button Does Nothing — No Handler Configured

**File:** `src/app/auth/page.tsx` (line 281)

**Problem:** The GitHub OAuth button in the auth page renders a decorative button with no `onClick` handler:
```tsx
<button className="flex items-center ...">
    <svg>...</svg> GitHub
</button>
```
There is no `/api/auth/github` route, no GitHub OAuth configuration in environment variables, and no callback handler. The button looks interactive but does nothing when clicked.

**Impact:** Users clicking "GitHub" login see no response. Misleading UI.

---

### BUG-039: `ChatThread` Schema Lacks Unique Constraint on `complaintId`

**File:** `prisma/schema.prisma` (lines 92-98)

**Problem:** The `ChatThread` model has a `complaintId` field but no `@unique` constraint on it. Multiple chat threads can be created for the same complaint, which makes queries for "the chat thread for complaint X" non-deterministic (which thread to use?).

**Impact:** Duplicate threads can accumulate for the same complaint when the chat feature is implemented.

**Fix:** Add `@unique` to `complaintId` or add `@@unique([complaintId])`.

---

### BUG-040: `Complaint` Model — Self-Referential `originalReportId` Has No Foreign Key

**File:** `prisma/schema.prisma` (line 51)

**Problem:** `originalReportId String?` is a free-text string field with no `@relation` to the `Complaint` model itself. There's no referential integrity:
- It can point to a complaint ID that doesn't exist.
- If the original complaint is deleted, orphaned references remain.
- No cascading delete/nullify behavior.

**Impact:** Data integrity risk when complaints are deleted or when invalid IDs are stored.

---

### BUG-041: `test-auth-flow.js` Shipped in Repo Root

**File:** `test-auth-flow.js`

**Problem:** A debugging/test script is committed at the project root. It contains hardcoded credential strings (`municipal-admin / municipal123`, `traffic-officer / traffic123`) and uses `require.main === module` CJS patterns even though the project is ESM-based.

**Impact:** Credentials are duplicated in yet another file. It won't run properly with the project's module system.

**Fix:** Remove from repo root or move to a `scripts/` directory and add to `.gitignore`.

---

### ~~BUG-042: Backend CORS Origins Too Restrictive for Production Deploy~~ ✅ FIXED

**File:** `backend/config.py` (line 18)

**Problem:**
```python
CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
```
Only localhost origins are allowed by default. In production, when the frontend is deployed to Vercel (`*.vercel.app`) or a custom domain, all FastAPI requests from the browser will be blocked by CORS policy unless the `.env` file is correctly configured.

**Impact:** Frontend-to-backend requests will silently fail in any non-localhost deployment.

---

### BUG-043: Signup Form Role Options Mismatch Between Frontend and Backend

**Files:**
- `src/app/auth/page.tsx` (lines 253-257) — dropdown: `"Citizen Contributor"`, `"Municipal Administrator"`, `"Traffic Department"`
- `src/app/api/auth/signup/route.ts` (line 28) — mapping: `"City Administrator"` → `"admin"`, `"Maintenance Contractor"` → `"contractor"`, else → `"user"`

**Problem:** The frontend offers roles `"Municipal Administrator"` and `"Traffic Department"`, but the backend's role mapping only recognizes `"City Administrator"` and `"Maintenance Contractor"`. A user selecting "Municipal Administrator" in the signup form will be assigned the `"user"` role because it doesn't match either backend case.

**Impact:** Signup role selection is misleading — selecting "Municipal Administrator" creates a regular user, not an admin.

---

### BUG-044: Frontend Upload Page Uses Simulated Progress — No Real Upload

**File:** `src/app/upload/page.tsx`

**Problem:** The upload page shows an animated progress bar that simulates analysis progress using `setInterval`, but the actual API call to the FastAPI backend may or may not be connected. The `results` state is typed as `any` with no schema validation. If the backend responds with an unexpected shape, the UI will silently break.

**Impact:** Users see a convincing progress animation but may receive no real detection results.

---

### BUG-045: Leaderboard Counts Upvotes *Given*, Not *Received*

**File:** `src/app/api/leaderboard/route.ts` (lines 14-19, 33)

**Problem:** The leaderboard query counts `_count.upvotes` — which is the number of upvotes the user has **given** (cast), not **received** on their complaints. The formula `complaints * 10 + upvotes * 5` therefore rewards users for upvoting others' complaints rather than having their own complaints upvoted.

According to AGENTS.md, the scoring should be:
> "10 pts per complaint + 5 pts per upvote"

The intent is likely "5 pts per upvote received on your complaints."

**Impact:** The leaderboard ranking doesn't reflect a user's contribution quality. A user who spam-upvotes others gets ranked higher.

---

### ~~BUG-046: Backend Module-Level `UPLOAD_PATH.mkdir()` Runs at Import Time~~ ✅ FIXED

**File:** `backend/config.py` (lines 57-58)

**Problem:**
```python
UPLOAD_PATH = BASE_DIR / get_settings().UPLOAD_DIR
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)
```
This code runs at module import time — every time any module imports from `config.py`, a `Settings()` is created AND a directory is created on disk. This couples import behavior to side effects. In test environments or when importing just for constants, the disk I/O is unnecessary.

**Impact:** Side effects at import time. Creates directories unexpectedly during testing or when running CLI tools that import config.

---

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 3 |
| 🟠 HIGH | 8 (3 fixed) |
| 🟡 MEDIUM | 9 + 11 new = 20 |
| 🟢 LOW | 6 (5 fixed) + 9 new = 10 |
| **Total** | **46** |

### Priority Fix Order

1. **BUG-001** — JWT key mismatch (signup/login broken for citizens)
2. **BUG-004** — Middleware never executes (zero route protection)
3. **BUG-003** — JWT secret fallback (production auth bypass risk)
4. **BUG-002** — Hardcoded credentials in source
5. **BUG-027** — Client-side credential logging
6. **BUG-028** — Credentials displayed in UI
7. **BUG-032** — Prisma schema missing datasource URL
8. **BUG-036** — Upvote race condition (no unique constraint)
9. **BUG-043** — Signup role mismatch (misleading UI)
10. **BUG-029** — Header nav links broken
11. **BUG-007/008/031** — Wire up complaints page to real data
12. **BUG-045** — Leaderboard counts wrong metric
