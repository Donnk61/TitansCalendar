import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type IconButtonVariant = "quiet" | "filled" | "danger";

const variantClassName: Record<IconButtonVariant, string> = {
  quiet: "border-border bg-surface text-text-secondary hover:text-text-primary",
  filled:
    "border-brand-orange bg-brand-orange text-background hover:bg-brand-amber",
  danger: "border-danger bg-danger text-background hover:bg-brand-red",
};

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
};

export function IconButton({
  className,
  icon,
  label,
  type = "button",
  variant = "quiet",
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-sm border transition duration-normal disabled:cursor-not-allowed disabled:opacity-55",
        variantClassName[variant],
        className,
      )}
      type={type}
      {...props}
    >
      {icon}
    </button>
  );
}
