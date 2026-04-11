"""
SadakSathi — Traffic Violation Detection Module

Handles detection of traffic-related violations using YOLO:
  • Helmet / No Helmet detection
  • Number Plate detection with EasyOCR text reading
  • Triple Riding detection
  • Wrong Side Moving detection

Image analysis:  POST /detect/traffic/image
Video analysis:  POST /detect/traffic/video — uses Ultralytics built-in
                 ByteTrack or BoT-SORT tracker for persistent object IDs.
"""

from __future__ import annotations

import base64
import logging
import os
from collections import Counter
from typing import Optional

import cv2
import numpy as np
import torch

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
#  Global Model / OCR Instances
# ─────────────────────────────────────────────

_global_traffic_model = None
_global_ocr_reader = None


# ─────────────────────────────────────────────
#  Class Config: display name + default severity
# ─────────────────────────────────────────────

CLASS_CONFIG: dict[str, dict] = {
    # High-severity violations
    "wrong_side":          {"display": "Wrong Side Moving",        "priority": "High"},
    "wrong_side_moving":   {"display": "Wrong Side Moving",        "priority": "High"},
    "triple_riding":       {"display": "Triple Riding",            "priority": "High"},
    "no_helmet":           {"display": "No Helmet",                "priority": "High"},
    "number_plate_missing":{"display": "Number Plate Missing",     "priority": "High"},

    # Medium-severity (present but needs attention)
    "number_plate":        {"display": "Number Plate",             "priority": "Medium"},
    "licence_plate":       {"display": "Number Plate",             "priority": "Medium"},
    "license_plate":       {"display": "Number Plate",             "priority": "Medium"},

    # Low-severity (tracked but compliant)
    "helmet":              {"display": "Helmet (Compliant)",       "priority": "Low"},
    "vehicle":             {"display": "Vehicle",                  "priority": "Low"},
    "motorcycle":          {"display": "Motorcycle",               "priority": "Low"},
    "car":                 {"display": "Car",                      "priority": "Low"},
    "bike":                {"display": "Bike",                     "priority": "Low"},
    "truck":               {"display": "Truck",                    "priority": "Low"},
    "bus":                 {"display": "Bus",                      "priority": "Low"},
}

PRIORITY_COLORS: dict[str, tuple[int, int, int]] = {
    "High":   (0, 0, 255),     # Red
    "Medium": (0, 165, 255),   # Orange
    "Low":    (0, 255, 0),     # Green
}


# ─────────────────────────────────────────────
#  Model Loading
# ─────────────────────────────────────────────


def load_traffic_model(model_path: str, device: str = "auto"):
    """
    Load the YOLO traffic violation model from a .pt file.

    Returns the loaded model, or None if the file doesn't exist.
    When None is returned, all traffic endpoints respond with HTTP 503.
    """
    global _global_traffic_model

    if not os.path.exists(model_path):
        logger.warning(
            f"Traffic model not found: {model_path}. "
            "Traffic detection endpoints will return HTTP 503 until model.pt is placed here."
        )
        return None

    try:
        from ultralytics import YOLO

        logger.info(f"Loading YOLO traffic model from {model_path}")
        model = YOLO(model_path)

        if device == "auto":
            device = "cuda" if torch.cuda.is_available() else "cpu"

        model.to(device)
        _global_traffic_model = model
        logger.info(f"✅ YOLO traffic model loaded on {device}.")
        return model

    except Exception as e:
        logger.error(f"Failed to load YOLO traffic model: {e}", exc_info=True)
        return None


def get_traffic_model():
    """Return the global traffic model instance."""
    return _global_traffic_model


def load_ocr_reader(languages: list[str] | None = None):
    """
    Initialize EasyOCR reader for number plate text extraction.
    Called at startup; the reader is reused for all subsequent OCR calls.
    """
    global _global_ocr_reader

    if _global_ocr_reader is not None:
        return _global_ocr_reader

    if languages is None:
        languages = ["en"]

    try:
        import easyocr

        logger.info(f"Initializing EasyOCR with languages: {languages}")
        _global_ocr_reader = easyocr.Reader(languages, gpu=torch.cuda.is_available())
        logger.info("✅ EasyOCR initialized successfully.")
        return _global_ocr_reader

    except Exception as e:
        logger.error(f"Failed to initialize EasyOCR: {e}", exc_info=True)
        # OCR failure is non-fatal — detections work without plate text
        return None


def get_ocr_reader():
    """Return the global EasyOCR reader instance."""
    return _global_ocr_reader


