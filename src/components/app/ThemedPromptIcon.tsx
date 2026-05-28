import { cn } from "@/lib/utils";

type ThemedPromptIconProps = {
  alt?: string;
  className?: string;
};

export function ThemedPromptIcon({ alt = "PromptLibrary", className }: ThemedPromptIconProps) {
  return (
    <span
      className={cn("inline-block overflow-hidden rounded-xl", className)}
      aria-label={alt}
      role="img"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        className="size-full"
        aria-hidden="true"
      >
        <defs>
          <filter id="pl-shadow" x="-8%" y="-8%" width="116%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#00000012" />
          </filter>
        </defs>
        <rect width="512" height="512" fill="#EFEFEF" />
        <rect x="28" y="22" width="456" height="468" rx="96" fill="white" filter="url(#pl-shadow)" />
        {/* lines left */}
        <rect x="46" y="142" width="116" height="20" rx="10" fill="#DFDFDF" />
        <rect x="46" y="192" width="98" height="20" rx="10" fill="#DFDFDF" />
        <rect x="46" y="242" width="112" height="20" rx="10" fill="#DFDFDF" />
        <rect x="46" y="292" width="92" height="20" rx="10" fill="#DFDFDF" />
        <rect x="46" y="342" width="116" height="20" rx="10" fill="#DFDFDF" />
        <rect x="46" y="392" width="102" height="20" rx="10" fill="#DFDFDF" />
        {/* lines right */}
        <rect x="350" y="142" width="116" height="20" rx="10" fill="#DFDFDF" />
        <rect x="368" y="192" width="98" height="20" rx="10" fill="#DFDFDF" />
        <rect x="354" y="242" width="112" height="20" rx="10" fill="#DFDFDF" />
        <rect x="374" y="292" width="92" height="20" rx="10" fill="#DFDFDF" />
        <rect x="350" y="342" width="116" height="20" rx="10" fill="#DFDFDF" />
        <rect x="364" y="392" width="102" height="20" rx="10" fill="#DFDFDF" />
        {/* P */}
        <text
          x="256"
          y="372"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="296"
          fontWeight="bold"
          textAnchor="middle"
          fill="#1A1A1A"
        >
          P
        </text>
      </svg>
    </span>
  );
}
