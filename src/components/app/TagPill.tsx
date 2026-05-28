import { tagColor } from "@/lib/promptStore";
import { cn } from "@/lib/utils";
import { Hash } from "lucide-react";

const styles: Record<string, string> = {
  amber: "bg-tag-amber text-amber-800 dark:text-amber-200",
  lavender: "bg-tag-lavender text-violet-800 dark:text-violet-200",
  sky: "bg-tag-sky text-sky-800 dark:text-sky-200",
  mint: "bg-tag-mint text-emerald-800 dark:text-emerald-200",
  rose: "bg-tag-rose text-rose-800 dark:text-rose-200",
};

const activeRing: Record<string, string> = {
  amber: "ring-2 ring-amber-500/50",
  lavender: "ring-2 ring-violet-500/50",
  sky: "ring-2 ring-sky-500/50",
  mint: "ring-2 ring-emerald-500/50",
  rose: "ring-2 ring-rose-500/50",
};

export function TagPill({
  tag,
  className,
  onClick,
  active,
}: {
  tag: string;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const c = tagColor(tag);
  return (
    <span
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium select-none",
        styles[c],
        onClick && "cursor-pointer hover:opacity-75 active:scale-95 transition-all duration-150",
        active && activeRing[c],
        className,
      )}
    >
      <Hash className="size-2.5 shrink-0" />
      {tag}
    </span>
  );
}
