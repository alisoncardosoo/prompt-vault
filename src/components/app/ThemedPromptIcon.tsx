import { cn } from "@/lib/utils";

type ThemedPromptIconProps = {
  alt?: string;
  className?: string;
};

export function ThemedPromptIcon({ alt = "PromptLibrary", className }: ThemedPromptIconProps) {
  return (
    <span className={cn("inline-block overflow-hidden rounded-xl", className)}>
      <img src="/icon-192.png" alt={alt} className="size-full object-cover" />
    </span>
  );
}
