import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import AppErrorBoundary from "./AppErrorBoundary";

const BrokenView = () => {
  throw new Error("render failed");
};

it("shows a recoverable fallback when a screen crashes", () => {
  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  render(
    <AppErrorBoundary>
      <BrokenView />
    </AppErrorBoundary>,
  );

  expect(screen.getByRole("heading", { name: /unexpected error/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /reload staffflow/i })).toBeInTheDocument();
  consoleSpy.mockRestore();
});
