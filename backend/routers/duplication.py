"""
SadakSathi — Duplication Detection API Router

Endpoints:
    POST /duplicate/check       — Check if a report is a duplicate
    POST /duplicate/add-report  — Add a report to the detector's database
    GET  /duplicate/stats       — Get detector statistics
"""

from __future__ import annotations

import logging
from collections import Counter

from fastapi import APIRouter, HTTPException, Request

from models.schemas import (
    AddReportRequest,
    AddReportResponse,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    DuplicateStatsResponse,
    SimilarReport,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/duplicate", tags=["Duplication Detection"])


def _get_detector(request: Request):
    """Get the detector instance from app state, or raise 503."""
    detector = getattr(request.app.state, "detector", None)
    if detector is None:
        raise HTTPException(status_code=503, detail="Duplicate detector not initialized.")
    return detector


@router.post("/check", response_model=DuplicateCheckResponse)
def check_duplicate(request: Request, body: DuplicateCheckRequest):
    """
    Check if a new report is a duplicate of any existing report.

    Compares using:
    - Text similarity (Sentence-BERT)
    - Image similarity (ResNet50) — if image_base64 is provided
    - Geospatial proximity (Geopy)
    - XGBoost classifier (if trained)
    """
    detector = _get_detector(request)

    report_data = {
        "text": body.text,
        "location": body.location,
        "issue_type": body.issue_type,
    }
    if body.image_base64:
        report_data["image_base64"] = body.image_base64

    result = detector.process_json_input(report_data)

    is_dup = bool(result.get("is_duplicate", 0))
    confidence = float(result.get("confidence", 0.0))
    original_id = result.get("original_report_id")

    similar = []
    for sr in result.get("similar_reports", []):
        similar.append(SimilarReport(
            id=sr.get("id", "unknown"),
            text=sr.get("text", ""),
            issue_type=sr.get("issue_type", ""),
            location=sr.get("location", []),
        ))

    return DuplicateCheckResponse(
        is_duplicate=is_dup,
        confidence=confidence,
        original_report_id=original_id,
        similar_reports=similar,
    )


@router.post("/add-report", response_model=AddReportResponse)
def add_report(request: Request, body: AddReportRequest):
    """
    Add a report to the detector's internal database for future duplicate checks.

    This should be called whenever a new complaint is submitted so the detector
    can compare future reports against it.
    """
    detector = _get_detector(request)

    report_data = {
        "id": body.id,
        "text": body.text,
        "location": body.location,
        "issue_type": body.issue_type,
    }
    if body.image_base64:
        report_data["image_base64"] = body.image_base64

    index = detector.add_report(report_data)

    if index is not None:
        return AddReportResponse(success=True, index=index, message=f"Report added at index {index}.")
    else:
        return AddReportResponse(success=False, index=None, message="Failed to add report.")


@router.get("/stats", response_model=DuplicateStatsResponse)
def duplicate_stats(request: Request):
    """
    Get statistics about the duplicate detector's current state.
    """
    detector = _get_detector(request)

    issue_counts = dict(Counter(detector.issue_types_db))

    return DuplicateStatsResponse(
        total_reports=len(detector.reports_db),
        issue_types=issue_counts,
        # XGBoost and stored KMeans were removed from the v2 detector; keep the response shape.
        xgboost_trained=getattr(detector, "has_enough_data_for_xgboost", False),
        clusters_built=getattr(detector, "image_kmeans", None) is not None,
    )
