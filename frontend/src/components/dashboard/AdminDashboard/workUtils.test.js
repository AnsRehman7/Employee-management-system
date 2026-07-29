import { describe, expect, it } from "vitest";
import { initialsFor, labelForValue } from "./workUtils";

describe("work display utilities", () => {
  it("formats workflow labels consistently", () => {
    expect(labelForValue("in_progress")).toBe("In Progress");
    expect(labelForValue("blocked")).toBe("Blocked");
  });

  it("creates stable two-letter initials", () => {
    expect(initialsFor("Ayesha Noor Khan")).toBe("AN");
    expect(initialsFor("")).toBe("TM");
  });
});
