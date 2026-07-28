"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_CALENDAR_TAGS } from "@/server/queries/public-calendar";

export async function revalidatePublicCalendar() {
  revalidatePath("/");
  revalidateTag(PUBLIC_CALENDAR_TAGS.semester, "max");
  revalidateTag(PUBLIC_CALENDAR_TAGS.calendar, "max");
  revalidateTag(PUBLIC_CALENDAR_TAGS.projects, "max");
  revalidateTag(PUBLIC_CALENDAR_TAGS.eventTypes, "max");
  revalidateTag(PUBLIC_CALENDAR_TAGS.announcements, "max");
}
