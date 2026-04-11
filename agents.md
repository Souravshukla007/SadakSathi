# 🛣️ SadakSathi — Project Intelligence Document

> **Last Updated:** 2026-03-09  
> **Lead Developer:** @devgu (Full-Stack + ML Integration)  
> **Current Phase:** Next.js frontend → FastAPI backend migration + ML model integration

---

## 1. Project Overview

**SadakSathi** (Hindi: _"Road Companion"_) is an AI-powered civic road intelligence platform that enables citizens to report road hazards, detect infrastructure issues using ML models, monitor traffic violations, and track municipal responsiveness — all through a unified web application.

### Core Vision
- Citizens upload images/videos of road issues (potholes, garbage, manhole covers, fallen trees).
- ML models automatically detect and classify the hazard type.
- A **duplication detection system** prevents redundant reports for the same issue (concept imported from a prior project).
- Municipal authorities manage complaints via a dashboard.
- A traffic violation detection module (helmet violations, triple riding, wrong-side driving) operates as a separate AI pipeline.
- Gamification via leaderboard incentivizes citizen participation.

### Your Role (Developer Context)
You are the sole developer building the **FastAPI backend** (Python) to serve ML inference and handle heavy logic, while connecting it to the existing **Next.js** frontend. The Next.js app currently handles everything via its API routes but will transition to calling FastAPI for ML workloads and complex business logic.

---

## 2. Tech Stack

| Layer | Technology | Version/Notes |
|---|---|---|
| **Frontend Framework** | Next.js (App Router) | v16.1.6, React 19 |
| **Language** | TypeScript | v5+ |
| **Styling** | Tailwind CSS v4 | PostCSS plugin |
| **Database** | PostgreSQL | via Prisma ORM |
| **ORM** | Prisma | v7.3.0, `@prisma/adapter-pg` for pg pool |
| **Auth** | JWT (jose) + bcryptjs | Cookie-based, 7-day expiry |
| **Icons** | lucide-react | v0.576.0 |
| **Notifications** | react-hot-toast | v2.4.1 |
| **Fonts** | Google Fonts | Outfit (headings) + DM Sans (body) |
| **Backend (Planned)** | FastAPI (Python) | For ML inference, duplication detection |
| **ML Models (Planned)** | YOLO-based object detection | Pothole, manhole cover, garbage, fallen tree |
| **Deployment** | TBD | Vercel (frontend), likely Railway/Render (FastAPI) |

---

## 3. Database Schema (Prisma)

### 3.1 Models Overview

| Model | Purpose | Key Fields |
|---|---|---|
| `User` | All users (citizens, admins, contractors) | `id`, `username`, `fullName`, `email`, `passwordHash`, `role`, `phone`, `city`, `state`, `profileImageUrl` |
| `UserActivity` | Audit log for user actions | `userId`, `action`, `details` |
| `Complaint` | Road issue reports from citizens | `userId`, `issueType`, `description`, `street/city/state/zipcode`, `latitude/longitude`, `status`, `isDuplicate`, `originalReportId`, `evidenceUrl`, `videoUrl` |
| `Upvote` | Community upvotes on complaints | `complaintId`, `userId` |
| `Feedback` | User feedback on resolved complaints | `complaintId`, `userId`, `rating`, `comment`, `imageUrl` |
| `DetectionResult` | ML model output per complaint | `complaintId`, `type`, `payload` (JSON) |
| `ChatThread` | Threads for citizen-authority messaging | `complaintId` |
| `ChatMessage` | Individual chat messages | `threadId`, `senderId`, `senderRole`, `text` |
| `VehicleDetection` | Detected vehicles from traffic AI | `frameId`, `vehicleType`, `confidence` |
| `TrafficViolation` | Traffic violations detected by AI | `type` (enum), `confidence`, `frameId`, `vehicleId`, `location`, `status` |
| `Challan` | Fines issued for traffic violations | `violationId`, `amount`, `status` (enum) |

### 3.2 Enums

| Enum | Values |
|---|---|
| `ComplaintStatus` | `Submitted`, `Approved`, `Rejected`, `OnHold`, `Completed`, `ResolvedReviewed` |
| `ViolationType` | `helmet_violation`, `triple_riding`, `wrong_side`, `plate_detection` |
| `ChallanStatus` | `Issued`, `Paid`, `Disputed`, `Cancelled` |

