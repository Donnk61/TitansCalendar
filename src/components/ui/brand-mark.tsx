import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center overflow-hidden rounded-sm border border-brand-orange/45 bg-surface-elevated shadow-[inset_0_-2px_0_var(--brand-red)]"
      >
        <Image
          alt=""
          className="size-8 object-contain"
          height={32}
          src="/titans-logo.svg"
          width={32}
        />
      </span>
      <span className="grid leading-none">
        <span className="font-display text-sm font-black tracking-[0.18em] text-text-primary">
          TITANS
        </span>
        <span className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
          Cronograma
        </span>
      </span>
    </span>
  );
}
