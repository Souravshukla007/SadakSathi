"""
SadakSathi — Multi-Class YOLO Detection Module

Ported from eNivaran's pothole_detection.py.
Enhanced for multi-class: pothole, manhole_cover, garbage, fallen_tree.
"""

from __future__ import annotations

import base64
import json
import logging
import os
from collections import Counter
from pathlib import Path

import cv2
import numpy as np
import torch

logger = logging.getLogger(__name__)

# Global model instance
_global_model = None


# ─────────────────────────────────────────────
#  Model Loading
# ─────────────────────────────────────────────


def load_model(model_path: str, device: str = "auto"):
    """
    Load a YOLO model from a .pt file using Ultralytics.

    Args:
        model_path: Path to the YOLO .pt model file.
        device: "auto" | "cpu" | "cuda"

    Returns:
        Loaded YOLO model, or None if model file not found.
    """
    global _global_model

    if not os.path.exists(model_path):
        logger.warning(f"Model file not found: {model_path}. Detection endpoints will return errors.")
        return None

    try:
        from ultralytics import YOLO

        logger.info(f"Loading YOLO model from {model_path}")
        model = YOLO(model_path)

        # Determine device
        if device == "auto":
            device = "cuda" if torch.cuda.is_available() else "cpu"

        logger.info(f"CUDA available: {torch.cuda.is_available()}")
        logger.info(f"Model will use device: {device}")

        model.to(device)
        _global_model = model
        logger.info("YOLO model loaded successfully.")
        return model

    except Exception as e:
        logger.error(f"Failed to load YOLO model: {e}", exc_info=True)
        return None


def get_model():
    """Return the global model instance."""
    return _global_model


def get_device() -> str:
    """Get the current device string."""
    if _global_model is None:
        return "cpu"
    try:
        return str(next(_global_model.model.parameters()).device)
    except Exception:
        return "cpu"


# ─────────────────────────────────────────────
#  Helper Functions
# ─────────────────────────────────────────────


def estimate_depth_score(image: np.ndarray, contour: np.ndarray) -> float:
    """
    Estimate depth score (0-1) based on shadow analysis within a contour region.
    Darker, higher-contrast regions → deeper hazard.
    """
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        mask = np.zeros_like(gray)
        cv2.drawContours(mask, [contour], 0, 255, -1)

        pixels = gray[mask == 255]
        if pixels.size == 0:
            return 0.0

        darkness = 1 - (np.mean(pixels) / 255.0)
        contrast = min(np.std(pixels) / 50.0, 1.0) if pixels.size > 1 else 0.0
        return max(0.0, min(1.0, 0.7 * darkness + 0.3 * contrast))

    except Exception as e:
        logger.warning(f"Depth estimation failed: {e}")
        return 0.0


def get_detection_priority(area_ratio: float, depth_score: float) -> tuple[str, tuple[int, int, int]]:
    """
    Determine individual detection priority: High / Medium / Low.
    Returns (priority_str, bgr_color).
    """
    combined = (0.6 * area_ratio * 100) + (0.4 * depth_score)
    if combined > 0.6 or (area_ratio > 0.01 and depth_score > 0.6):
        return "High", (0, 0, 255)  # Red
    elif combined > 0.3 or (area_ratio > 0.005 and depth_score > 0.4):
        return "Medium", (0, 165, 255)  # Orange
    else:
        return "Low", (0, 255, 0)  # Green


def determine_road_priority(
    detections: list[dict], proximity_threshold: int, image_shape: tuple[int, int]
) -> tuple[str, tuple[int, int, int], list[list[int]]]:
    """
    Determine overall road priority based on all detected hazards.
    Uses clustering of nearby detections for severity assessment.
    """
    if not detections:
        return "Low", (0, 255, 0), []

    high_count = sum(1 for d in detections if d["priority"] == "High")
    medium_count = sum(1 for d in detections if d["priority"] == "Medium")

    # Simple proximity clustering
    clusters: list[list[int]] = []
    processed: set[int] = set()

    for i, d1 in enumerate(detections):
        if i in processed:
            continue
        cluster = [i]
        queue = [i]
        processed.add(i)
        while queue:
            curr = queue.pop(0)
            for j, d2 in enumerate(detections):
                if j not in processed:
                    dist = np.linalg.norm(
                        np.array(d1["position"]) - np.array(d2["position"])
                    )
                    if dist < proximity_threshold:
                        processed.add(j)
                        cluster.append(j)
                        queue.append(j)
        clusters.append(cluster)

    total_area = sum(d["area_ratio"] for d in detections)
    large_clusters = [c for c in clusters if len(c) >= 3]
    medium_clusters = [c for c in clusters if len(c) >= 2]

    if high_count >= 2 or (high_count >= 1 and medium_count >= 2) or total_area > 0.05 or large_clusters:
        return "High", (0, 0, 255), clusters
    elif high_count >= 1 or medium_count >= 2 or total_area > 0.02 or medium_clusters:
        return "Medium", (0, 165, 255), clusters
    else:
        return "Low", (0, 255, 0), clusters


