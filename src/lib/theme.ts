export type ThemePreference = "light" | "dark" | "system";

const APP_THEME_COLOR = "#1A1A1A";

const iconPaths = {
  light: {
    icon32: "/icon-32.png",
    icon192: "/icon-192.png",
  },
  dark: {
    icon32: "/icon-32-dark.png",
    icon192: "/icon-192-dark.png",
  },
} as const;

function setLinkHref(selector: string, href: string) {
  document.querySelectorAll<HTMLLinkElement>(selector).forEach((link) => {
    link.href = href;
  });
}

export function applyThemePreference(theme: ThemePreference) {
  const root = document.documentElement;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  const apply = (isDark: boolean) => {
    root.classList.toggle("dark", isDark);

    const paths = isDark ? iconPaths.dark : iconPaths.light;
    setLinkHref('link[rel="icon"][sizes="32x32"]', paths.icon32);
    setLinkHref('link[rel="icon"][sizes="192x192"]', paths.icon192);

    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.content = APP_THEME_COLOR;
    }
  };

  if (theme === "dark") {
    apply(true);
    return undefined;
  }

  if (theme === "light") {
    apply(false);
    return undefined;
  }

  apply(systemDark.matches);
  const listener = (event: MediaQueryListEvent) => apply(event.matches);
  systemDark.addEventListener("change", listener);

  return () => systemDark.removeEventListener("change", listener);
}
