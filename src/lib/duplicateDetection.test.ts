import { describe, expect, it, vi } from "vitest";

const findMany = vi.fn(async () => []);
vi.mock("@/lib/prisma", () => ({ prisma: { complaint: { findMany, count: vi.fn(async () => 0), update: vi.fn() } } }));
vi.mock("@/lib/mlBackend", () => ({ mlFetch: vi.fn(async () => { throw new Error("ML down"); }) }));
const { haversineDistance, checkAndFlagDuplicate } = await import("./duplicateDetection");

describe("checkAndFlagDuplicate", () => {
  it("only compares with open reports filed before this one", async () => {
    const createdAt = new Date("2026-11-18T10:00:00Z");
    await checkAndFlagDuplicate({ id: "new", createdAt, issueType: "Pothole", description: "x", lat: 18.52, lng: 73.85, evidenceUrl: null });
    const where = (findMany.mock.calls[0] as unknown as [{ where: Record<string, unknown> }])[0].where;
    // A fixed or rejected pothole must not hide a fresh report of the same spot.
    expect(where.status).toEqual({ notIn: ["Completed", "ResolvedReviewed", "Rejected"] });
    // Two reports filed at the same moment must not flag each other (both would vanish from the feed).
    expect((where.createdAt as { lt: Date }).lt).toBe(createdAt);
  });
});

describe("haversineDistance", () => {
  it("measures short distances in metres", () => {
    // Two points on MG Road, Pune, about 24 m apart (inside the 100 m duplicate radius).
    expect(haversineDistance(18.5204, 73.8567, 18.5206, 73.8568)).toBeCloseTo(24.5, 0);
  });

  it("is zero for the same point and symmetric", () => {
    expect(haversineDistance(12.97, 77.59, 12.97, 77.59)).toBe(0);
    expect(haversineDistance(28.61, 77.2, 19.07, 72.87)).toBeCloseTo(haversineDistance(19.07, 72.87, 28.61, 77.2), 6);
  });

  it("matches the known Delhi–Mumbai distance (~1,150 km)", () => {
    expect(haversineDistance(28.6139, 77.209, 19.076, 72.8777) / 1000).toBeCloseTo(1153, -1);
  });
});