# ─────────────────────────────────────────────
#  Image Assessment (Core)
# ─────────────────────────────────────────────


def assess_road_image(
    image_input,
    model=None,
    conf_threshold: float = 0.25,
    proximity_threshold: int = 150,
    device: str = "cpu",
    return_annotated: bool = True,
) -> tuple[dict, np.ndarray | None]:
    """
    Assess a road image for hazards using the YOLO model.

    Args:
        image_input: File path (str), numpy array (BGR), or bytes.
        model: YOLO model instance. If None, uses global model.
        conf_threshold: Confidence threshold for detections.
        proximity_threshold: Pixel distance for clustering nearby detections.
        device: Device for inference.
        return_annotated: Whether to produce an annotated image.

    Returns:
        (result_dict, annotated_image_array_or_None)
    """
    if model is None:
        model = _global_model
    if model is None:
        return {"success": False, "message": "Model not loaded"}, None

    try:
        # Read image
        if isinstance(image_input, str):
            image = cv2.imread(image_input)
            if image is None:
                return {"success": False, "message": f"Could not read image: {image_input}"}, None
        elif isinstance(image_input, bytes):
            nparr = np.frombuffer(image_input, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image is None:
                return {"success": False, "message": "Could not decode image bytes"}, None
        elif isinstance(image_input, np.ndarray):
            image = image_input
        else:
            return {"success": False, "message": "Unsupported image input type"}, None

        annotated = image.copy() if return_annotated else None
        h, w = image.shape[:2]
        image_area = h * w

        # Run inference
        try:
            results = model(image, conf=conf_threshold, device=device)
        except (torch.cuda.OutOfMemoryError, RuntimeError) as e:
            if "cuda" in str(e).lower() and device == "cuda":
                logger.warning(f"CUDA OOM, falling back to CPU: {e}")
                results = model(image, conf=conf_threshold, device="cpu")
            else:
                raise

        result = results[0]
        detections_list: list[dict] = []

        if result.boxes is not None and len(result.boxes) > 0:
            boxes = result.boxes.xyxy.cpu().numpy()
            confidences = result.boxes.conf.cpu().numpy()
            class_ids = result.boxes.cls.cpu().numpy().astype(int)

            # Get class names from model
            class_names = model.names if hasattr(model, "names") else {}

            # Get contours from masks if available, else from bounding boxes
            if hasattr(result, "masks") and result.masks is not None and len(result.masks.xy) > 0:
                contours = [c.astype(int) for c in result.masks.xy]
            else:
                contours = [
                    np.array([
                        [int(b[0]), int(b[1])], [int(b[2]), int(b[1])],
                        [int(b[2]), int(b[3])], [int(b[0]), int(b[3])]
                    ], dtype=np.int32)
                    for b in boxes
                ]

            for i in range(len(boxes)):
                x1, y1, x2, y2 = map(int, boxes[i])
                confidence = float(confidences[i])
                cls_id = int(class_ids[i])
                cls_name = class_names.get(cls_id, f"class_{cls_id}")

                contour = contours[i]
                contour_area = cv2.contourArea(contour)
                area_ratio = contour_area / image_area if image_area > 0 else 0

                depth_score = estimate_depth_score(image, contour)
                priority, color = get_detection_priority(area_ratio, depth_score)

                detection = {
                    "id": i,
                    "class_name": cls_name,
                    "confidence": round(confidence, 4),
                    "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                    "position": ((x1 + x2) // 2, (y1 + y2) // 2),
                    "area_pixels": int(contour_area),
                    "area_ratio": round(area_ratio, 6),
                    "depth_score": round(depth_score, 4),
                    "priority": priority,
                }
                detections_list.append(detection)

                # Annotate
                if annotated is not None:
                    cv2.drawContours(annotated, [contour], -1, color, 2)
                    cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 1, cv2.LINE_AA)
                    label = f"{cls_name} {priority} ({confidence:.2f})"
                    cv2.putText(annotated, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        # Overall road priority
        road_priority, road_color, clusters = determine_road_priority(
            detections_list, proximity_threshold, (h, w)
        )

        if annotated is not None:
            # Draw cluster hulls
            for cluster in clusters:
                if len(cluster) > 1:
                    pts = np.array([detections_list[idx]["position"] for idx in cluster]).astype(np.int32)
                    hull = cv2.convexHull(pts.reshape(-1, 1, 2))
                    cv2.polylines(annotated, [hull], True, (255, 0, 255), 2)
            cv2.putText(annotated, f"Road Priority: {road_priority}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, road_color, 3)

        priority_counts = dict(Counter(d["priority"] for d in detections_list))

        result_dict = {
            "success": True,
            "total_detections": len(detections_list),
            "detections": detections_list,
            "road_priority": road_priority,
            "priority_counts": priority_counts,
            "message": f"Detected {len(detections_list)} hazard(s)." if detections_list else "No hazards detected.",
        }

        return result_dict, annotated

    except Exception as e:
        logger.error(f"Error in assess_road_image: {e}", exc_info=True)
        return {"success": False, "message": f"Detection error: {str(e)}"}, None


def encode_image_to_base64(image: np.ndarray, fmt: str = ".jpg") -> str | None:
    """Encode a numpy image array to base64 string."""
    try:
        success, encoded = cv2.imencode(fmt, image)
        if success:
            return base64.b64encode(encoded.tobytes()).decode("utf-8")
        return None
    except Exception as e:
        logger.error(f"Error encoding image: {e}")
        return None


# ─────────────────────────────────────────────
#  Video Assessment
# ─────────────────────────────────────────────


def assess_road_video(
    video_path: str,
    model=None,
    conf_threshold: float = 0.25,
    device: str = "cpu",
    sample_rate: int = 5,
) -> dict:
    """
    Assess a road video for hazards by sampling frames.

    Args:
        video_path: Path to video file.
        model: YOLO model. If None, uses global.
        conf_threshold: Detection confidence threshold.
        device: Inference device.
        sample_rate: Process every Nth frame.

    Returns:
        Summary dict with per-frame detections.
    """
    if model is None:
        model = _global_model
    if model is None:
        return {"success": False, "message": "Model not loaded", "total_frames_analyzed": 0, "total_detections": 0}

    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"success": False, "message": f"Could not open video: {video_path}", "total_frames_analyzed": 0, "total_detections": 0}

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

        all_detections: list[dict] = []
        frames_analyzed = 0
        frame_idx = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % sample_rate == 0:
                result, _ = assess_road_image(
                    frame, model, conf_threshold=conf_threshold, device=device, return_annotated=False
                )
                if result.get("success") and result.get("detections"):
                    for det in result["detections"]:
                        det["frame_index"] = frame_idx
                        det["timestamp_sec"] = round(frame_idx / fps, 2)
                    all_detections.extend(result["detections"])
                frames_analyzed += 1

            frame_idx += 1

        cap.release()

        # Build summary
        class_counts: dict[str, int] = {}
        priority_counts: dict[str, int] = {}
        for det in all_detections:
            cls = det.get("class_name", "unknown")
            pri = det.get("priority", "Low")
            class_counts[cls] = class_counts.get(cls, 0) + 1
            priority_counts[pri] = priority_counts.get(pri, 0) + 1

        return {
            "success": True,
            "total_frames_analyzed": frames_analyzed,
            "total_frames": total_frames,
            "total_detections": len(all_detections),
            "summary": {
                "class_counts": class_counts,
                "priority_counts": priority_counts,
                "fps": fps,
                "sample_rate": sample_rate,
            },
            "message": f"Analyzed {frames_analyzed} frames, found {len(all_detections)} detection(s).",
        }

    except Exception as e:
        logger.error(f"Error in assess_road_video: {e}", exc_info=True)
        return {"success": False, "message": f"Video processing error: {str(e)}", "total_frames_analyzed": 0, "total_detections": 0}
