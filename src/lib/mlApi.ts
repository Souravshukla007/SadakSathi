/**
 * mlApi.ts — Typed client for the SadakSathi FastAPI ML backend.
 *
 * All network calls go through the Next.js proxy routes (/api/ml/...)
 * so the FastAPI URL never appears in the client bundle.
 *
 * This file also owns the sessionStorage persistence helpers that pass
 * detection results between pages (/upload → /results → /Municipal).
 */

// ─────────────────────────────────────────────────────────────────────────────
//  TypeScript interfaces (mirror FastAPI Pydantic schemas)
// ─────────────────────────────────────────────────────────────────────────────

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SingleDetection {
  id: number;
  class_name: string;
  confidence: number;
  bbox: BoundingBox;
  area_pixels: number;
  area_ratio: number;
  depth_score: number;
  priority: "High" | "Medium" | "Low";
}

export interface ImageAssessmentResponse {
  success: boolean;
  total_detections: number;
  detections: SingleDetection[];
  road_priority: string;
  priority_counts: Record<string, number>;
  annotated_image_base64: string | null;
  message: string;
}

export interface VideoAssessmentResponse {
  success: boolean;
  total_frames_analyzed: number;
  total_detections: number;
  road_priority: string;
  priority_counts: Record<string, number>;
  annotated_image_base64: string | null;
  summary: Record<string, unknown>;
  message: string;
}

export interface TrafficDetection {
  id: number;
  class_name: string;
  display_name: string;
  confidence: number;
  bbox: BoundingBox;
  priority: "High" | "Medium" | "Low";
  plate_text: string | null;
}

export interface TrafficAssessmentResponse {
  success: boolean;
  total_detections: number;
  detections: TrafficDetection[];
  overall_priority: string;
  priority_counts: Record<string, number>;
  class_counts: Record<string, number>;
  annotated_image_base64: string | null;
  message: string;
}

export interface UniqueViolation {
  track_id: number;
  class_name: string;
  display_name: string;
  priority: string;
  first_seen_frame: number;
  first_seen_sec: number;
  confidence: number;
  plate_text: string | null;
}

export interface TrafficVideoAssessmentResponse {
  success: boolean;
  total_frames_analyzed: number;
  total_frames: number;
  total_detections: number;
  unique_tracked_violations: number;
  violations: UniqueViolation[];
  summary: {
    class_counts: Record<string, number>;
    priority_counts: Record<string, number>;
    fps: number;
    tracker: string;
  };
  message: string;
}

// Every field the four ML response shapes may carry; StoredDetection.result is a
// union of them, so pages read it through this optional-field view.
export type MlDetectionRow = Pick<TrafficDetection, "id" | "class_name" | "confidence" | "bbox" | "priority"> & {
  display_name?: string;
  plate_text?: string | null;
};
export interface MlResultView {
  success?: boolean;
  message?: string;
  annotated_image_base64?: string | null;
  detections?: MlDetectionRow[];
  violations?: UniqueViolation[];
  total_detections?: number;
  road_priority?: string;
  overall_priority?: string;
  priority_counts?: Record<string, number>;
  class_counts?: Record<string, number>;
  unique_tracked_violations?: number;
  total_frames_analyzed?: number;
  summary?: {
    priority_counts?: Record<string, number>;
    class_counts?: Record<string, number>;
    fps?: number;
    sample_rate?: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  sessionStorage Helpers
// ─────────────────────────────────────────────────────────────────────────────

export interface StoredDetection {
  id: string;                        // e.g. "PV-8820"
  timestamp: string;                 // ISO string
  engine: "road" | "traffic";
  mediaType: "image" | "video";
  fileName: string;
  result: ImageAssessmentResponse | VideoAssessmentResponse | TrafficAssessmentResponse | TrafficVideoAssessmentResponse;
}

// ─────────────────────────────────────────────────────────────────────────────
//  In-memory blob URL store
//  Blob URLs are tab-local and can't be serialized to sessionStorage.
//  This module-level variable survives Next.js client-side navigation within
//  the same browser tab so /results can play the video uploaded on /upload.
// ─────────────────────────────────────────────────────────────────────────────

let _lastVideoBlobUrl: string | null = null;

export function setLastVideoBlobUrl(url: string | null): void {
  _lastVideoBlobUrl = url;
}

export function getLastVideoBlobUrl(): string | null {
  return _lastVideoBlobUrl;
}

const LAST_KEY    = "sadaksathi_lastDetection";
const HISTORY_KEY = "sadaksathi_detectionHistory";

function generateId(): string {
  return `PV-${Math.floor(10000 + Math.random() * 90000)}`;
}

export function saveDetectionResult(
  result: StoredDetection["result"],
  engine: "road" | "traffic",
  mediaType: "image" | "video",
  fileName: string
): StoredDetection {
  const entry: StoredDetection = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    engine,
    mediaType,
    fileName,
    result,
  };

  try {
    sessionStorage.setItem(LAST_KEY, JSON.stringify(entry));

    const history = getDetectionHistory();
    history.unshift(entry);           // newest first
    // Each run carries an annotated image; sessionStorage is ~5 MB, so keep only the last 5.
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 5)));
  } catch {
    // Storage quota exceeded — silently ignore
  }

  return entry;
}

export function getLastDetection(): StoredDetection | null {
  try {
    const raw = sessionStorage.getItem(LAST_KEY);
    return raw ? (JSON.parse(raw) as StoredDetection) : null;
  } catch {
    return null;
  }
}

export function getDetectionHistory(): StoredDetection[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as StoredDetection[]) : [];
  } catch {
    return [];
  }
}


/** Relative time string — e.g. "2 mins ago" */
export function relativeTime(isoString: string): string {
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Complaint Prefill Helpers
//  Used to pass AI detection results from /results → /complaints modal.
// ─────────────────────────────────────────────────────────────────────────────

export interface ComplaintPrefill {
  /** Full data-URL: "data:image/jpeg;base64,..." */
  imageDataUrl: string;
  engine: "road" | "traffic";
  fileName: string;
  /** All unique class names detected (snake_case) */
  detectedClasses: string[];
}

const PREFILL_KEY = "sadaksathi_complaintPrefill";

export function saveComplaintPrefill(data: ComplaintPrefill): void {
  try {
    sessionStorage.setItem(PREFILL_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

/** Carry a scan into the report form: its marked-up photo and what it found. Used by /upload and /results. */
export function prefillFromScan(result: MlResultView, engine: "road" | "traffic", fileName: string): void {
  const detections: { class_name?: string }[] = result.detections ?? result.violations ?? [];
  if (!result.annotated_image_base64) return; // nothing to attach; the form still opens
  saveComplaintPrefill({
    imageDataUrl: `data:image/jpeg;base64,${result.annotated_image_base64}`,
    engine,
    fileName,
    detectedClasses: [...new Set(detections.map((d) => d.class_name ?? "").filter(Boolean))],
  });
}

export function getComplaintPrefill(): ComplaintPrefill | null {
  try {
    const raw = sessionStorage.getItem(PREFILL_KEY);
    return raw ? (JSON.parse(raw) as ComplaintPrefill) : null;
  } catch {
    return null;
  }
}

export function clearComplaintPrefill(): void {
  try {
    sessionStorage.removeItem(PREFILL_KEY);
  } catch {
    // noop
  }
}