def get_traffic_device() -> str:
    """Return the device string the traffic model is currently running on."""
    if _global_traffic_model is None:
        return "cpu"
    try:
        return str(next(_global_traffic_model.model.parameters()).device)
    except Exception:
        return "cpu"


# ─────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────


def normalize_class(raw_name: str) -> dict:
    """
    Map a raw YOLO class label to a human-readable display name and priority level.
    Falls back gracefully for unknown class names.
    """
    key = raw_name.lower().strip().replace(" ", "_")
    return CLASS_CONFIG.get(
        key,
        {"display": raw_name.replace("_", " ").title(), "priority": "Low"},
    )


def is_plate_class(raw_name: str) -> bool:
    """Return True if this class is a number plate that should be OCR'd."""
    return raw_name.lower().strip() in ("number_plate", "licence_plate", "license_plate")


def read_plate_text(image: np.ndarray, bbox: dict) -> str | None:
    """
    Crop the number plate region from an image and run EasyOCR on it.

    Args:
        image: Full BGR frame.
        bbox:  Dict with x1, y1, x2, y2 keys.

    Returns:
        Uppercase plate text string, or None if OCR unavailable/failed.
    """
    reader = _global_ocr_reader
    if reader is None:
        return None

    try:
        pad = 6
        h, w = image.shape[:2]
        x1 = max(0, bbox["x1"] - pad)
        y1 = max(0, bbox["y1"] - pad)
        x2 = min(w, bbox["x2"] + pad)
        y2 = min(h, bbox["y2"] + pad)

        crop = image[y1:y2, x1:x2]
        if crop.size == 0:
            return None

        # Upscale small crops for better OCR accuracy
        ch, cw = crop.shape[:2]
        if cw < 100:
            scale = max(2, 100 // cw)
            crop = cv2.resize(crop, (cw * scale, ch * scale), interpolation=cv2.INTER_CUBIC)

        # Grayscale + mild sharpening helps plate OCR
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        gray = cv2.bilateralFilter(gray, 9, 75, 75)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        ocr_results = reader.readtext(thresh, detail=0, paragraph=True)
        text = " ".join(ocr_results).strip().upper()
        return text if text else None

    except Exception as e:
        logger.warning(f"OCR failed for plate crop: {e}")
        return None


def get_overall_priority(detections: list[dict]) -> str:
    """Return the highest priority among a list of detections."""
    priorities = [d.get("priority", "Low") for d in detections]
    if "High" in priorities:
        return "High"
    elif "Medium" in priorities:
        return "Medium"
    return "Low"


# ─────────────────────────────────────────────
#  Image Assessment
# ─────────────────────────────────────────────


def assess_traffic_image(
    image_input,
    model=None,
    conf_threshold: float = 0.25,
    device: str = "cpu",
    return_annotated: bool = True,
    run_ocr: bool = True,
) -> tuple[dict, np.ndarray | None]:
    """
    Assess a single image for traffic violations.

    Returns a result dict containing:
      - total_detections
      - detections[]  — class_name, display_name, confidence, bbox,
                        priority, plate_text (for plates)
      - overall_priority
      - priority_counts / class_counts
      - annotated image (optional)
    """
    if model is None:
        model = _global_traffic_model
    if model is None:
        return {
            "success": False,
            "message": "Traffic model not loaded — place traffic_model.pt in backend/ and restart.",
        }, None

    try:
        # ── Decode image ──
        if isinstance(image_input, str):
            image = cv2.imread(image_input)
        elif isinstance(image_input, bytes):
            nparr = np.frombuffer(image_input, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif isinstance(image_input, np.ndarray):
            image = image_input
        else:
            return {"success": False, "message": "Unsupported image input type"}, None

        if image is None:
            return {"success": False, "message": "Could not decode image"}, None

        annotated = image.copy() if return_annotated else None

        # ── Inference ──
        try:
            results = model(image, conf=conf_threshold, device=device)
        except (torch.cuda.OutOfMemoryError, RuntimeError) as e:
            if "cuda" in str(e).lower():
                logger.warning("CUDA OOM — retrying on CPU")
                results = model(image, conf=conf_threshold, device="cpu")
            else:
                raise

        result = results[0]
        detections_list: list[dict] = []

        if result.boxes is not None and len(result.boxes) > 0:
            boxes       = result.boxes.xyxy.cpu().numpy()
            confidences = result.boxes.conf.cpu().numpy()
            class_ids   = result.boxes.cls.cpu().numpy().astype(int)
            class_names = model.names if hasattr(model, "names") else {}

            for i in range(len(boxes)):
                x1, y1, x2, y2 = map(int, boxes[i])
                confidence = float(confidences[i])
                cls_id     = int(class_ids[i])
                raw_cls    = class_names.get(cls_id, f"class_{cls_id}")

                info         = normalize_class(raw_cls)
                display_name = info["display"]
                priority     = info["priority"]
                color        = PRIORITY_COLORS[priority]
                bbox         = {"x1": x1, "y1": y1, "x2": x2, "y2": y2}

                # OCR number plates
                plate_text = None
                if run_ocr and is_plate_class(raw_cls):
                    plate_text = read_plate_text(image, bbox)

                detection = {
                    "id":           i,
                    "class_name":   raw_cls,
                    "display_name": display_name,
                    "confidence":   round(confidence, 4),
                    "bbox":         bbox,
                    "position":     ((x1 + x2) // 2, (y1 + y2) // 2),
                    "priority":     priority,
                    "plate_text":   plate_text,
                }
                detections_list.append(detection)

                # ── Annotate ──
                if annotated is not None:
                    cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2, cv2.LINE_AA)
                    label = f"{display_name} ({confidence:.2f})"
                    if plate_text:
                        label += f"  [{plate_text}]"
                    cv2.putText(
                        annotated, label,
                        (x1, max(y1 - 10, 12)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2,
                    )

        overall_priority = get_overall_priority(detections_list)
        priority_counts  = dict(Counter(d["priority"]    for d in detections_list))
        class_counts     = dict(Counter(d["class_name"]  for d in detections_list))

        if annotated is not None:
            overlay_color = PRIORITY_COLORS.get(overall_priority, (0, 255, 0))
            cv2.putText(
                annotated, f"Traffic Alert: {overall_priority}",
                (10, 32), cv2.FONT_HERSHEY_SIMPLEX, 1.0, overlay_color, 3,
            )

        return {
            "success":          True,
            "total_detections": len(detections_list),
            "detections":       detections_list,
            "overall_priority": overall_priority,
            "priority_counts":  priority_counts,
            "class_counts":     class_counts,
            "message":          (
                f"Detected {len(detections_list)} object(s)."
                if detections_list else "No violations detected."
            ),
        }, annotated

    except Exception as e:
        logger.error(f"Error in assess_traffic_image: {e}", exc_info=True)
        return {"success": False, "message": f"Detection error: {str(e)}"}, None


# ─────────────────────────────────────────────
#  Video Assessment — ByteTrack / BoT-SORT
# ─────────────────────────────────────────────


def assess_traffic_video(
    video_path: str,
    model=None,
    conf_threshold: float = 0.25,
    device: str = "cpu",
    tracker: str = "bytetrack.yaml",
    run_ocr: bool = True,
) -> dict:
    """
    Assess a video for traffic violations using Ultralytics built-in tracking.

    Tracking assigns a persistent `track_id` to each object across frames so
    the same motorcycle isn't counted as 30 separate violations per second.

    Supported trackers (via `tracker` param):
      • "bytetrack.yaml"  — ByteTrack (default, fast, occlusion-robust)
      • "botsort.yaml"    — BoT-SORT  (Re-ID aware, better for crowded scenes)

    Returns:
      - unique_tracked_violations: de-duplicated list keyed by track_id
      - total_detections: raw frame-level detection count
      - Summary with class_counts, priority_counts, fps, tracker used
    """
    if model is None:
        model = _global_traffic_model
    if model is None:
        return {
            "success": False,
            "message": "Traffic model not loaded — place traffic_model.pt in backend/ and restart.",
            "total_frames_analyzed": 0,
            "total_detections": 0,
        }

    if not os.path.exists(video_path):
        return {
            "success": False,
            "message": f"Video not found: {video_path}",
            "total_frames_analyzed": 0,
            "total_detections": 0,
        }

    try:
        # Grab video metadata before tracking
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps          = cap.get(cv2.CAP_PROP_FPS) or 30.0
        cap.release()

        logger.info(
            f"Starting traffic video analysis — tracker={tracker}, "
            f"frames={total_frames}, fps={fps:.1f}"
        )

        class_names = model.names if hasattr(model, "names") else {}

        # ── Run tracking (streaming generator — mem-efficient) ──
        tracking_results = model.track(
            source=video_path,
            conf=conf_threshold,
            device=device,
            tracker=tracker,
            persist=True,    # Maintain track state across frames
            stream=True,     # Generator — avoid loading full video into RAM
            verbose=False,
        )

        all_detections: list[dict] = []

        # track_id → best detection info (avoid counting same object per frame)
        unique_track_violations: dict[int, dict] = {}

        frame_idx = 0

        for result in tracking_results:
            if result.boxes is None or len(result.boxes) == 0:
                frame_idx += 1
                continue

            boxes       = result.boxes.xyxy.cpu().numpy()
            confidences = result.boxes.conf.cpu().numpy()
            class_ids   = result.boxes.cls.cpu().numpy().astype(int)

            # track_ids may be None for the very first frames before tracker locks in
            track_ids = (
                result.boxes.id.cpu().numpy().astype(int)
                if result.boxes.id is not None
                else [None] * len(boxes)
            )

            # Original frame for OCR cropping
            frame_image: np.ndarray | None = getattr(result, "orig_img", None)

            timestamp_sec = round(frame_idx / fps, 2)

            for i in range(len(boxes)):
                x1, y1, x2, y2 = map(int, boxes[i])
                confidence = float(confidences[i])
                cls_id     = int(class_ids[i])
                track_id   = int(track_ids[i]) if track_ids[i] is not None else None
                raw_cls    = class_names.get(cls_id, f"class_{cls_id}")

                info         = normalize_class(raw_cls)
                priority     = info["priority"]
                display_name = info["display"]
                bbox         = {"x1": x1, "y1": y1, "x2": x2, "y2": y2}

                # OCR — only attempt once per track_id to avoid redundant calls
                plate_text = None
                if (
                    run_ocr
                    and frame_image is not None
                    and is_plate_class(raw_cls)
                    and track_id is not None
                ):
                    existing = unique_track_violations.get(track_id, {})
                    if not existing.get("plate_text"):
                        plate_text = read_plate_text(frame_image, bbox)

                detection = {
                    "frame_index":  frame_idx,
                    "timestamp_sec": timestamp_sec,
                    "track_id":     track_id,
                    "class_name":   raw_cls,
                    "display_name": display_name,
                    "confidence":   round(confidence, 4),
                    "bbox":         bbox,
                    "priority":     priority,
                    "plate_text":   plate_text,
                }
                all_detections.append(detection)

                # Build unique violation registry (High + Medium only)
                if track_id is not None and priority in ("High", "Medium"):
                    if track_id not in unique_track_violations:
                        unique_track_violations[track_id] = {
                            "track_id":        track_id,
                            "class_name":      raw_cls,
                            "display_name":    display_name,
                            "priority":        priority,
                            "first_seen_frame": frame_idx,
                            "first_seen_sec":   timestamp_sec,
                            "confidence":       round(confidence, 4),
                            "plate_text":       plate_text,
                        }
                    elif plate_text and not unique_track_violations[track_id].get("plate_text"):
                        # Update plate text if we got OCR later
                        unique_track_violations[track_id]["plate_text"] = plate_text

            frame_idx += 1

        # ── Build summary ──
        class_counts:    dict[str, int] = {}
        priority_counts: dict[str, int] = {}
        for det in all_detections:
            cls = det.get("class_name", "unknown")
            pri = det.get("priority", "Low")
            class_counts[cls]    = class_counts.get(cls, 0) + 1
            priority_counts[pri] = priority_counts.get(pri, 0) + 1

        unique_violations = list(unique_track_violations.values())

        return {
            "success":                  True,
            "total_frames_analyzed":    frame_idx,
            "total_frames":             total_frames,
            "total_detections":         len(all_detections),
            "unique_tracked_violations": len(unique_violations),
            "violations":               unique_violations,
            "summary": {
                "class_counts":    class_counts,
                "priority_counts": priority_counts,
                "fps":             fps,
                "tracker":         tracker,
            },
            "message": (
                f"Analyzed {frame_idx} frames — "
                f"found {len(unique_violations)} unique violation(s) "
                f"({len(all_detections)} raw detections)."
            ),
        }

    except Exception as e:
        logger.error(f"Error in assess_traffic_video: {e}", exc_info=True)
        return {
            "success": False,
            "message": f"Video processing error: {str(e)}",
            "total_frames_analyzed": 0,
            "total_detections": 0,
        }


# ─────────────────────────────────────────────
#  Utility
# ─────────────────────────────────────────────


def encode_image_to_base64(image: np.ndarray, fmt: str = ".jpg") -> str | None:
    """Encode a numpy BGR image to a base64 string."""
    try:
        success, encoded = cv2.imencode(fmt, image)
        if success:
            return base64.b64encode(encoded.tobytes()).decode("utf-8")
        return None
    except Exception as e:
        logger.error(f"Error encoding image: {e}")
        return None
