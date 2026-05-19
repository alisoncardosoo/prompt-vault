import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";
import {
  LayoutGrid,
  List,
  ChevronDown,
  CheckCircle2,
  Star,
  Clock,
  Folder,
  Plus,
  Trash2,
} from "lucide-react";
import { usePromptStore } from "@/lib/promptStore";
import { AppSidebar } from "@/components/app/Sidebar";
import { AppHeader } from "@/components/app/Header";
import { CategoryCards } from "@/components/app/CategoryCards";
import { PromptCard } from "@/components/app/PromptCard";
import { DetailPanel } from "@/components/app/DetailPanel";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/")({
  component: Page,
});

const PromptEditor = lazy(() =>
  import("@/components/app/PromptEditor").then((module) => ({ default: module.PromptEditor })),
);
const VariablesModal = lazy(() =>
  import("@/components/app/VariablesModal").then((module) => ({ default: module.VariablesModal })),
);
const SettingsModal = lazy(() =>
  import("@/components/app/SettingsModal").then((module) => ({ default: module.SettingsModal })),
);
const ImageImportDialog = lazy(() =>
  import("@/components/app/ImageImportDialog").then((module) => ({
    default: module.ImageImportDialog,
  })),
);

type DockItemProps = {
  icon: typeof Star;
  label: string;
  active: boolean;
  onClick: () => void;
};

function DockItem({ icon: Icon, label, active, onClick }: DockItemProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex items-center justify-center transition-all duration-200 active:scale-90",
        active
          ? "gap-1.5 bg-white/80 dark:bg-white/15 text-neutral-900 dark:text-neutral-100 rounded-full px-3.5 py-2 shadow-sm backdrop-blur-sm"
          : "text-neutral-600 dark:text-neutral-300 px-3 py-2",
      )}
    >
      <Icon className={cn("shrink-0", active ? "size-[18px]" : "size-5")} />
      {active && (
        <span className="text-[13px] font-semibold leading-none whitespace-nowrap">{label}</span>
      )}
    </button>
  );
}

function MobileBottomNav() {
  const { view, setView, openEditor, setSidebarOpen } = usePromptStore();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-end gap-3 pointer-events-none px-3"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}
    >
      {/* Dock — ocupa toda a largura disponível */}
      <div className="pointer-events-auto flex-1 flex items-center justify-around bg-neutral-100/35 dark:bg-neutral-900/35 backdrop-blur-3xl rounded-full px-2 py-1.5 border border-white/50 dark:border-white/10 shadow-xl shadow-black/15">
        <DockItem
          icon={LayoutGrid}
          label="Todos"
          active={view === "all"}
          onClick={() => setView("all")}
        />
        <DockItem
          icon={Star}
          label="Favoritos"
          active={view === "favorites"}
          onClick={() => setView("favorites")}
        />
        <DockItem
          icon={Clock}
          label="Recentes"
          active={view === "recent"}
          onClick={() => setView("recent")}
        />
        <DockItem
          icon={Folder}
          label="Pastas"
          active={false}
          onClick={() => setSidebarOpen(true)}
        />
      </div>

      {/* FAB flutuante fora do dock — estilo Liquid Glass */}
      <button
        onClick={() => openEditor()}
        aria-label="Novo prompt"
        className="pointer-events-auto shrink-0 size-14 rounded-full flex items-center justify-center text-neutral-900 active:scale-90 transition-all duration-200"
        style={{
          background:
            "radial-gradient(ellipse at 40% 30%, rgba(253,224,71,0.92) 0%, rgba(251,191,36,0.85) 60%, rgba(245,158,11,0.80) 100%)",
          backdropFilter: "blur(20px) saturate(1.8)",
          WebkitBackdropFilter: "blur(20px) saturate(1.8)",
          border: "1px solid rgba(255,255,255,0.55)",
          boxShadow:
            "inset 0 1px 1.5px rgba(255,255,255,0.55), 0 8px 28px rgba(251,191,36,0.45), 0 2px 8px rgba(0,0,0,0.12)",
        }}
      >
        <Plus className="size-6" strokeWidth={2.5} />
      </button>
    </nav>
  );
}

function formatBuildTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function forceRefreshApp() {
  const url = new URL(window.location.href);
  url.searchParams.set("refresh", String(Date.now()));
  window.location.href = url.toString();
}