### 3.3 Key Schema Notes
- `Complaint.isDuplicate` and `Complaint.originalReportId` are the hooks for the duplication detection system — when a new complaint is detected as a duplicate, `isDuplicate = true` and `originalReportId` links to the original.
- `DetectionResult.payload` is a `Json` field — flexible storage for ML model outputs (bounding boxes, confidence scores, class labels, etc.).
- `User.role` is currently a free-text `String`, meaning there's no enum enforcing valid values.

---

## 4. API Endpoints (Next.js Route Handlers)

### 4.1 Authentication (`/api/auth/*`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register new user (email + password). Sets `auth_token` cookie. | ❌ |
| `POST` | `/api/auth/login` | Login with email + password. Returns JWT cookie. | ❌ |
| `GET` | `/api/auth/me` | Returns current user payload from JWT. | ✅ (cookie) |
| `POST` | `/api/auth/logout` | Clears `auth_token` cookie. | ❌ |
| `GET` | `/api/auth/google` | Redirects to Google OAuth consent screen. | ❌ |
| `GET` | `/api/auth/google/callback` | Handles Google OAuth callback, creates/updates user, sets JWT cookie. | ❌ |

### 4.2 Complaints (`/api/complaints/*`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/complaints/feed` | Public feed of non-duplicate complaints. Supports `?sort=newest\|oldest\|upvotes` and `?search=`. | ❌ (optional for vote status) |
| `GET` | `/api/complaints/my` | Returns complaints submitted by the authenticated user. | ✅ |
| `POST` | `/api/complaints/vote` | Toggle upvote on a complaint. Requires `{ complaintId }`. | ✅ |

### 4.3 Account (`/api/account/*`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/account/profile` | Returns user profile, stats (complaints, upvotes, leaderboard rank), and recent activity. | ✅ |
| `PUT` | `/api/account/profile` | Updates user profile fields (`fullName`, `phone`, `city`, `state`). | ✅ |
| `POST` | `/api/account/change-password` | Changes password with current password verification. | ✅ |
| `POST` | `/api/account/upload-avatar` | Uploads avatar as base64 data URI (stored directly in DB). | ✅ |

### 4.4 Traffic (`/api/traffic/*`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/traffic/upload` | **MOCK/PLACEHOLDER** — Accepts multipart/form-data, returns hardcoded mock results. | ❌ |
| `GET` | `/api/traffic/detections` | Returns latest 50 traffic violations with challan and vehicle info. | ❌ |
| `POST` | `/api/traffic/challan` | Issues a challan (fine) for a specific violation. Uses `FINE_MAP` for amounts. | ❌ |
| `GET` | `/api/traffic/analytics` | Returns aggregate traffic stats (total violations, avg confidence, vehicle count, challan totals). | ❌ |

