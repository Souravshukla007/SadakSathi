/** Server-side calls to the FastAPI ML backend, with the shared X-API-Key attached. */
const FASTAPI_BASE = process.env.FASTAPI_BASE_URL ?? "http://127.0.0.1:8000";

export function mlFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    if (process.env.ML_API_KEY) headers.set("X-API-Key", process.env.ML_API_KEY);
    return fetch(`${FASTAPI_BASE}${path}`, { cache: "no-store", ...init, headers });
}

/** Parse a backend reply that may not be JSON (proxy errors, HTML error pages). */
export async function readJson(res: Response): Promise<Record<string, unknown> | null> {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return null; }
}
