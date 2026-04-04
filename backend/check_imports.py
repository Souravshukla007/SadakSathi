"""
Quick import validation for SadakSathi backend.
Run from backend/ directory: python check_imports.py
"""
import sys
import traceback

checks = [
    ("config", "from config import get_settings, ROAD_HAZARD_CLASSES, TRAFFIC_VIOLATION_CLASSES"),
    ("ml.detection", "from ml.detection import load_model, get_detection_priority, assess_road_image, assess_road_video"),
    ("ml.traffic", "from ml.traffic import load_traffic_model, load_ocr_reader, get_traffic_device, assess_traffic_image, assess_traffic_video, encode_image_to_base64"),
    ("models.schemas", "from models.schemas import TrafficDetection, TrafficAssessmentResponse, TrafficVideoAssessmentResponse, UniqueViolation, TrafficVideoSummary, HealthResponse, SingleDetection, ImageAssessmentResponse"),
    ("routers.health", "from routers.health import router"),
    ("routers.detection", "from routers.detection import router"),
    ("routers.duplication", "from routers.duplication import router"),
    ("routers.traffic", "from routers.traffic import router"),
    ("main", "from main import app"),
]

all_ok = True
for name, stmt in checks:
    try:
        exec(stmt)
        print(f"  ✅ {name}")
    except Exception as e:
        print(f"  ❌ {name}: {e}")
        traceback.print_exc()
        all_ok = False

print()
print("✅ ALL IMPORTS OK" if all_ok else "❌ SOME IMPORTS FAILED — see above")
