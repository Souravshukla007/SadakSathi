"""
Standalone detection script.
Runs both road-hazard models on an image and saves annotated results.

Usage:
    python run_detection.py
"""

import sys
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT        = Path(__file__).resolve().parent
IMAGE_PATH  = Path(r"C:\Users\Hello\Downloads\garbage.jpg")

MODEL_NANO  = ROOT / "backend" / "models" / "best_model_nano_0.81_map@50_score.pt"
MODEL_WHOLE = ROOT / "backend" / "models" / "best_whole_model_nano.pt"

OUT_NANO    = ROOT / "result_nano.jpg"
OUT_WHOLE   = ROOT / "result_whole.jpg"

# ── Sanity checks ──────────────────────────────────────────────────────────────
for p, label in [(IMAGE_PATH, "Input image"), (MODEL_NANO, "Nano model"), (MODEL_WHOLE, "Whole model")]:
    if not p.exists():
        print(f"[ERROR] {label} not found: {p}")
        sys.exit(1)

# ── Imports ────────────────────────────────────────────────────────────────────
try:
    from ultralytics import YOLO
    import cv2
except ImportError as e:
    print(f"[ERROR] Missing dependency: {e}")
    print("       Run:  pip install ultralytics opencv-python")
    sys.exit(1)

# ── Helper ─────────────────────────────────────────────────────────────────────

PRIORITY_COLOR = {
    "High":   (0,   0, 255),   # red   (BGR)
    "Medium": (0, 165, 255),   # orange
    "Low":    (0, 255,   0),   # green
}

def priority(area_ratio: float) -> str:
    if area_ratio > 0.01:  return "High"
    if area_ratio > 0.004: return "Medium"
    return "Low"

def run_and_save(model_path: Path, output_path: Path, label: str) -> None:
    print(f"\n{'='*60}")
    print(f"  Model : {model_path.name}")
    print(f"  Output: {output_path.name}")
    print(f"{'='*60}")

    model = YOLO(str(model_path))
    results = model(str(IMAGE_PATH), conf=0.13, verbose=False)
    result  = results[0]

    # Load image for annotation
    img = cv2.imread(str(IMAGE_PATH))
    h, w = img.shape[:2]
    area  = h * w

    detections = []

    if result.boxes is not None and len(result.boxes):
        boxes       = result.boxes.xyxy.cpu().numpy()
        confs       = result.boxes.conf.cpu().numpy()
        class_ids   = result.boxes.cls.cpu().numpy().astype(int)
        class_names = model.names

        for i in range(len(boxes)):
            x1, y1, x2, y2 = map(int, boxes[i])
            conf  = float(confs[i])
            cls   = class_names.get(class_ids[i], f"cls_{class_ids[i]}")
            ar    = ((x2 - x1) * (y2 - y1)) / area
            pri   = priority(ar)
            color = PRIORITY_COLOR[pri]

            detections.append({"class": cls, "conf": conf, "priority": pri, "bbox": (x1, y1, x2, y2)})

            # Draw bbox
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
            text  = f"{cls} {pri} {conf:.2f}"
            (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
            cv2.rectangle(img, (x1, y1 - th - 8), (x1 + tw + 4, y1), color, -1)
            cv2.putText(img, text, (x1 + 2, y1 - 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

    # Overall label
    overall = "High" if any(d["priority"] == "High" for d in detections) \
              else "Medium" if any(d["priority"] == "Medium" for d in detections) \
              else "Low"
    oc = PRIORITY_COLOR[overall]
    cv2.putText(img, f"[{label}] Road Priority: {overall}  |  {len(detections)} detection(s)",
                (10, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.9, oc, 3)

    cv2.imwrite(str(output_path), img)

    # Console summary
    print(f"  Detections : {len(detections)}")
    print(f"  Road Priority : {overall}")
    for d in detections:
        x1, y1, x2, y2 = d["bbox"]
        print(f"    [{d['priority']:6s}] {d['class']:<22s}  conf={d['conf']:.3f}  bbox=({x1},{y1})->({x2},{y2})")
    print(f"\n  Saved → {output_path}")


# ── Run ────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    run_and_save(MODEL_NANO,  OUT_NANO,  "Nano 0.81 mAP")
    run_and_save(MODEL_WHOLE, OUT_WHOLE, "Whole Model")
    print(f"\n✅  Done!  Results saved to:")
    print(f"   {OUT_NANO}")
    print(f"   {OUT_WHOLE}")
