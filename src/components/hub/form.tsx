import { cn } from "@/lib/cn";

/** Shared form primitives so every custom screen looks and behaves the same. */

export const fieldClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldClass, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldClass, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldClass, props.className)} />;
}

/** Rupiah input: shows thousands separators, the raw digits travel in the same field. */
export function RupiahInput({
  value,
  onChange,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string;
  onChange: (digitsGrouped: string) => void;
}) {
  return (
    <div className="flex items-center rounded-xl border border-line bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
      <span className="pl-3.5 text-sm font-semibold text-muted">Rp</span>
      <input
        {...props}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(groupDigits(e.target.value.replace(/\D/g, "")))}
        className={cn("w-full bg-transparent px-2 py-2.5 text-sm focus:outline-none", className)}
        placeholder="0"
      />
    </div>
  );
}

export const groupDigits = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm font-medium text-red-600">
      {children}
    </p>
  );
}
