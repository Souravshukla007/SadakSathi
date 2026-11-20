import { describe, expect, it, vi } from "vitest";

const { create } = vi.hoisted(() => ({
  create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: "u1", ...data })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn(async () => null), create } },
}));

import { POST } from "./route";

describe("POST /api/auth/signup", () => {
  it("ignores a client-supplied admin role", async () => {
    const req = new Request("http://localhost/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        firstName: "Eve",
        lastName: "Attacker",
        email: "eve@example.com",
        password: "pw123456",
        role: "City Administrator",
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(create.mock.calls[0][0].data.role).toBe("user");
  });
});
