import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "@/features/events/event-status";

describe("StatusBadge", () => {
  it("renders accessible status text and an icon", () => {
    render(<StatusBadge status="cancelled" />);

    expect(screen.getByText("Cancelado")).toBeVisible();
    expect(screen.getByText("Cancelado").closest("span")).toBeTruthy();
  });
});
