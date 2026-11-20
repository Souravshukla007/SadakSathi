import { describe, expect, it, vi } from "vitest";
import { allow } from "./rateLimit";

describe("allow", () => {
  it("permits up to the limit inside a window, then blocks, then resets", () => {
    vi.useFakeTimers();
    expect([1, 2, 3].map(() => allow("k", 2, 1000))).toEqual([true, true, false]);
    expect(allow("other", 2, 1000)).toBe(true); // separate key, separate budget
    vi.advanceTimersByTime(1000);
    expect(allow("k", 2, 1000)).toBe(true);
    vi.useRealTimers();
  });
});
