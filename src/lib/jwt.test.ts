import { describe, expect, it, vi } from "vitest";

async function importJwtModule(secret: string) {
  vi.resetModules();
  vi.stubEnv("JWT_SECRET", secret);
  return import("./jwt");
}

describe("jwt helpers", () => {
  it("signs and verifies tokens with the configured secret", async () => {
    const { signToken, verifyToken } = await importJwtModule("test-secret");
    const token = await signToken({ sub: "user-123", role: "citizen" });
    const payload = await verifyToken(token);

    expect(payload).toMatchObject({ sub: "user-123", role: "citizen" });
  });

  it("returns null when the token is invalid", async () => {
    const { verifyToken } = await importJwtModule("test-secret");

    await expect(verifyToken("not-a-real-token")).resolves.toBeNull();
  });
});