function Page() {
  const {
    prompts,
    trashedPrompts,
    userName,
    view,
    viewArg,
    categories,
    search,
    openEditor,
    emptyTrash,
    purgeTrashedPrompts,
    theme,
    imageImportOpen,
    editorOpen,
    variablesOpen,
    settingsOpen,
    setImageImportOpen,
  } = usePromptStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      root.classList.toggle("dark", mq.matches);
      const listener = (e: MediaQueryListEvent) => root.classList.toggle("dark", e.matches);
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
  }, [theme]);

  useEffect(() => {
    purgeTrashedPrompts();
  }, [purgeTrashedPrompts]);
  const [greeting] = useState(() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  });
  const [showAll, setShowAll] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "alpha" | "rating">("recent");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const buildTime = new Date(__APP_BUILD_TIME__);
  const isBuildTimeValid = !Number.isNaN(buildTime.getTime());
  const buildAgeMinutes = Math.floor((nowMs - buildTime.getTime()) / 60000);
  const isLikelyFresh = isBuildTimeValid && buildAgeMinutes <= 30;
  const buildStatusText = isLikelyFresh ? "Atualizado recentemente" : "Pode haver versão mais nova";

  const SORT_LABELS = { recent: "Recente", alpha: "A–Z", rating: "Avaliação" } as const;

  useEffect(() => {
    setShowAll(false);
  }, [view, viewArg, search]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>("[data-search-input]")?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        openEditor();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openEditor]);

  const filtered = useMemo(() => {
    if (view === "trash") {
      return [...trashedPrompts].sort((a, b) => b.deletedAt - a.deletedAt);
    }
    let list = prompts.filter((p) => !p.isArchived);
    if (view === "favorites") list = list.filter((p) => p.isFavorite);
    if (view === "recent")
      list = list
        .filter((p) => p.lastUsedAt)
        .sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0));
    if (view === "attachments") list = list.filter((p) => p.attachments.length > 0);
    if (view === "category" && viewArg) list = list.filter((p) => p.categoryId === viewArg);
    if (view === "tag" && viewArg) list = list.filter((p) => p.tags.includes(viewArg));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (view !== "recent") {
      if (sortBy === "alpha") return [...list].sort((a, b) => a.title.localeCompare(b.title));
      if (sortBy === "rating") return [...list].sort((a, b) => b.rating - a.rating);
    }
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [prompts, trashedPrompts, view, viewArg, search, sortBy]);

  const headingByView = () => {
    if (view === "favorites") return "Favoritos";
    if (view === "recent") return "Usados recentemente";
    if (view === "attachments") return "Com anexos";
    if (view === "trash") return "Lixeira";
    if (view === "category") return categories.find((c) => c.id === viewArg)?.name ?? "Pasta";
    if (view === "tag") return `#${viewArg}`;
    return null;
  };

  const heading = headingByView();

  return (
    <div className="flex w-full h-dvh overflow-hidden bg-background text-foreground">
      {/* AppSidebar always rendered — handles its own desktop/mobile visibility */}
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />

        <div className="flex-1 flex min-h-0">
          <main className="flex-1 overflow-y-auto overscroll-contain px-5 md:px-7 lg:px-10 py-5 lg:py-7">
            <div className="max-w-5xl pb-28 lg:pb-4">
              {!heading ? (
                <>
                  <div className="flex items-start justify-between mb-5 lg:mb-6 gap-3">
                    <div>
                      <h1 className="text-xl lg:text-2xl font-semibold flex items-center gap-2 flex-wrap">
                        {greeting}, {userName} <span className="text-xl lg:text-2xl">👋</span>
                      </h1>
                      <p className="text-sm text-muted-foreground mt-1">
                        {prompts.length} prompts em {categories.length} pastas.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex bg-muted/60 rounded-xl p-0.5">
                        <button
                          onClick={() => setViewMode("grid")}
                          className={cn(
                            "min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 lg:p-1.5 flex items-center justify-center rounded-lg transition-all duration-150",
                            viewMode === "grid"
                              ? "bg-card shadow-sm text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          <LayoutGrid className="size-4" />
                        </button>
                        <button
                          onClick={() => setViewMode("list")}
                          className={cn(
                            "min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 lg:p-1.5 flex items-center justify-center rounded-lg transition-all duration-150",
                            viewMode === "list"
                              ? "bg-card shadow-sm text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          <List className="size-4" />
                        </button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="hidden sm:flex items-center gap-1.5 bg-transparent hover:bg-muted/60 rounded-xl px-3 py-1.5 text-sm transition-colors">
                            {SORT_LABELS[sortBy]} <ChevronDown className="size-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(Object.keys(SORT_LABELS) as (keyof typeof SORT_LABELS)[]).map((key) => (
                            <DropdownMenuItem
                              key={key}
                              onClick={() => setSortBy(key)}
                              className={sortBy === key ? "font-medium text-primary" : ""}
                            >
                              {SORT_LABELS[key]}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <CategoryCards />
                  </div>

                  <div className="mt-6 lg:mt-8 mb-4">
                    <h2 className="text-base font-semibold">Prompts recentes</h2>
                  </div>
                </>
              ) : (
                <div className="mb-5 lg:mb-6 flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl lg:text-2xl font-semibold flex items-center gap-2">
                      {view === "trash" && <Trash2 className="size-5 text-muted-foreground" />}
                      {heading}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {view === "trash"
                        ? `${filtered.length} itens · excluídos automaticamente após 30 dias`
                        : `${filtered.length} prompts`}
                    </p>
                  </div>
                  {view === "trash" && filtered.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm("Esvaziar lixeira permanentemente?")) emptyTrash();
                      }}
                      className="shrink-0 text-sm text-destructive/70 hover:text-destructive border border-destructive/20 hover:border-destructive/50 rounded-lg px-3 py-1.5 min-h-[44px] transition-colors"
                    >
                      Esvaziar lixeira
                    </button>
                  )}
                </div>
              )}

              {filtered.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-20">
                  {view === "trash" ? "A lixeira está vazia." : "Nenhum prompt aqui ainda."}
                </div>
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
                      : "flex flex-col gap-2"
                  }
                >
                  {(showAll ? filtered : filtered.slice(0, 12)).map((p) => (
                    <PromptCard key={p.id} prompt={p} mode={viewMode} inTrash={view === "trash"} />
                  ))}
                </div>
              )}

              {!showAll && filtered.length > 12 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full mt-4 py-3 text-sm text-muted-foreground bg-card/60 backdrop-blur-sm rounded-2xl shadow-sm hover:bg-card/80 min-h-[48px] transition-all duration-150"
                >
                  Mostrar mais {filtered.length - 12} prompts
                </button>
              )}

              <div className="lg:hidden mt-4">
                <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm px-3 py-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5 justify-between">
                    <div className="flex items-center gap-1.5">
                      Publicado em:{" "}
                      {isBuildTimeValid
                        ? formatBuildTime(__APP_BUILD_TIME__)
                        : "horário indisponível"}
                      <CheckCircle2
                        className={cn(
                          "size-3.5",
                          isLikelyFresh ? "text-emerald-500" : "text-amber-500",
                        )}
                      />
                      <span className={isLikelyFresh ? "text-emerald-600" : "text-amber-600"}>
                        {buildStatusText}
                      </span>
                    </div>
                    {!isLikelyFresh && (
                      <button
                        onClick={forceRefreshApp}
                        className="rounded-md border border-amber-500/40 px-2 py-0.5 text-[10px] font-medium text-amber-600 hover:bg-amber-500/10"
                      >
                        Atualizar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>

          <DetailPanel />
        </div>

        {/* Desktop-only footer */}
        <footer className="hidden lg:flex h-8 px-4 items-center justify-between text-[11px] text-muted-foreground border-t border-border/30 bg-background/50 shrink-0">
          <div className="flex items-center gap-1.5">
            Publicado em:{" "}
            {isBuildTimeValid ? formatBuildTime(__APP_BUILD_TIME__) : "horário indisponível"}
            <CheckCircle2
              className={cn("size-3.5", isLikelyFresh ? "text-emerald-500" : "text-amber-500")}
            />
            <span className={isLikelyFresh ? "text-emerald-600" : "text-amber-600"}>
              {buildStatusText}
            </span>
          </div>
          {!isLikelyFresh && (
            <button
              onClick={forceRefreshApp}
              className="rounded-md border border-amber-500/40 px-2 py-0.5 text-[10px] font-medium text-amber-600 hover:bg-amber-500/10"
            >
              Atualizar app
            </button>
          )}
        </footer>
      </div>

      <Suspense fallback={null}>
        {editorOpen ? <PromptEditor /> : null}
        {variablesOpen ? <VariablesModal /> : null}
        {settingsOpen ? <SettingsModal /> : null}
        {imageImportOpen ? (
          <ImageImportDialog open={imageImportOpen} onOpenChange={setImageImportOpen} />
        ) : null}
      </Suspense>
      <Toaster position="top-center" />
      <MobileBottomNav />
    </div>
  );
}
