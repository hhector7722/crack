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
          "text-zinc-300 active:text-zinc-100",
        variant === "ghost" &&
          "text-zinc-300 active:text-zinc-100",
        variant === "danger" &&
          "text-red-400 active:text-red-300",
        className
      )}
      {...props}
    />
  );
}
