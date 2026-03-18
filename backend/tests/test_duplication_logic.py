from __future__ import annotations

from collections import defaultdict

from ml.duplication import CivicIssueDuplicateDetector, _decode_base64_image


def build_detector() -> CivicIssueDuplicateDetector:
    detector = CivicIssueDuplicateDetector.__new__(CivicIssueDuplicateDetector)
    detector.location_threshold = 0.1
    detector.text_similarity_threshold = 0.65
    detector.image_model_available = False
    detector.image_model = None
    detector.image_transform = None
    detector.tfidf = None
    detector.tfidf_fitted = False
    detector.text_model = None
    detector.text_model_available = False
    detector.image_features_db = []
    detector.location_db = []
    detector.text_embeddings_db = []
    detector.text_raw_db = []
    detector.issue_types_db = []
    detector.reports_db = []
    detector.image_kmeans = None
    detector.image_clusters = []
    detector.location_clusters = defaultdict(list)
    detector.issue_type_clusters = defaultdict(list)
    detector.xgb_model = None
    detector.scaler = None
    detector.has_enough_data_for_xgboost = False
    detector._check_and_train_xgboost = lambda: None
    return detector


def test_decode_base64_image_falls_back_to_blank_image() -> None:
    image = _decode_base64_image("not-valid-base64")

    assert image.size == (224, 224)
    assert image.mode == "RGB"


def test_add_report_rejects_missing_required_fields() -> None:
    detector = build_detector()

    index = detector.add_report({"text": "Missing location", "issue_type": "pothole"})

    assert index is None
    assert detector.reports_db == []


def test_process_json_input_includes_original_id_and_truncates_text() -> None:
    detector = build_detector()
    long_text = "a" * 120
    detector.find_duplicates = lambda data: (
        True,
        [
            {
                "id": "cmp-1",
                "text": long_text,
                "issue_type": "pothole",
                "location": [28.6139, 77.2090],
            }
        ],
        0.9234,
    )

    response = detector.process_json_input(
        {"text": "Pothole near market", "location": [28.6139, 77.2090], "issue_type": "pothole"}
    )

    assert response["is_duplicate"] == 1
    assert response["confidence"] == 0.9234
    assert response["original_report_id"] == "cmp-1"
    assert response["similar_reports"][0]["text"].endswith("...")
    assert len(response["similar_reports"][0]["text"]) == 103
