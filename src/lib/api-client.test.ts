import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalFetch = global.fetch;

async function importApiClient() {
  vi.resetModules();
  return import("./api-client");
}

describe("api client", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("prefixes requests with NEXT_PUBLIC_API_BASE_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.sadaksathi.test");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock as typeof fetch;

    const { apiFetch } = await importApiClient();
    const response = await apiFetch<{ ok: boolean }>("/health");

    expect(response).toEqual({ data: { ok: true } });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.sadaksathi.test/health",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("returns response text when the request fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => "Bad request",
    });
    global.fetch = fetchMock as typeof fetch;

    const { apiFetch } = await importApiClient();
    const response = await apiFetch("/complaints");

    expect(response).toEqual({ error: "Bad request" });
  });

  it("returns the thrown error message when fetch rejects", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    global.fetch = fetchMock as typeof fetch;

    const { apiFetch } = await importApiClient();
    const response = await apiFetch("/complaints");

    expect(response).toEqual({ error: "network down" });
  });
});
