from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from routers.duplication import router


class FakeDetector:
    def __init__(self) -> None:
        self.reports_db = [object()] * 9
        self.issue_type_clusters = {"pothole": [0, 1]}
        self.image_kmeans = None
        self.has_enough_data_for_xgboost = False
        self.build_clusters_called = 0

    def process_json_input(self, payload: dict) -> dict:
        return {
            "is_duplicate": 1,
            "confidence": 0.88,
            "original_report_id": "cmp-42",
            "similar_reports": [
                {
                    "id": "cmp-42",
                    "text": "Existing complaint",
                    "issue_type": payload["issue_type"],
                    "location": payload["location"],
                }
            ],
        }

    def add_report(self, payload: dict) -> int:
        self.reports_db.append(payload)
        return len(self.reports_db) - 1

    def build_clusters(self) -> None:
        self.build_clusters_called += 1
        self.image_kmeans = object()


def create_client(detector: FakeDetector) -> TestClient:
    app = FastAPI()
    app.state.detector = detector
    app.include_router(router)
    return TestClient(app)


def test_check_duplicate_maps_detector_response() -> None:
    client = create_client(FakeDetector())

    response = client.post(
        "/duplicate/check",
        json={
            "text": "Big pothole near signal",
            "location": [28.61, 77.20],
            "issue_type": "pothole",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["is_duplicate"] is True
    assert body["confidence"] == 0.88
    assert body["original_report_id"] == "cmp-42"
    assert body["similar_reports"][0]["id"] == "cmp-42"


def test_add_report_rebuilds_clusters_every_tenth_report() -> None:
    detector = FakeDetector()
    client = create_client(detector)

    response = client.post(
        "/duplicate/add-report",
        json={
            "id": "cmp-99",
            "text": "Road cave-in",
            "location": [28.61, 77.20],
            "issue_type": "pothole",
        },
    )

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert detector.build_clusters_called == 1


def test_duplicate_stats_reflects_detector_state() -> None:
    detector = FakeDetector()
    detector.image_kmeans = object()
    detector.has_enough_data_for_xgboost = True
    client = create_client(detector)

    response = client.get("/duplicate/stats")

    assert response.status_code == 200
    assert response.json() == {
        "total_reports": 9,
        "issue_types": {"pothole": 2},
        "xgboost_trained": True,
        "clusters_built": True,
    }
