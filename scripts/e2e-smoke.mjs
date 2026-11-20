// End-to-end smoke test against running servers (Windows or Linux, Node 20.12+).
//
//   1. Start PostgreSQL, run `npx prisma migrate deploy` and `node seed-authorities.js`
//   2. Start the web app (`npm run dev`) and the ML backend (`uvicorn main:app --port 8000` in backend/)
//   3. npm run test:e2e
//
// Env: WEB_URL (default http://localhost:3000), ML_URL (default http://127.0.0.1:8000),
//      AUTHORITY_SEED_PASSWORD (read from .env), E2E_IMAGE (default public/assets/cctv.jpg),
//      E2E_SKIP_ML=1 to skip the model checks.
import { readFileSync } from 'node:fs';
import path from 'node:path';

try { process.loadEnvFile(); } catch { /* use the real environment */ }

const WEB = process.env.WEB_URL ?? 'http://localhost:3000';
const ML = process.env.ML_URL ?? 'http://127.0.0.1:8000';
const IMAGE = process.env.E2E_IMAGE ?? path.join('public', 'assets', 'cctv.jpg');
const SKIP_ML = process.env.E2E_SKIP_ML === '1';
const run = Date.now().toString(36);
const runIp = `10.${[0, 0, 0].map(() => Math.floor(Math.random() * 250) + 1).join(".")}`;

