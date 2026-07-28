import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type MultiSelectOption = {
  label: string;
  value: string;
  description?: ReactNode;
};

type MultiSelectProps = {
  legend: string;
  name: string;
  options: MultiSelectOption[];
  selectedValues?: string[];
};

export function MultiSelect({
  legend,
  name,
  options,
  selectedValues = [],
}: MultiSelectProps) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold text-text-primary">
        {legend}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);

          return (
            <label
              className={cn(
                "flex min-h-12 items-start gap-3 rounded-sm border bg-surface p-3 text-sm transition duration-normal",
                "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus",
                isSelected
                  ? "border-brand-orange"
                  : "border-border hover:border-border-strong",
              )}
              key={option.value}
            >
              <input
                className="sr-only"
                defaultChecked={isSelected}
                name={name}
                type="checkbox"
                value={option.value}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 flex size-4 items-center justify-center rounded-xs border",
                  isSelected
                    ? "border-brand-orange bg-brand-orange text-background"
                    : "border-border-strong",
                )}
              >
                {isSelected ? <Check className="size-3" /> : null}
              </span>
              <span className="grid gap-1">
                <span className="font-semibold text-text-primary">
                  {option.label}
                </span>
                {option.description ? (
                  <span className="text-text-muted">{option.description}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
