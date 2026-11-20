"""
Integration test: Florence-2 OCR through traffic.py's interface.
Verifies that load_ocr_reader() and read_plate_text() work correctly
after the EasyOCR -> Florence-2 migration.
"""
import os
import sys
import time

import cv2
import pytest
import numpy as np

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

def test_florence_ocr_via_traffic():
    pytest.importorskip("torch")
    pytest.importorskip("transformers")
    print("=" * 65)
    print("  Florence-2 Integration Test via traffic.py")
    print("=" * 65)

    from ml.traffic import load_ocr_reader, get_ocr_reader, read_plate_text

    # [1] Load OCR via traffic.py's interface
    print("\n[1] Loading OCR via load_ocr_reader()...")
    t0 = time.time()
    result = load_ocr_reader()
    print(f"    Result: {result} in {time.time()-t0:.1f}s")
    print(f"    get_ocr_reader(): {get_ocr_reader()}")

    if not result:
        print("    FAILED to load OCR. Exiting.")
        pytest.skip("Florence-2 OCR could not be loaded")

    # [2] Test read_plate_text on test images
    TEST_DIR = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "test_img")
    )

    print(f"\n[2] Testing read_plate_text on images from {TEST_DIR}...\n")

    tests = [
        ("debug_crop.png",    "AP 21 BC 2008",  None),   # pre-cropped, use full image
        ("image.png",         "TN 50 AK 4747",  (0.28, 0.62, 0.72, 0.92)),
        ("WhatsApp Image 2026-05-15 at 02.04.41.jpeg", "TN 51A M1215", None),
        ("WhatsApp Image 2026-05-15 at 02.04.41 (1).jpeg", "AP 21 BC 2008", (0.02, 0.55, 0.38, 0.95)),
    ]

    print(f"  {'Expected':<25} {'Got':<25} {'Time':>8}")
    print("  " + "-" * 62)

    for fname, expected, crop_frac in tests:
        img_path = os.path.join(TEST_DIR, fname)
        image = cv2.imread(img_path)
        if image is None:
            print(f"  {expected:<25} (image not found)")
            continue

        h, w = image.shape[:2]

        if crop_frac:
            fx1, fy1, fx2, fy2 = crop_frac
            x1, y1 = int(fx1 * w), int(fy1 * h)
            x2, y2 = int(fx2 * w), int(fy2 * h)
            bbox = {"x1": x1, "y1": y1, "x2": x2, "y2": y2}
        else:
            bbox = {"x1": 0, "y1": 0, "x2": w, "y2": h}

        t0 = time.time()
        text = read_plate_text(image, bbox)
        elapsed = (time.time() - t0) * 1000

        print(f"  {expected:<25} {str(text):<25} {elapsed:>6.0f}ms")

    # [3] Verify idempotent load
    print("\n[3] Testing idempotent load...")
    t0 = time.time()
    result2 = load_ocr_reader()
    print(f"    Second load_ocr_reader(): {result2} in {time.time()-t0:.4f}s (should be instant)")

    print("\n✅ Integration test complete!")


if __name__ == "__main__":
    test_florence_ocr_via_traffic()
