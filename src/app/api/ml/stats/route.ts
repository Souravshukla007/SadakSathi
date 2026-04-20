import { NextResponse } from "next/server";

const FASTAPI_BASE = process.env.FASTAPI_BASE_URL ?? "http://127.0.0.1:8000";

/**
 * GET /api/ml/stats
 *
 * Proxies to FastAPI GET /stats — returns session-scoped detection aggregates.
 */
export async function GET() {
  try {
    const res = await fetch(`${FASTAPI_BASE}/stats`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "FastAPI ML backend is unreachable." },
      { status: 503 }
    );
  }
}