### 4.5 Leaderboard

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/leaderboard` | Returns top 50 users ranked by points (10/complaint + 5/upvote). | ❌ |

---

## 5. Frontend Pages

| Route | File | Description | Status |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Landing page — hero, features, stats, CTA sections | ✅ Implemented |
| `/login` | `src/app/login/page.tsx` | Login form page | ✅ Implemented |
| `/signup` | `src/app/signup/page.tsx` | Registration form page | ✅ Implemented |
| `/auth` | `src/app/auth/page.tsx` | Auth page (likely combined login/signup) | ✅ Implemented |
| `/dashboard` | `src/app/dashboard/page.tsx` | User dashboard — my complaints table, community feed, stats, voting, chat | ✅ Implemented |
| `/dashboard/traffic` | `src/app/dashboard/traffic/page.tsx` | Traffic violations dashboard sub-page | ✅ Implemented |
| `/complaints` | `src/app/complaints/page.tsx` | Complaints listing with submit modal (⚠️ uses hardcoded data) | ⚠️ Partial |
| `/my-complaints` | `src/app/my-complaints/page.tsx` | User's own complaints view | ✅ Implemented |
| `/upload` | `src/app/upload/page.tsx` | Image/video upload page (⚠️ simulated progress, no real upload) | ⚠️ Partial |
| `/results` | `src/app/results/page.tsx` | Detection results display page | ⚠️ Likely placeholder |
| `/leaderboard` | `src/app/leaderboard/page.tsx` | Leaderboard rankings page | ✅ Implemented |
| `/account` | `src/app/account/page.tsx` | User account/profile management page | ✅ Implemented |
| `/performance` | `src/app/performance/page.tsx` | Analytics/performance metrics page | ✅ Implemented |
| `/traffic-violations` | `src/app/traffic-violations/page.tsx` | Traffic violation monitoring page | ✅ Implemented |
| `/Municipal` | `src/app/Municipal/page.tsx` | Municipal authority dashboard (static) | ⚠️ Static |
| `/admin` | `src/app/admin/page.tsx` | Admin page **PLACEHOLDER** — renders `<div>Admin Page</div>` | 🔴 Stub |
| `/unified-detector` | `src/app/unified-detector/page.tsx` | Unified detector page **PLACEHOLDER** | 🔴 Stub |

---

## 6. Components

### Shared
| File | Description |
|---|---|
| `AppHeader.tsx` | Global responsive nav header with auth-aware links, mobile menu |
| `AppFooter.tsx` | Global site footer |

### Dashboard (`components/dashboard/`)
| File | Description |
|---|---|
| `WelcomeBanner.tsx` | Personalized greeting banner with complaint count |
| `StatusBadge.tsx` | Color-coded complaint status pill component |
| `VoteButton.tsx` | Upvote button with optimistic UI, calls `/api/complaints/vote` |
| `ChatModal.tsx` | Modal for citizen-authority chat per complaint |

### Account (`components/account/`)
| File | Description |
|---|---|
| `ProfileHeader.tsx` | Profile header with avatar, name, role |
| `ProfileForm.tsx` | Editable profile fields form |
| `ProfileStats.tsx` | User statistics display (complaints, upvotes, rank) |
| `ActivityTable.tsx` | Recent activity log table |
| `SecuritySettings.tsx` | Password change form |
| `NotificationSettings.tsx` | Notification preferences (likely frontend-only for now) |

### Traffic (`components/traffic/`)
| File | Description |
|---|---|
| `TrafficPreview.tsx` | Traffic detection preview/summary component |
| `TrafficAnalyticsCard.tsx` | Analytics stat card for traffic module |
| `DetectionStreamTable.tsx` | Real-time detection stream table |
| `TrafficTabs.tsx` | Tab navigation for traffic sub-views |
| `UploadAuditCard.tsx` | Upload history/audit trail card |
| `ViolationBadge.tsx` | Violation type badge with color coding |

### App Download (`components/app-download/`)
| File | Description |
|---|---|
| `DownloadAppButton.tsx` | CTA button for mobile app download |
| `DownloadAppModal.tsx` | QR code / download link modal |

---

## 7. Library Files (`src/lib/`)

| File | Description |
|---|---|
| `prisma.ts` | Singleton Prisma client using `@prisma/adapter-pg` with a `pg.Pool`. Caches globally in dev. |
| `jwt.ts` | JWT sign/verify using `jose` library. HS256, 7-day expiry. ⚠️ Hardcoded fallback secret. |
| `auth.ts` | Password hashing (bcrypt, salt rounds = 10) and comparison utilities. |
| `api-client.ts` | Client-side `apiFetch` wrapper with error handling. Exposes `api.getComplaints`, `api.getLeaderboard`, `api.raiseComplaint`. |

---

## 8. Middleware

| File | Description |
|---|---|
| `src/proxy.ts` | Next.js middleware. Protects `/dashboard`, `/complaints/new`, `/profile`, `/admin`. Redirects authenticated users away from `/auth`, `/login`, `/signup`. ⚠️ Named `proxy.ts`, should be `middleware.ts` to auto-activate. |

---

## 9. ML Models (Planned — To Be Integrated via FastAPI)

### 9.1 Object Detection Models

| Model | Target Class | Notes |
|---|---|---|
| Pothole Detector | Potholes, road cracks | YOLO-based, trained/fine-tuned on custom dataset |
| Manhole Cover Detector | Open/damaged manhole covers | Safety hazard detection |
| Garbage Detector | Garbage dumps, littering on roads | Environmental cleanliness |
| Fallen Tree Detector | Fallen trees blocking roads | Post-storm/disaster scenario |

All models will output bounding boxes + confidence scores → stored in `DetectionResult.payload` (JSON).

### 9.2 Duplication Detection System
Concept imported from a prior project. Core idea:
- When a new complaint is submitted with an image/location, compare it against existing complaints.
- Use a combination of:
  - **Geo-proximity** — complaints within X meters of each other.
  - **Image similarity** — perceptual hashing or embedding-based similarity.
  - **Time window** — prioritize recent complaints for duplication.
- If a match exceeds the threshold → mark `isDuplicate = true`, set `originalReportId`.
- Prevents flood reports for the same pothole/issue.

### 9.3 Traffic Violation Detection (Existing Schema, Pending ML)
- Helmet violation detection
- Triple riding detection
- Wrong-side driving detection
- Number plate detection/OCR

---

## 10. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                      │
│   Next.js Pages + React Components + Tailwind CSS        │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (fetch)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              NEXT.JS SERVER (API Routes)                 │
│  /api/auth/*  /api/complaints/*  /api/account/*          │
│  /api/traffic/*  /api/leaderboard                        │
│  Middleware (proxy.ts) → JWT verification                │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │ HTTP (planned)
           ▼                          ▼
┌──────────────────┐    ┌──────────────────────────────────┐
│   PostgreSQL DB   │    │     FASTAPI BACKEND (Planned)     │
│   (via Prisma)    │    │  /detect  /duplicate-check        │
│                   │    │  /traffic/analyze                  │
│  Users            │    │  YOLO models served via            │
│  Complaints       │    │  Ultralytics / ONNX Runtime        │
│  Upvotes          │    │                                    │
│  Feedback         │    │  Duplication Detection Engine       │
│  DetectionResults │    │  (Geo + Image Similarity)           │
│  ChatThreads      │    └──────────────────────────────────┘
│  VehicleDetections│
│  TrafficViolations│
│  Challans         │
└──────────────────┘
```

