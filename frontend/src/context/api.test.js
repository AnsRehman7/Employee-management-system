import { afterEach, describe, expect, it, vi } from "vitest";
import { api, setAuthTokenProvider } from "./api";

const response = ({ body = {}, headers = {}, status = 200 }) => ({
  headers: { get: (name) => headers[name.toLowerCase()] || null },
  json: async () => body,
  ok: status >= 200 && status < 300,
  status,
});

describe("API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setAuthTokenProvider(async () => null);
  });

  it("refreshes an expired Firebase token once", async () => {
    const tokenProvider = vi.fn(async ({ forceRefresh }) => (forceRefresh ? "fresh-token" : "old-token"));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ body: { error: { message: "Expired" } }, status: 401 }))
      .mockResolvedValueOnce(response({ body: { data: { task: { id: "task-1" } } } }));
    setAuthTokenProvider(tokenProvider);
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.getTask("task-1")).resolves.toEqual({ task: { id: "task-1" } });
    expect(tokenProvider).toHaveBeenLastCalledWith({ forceRefresh: true });
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer fresh-token");
  });

  it("preserves validation details and request IDs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          body: { error: { details: { title: ["Title is required."] }, message: "Validation failed." } },
          headers: { "x-request-id": "request-123" },
          status: 400,
        }),
      ),
    );

    await expect(api.createTask({})).rejects.toMatchObject({
      details: { title: ["Title is required."] },
      message: "Validation failed.",
      requestId: "request-123",
      status: 400,
    });
  });
});
