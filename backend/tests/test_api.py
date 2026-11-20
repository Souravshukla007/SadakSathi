"""
SadakSathi Backend — API Tests

These tests run against the FastAPI app without requiring heavy ML dependencies.
Tests that require ML models (torch, ultralytics, etc.) skip gracefully.
"""

import os

import pytest
from fastapi.testclient import TestClient

import sys

backend_dir = os.path.dirname(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health_endpoint(client):
    """Test that the application healthcheck returns 200 OK and valid structure."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model_loaded" in data


def test_duplicate_stats_endpoint(client):
    """Test duplicate statistics endpoint."""
    response = client.get("/duplicate/stats")
    # If the detector couldn't be created (missing ML deps), it returns 503
    if response.status_code == 503:
        pytest.skip("Duplicate detector not available (missing ML deps).")
    assert response.status_code == 200
    data = response.json()
    assert "total_reports" in data


def test_duplicate_check_validation_error(client):
    """Test duplicate check strict Pydantic validation (missing location)."""
    # Missing location and issue_type should trigger 422 Unprocessable Entity
    response = client.post("/duplicate/check", json={"text": "massive pothole on MG Road"})
    assert response.status_code == 422


def test_detect_image_validation_error(client):
    """Test detection endpoint payload validation (missing file)."""
    response = client.post("/detect/image")
    assert response.status_code == 422


def test_traffic_detect_image_validation_error(client):
    """Test traffic detection endpoint payload validation (missing file)."""
    response = client.post("/detect/traffic/image")
    assert response.status_code == 422


def test_traffic_detection_with_actual_image(client):
    """
    Test the actual traffic analysis pipeline over an existing test image.
    Validates model inference and endpoint response schemas organically avoiding mocks.
    """
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    image_path = os.path.join(project_root, "test_image", "road_safety_2.jpg")

    if not os.path.exists(image_path):
        pytest.skip(f"Could not find test image: {image_path}")

    with open(image_path, "rb") as f:
        # We need to send it as multipart form-data
        response = client.post(
            "/detect/traffic/image",
            files={"file": ("road_safety_2.jpg", f, "image/jpeg")},
            data={"conf_threshold": "0.25"},
        )

    # If models are not loaded (503 Service Unavailable), skip gracefully
    if response.status_code == 503:
        pytest.skip("Traffic ML model is not loaded in backend (missing pt file). Skipping inference assertion.")

    # Otherwise check that HTTP response was successful
    assert response.status_code == 200

    data = response.json()
    # Confirm our Pipeline schemas matched and executed successfully
    assert data.get("success") is True
    assert "detections" in data
    assert "annotated_image_base64" in data

    # We know previously that road_safety_2 triggered violations (TripleRiding)
    # The endpoint should return a list of detections
    assert isinstance(data["detections"], list)


def test_stats_routes_removed(client):
    """The per-process /stats counters had no readers and were removed."""
    assert client.get("/stats").status_code == 404
    assert client.post("/stats/reset").status_code in (404, 405)


def test_api_key_required_when_configured(client, monkeypatch):
    from config import get_settings

    monkeypatch.setattr(get_settings(), "ML_API_KEY", "s3cret")
    assert client.post("/duplicate/check", json={}).status_code == 401
    assert client.post("/duplicate/check", json={}, headers={"X-API-Key": "wrong"}).status_code == 401
    # With the right key the request reaches validation (422 for the empty body), and /health stays open.
    assert client.post("/duplicate/check", json={}, headers={"X-API-Key": "s3cret"}).status_code == 422
    assert client.get("/health").status_code == 200


def test_detect_image_returns_every_detection(client, monkeypatch):
    """The image handler passes all detections through (runs in the threadpool, no stats side effects)."""
    import types

    det = {
        "class_name": "pothole", "confidence": 0.9,
        "bbox": {"x1": 0, "y1": 0, "x2": 1, "y2": 1},
        "area_pixels": 1, "area_ratio": 0.1, "depth_score": 0.1, "priority": "High",
    }
    result = {
        "success": True, "total_detections": 3,
        "detections": [dict(det, id=i) for i in range(3)],
        "road_priority": "High", "priority_counts": {"High": 3},
    }
    fake = types.ModuleType("ml.detection")
    fake.assess_road_image = lambda *a, **k: (result, None)
    fake.encode_image_to_base64 = lambda img: None
    fake.get_device = lambda: "cpu"
    monkeypatch.setitem(sys.modules, "ml.detection", fake)
    monkeypatch.setattr(client.app.state, "model", object(), raising=False)

    response = client.post("/detect/image", files={"file": ("x.jpg", b"fake", "image/jpeg")})
    assert response.status_code == 200
    assert [d["class_name"] for d in response.json()["detections"]] == ["pothole"] * 3


def test_health_reports_ocr_false_when_loader_failed(client, monkeypatch):
    monkeypatch.setattr(client.app.state, "ocr_reader", False, raising=False)
    assert client.get("/health").json()["ocr_loaded"] is False
