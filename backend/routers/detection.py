"""
SadakSathi — Detection API Router

Endpoints:
    POST /detect/image  — Upload an image for multi-class hazard detection
    POST /detect/video  — Upload a video for frame-by-frame hazard detection
"""

from __future__ import annotations

import logging
import os
import uuid

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from config import UPLOAD_PATH
from ml.detection import assess_road_image, assess_road_video, encode_image_to_base64, get_device
from models.schemas import ImageAssessmentResponse, VideoAssessmentResponse
from routers.stats import record_detection

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/detect", tags=["Detection"])

# Max file sizes
MAX_IMAGE_SIZE = 20 * 1024 * 1024  # 20 MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB


@router.post("/image", response_model=ImageAssessmentResponse)
async def detect_image(
    request: Request,
    file: UploadFile = File(..., description="Image file (JPG, PNG, WEBP)"),
    conf_threshold: float = Form(0.25, description="Confidence threshold (0.0 - 1.0)"),
    include_annotated: bool = Form(True, description="Include base64-encoded annotated image"),
):
    """
    Upload an image for multi-class hazard detection.

    Detects: pothole, manhole_cover, garbage, overflow_garbage, fallen_tree, etc.
    Returns bounding boxes, confidence scores, depth scores, per-detection priority, 
    overall road priority, and optionally an annotated image (base64).
    """
    model = getattr(request.app.state, "model", None)
    if model is None:
        raise HTTPException(status_code=503, detail="ML model not loaded. Please place a .pt model file and restart.")

    # Validate file type
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail=f"Expected image file, got: {content_type}")

    # Read file bytes
    image_bytes = await file.read()
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail=f"Image too large. Max {MAX_IMAGE_SIZE // (1024*1024)}MB.")

    # Run detection
    device = get_device()
    result, annotated = assess_road_image(
        image_bytes,
        model=model,
        conf_threshold=conf_threshold,
        device=device,
        return_annotated=include_annotated,
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("message", "Detection failed"))

    # Encode annotated image
    annotated_b64 = None
    if annotated is not None and include_annotated:
        annotated_b64 = encode_image_to_base64(annotated)

    # Clean detections for response (remove internal 'position' field)
    clean_detections = []
    for det in result.get("detections", []):
        clean_det = {k: v for k, v in det.items() if k != "position"}
        clean_detections.append(clean_det)

    response = ImageAssessmentResponse(
        success=True,
        total_detections=result.get("total_detections", 0),
        detections=clean_detections,
        road_priority=result.get("road_priority", "Low"),
        priority_counts=result.get("priority_counts", {}),
        annotated_image_base64=annotated_b64,
        message=result.get("message", ""),
    )

    # Update session-scoped stats
    record_detection(
        engine="road",
        total_detections=response.total_detections,
        priority_counts=result.get("priority_counts", {}),
        class_counts={det.class_name: 1 for det in response.detections},
    )

    return response


@router.post("/video", response_model=VideoAssessmentResponse)
async def detect_video(
    request: Request,
    file: UploadFile = File(..., description="Video file (MP4, AVI, MOV)"),
    conf_threshold: float = Form(0.25, description="Confidence threshold"),
    sample_rate: int = Form(5, description="Process every Nth frame (default: 5)"),
):
    """
    Upload a video for hazard detection.

    Processes sampled frames, returns aggregate detection summary.
    """
    model = getattr(request.app.state, "model", None)
    if model is None:
        raise HTTPException(status_code=503, detail="ML model not loaded.")

    content_type = file.content_type or ""
    if not content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail=f"Expected video file, got: {content_type}")

    video_bytes = await file.read()
    if len(video_bytes) > MAX_VIDEO_SIZE:
        raise HTTPException(status_code=413, detail=f"Video too large. Max {MAX_VIDEO_SIZE // (1024*1024)}MB.")

    # Save to temp file (OpenCV needs file path for video)
    temp_filename = f"{uuid.uuid4().hex}.mp4"
    temp_path = UPLOAD_PATH / temp_filename

    try:
        with open(temp_path, "wb") as f:
            f.write(video_bytes)

        device = get_device()
        result = assess_road_video(
            str(temp_path),
            model=model,
            conf_threshold=conf_threshold,
            device=device,
            sample_rate=sample_rate,
        )

        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message", "Video processing failed"))

        response = VideoAssessmentResponse(
            success=True,
            total_frames_analyzed=result.get("total_frames_analyzed", 0),
            total_detections=result.get("total_detections", 0),
            summary=result.get("summary", {}),
            message=result.get("message", ""),
        )

        # Update session-scoped stats
        summary = result.get("summary", {})
        record_detection(
            engine="road",
            total_detections=response.total_detections,
            priority_counts=summary.get("priority_counts", {}),
            class_counts=summary.get("class_counts", {}),
        )

        return response

    finally:
        # Cleanup temp file
        if temp_path.exists():
            try:
                os.remove(temp_path)
            except Exception:
                pass
