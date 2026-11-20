import { describe, expect, it } from "vitest";
import { canMoveStatus, statusOptions } from "./complaintStatus";

describe("complaint status rules", () => {
  it("moves forward through review and repair", () => {
    expect(canMoveStatus("Submitted", "Approved")).toBe(true);
    expect(canMoveStatus("Approved", "Completed")).toBe(true);
    expect(canMoveStatus("Completed", "ResolvedReviewed")).toBe(true);
  });

  it("refuses jumps backwards and out of the closed state", () => {
    expect(canMoveStatus("Completed", "Submitted")).toBe(false);
    expect(canMoveStatus("Rejected", "Completed")).toBe(false);
    expect(canMoveStatus("ResolvedReviewed", "Approved")).toBe(false);
  });

  it("always allows staying put, and offers the current status first", () => {
    expect(canMoveStatus("OnHold", "OnHold")).toBe(true);
    expect(statusOptions("Rejected")).toEqual(["Rejected", "Approved"]);
  });
});
