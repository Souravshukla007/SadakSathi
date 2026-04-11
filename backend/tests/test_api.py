import os
import pytest
from fastapi.testclient import TestClient

import sys
project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
backend_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(backend_dir)

# Import the FastAPI app instance from main.py
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
            data={"conf_threshold": "0.25"}
        )
    
    # If models are not loaded (503 Service Unavailable), skip the test gracefully instead of failing
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
