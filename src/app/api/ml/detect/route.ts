import { NextRequest, NextResponse } from "next/server";
import { ViolationType } from "@prisma/client";
import { mlFetch, readJson } from "@/lib/mlBackend";
import { prisma } from "@/lib/prisma";
import { requireUser, STAFF } from "@/lib/session";
import { allow } from "@/lib/rateLimit";
import { plateFor, type ScanDetection } from "@/lib/traffic";

// Model class names (old and new weights) → the violation types a challan can be issued for.
const VIOLATION_BY_CLASS: Record<string, ViolationType> = {
  no_helmet: "helmet_violation", withouthelmet: "helmet_violation",
  triple_riding: "triple_riding", tripleriding: "triple_riding",
  wrong_side: "wrong_side", wrong_side_moving: "wrong_side",
  number_plate_missing: "plate_detection",
};

type Detection = ScanDetection & { first_seen_frame?: number };

// Node's fetch gives up on a response after 300 s (undici headersTimeout); stop a little earlier ourselves.
const ML_TIMEOUT_MS = 280_000;

/**
 * Store the violations found in one traffic upload so the traffic desk can review and fine them.
 * `uploadId` is the file's hash: the same footage scanned twice is saved once (returns -1 when already saved).
 */
async function saveViolations(detections: Detection[], uploadId: string): Promise<number> {
  if (await prisma.trafficViolation.count({ where: { frameId: { startsWith: uploadId } } })) return -1;
  const plates = detections.filter((d) => d.plate_text);
  const rows = detections
    .map((d) => ({ d, type: VIOLATION_BY_CLASS[d.class_name.toLowerCase().replace(/\s+/g, "")] }))
    .filter((r) => r.type);
  await prisma.$transaction(rows.map(({ d, type }) => {
    const frameId = d.first_seen_frame == null ? uploadId : `${uploadId}:${d.first_seen_frame}`;
    return prisma.trafficViolation.create({
      data: {
        type, confidence: d.confidence, frameId, plateText: plateFor(d, plates),
        vehicle: { create: { frameId, vehicleType: "two-wheeler", confidence: d.confidence } },
      },
    });
  }));
  return rows.length;
}

/**
 * POST /api/ml/detect?engine=(road|traffic)&mediaType=(image|video)
 * Forwards the upload to the FastAPI backend (with the shared API key) and returns its JSON.
 */
export async function POST(req: NextRequest) {
  const session = await requireUser();
  if (session instanceof NextResponse) return session;
  // Detection is CPU-heavy (minutes per video on a Raspberry Pi): cap each account.
  if (!allow(`detect:${session.id}`, 10, 60_000)) {
    return NextResponse.json({ success: false, message: "Too many scans in a minute. Wait a moment and try again." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const traffic = searchParams.get("engine") === "traffic";
  const video = searchParams.get("mediaType") === "video";
  const path = `/detect${traffic ? "/traffic" : ""}${video ? "/video" : "/image"}`;
  // A video can keep a model busy for minutes: far fewer per person than photos.
  if (video && !allow(`detect-video:${session.id}`, 3, 600_000)) {
    return NextResponse.json({ success: false, message: "You can scan 3 videos every 10 minutes. Try again shortly." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    // A broken or cut-off upload is the client's problem, not "the detector is offline".
    return NextResponse.json({ success: false, message: "The upload did not arrive in full. Try again, or use a smaller file." }, { status: 400 });
  }

  let res: Response;
  try {
    // Do NOT set Content-Type: fetch adds the multipart boundary itself.
    // Stop just before Node's own 5-minute response limit, so a long scan gets a clear answer.
    res = await mlFetch(path, { method: "POST", body: form, signal: AbortSignal.timeout(ML_TIMEOUT_MS) });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json({ success: false, message: "This scan took too long. Try a shorter video clip." }, { status: 504 });
    }
    console.error("[/api/ml/detect] Proxy error:", err);
    return NextResponse.json(
      { success: false, message: "The detection server is not reachable. Start it on port 8000 (see README)." },
      { status: 503 },
    );
  }

  const data = await readJson(res);
  if (!data) {
    console.error("[/api/ml/detect] Non-JSON response:", res.status);
    return NextResponse.json({ success: false, message: `Detection server error (HTTP ${res.status})` }, { status: res.ok ? 502 : res.status });
  }

  // Only the traffic desk's own scans become fineable violations; a citizen's scan is just a preview.
  if (traffic && res.ok && data.success && STAFF.traffic.includes(session.role)) {
    const found = (video ? data.violations : data.detections) as Detection[] | undefined;
    try {
      // Hash of the uploaded file: scanning the same footage again must not create a second set of fines.
      const file = form.get("file");
      const uploadId = file instanceof Blob
        ? Buffer.from(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())).toString("hex").slice(0, 32)
        : crypto.randomUUID();
      const saved = await saveViolations(found ?? [], uploadId);
      data.saved_violations = Math.max(saved, 0);
      if (saved === -1) data.already_saved = true;
    } catch (err) {
      // The scan result is still useful to the user even if saving fails.
      console.error("[/api/ml/detect] Could not save violations:", err);
    }
  }

  return NextResponse.json(data, { status: res.status });
}