---

## 11. Environment Variables Required

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWTs (⚠️ has insecure fallback) |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret |
| `NEXT_PUBLIC_APP_URL` | Base URL for OAuth redirects (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for client-side API calls (default: empty = same origin) |

---

## 12. Future Scope

### Short Term (Current Sprint)
- [ ] Build FastAPI backend with `/detect` endpoint (accepts image, returns detection results)
- [ ] Integrate YOLO models for pothole, manhole, garbage, fallen tree detection
- [ ] Implement duplication detection system (geo + image similarity)
- [ ] Connect Next.js upload flow to FastAPI for real ML inference
- [ ] Wire up the complaint submission modal to actually POST data to the backend

### Medium Term
- [ ] Build admin dashboard (currently a stub) for complaint management
- [ ] Add real-time chat API (currently `ChatThread`/`ChatMessage` models exist but no API routes)
- [ ] Implement traffic violation ML pipeline (replace mock upload endpoint)
- [ ] Add file storage (S3/Cloudinary) instead of base64 avatar storage
- [ ] Add pagination to feed endpoint
- [ ] Build unified detector page (currently a stub)

### Long Term
- [ ] Mobile app (React Native or Flutter) for on-the-go reporting
- [ ] Real-time notifications (WebSocket/SSE) for complaint status changes
- [ ] Heatmap visualization of road issues by geography
- [ ] Integration with municipal APIs for automated work order creation
- [ ] Analytics and reporting dashboards for city administrators
- [ ] Multi-language support (Hindi, regional languages)

---

## 13. Key Design Decisions

1. **Cookie-based JWT auth** — Chose httpOnly cookies over localStorage for XSS protection.
2. **Prisma with pg adapter** — Using `@prisma/adapter-pg` for connection pooling (important for serverless).
3. **Flexible `DetectionResult.payload`** — JSON field allows different model outputs without schema migrations.
4. **Points-based leaderboard** — 10 pts per complaint + 5 pts per upvote incentivizes both reporting and community engagement.
5. **Duplication as a first-class concept** — `isDuplicate` and `originalReportId` baked into the schema from day one.

---

## 14. Running the Project

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
# → http://localhost:3000
```
