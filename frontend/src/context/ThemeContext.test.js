import { afterEach, describe, expect, it, vi } from "vitest";
import { readStoredTheme, resolveTheme } from "./ThemeContext";

const setSystemDark = (isDark) => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    addEventListener: vi.fn(),
    matches: isDark && query === "(prefers-color-scheme: dark)",
    media: query,
    removeEventListener: vi.fn(),
  }));
};

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("theme preference", () => {
  it("defaults to light rather than following a dark OS", () => {
    setSystemDark(true);
    expect(readStoredTheme()).toBe("light");
  });

  it("ignores a stored value that is not a real theme", () => {
    window.localStorage.setItem("staffflow.theme", "neon");
    expect(readStoredTheme()).toBe("light");
  });

  it("keeps an explicit choice", () => {
    window.localStorage.setItem("staffflow.theme", "dark");
    expect(readStoredTheme()).toBe("dark");
  });

  it("resolves 'system' against the OS setting", () => {
    setSystemDark(true);
    expect(resolveTheme("system")).toBe("dark");

    setSystemDark(false);
    expect(resolveTheme("system")).toBe("light");
  });

  it("lets an explicit choice override the OS setting", () => {
    setSystemDark(true);
    expect(resolveTheme("light")).toBe("light");

    setSystemDark(false);
    expect(resolveTheme("dark")).toBe("dark");
  });
});
