import { describe, expect, it } from "vitest";
import { parseEventFormData } from "@/server/validation/event-form";

describe("event form validation", () => {
  it("requires a start time for timed events", () => {
    const formData = baseEventFormData();
    formData.set("startTime", "");

    expect(() => parseEventFormData(formData)).toThrow("horário inicial");
  });

  it("rejects unsafe meeting urls", () => {
    const formData = baseEventFormData();
    formData.set("meetingUrl", "javascript:alert(1)");

    expect(() => parseEventFormData(formData)).toThrow();
  });

  it("accepts multiple projects and external HTTP links", () => {
    const formData = baseEventFormData();
    formData.append("projectIds", "019fa939-9871-79c0-81d4-28d8cd3f3e58");
    formData.append("projectIds", "119fa939-9871-79c0-81d4-28d8cd3f3e58");
    formData.append("linkLabel", "Pauta");
    formData.append("linkUrl", "https://example.com/pauta");

    const result = parseEventFormData(formData);

    expect(result.projectIds).toHaveLength(2);
    expect(result.linkLabels).toContain("Pauta");
  });
});

function baseEventFormData() {
  const formData = new FormData();

  formData.set("title", "Reunião geral");
  formData.set("startsOn", "2026-08-10");
  formData.set("startTime", "19:00");
  formData.set("endsOn", "2026-08-10");
  formData.set("endTime", "20:00");
  formData.set("typeSlug", "general-meeting");
  formData.set("status", "confirmed");
  formData.set("recurrence", "none");
  formData.set("meetingUrl", "https://meet.google.com/titans-demo");

  return formData;
}
