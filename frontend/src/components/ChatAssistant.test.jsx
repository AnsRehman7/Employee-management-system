import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import ChatAssistant from "./ChatAssistant";

const assistantInterpret = vi.fn();
const assistantExecute = vi.fn();

vi.mock("../context/api", () => ({
  api: {
    assistantExecute: (...args) => assistantExecute(...args),
    assistantInterpret: (...args) => assistantInterpret(...args),
  },
  formatApiError: (error) => error.message,
}));

const previewResponse = {
  actions: [
    { description: "Create project Attendance Revamp", executable: true, index: 0, issues: [], type: "create_project" },
    { description: "Create task Build the API · for Sara Khan", executable: true, index: 1, issues: [], type: "create_task" },
  ],
  planToken: "signed.plan.token",
  reply: "I will create the project and one task.",
  status: "preview",
};

/** Opens the panel and sends one message, which is the start of every case here. */
const ask = (text = "create a project") => {
  render(<ChatAssistant />);
  fireEvent.click(screen.getByRole("button", { name: /open the workspace assistant/i }));
  fireEvent.change(screen.getByLabelText(/message the assistant/i), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
};

beforeEach(() => {
  assistantInterpret.mockReset();
  assistantExecute.mockReset();
});

it("previews the proposed changes without applying them", async () => {
  assistantInterpret.mockResolvedValue(previewResponse);
  ask();

  expect(await screen.findByText(/create project attendance revamp/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /apply changes/i })).toBeInTheDocument();

  // The whole point of the preview step: interpreting must never write anything.
  expect(assistantExecute).not.toHaveBeenCalled();
});

it("only writes once the person confirms, and sends back the signed plan", async () => {
  assistantInterpret.mockResolvedValue(previewResponse);
  assistantExecute.mockResolvedValue({
    results: [{ label: "Created project Attendance Revamp", status: "done", type: "create_project" }],
    summary: "Done. 1 change applied.",
  });

  ask();
  fireEvent.click(await screen.findByRole("button", { name: /apply changes/i }));

  await waitFor(() => expect(assistantExecute).toHaveBeenCalledWith("signed.plan.token"));
  expect(await screen.findByText(/done\. 1 change applied\./i)).toBeInTheDocument();

  // Applying retires the plan so the same batch cannot be run twice.
  expect(screen.queryByRole("button", { name: /apply changes/i })).not.toBeInTheDocument();
});

it("discarding a plan changes nothing", async () => {
  assistantInterpret.mockResolvedValue(previewResponse);
  ask();

  fireEvent.click(await screen.findByRole("button", { name: /discard/i }));

  expect(await screen.findByText(/nothing was changed/i)).toBeInTheDocument();
  expect(assistantExecute).not.toHaveBeenCalled();
});

it("shows why a blocked action cannot run and offers no apply button", async () => {
  assistantInterpret.mockResolvedValue({
    actions: [
      {
        description: "Create task Fix login bug",
        executable: false,
        index: 0,
        issues: ['No active team member called "Fatima" was found.'],
        type: "create_task",
      },
    ],
    planToken: null,
    reply: "I could not resolve everything.",
    status: "blocked",
  });

  ask("add a task assigned to Fatima");

  expect(await screen.findByText(/no active team member called "fatima"/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /apply changes/i })).not.toBeInTheDocument();
});

it("surfaces a failed request instead of silently doing nothing", async () => {
  assistantInterpret.mockRejectedValue(new Error("The assistant is unavailable."));
  ask();

  expect(await screen.findByText(/the assistant is unavailable\./i)).toBeInTheDocument();
});
