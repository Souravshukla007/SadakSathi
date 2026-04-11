import logging
from typing import Annotated
from fastapi import APIRouter, File, Form, Request, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from models.schemas import TrafficAssessmentResponse
from ml.traffic import assess_traffic_image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/traffic/analyze", tags=["Traffic Violations"])

# Avoid circular import, re-use existing encode function if needed
def local_encode_image(image, fmt=".jpg"):
    import cv2
    import base64
    success, encoded = cv2.imencode(fmt, image)
    if success:
        return base64.b64encode(encoded.tobytes()).decode("utf-8")
    return None

@router.post("/image", response_model=TrafficAssessmentResponse)
async def analyze_traffic_image(
    request: Request,
    file: Annotated[UploadFile, File(...)],
    conf_threshold: Annotated[float, Form()] = 0.25
):
    """
    Detect traffic violations (WithoutHelmet, TripleRiding) and extract license plates.
    Returns bounding boxes and PaddleOCR text extraction for plates.
    """
    try:
        contents = await file.read()
    except Exception as e:
        logger.error(f"Error reading traffic upload: {e}")
        raise HTTPException(status_code=400, detail="Could not read file")

    model = getattr(request.app.state, "traffic_model", None)
    if not model:
        raise HTTPException(status_code=503, detail="Traffic YOLO model not loaded")

    result_dict, annotated_img = assess_traffic_image(
        image_input=contents,
        model=model,
        conf_threshold=conf_threshold,
        return_annotated=True
    )

    if not result_dict.get("success"):
        raise HTTPException(status_code=500, detail=result_dict.get("message", "Traffic diagnosis failed"))

    base64_img = None
    if annotated_img is not None:
        base64_img = local_encode_image(annotated_img)

    return TrafficAssessmentResponse(
        success=True,
        total_detections=result_dict["total_detections"],
        detections=result_dict["detections"],
        annotated_image_base64=base64_img,
        message=result_dict["message"]
    )
