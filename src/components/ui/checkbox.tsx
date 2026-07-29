import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  description?: ReactNode;
};

export function Checkbox({
  className,
  description,
  label,
  ...props
}: CheckboxProps) {
  return (
    <label className="flex min-w-0 gap-3 rounded-sm border border-border bg-surface p-3 text-sm text-text-primary transition duration-normal hover:border-border-strong focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
      <input
        className={cn(
          "mt-0.5 size-4 rounded-xs accent-brand-orange focus-visible:outline-focus",
          className,
        )}
        type="checkbox"
        {...props}
      />
      <span className="grid min-w-0 gap-1">
        <span className="break-words font-semibold">{label}</span>
        {description ? (
          <span className="break-words text-text-muted">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
