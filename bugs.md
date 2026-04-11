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

### BUG-006: `vitest.config.ts` Deleted — Frontend Tests Cannot Run

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

### BUG-021: Console Logs Left in Production Auth Code

**File:** `src/app/api/auth/login/route.ts` (lines 18, 21, 24, 38)

**Problem:** Debug `console.log` statements with emoji (`🔍`, `❌`, `🚀`) are left in the authority login path. These log credentials and tokens to stdout.

**Impact:** Credential leakage in server logs.

---

### BUG-022: `.idea/` Directory Committed to Repository

**Problem:** JetBrains IDE configuration files (`.idea/`) for Android Studio are committed to the repo. These are user-specific IDE settings and shouldn't be in version control.

**Fix:** Add `.idea/` to `.gitignore` and remove from tracking.

---

### BUG-023: Signup Generates Weak Random Usernames

**File:** `src/app/api/auth/signup/route.ts` (line 25)

**Problem:**
```typescript
username: email.split('@')[0] + Math.random().toString(36).substring(7)
```
`Math.random().toString(36).substring(7)` produces only 4-5 random characters. With enough signups, username collisions are likely and will cause Prisma unique constraint errors (500 Internal Server Error).

**Fix:** Use `crypto.randomUUID()` or a longer random suffix.

---

### BUG-024: Google OAuth Username Collision Risk

**File:** `src/app/api/auth/google/callback/route.ts` (lines 62-63)

**Problem:** Same issue as BUG-023: `Math.floor(1000 + Math.random() * 9000)` produces only 4-digit suffixes (1000-9999). With >9000 Google users sharing the same email prefix, username collisions will cause 500 errors.

---

### BUG-025: Frontend Test Files Import Missing Vitest Config

**Files:** `src/lib/api-client.test.ts`, `src/lib/auth.test.ts`, `src/lib/jwt.test.ts`

**Problem:** Test files exist next to source files but `vitest.config.ts` was deleted (see BUG-006). These tests reference vitest APIs that won't resolve.

**Impact:** `npm test` fails completely.

---

### ~~BUG-026: `backend/check_imports.py` — Orphaned Utility Script~~ ✅ FIXED

**File:** `backend/check_imports.py`

**Problem:** This debugging script was added by the other contributor and left in the repo. It's a development-only utility and shouldn't be in the production codebase.

---

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 3 |
| 🟠 HIGH | 8 |
| 🟡 MEDIUM | 9 |
| 🟢 LOW | 6 |
| **Total** | **26** |

### Priority Fix Order

1. **BUG-001** — JWT key mismatch (signup/login broken for citizens)
2. **BUG-004** — Middleware never executes (zero route protection)
3. **BUG-003** — JWT secret fallback (production auth bypass risk)
4. **BUG-002** — Hardcoded credentials in source
5. **BUG-005** — Duplicate schema class name
6. **BUG-006** — Vitest config deleted
7. **BUG-010** — Remove unused PaddleOCR deps
8. **BUG-007/008** — Wire up complaints page to real data
