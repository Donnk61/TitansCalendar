import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";

export function AdminPlaceholder({
  description,
  icon,
  title,
}: {
  description: string;
  icon?: ReactNode;
  title: string;
}) {
  return <EmptyState description={description} icon={icon} title={title} />;
}
