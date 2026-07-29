"use client";

import type { ReactNode } from "react";
import { useState } from "react";
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
  const [selected, setSelected] = useState(() => new Set(selectedValues));

  function toggleValue(value: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(value);
      } else {
        next.delete(value);
      }

      return next;
    });
  }

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold text-text-primary">
        {legend}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = selected.has(option.value);

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
                checked={isSelected}
                className="sr-only"
                name={name}
                onChange={(event) =>
                  toggleValue(option.value, event.currentTarget.checked)
                }
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
