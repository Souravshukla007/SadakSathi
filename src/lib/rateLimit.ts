// shortcut: counters live in this process's memory, which is exact for one server (the Raspberry Pi
// deployment); with several instances each gets its own budget — move to Redis/DB if you scale out.
const windows = new Map<string, { count: number; resetAt: number }>();

/** true if `key` may act now: at most `limit` actions per `windowMs`. */
export function allow(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const w = windows.get(key);
    if (!w || now >= w.resetAt) {
        if (windows.size > 10_000) for (const [k, v] of windows) if (now >= v.resetAt) windows.delete(k); // bound memory
        windows.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }
    w.count += 1;
    return w.count <= limit;
}

/** Client IP as seen by the reverse proxy (Caddy sets X-Forwarded-For); falls back to a shared bucket. */
export const clientIp = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
