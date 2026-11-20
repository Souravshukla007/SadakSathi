import { describe, expect, it } from "vitest";
import { plateFor, type ScanDetection } from "./traffic";

const box = (x: number, y: number) => ({ x1: x, y1: y, x2: x + 10, y2: y + 10 });
const rider = (x: number, extra: Partial<ScanDetection> = {}): ScanDetection => ({ class_name: "WithoutHelmet", confidence: 0.9, bbox: box(x, 0), ...extra });
const plate = (x: number, text: string): ScanDetection => ({ class_name: "Plate", confidence: 0.8, bbox: box(x, 20), plate_text: text });

describe("plateFor", () => {
  it("gives each rider the nearest plate in the photo", () => {
    const plates = [plate(0, "MH12AB1234"), plate(500, "MH14CD5678")];
    expect(plateFor(rider(480), plates)).toBe("MH14CD5678");
    expect(plateFor(rider(10), plates)).toBe("MH12AB1234");
  });

  it("prefers a plate read on the same tracked vehicle", () => {
    expect(plateFor(rider(0, { plate_text: "KA01XY0001" }), [plate(0, "MH12AB1234"), plate(5, "X")])).toBe("KA01XY0001");
  });

  it("returns nothing when no plate was read", () => {
    expect(plateFor(rider(0), [])).toBeNull();
  });
});
