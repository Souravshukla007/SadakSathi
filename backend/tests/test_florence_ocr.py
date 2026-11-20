"""
Test Florence-2-base OCR on Indian plate images from test_img/.

Expected plates:
  debug_crop.png             -> AP 21 BC 2008
  image.png                  -> TN 50 AK 4747
  image copy.png             -> KA 24 EA 3843
  WhatsApp...41.jpeg         -> TN 51A M1215
  WhatsApp...41 (1).jpeg     -> AP 21 BC 2008
"""
import os
import sys
import time

import cv2
import pytest
import numpy as np

# Add parent so ml.plate_ocr is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

TEST_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "test_img")
)

PLATE_CROPS = {
    "image.png": [
        ("TN 50 AK 4747", 0.28, 0.62, 0.72, 0.92),
    ],
    "image copy.png": [
        ("KA 24 EA 3843", 0.18, 0.55, 0.80, 0.82),
    ],
    "WhatsApp Image 2026-05-15 at 02.04.41.jpeg": [
        ("TN 51A M1215", 0.05, 0.05, 0.95, 0.95),
    ],
    "WhatsApp Image 2026-05-15 at 02.04.41 (1).jpeg": [
        ("AP 21 BC 2008", 0.02, 0.55, 0.38, 0.95),
    ],
}

def test_florence_plate_ocr():
    pytest.importorskip("torch")
    pytest.importorskip("transformers")
    if not os.path.isdir(TEST_DIR):
        pytest.skip(f"Plate test images not found: {TEST_DIR}")
    print("=" * 65)
    print("  Florence-2-base OCR Test on Indian Plates")
    print("=" * 65)

    # ── Load Florence-2 ──
    from ml.plate_ocr import load_plate_ocr, read_plate_text

    print("\n[1] Loading Florence-2-base...")
    t0 = time.time()
    ok = load_plate_ocr(model_id="microsoft/Florence-2-base", device="cpu")
    print(f"    Loaded: {ok} in {time.time()-t0:.1f}s")

    if not ok:
        print("    FAILED to load model. Exiting.")
        pytest.skip("Florence-2 model could not be loaded")

    # ── Also test debug_crop.png directly ──
    print("\n[2] Testing debug_crop.png (pre-cropped plate)...")
    debug_crop = cv2.imread(os.path.join(TEST_DIR, "debug_crop.png"))
    if debug_crop is not None:
        h, w = debug_crop.shape[:2]
        bbox = {"x1": 0, "y1": 0, "x2": w, "y2": h}
        t0 = time.time()
        text = read_plate_text(debug_crop, bbox, pad=0)
        elapsed = (time.time() - t0) * 1000
        print(f"    Expected: AP 21 BC 2008")
        print(f"    Got:      {text}  ({elapsed:.0f}ms)")

    # ── Test all plate crops ──
    print("\n[3] Testing plate crops from full images...\n")
    print(f"  {'Expected':<25} {'Got':<25} {'Time':>8}")
    print("  " + "-" * 62)

    images = sorted(
        f for f in os.listdir(TEST_DIR) if f.lower().endswith((".png", ".jpg", ".jpeg"))
    )

    total_time = 0
    count = 0

    for img_file in images:
        if img_file == "debug_crop.png":
            continue

        crops = PLATE_CROPS.get(img_file)
        if not crops:
            continue

        img_path = os.path.join(TEST_DIR, img_file)
        image = cv2.imread(img_path)
        if image is None:
            continue

        h, w = image.shape[:2]

        for expected, fx1, fy1, fx2, fy2 in crops:
            x1, y1 = int(fx1 * w), int(fy1 * h)
            x2, y2 = int(fx2 * w), int(fy2 * h)

            crop = image[y1:y2, x1:x2]
            ch, cw = crop.shape[:2]

            # Use read_plate_text with a full-crop bbox
            bbox = {"x1": 0, "y1": 0, "x2": cw, "y2": ch}
            t0 = time.time()
            text = read_plate_text(crop, bbox, pad=0)
            elapsed = (time.time() - t0) * 1000

            total_time += elapsed
            count += 1

            match = "YES" if text and expected.replace(" ", "")[:4] in text.replace(" ", "") else "no"
            print(f"  {expected:<25} {str(text):<25} {elapsed:>6.0f}ms  {match}")

    # ── Speed benchmark ──
    print(f"\n[4] Speed: {count} plates in {total_time:.0f}ms, avg {total_time/max(count,1):.0f}ms/plate")

    print("\nDone!")


if __name__ == "__main__":
    test_florence_plate_ocr()
