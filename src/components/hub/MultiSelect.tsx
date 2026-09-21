"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SelectOption } from "./Select";

interface MultiSelectProps {
  name: string;
  options: readonly SelectOption[];
  defaultValue?: string[];
  placeholder?: string;
  size?: "field" | "compact";
  className?: string;
}

/**
 * One trigger, a checklist underneath. Submits one hidden input per selected
 * value, so `formData.getAll(name)` works in server actions.
 */
export function MultiSelect({
  name,
  options,
  defaultValue = [],
  placeholder = "Pilih",
  size = "field",
  className,
}: MultiSelectProps) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const toggle = (value: string) =>
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  const labels = options.filter((o) => selected.includes(o.value)).map((o) => o.label);

  return (
    <Popover.Root>
      {selected.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
      <Popover.Trigger
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-white text-left text-ink",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          size === "field" ? "px-3.5 py-2.5 text-sm" : "px-2.5 py-1.5 text-xs font-semibold",
          className,
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", labels.length === 0 && "font-normal text-muted")}>
          {labels.length === 0 ? placeholder : labels.join(", ")}
        </span>
        <ChevronDown className={cn("shrink-0 text-muted", size === "field" ? "size-4" : "size-3.5")} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-[60] min-w-[var(--radix-popover-trigger-width)] rounded-xl border border-line bg-white p-1 shadow-xl shadow-ink/10"
        >
          {options.map((o) => {
            const on = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                role="menuitemcheckbox"
                aria-checked={on}
                onClick={() => toggle(o.value)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-ink hover:bg-primary-soft hover:text-primary-dark",
                  on && "font-semibold",
                )}
              >
                {o.label}
                <span className={cn("grid size-4 place-items-center rounded border", on ? "border-primary bg-primary text-white" : "border-line")}>
                  {on && <Check className="size-3" />}
                </span>
              </button>
            );
          })}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
