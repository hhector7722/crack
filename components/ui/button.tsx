import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors disabled:opacity-50",
        variant === "primary" &&
          "bg-zinc-100 text-zinc-950 hover:bg-white",
        variant === "secondary" &&
          "border border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800",
        variant === "ghost" &&
          "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
        variant === "danger" &&
          "bg-red-600 text-white hover:bg-red-500",
        className
      )}
      {...props}
    />
  );
}
