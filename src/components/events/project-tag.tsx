import { Badge } from "@/components/ui/badge";

export function ProjectTag({ name }: { name: string }) {
  return (
    <Badge className="border-border-strong bg-surface text-text-primary">
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-brand-orange"
      />
      {name}
    </Badge>
  );
}