let failures = 0;
const check = (ok, label, detail = '') => {
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `  -> ${detail}` : ''}`);
};

// Minimal cookie-carrying client: one instance per logged-in person.
function client() {
    let cookie = '';
    const call = async (urlPath, { method = 'GET', json, form, raw, redirect = 'manual', headers: extra = {} } = {}) => {
        // Unique client IP per run: sign-ups are rate-limited per IP (Caddy sets this header in production).
        const headers = { 'x-forwarded-for': runIp, ...extra, ...(cookie ? { cookie } : {}) };
        let body;
        if (json !== undefined) { headers['content-type'] = 'application/json'; body = JSON.stringify(json); }
        if (form) body = form;
        if (raw !== undefined) body = raw;
        const res = await fetch(urlPath.startsWith('http') ? urlPath : WEB + urlPath, { method, headers, body, redirect });
        const set = res.headers.getSetCookie?.() ?? [];
        for (const c of set) if (c.startsWith('auth_token=')) cookie = c.split(';')[0];
        const text = await res.text();
        let data; try { data = JSON.parse(text); } catch { data = text; }
        return { status: res.status, data, headers: res.headers };
    };
    call.cookie = () => cookie;
    call.setCookie = (c) => { cookie = c; };
    return call;
}
const mlKey = process.env.ML_API_KEY ? { 'X-API-Key': process.env.ML_API_KEY } : {};

const imageBytes = readFileSync(IMAGE);
const dataUrl = `data:image/jpeg;base64,${imageBytes.toString('base64')}`;
const imageForm = () => { const f = new FormData(); f.append('file', new Blob([imageBytes], { type: 'image/jpeg' }), 'test.jpg'); return f; };

// ── Auth ────────────────────────────────────────────────────────────────────
const citizen = client();
const email = `e2e-${run}@example.test`;
let r = await citizen('/api/auth/signup', { method: 'POST', json: { firstName: 'E2E', lastName: 'Citizen', email, password: 'short' } });
check(r.status === 400, 'signup rejects passwords under 8 characters', r.status);

r = await citizen('/api/auth/signup', { method: 'POST', json: { firstName: 'E2E', lastName: 'Citizen', email, password: 'RoadSafety123', role: 'City Administrator' } });
check(r.status === 201, 'citizen signs up', JSON.stringify(r.data));
r = await citizen('/api/auth/me');
check(r.data?.user?.role === 'user', 'signup ignores a client-supplied admin role', JSON.stringify(r.data));

r = await client()('/api/auth/login', { method: 'POST', json: { email, password: 'wrong-password' } });
check(r.status === 401, 'login rejects a wrong password', r.status);

r = await client()('/dashboard');
check(r.status === 307 && r.headers.get('location')?.includes('/auth'), 'guests are redirected away from /dashboard', r.status);

r = await citizen('/Municipal');
check(r.status === 307 && r.headers.get('location')?.endsWith('/dashboard'), 'citizens are kept out of the municipal desk', r.status);

// ── Complaints ──────────────────────────────────────────────────────────────
const complaint = { issueType: 'Pothole', description: 'Deep pothole near the bus stop', street: 'MG Road', city: 'Pune', state: 'Maharashtra', zipcode: '411001', latitude: 18.5204, longitude: 73.8567, evidenceUrl: dataUrl };
r = await citizen('/api/complaints', { method: 'POST', json: { ...complaint, evidenceUrl: 'javascript:alert(1)' } });
check(r.status === 400, 'complaint rejects evidence that is not an image data URL', r.status);
r = await citizen('/api/complaints', { method: 'POST', json: { ...complaint, description: 'x'.repeat(2001) } });
check(r.status === 400, 'complaint rejects a description over 2,000 characters', r.status);

r = await citizen('/api/complaints', { method: 'POST', json: complaint });
check(r.status === 201 && r.data.isDuplicate === false, 'citizen files a complaint', JSON.stringify(r.data));
const firstId = r.data.complaintId;

r = await citizen('/api/complaints', { method: 'POST', json: { ...complaint, latitude: 18.5206, longitude: 73.8568 } });
check(r.status === 201 && r.data.isDuplicate && r.data.duplicateOf, 'a report ~25 m away is flagged as a duplicate', JSON.stringify(r.data));
const dupId = r.data.complaintId;

r = await citizen('/api/complaints/feed?status=NotAStatus');
check(r.status === 200 && Array.isArray(r.data), 'feed ignores an unknown status filter instead of crashing', r.status);
check(Array.isArray(r.data) && r.data.some(c => c.id === firstId) && !r.data.some(c => c.id === dupId), 'feed shows the original and hides the duplicate');

const selfVote = await citizen('/api/complaints/vote', { method: 'POST', json: { complaintId: firstId } });
check(selfVote.status === 400, 'authors cannot upvote their own report', selfVote.status);

check(r.data.find?.(c => c.id === firstId)?.evidenceUrl === `/api/complaints/${firstId}/media?kind=evidence`, 'feed returns a media URL, not the base64 photo');
r = await fetch(`${WEB}/api/complaints/${firstId}/media?kind=evidence`);
check(r.status === 200 && r.headers.get('content-type') === 'image/jpeg' && (await r.arrayBuffer()).byteLength === imageBytes.length, 'media endpoint serves the original photo bytes');
r = await citizen('/api/complaints', { method: 'POST', json: { ...complaint, evidenceUrl: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' } });
check(r.status === 400, 'SVG evidence is rejected (could carry script)', r.status);

const voter = client();
r = await voter('/api/auth/signup', { method: 'POST', json: { firstName: 'E2E', lastName: 'Voter', email: `e2e-voter-${run}@example.test`, password: 'RoadSafety123' } });
const [v1, v2] = await Promise.all([1, 2].map(() => voter('/api/complaints/vote', { method: 'POST', json: { complaintId: firstId } })));
check([v1.status, v2.status].sort().join() === '200,409', 'two simultaneous upvotes from another citizen count once', `${v1.status},${v2.status}`);

r = await citizen('/api/complaints/my');
check(r.status === 200 && r.data.length === 2, 'citizen sees both own reports', r.data?.length);

r = await citizen('/api/account/profile', { method: 'PUT', json: { fullName: 'E2E Citizen', city: 'x'.repeat(500) } });
check(r.status === 400, 'profile update rejects over-long fields', r.status);
r = await citizen('/api/account/profile');
check(r.status === 200 && r.data.user && !('passwordHash' in r.data.user) && r.data.stats.leaderboardRank >= 1, 'profile loads with a rank and no password hash', JSON.stringify(r.data?.stats));
check(r.data?.stats?.upvotesReceived === 1, "upvotes received counts the other citizen's vote", JSON.stringify(r.data?.stats));
r = await voter('/api/account/profile');
check(r.data?.stats?.upvotesReceived === 0 && r.data?.stats?.leaderboardRank === 0, 'casting a vote earns no points', JSON.stringify(r.data?.stats));

r = await citizen('/api/leaderboard');
check(r.status === 200 && r.data.leaderboard.some(u => u.fullName === 'E2E Citizen'), 'leaderboard lists the citizen');
check(r.data.leaderboard.every(u => u.role === 'user'), 'leaderboard lists citizens only (no staff/admin)', JSON.stringify(r.data.leaderboard.map(u => u.role)));

r = await client()(`/api/complaints/feed?near=18.5205,73.8567&radius=5`);
const nearRow = Array.isArray(r.data) && r.data.find(c => c.id === firstId);
check(nearRow && typeof nearRow.distanceKm === 'number' && nearRow.distanceKm < 1, 'near-me feed returns the report with its distance', JSON.stringify(nearRow));
r = await client()(`/api/complaints/feed?near=28.6139,77.2090&radius=5`);
check(Array.isArray(r.data) && !r.data.some(c => c.id === firstId), 'a report in Pune is not "near" someone in Delhi');
r = await client()('/complaints');
check(r.status === 200, 'guests can browse road reports without logging in', r.status);

// ── Chat ────────────────────────────────────────────────────────────────────
r = await citizen('/api/chat?department=parks');
check(r.status === 400, 'chat rejects an unknown department', r.status);
r = await citizen(`/api/chat?complaintId=${firstId}`);
const threadId = r.data?.threadId;
check(r.status === 200 && threadId, 'citizen opens a chat about the complaint', JSON.stringify(r.data));
r = await citizen('/api/chat', { method: 'POST', json: { threadId, text: 'When will this be fixed?' } });
check(r.status === 200, 'citizen sends a message', r.status);

// ── Sessions ────────────────────────────────────────────────────────────────
const oldCookie = citizen.cookie();
r = await citizen('/api/account/change-password', { method: 'POST', json: { currentPassword: 'RoadSafety123', newPassword: 'RoadSafety456', confirmPassword: 'RoadSafety456' } });
check(r.status === 200, 'citizen changes password', r.status);
r = await citizen('/api/auth/me');
check(r.status === 200, 'this browser stays signed in after the change', r.status);
const stolen = client(); stolen.setCookie(oldCookie);
r = await stolen('/api/auth/me');
check(r.status === 401, 'the old session cookie stops working after a password change', r.status);
// A revoked cookie must not bounce /auth to /dashboard (whose APIs all 401): the person would be stuck.
r = await stolen('/auth');
check(r.status === 200, 'a revoked session cookie gets the login page, not a redirect loop', `${r.status} ${r.headers.get('location') ?? ''}`);

const guesser = client();
for (let i = 0; i < 5; i++) await guesser('/api/auth/login', { method: 'POST', json: { email: `e2e-voter-${run}@example.test`, password: 'wrong-guess' } });
r = await guesser('/api/auth/login', { method: 'POST', json: { email: `e2e-voter-${run}@example.test`, password: 'RoadSafety123' } });
check(r.status === 429, 'five wrong passwords lock the account, even against the right one', r.status);

// Parallel guesses used to all read "not locked" before any failure was counted. Own IP so the per-IP login limit doesn't interfere.
const raceIp = { 'x-forwarded-for': `race-${run}` };
r = await client()('/api/auth/signup', { method: 'POST', headers: raceIp, json: { firstName: 'E2E', lastName: 'Racer', email: `e2e-racer-${run}@example.test`, password: 'RoadSafety123' } });
const guesses = await Promise.all(Array.from({ length: 12 }, () => client()('/api/auth/login', { method: 'POST', headers: raceIp, json: { email: `e2e-racer-${run}@example.test`, password: 'wrong-guess' } })));
const checked = guesses.filter(g => g.status === 401).length;
check(r.status === 201 && checked <= 5, '12 parallel wrong passwords get at most 5 password checks', `signup ${r.status}, checked ${checked}`);

// ── Staff ───────────────────────────────────────────────────────────────────
r = await citizen('/api/traffic/analytics');
check(r.status === 403, 'citizens cannot read traffic analytics', r.status);
r = await citizen(`/api/municipal/complaints/${firstId}`, { method: 'DELETE' });
check(r.status === 403, 'citizens cannot delete complaints', r.status);

const municipal = client();
r = await municipal('/api/auth/login', { method: 'POST', json: { email: 'municipal_desk', password: process.env.AUTHORITY_SEED_PASSWORD } });
check(r.status === 200 && r.data.redirectUrl === '/Municipal', 'municipal staff log in with their username', JSON.stringify(r.data));

r = await municipal('/api/municipal/complaints');
check(r.status === 200 && r.data.some(c => c.id === firstId), 'municipal desk lists the complaint');
r = await municipal(`/api/municipal/complaints/${firstId}`, { method: 'PATCH', json: { status: 'Nonsense' } });
check(r.status === 400, 'status update rejects unknown statuses', r.status);
r = await municipal(`/api/municipal/complaints/${firstId}`, { method: 'PATCH', json: { status: 'Completed' } });
check(r.status === 400, 'completing without a resolution photo is refused', r.status);
r = await municipal('/api/municipal/complaints');
check(r.status === 200 && !JSON.stringify(r.data).includes('base64,'), 'municipal list carries no base64 media');
r = await municipal(`/api/municipal/complaints/${firstId}`, { method: 'PATCH', json: { status: 'Approved', remarks: 'Crew assigned' } });
check(r.status === 200 && r.data.complaint.status === 'Approved', 'municipal desk approves the complaint', JSON.stringify(r.data));

r = await municipal('/api/chat');
check(r.status === 200 && r.data.threads?.some(t => t.id === threadId), 'municipal inbox shows the citizen thread');
r = await municipal('/api/chat', { method: 'POST', json: { threadId, text: 'A crew is scheduled for Monday.' } });
check(r.status === 200, 'municipal desk replies', r.status);

const traffic = client();
r = await traffic('/api/auth/login', { method: 'POST', json: { email: 'traffic@sadaksathi.ai', password: process.env.AUTHORITY_SEED_PASSWORD } });
check(r.status === 200 && r.data.redirectUrl === '/Traffic', 'traffic staff log in with their email', JSON.stringify(r.data));
r = await traffic(`/api/chat?threadId=${threadId}`);
check(r.status === 403, 'traffic staff cannot read municipal threads', r.status);
r = await traffic('/api/traffic/analytics');
check(r.status === 200 && typeof r.data.totalViolations === 'number', 'traffic desk reads analytics', JSON.stringify(r.data));
r = await traffic('/api/traffic/challan', { method: 'POST', json: { violationId: 'does-not-exist' } });
check(r.status === 404, 'challan for an unknown violation is a 404', r.status);

r = await municipal(`/api/municipal/complaints/${dupId}`, { method: 'DELETE' });
check(r.status === 200, 'municipal desk deletes the duplicate', r.status);
r = await municipal(`/api/municipal/complaints/${firstId}`, { method: 'DELETE' });
check(r.status === 200, 'municipal desk deletes a complaint with votes and chat (one transaction)', r.status);
r = await municipal(`/api/municipal/complaints/${firstId}`, { method: 'DELETE' });
check(r.status === 404, 'deleting it again is a 404', r.status);

// ── ML backend ──────────────────────────────────────────────────────────────
if (!SKIP_ML) {
    r = await client()(`${ML}/health`);
    check(r.status === 200 && typeof r.data.parallel_workers === 'number' && typeof r.data.ocr_enabled === 'boolean', 'ML backend is healthy and reports its parallel/OCR settings', JSON.stringify(r.data));
    if (process.env.ML_API_KEY) {
        r = await client()(`${ML}/duplicate/stats`);
        check(r.status === 401, 'ML backend refuses calls without the API key', r.status);
    }

    r = await client()('/api/ml/detect?engine=road&mediaType=image', { method: 'POST', form: imageForm() });
    check(r.status === 401, 'detection proxy requires login', r.status);

    r = await citizen('/api/ml/detect?engine=road&mediaType=image', { method: 'POST', form: imageForm() });
    check(r.status === 200 && r.data.success && typeof r.data.total_detections === 'number' && r.data.annotated_image_base64, 'road detection runs through the web proxy', `${r.status} ${JSON.stringify(r.data).slice(0, 200)}`);

    r = await citizen('/api/ml/detect?engine=traffic&mediaType=image', { method: 'POST', form: imageForm() });
    check(r.status === 200 && r.data.success && Array.isArray(r.data.detections) && r.data.saved_violations === undefined, 'a citizen traffic scan runs but is not saved as a fineable violation', `${r.status} ${JSON.stringify(r.data).slice(0, 200)}`);

    r = await traffic('/api/ml/detect?engine=traffic&mediaType=image', { method: 'POST', form: imageForm() });
    check(r.status === 200 && r.data.success && typeof r.data.saved_violations === 'number', 'a traffic-desk scan is saved as violations', `${r.status} ${JSON.stringify(r.data).slice(0, 200)}`);

    r = await citizen('/api/ml/detect?engine=road&mediaType=image', { method: 'POST', raw: 'not a multipart body', headers: { 'content-type': 'multipart/form-data; boundary=x' } });
    check(r.status === 400, 'a broken upload gets a clear 400, not "detector offline"', r.status);

    r = await client()(`${ML}/duplicate/check`, { method: 'POST', headers: mlKey, json: { text: 'Pothole near bus stop', location: [18.52, 73.85], issue_type: 'pothole' } });
    check(r.status === 200 && typeof r.data.is_duplicate === 'boolean', 'duplicate check answers', JSON.stringify(r.data));
    r = await client()(`${ML}/duplicate/stats`, { headers: mlKey });
    check(r.status === 200, 'duplicate stats answer', r.status);
}

// ── Logout revokes the session on the server, not just in this browser ──
const copied = client(); copied.setCookie(citizen.cookie());
r = await citizen('/api/auth/logout', { method: 'POST' });
check(r.status === 200, 'citizen logs out', r.status);
r = await copied('/api/auth/me');
check(r.status === 401, 'a copied session cookie stops working after logout', r.status);

console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
