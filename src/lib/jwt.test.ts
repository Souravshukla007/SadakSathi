import { afterEach, describe, expect, it, vi } from "vitest";

async function importJwtModule(secret: string) {
  vi.resetModules();
  vi.stubEnv("JWT_SECRET", secret);
  return import("./jwt");
}

describe("jwt helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("imports without a secret (next build) but refuses to sign or verify in production", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_SECRET", "");

    const { signToken, verifyToken } = await import("./jwt");
    await expect(signToken({ id: "u", role: "user", tv: 0 })).rejects.toThrow(/JWT_SECRET/);
    await expect(verifyToken("x")).rejects.toThrow(/JWT_SECRET/);
  });

  it("signs and verifies tokens with the configured secret", async () => {
    const { signToken, verifyToken } = await importJwtModule("test-secret");
    const token = await signToken({ id: "user-123", role: "user", tv: 0 });
    const payload = await verifyToken(token);

    expect(payload).toMatchObject({ id: "user-123", role: "user", tv: 0 });
  });

  it("returns null when the token is invalid", async () => {
    const { verifyToken } = await importJwtModule("test-secret");

    await expect(verifyToken("not-a-real-token")).resolves.toBeNull();
  });
});
