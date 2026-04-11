"""
SadakSathi — ML Traffic Violation Module (YOLO + PaddleOCR)
"""
from __future__ import annotations

import base64
import logging
import os
os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

import cv2
import numpy as np
import torch

from models.schemas import TrafficDetectionResult, BoundingBox

logger = logging.getLogger(__name__)

_global_traffic_model = None
_ocr_model = None

def get_ocr():
    global _ocr_model
    if _ocr_model is None:
        try:
            from paddleocr import PaddleOCR
            # Using English lang OCR for plates, disable angle classifier for speed
            _ocr_model = PaddleOCR(use_angle_cls=False, lang='en')
            logger.info("✅ PaddleOCR model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load PaddleOCR: {e}", exc_info=True)
    return _ocr_model

def load_traffic_model(model_path: str, device: str = "auto"):
    global _global_traffic_model
    if not os.path.exists(model_path):
        logger.warning(f"Traffic model file not found: {model_path}.")
        return None
    try:
        from ultralytics import YOLO
        logger.info(f"Loading Traffic YOLO model from {model_path}")
        model = YOLO(model_path)
        if device == "auto":
            device = "cuda" if torch.cuda.is_available() else "cpu"
        model.to(device)
        _global_traffic_model = model
        logger.info("✅ Traffic YOLO model loaded successfully.")
        return model
    except Exception as e:
        logger.error(f"Failed to load Traffic YOLO model: {e}", exc_info=True)
        return None

def extract_plate_text(image: np.ndarray, bbox: dict) -> str | None:
    ocr = get_ocr()
    if not ocr: return None
    
    x1, y1, x2, y2 = bbox["x1"], bbox["y1"], bbox["x2"], bbox["y2"]
    
    h, w = image.shape[:2]
    px, py = 5, 5
    cx1 = max(0, x1 - px)
    cy1 = max(0, y1 - py)
    cx2 = min(w, x2 + px)
    cy2 = min(h, y2 + py)
    
    crop = image[cy1:cy2, cx1:cx2]
    if crop.size == 0: return None
    
    try:
        results = ocr.ocr(crop, cls=False)
        if not results or not results[0]: return None
        text_lines = [line[1][0] for line in results[0]]
        return " ".join(text_lines)
    except Exception as e:
        logger.warning(f"OCR failed on plate: {e}")
        return None

def assess_traffic_image(
    image_input,
    model=None,
    conf_threshold: float = 0.25,
    device: str = "cpu",
    return_annotated: bool = True
) -> tuple[dict, np.ndarray | None]:
    if model is None: model = _global_traffic_model
    if model is None:
        return {"success": False, "message": "Traffic model not loaded"}, None

    try:
        if isinstance(image_input, str):
            image = cv2.imread(image_input)
        elif isinstance(image_input, bytes):
            image = cv2.imdecode(np.frombuffer(image_input, np.uint8), cv2.IMREAD_COLOR)
        elif isinstance(image_input, np.ndarray):
            image = image_input
        else:
            return {"success": False, "message": "Unsupported image format"}, None

        if image is None:
            return {"success": False, "message": "Could not read image"}, None

        annotated = image.copy() if return_annotated else None
        
        try:
            results = model(image, conf=conf_threshold, device=device)
        except Exception as e:
            if "cuda" in str(e).lower() and device == "cuda":
                results = model(image, conf=conf_threshold, device="cpu")
            else:
                raise

        result = results[0]
        detections: list[TrafficDetectionResult] = []
        has_violation = False

        if result.boxes is not None and len(result.boxes) > 0:
            boxes = result.boxes.xyxy.cpu().numpy()
            confidences = result.boxes.conf.cpu().numpy()
            class_ids = result.boxes.cls.cpu().numpy().astype(int)
            class_names = model.names if hasattr(model, "names") else {}

            for i in range(len(boxes)):
                x1, y1, x2, y2 = map(int, boxes[i])
                cls_name = class_names.get(class_ids[i], "Unknown")
                conf = float(confidences[i])

                if cls_name == "WithHelmet":
                    continue # User requested: ignore WithHelmet completely

                if cls_name in ["WithoutHelmet", "TripleRiding"]:
                    has_violation = True

                bbox = BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2)
                
                det = TrafficDetectionResult(
                    id=i, 
                    class_name=cls_name,
                    confidence=round(conf, 4),
                    bbox=bbox,
                    plate_text=None
                )
                
                detections.append(det)

                if annotated is not None:
                    color = (0, 0, 255) if cls_name in ["WithoutHelmet", "TripleRiding"] else (255, 0, 0)
                    cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(annotated, f"{cls_name} {conf:.2f}", (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        # Run OCR ONLY if a violation (WithoutHelmet or TripleRiding) was detected
        if has_violation:
            for det in detections:
                if det.class_name == "Plate":
                    text = extract_plate_text(image, {"x1": det.bbox.x1, "y1": det.bbox.y1, "x2": det.bbox.x2, "y2": det.bbox.y2})
                    det.plate_text = text
                    if annotated is not None and text:
                        cv2.putText(annotated, f"OCR: {text}", (det.bbox.x1, det.bbox.y2 + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

        res_dict = {
            "success": True,
            "total_detections": len(detections),
            "detections": detections,
            "message": f"Assessed {len(detections)} relevant traffic object(s)."
        }
        return res_dict, annotated

    except Exception as e:
        logger.error(f"Traffic detection error: {e}", exc_info=True)
        return {"success": False, "message": str(e)}, None
