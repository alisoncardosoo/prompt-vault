import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

type ThemedPromptIconProps = {
  alt?: string;
  className?: string;
};

export function ThemedPromptIcon({ alt = "Prompt Vault", className }: ThemedPromptIconProps) {
  return <img src={logo} alt={alt} className={cn("inline-block object-contain", className)} />;
}
