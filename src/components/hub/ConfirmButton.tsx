"use client";

/** Submit button that asks before the form action runs. */
export function ConfirmButton({
  message,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { message: string }) {
  return (
    <button
      type="submit"
      {...props}
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
