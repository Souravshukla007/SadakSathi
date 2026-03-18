import { describe, expect, it } from "vitest";

import { comparePasswords, hashPassword } from "./auth";

describe("auth helpers", () => {
  it("hashes passwords and validates the original password", async () => {
    const password = "RoadSafety@123";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    await expect(comparePasswords(password, hash)).resolves.toBe(true);
    await expect(comparePasswords("wrong-password", hash)).resolves.toBe(false);
  });
});
