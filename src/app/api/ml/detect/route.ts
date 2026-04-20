import { NextRequest, NextResponse } from "next/server";

const FASTAPI_BASE = process.env.FASTAPI_BASE_URL ?? "http://127.0.0.1:8000";

/**
 * POST /api/ml/detect?engine=(road|traffic)&mediaType=(image|video)
 *
 * Forwards multipart/form-data straight to FastAPI and streams the
 * JSON response back to the browser. This proxy keeps the FastAPI URL
 * server-side and avoids any CORS issues.
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const engine    = searchParams.get("engine")    ?? "road";
  const mediaType = searchParams.get("mediaType") ?? "image";

  // Build the FastAPI target path
  let path = "/detect";
  if (engine === "traffic") path += "/traffic";
  path += mediaType === "video" ? "/video" : "/image";

  const targetUrl = `${FASTAPI_BASE}${path}`;

  try {
    // Forward the raw FormData body (Next.js provides it as a ReadableStream)
    const formData = await req.formData();

    const fastapiRes = await fetch(targetUrl, {
      method: "POST",
      body: formData,
      // Do NOT set Content-Type — fetch sets it automatically with the boundary
    });

    const data = await fastapiRes.json();

    return NextResponse.json(data, { status: fastapiRes.status });
  } catch (err) {
    console.error("[/api/ml/detect] Proxy error:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          "Could not reach the FastAPI ML backend. " +
          "Make sure it is running on port 8000 (uvicorn main:app --reload --port 8000).",
      },
      { status: 503 }
    );
  }
}
