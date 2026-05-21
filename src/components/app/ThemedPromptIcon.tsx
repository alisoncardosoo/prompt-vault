import { cn } from "@/lib/utils";

type ThemedPromptIconProps = {
  alt?: string;
  className?: string;
};

export function ThemedPromptIcon({ alt = "PromptLibrary", className }: ThemedPromptIconProps) {
  return (
    <span className={cn("inline-block overflow-hidden rounded-lg", className)}>
      <img src="/icon-192.png" alt={alt} className="size-full object-cover dark:hidden" />
      <img
        src="/icon-192-dark.png"
        alt=""
        aria-hidden="true"
        className="hidden size-full object-cover dark:block"
      />
    </span>
  );
}
