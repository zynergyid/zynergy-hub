"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  name: string;
  options: readonly SelectOption[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  /** "field" matches text inputs in forms; "compact" fits table rows. */
  size?: "field" | "compact";
  className?: string;
}

/**
 * Styled select on top of Radix: keyboard and screen-reader friendly, and it
 * submits `name=value` in plain forms and server actions like a native select.
 */
export function Select({
  name,
  options,
  defaultValue,
  value,
  onValueChange,
  placeholder = "Pilih",
  id,
  required,
  disabled,
  size = "field",
  className,
}: SelectProps) {
  return (
    <RadixSelect.Root name={name} defaultValue={defaultValue} value={value} onValueChange={onValueChange} required={required} disabled={disabled}>
      <RadixSelect.Trigger
        id={id}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-white text-left text-ink",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60",
          "data-[placeholder]:text-muted",
          size === "field" ? "px-3.5 py-2.5 text-sm" : "px-2.5 py-1.5 text-xs font-semibold",
          className,
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown className={cn("shrink-0 text-muted", size === "field" ? "size-4" : "size-3.5")} />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="z-[60] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-line bg-white p-1 shadow-xl shadow-ink/10"
        >
          <RadixSelect.Viewport className="max-h-72">
            {options.map((o) => (
              <RadixSelect.Item
                key={o.value}
                value={o.value}
                className="flex cursor-pointer select-none items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-ink outline-none data-[highlighted]:bg-primary-soft data-[highlighted]:text-primary-dark data-[state=checked]:font-semibold"
              >
                <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator>
                  <Check className="size-4 text-primary" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
