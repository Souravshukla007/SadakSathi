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

export interface FastAPIStats {
  total_uploads: number;
  road_uploads: number;
  traffic_uploads: number;
  total_detections: number;
  high_priority_count: number;
  medium_priority_count: number;
  low_priority_count: number;
  class_counts: Record<string, number>;
}

// ─────────────────────────────────────────────────────────────────────────────
//  API Functions
// ─────────────────────────────────────────────────────────────────────────────

async function callDetect(
  file: File,
  engine: "road" | "traffic",
  mediaType: "image" | "video",
  extraFields: Record<string, string> = {}
): Promise<Response> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("conf_threshold", "0.25");
  for (const [key, val] of Object.entries(extraFields)) {
    formData.append(key, val);
  }
  return fetch(`/api/ml/detect?engine=${engine}&mediaType=${mediaType}`, {
    method: "POST",
    body: formData,
  });
}

export async function detectRoadImage(
  file: File,
  conf = 0.25
): Promise<ImageAssessmentResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("conf_threshold", String(conf));
  formData.append("include_annotated", "true");
  const res = await fetch(`/api/ml/detect?engine=road&mediaType=image`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? err?.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function detectRoadVideo(
  file: File,
  conf = 0.25
): Promise<VideoAssessmentResponse> {
  const res = await callDetect(file, "road", "video", {
    conf_threshold: String(conf),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? err?.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function detectTrafficImage(
  file: File,
  conf = 0.25,
  runOcr = true
): Promise<TrafficAssessmentResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("conf_threshold", String(conf));
  formData.append("include_annotated", "true");
  formData.append("run_ocr", String(runOcr));
  const res = await fetch(`/api/ml/detect?engine=traffic&mediaType=image`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? err?.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function detectTrafficVideo(
  file: File,
  conf = 0.25,
  tracker = "bytetrack.yaml"
): Promise<TrafficVideoAssessmentResponse> {
  const res = await callDetect(file, "traffic", "video", {
    conf_threshold: String(conf),
    tracker,
    run_ocr: "true",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? err?.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchMLStats(): Promise<FastAPIStats> {
  const res = await fetch("/api/ml/stats", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not reach FastAPI /stats");
  return res.json();
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
    // Keep last 50 runs
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
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

export function clearDetectionHistory(): void {
  try {
    sessionStorage.removeItem(LAST_KEY);
    sessionStorage.removeItem(HISTORY_KEY);
  } catch {
    // noop
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
