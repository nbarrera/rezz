import type { ComponentProps, JSX } from "solid-js";
import { splitProps } from "solid-js";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  class?: string;
  children: JSX.Element;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-biscay text-white hover:bg-biscay-dark",
  secondary: "border border-obsidian/20 text-obsidian/60 hover:bg-obsidian/5",
  danger: "bg-peach-light text-peach-dark border border-peach/40 hover:bg-peach/20",
  ghost: "text-obsidian/50 hover:text-obsidian hover:bg-obsidian/5",
};

const base = "rounded-lg font-medium py-2.5 px-4 active:scale-95 disabled:opacity-50 transition-all";

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ["variant", "class", "children"]);
  const variant = () => local.variant ?? "primary";
  return (
    <button
      class={`${base} ${variantClasses[variant()]} ${local.class ?? ""}`}
      {...rest}
    >
      {local.children}
    </button>
  );
}
