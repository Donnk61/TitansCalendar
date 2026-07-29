import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <Image
        alt=""
        aria-hidden="true"
        className="size-11 object-contain sm:size-12"
        height={48}
        src="/titans-logo.svg"
        width={48}
      />
      <span className="grid min-w-0 leading-none">
        <span className="truncate font-display text-sm font-black tracking-[0.18em] text-text-primary">
          TITANS
        </span>
        <span className="mt-1 truncate text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
          Cronograma
        </span>
      </span>
    </span>
  );
}
