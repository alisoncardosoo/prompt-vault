import { tagColor } from "@/lib/promptStore";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  amber: "bg-tag-amber text-amber-900",
  lavender: "bg-tag-lavender text-violet-900",
  sky: "bg-tag-sky text-sky-900",
  mint: "bg-tag-mint text-emerald-900",
  rose: "bg-tag-rose text-rose-900",
};

export function TagPill({ tag, className }: { tag: string; className?: string }) {
  const c = tagColor(tag);
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium",
        styles[c],
        className,
      )}
    >
      #{tag}
    </span>
  );
}
