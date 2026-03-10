import type { ComponentProps } from "solid-js";
import { splitProps, Show } from "solid-js";

type TextAreaProps = ComponentProps<"textarea"> & {
  label: string;
  error?: string | null;
  class?: string;
};

const textareaBase =
  "rounded-lg border bg-gardenia/60 px-3 py-2.5 text-obsidian placeholder:text-obsidian/30 focus:outline-none focus:ring-2 focus:ring-biscay focus:border-transparent transition resize-none w-full";

export function TextArea(props: TextAreaProps) {
  const [local, rest] = splitProps(props, ["label", "error", "class"]);
  const borderClass = () => local.error ? "border-peach" : "border-obsidian/20";
  return (
    <div class={`flex flex-col gap-1.5 ${local.class ?? ""}`}>
      <label for={rest.id} class="text-sm font-medium text-obsidian">
        {local.label}
      </label>
      <textarea
        rows={3}
        class={`${textareaBase} ${borderClass()}`}
        {...rest}
      />
      <Show when={local.error}>
        <p class="text-sm text-peach-dark">{local.error}</p>
      </Show>
    </div>
  );
}
