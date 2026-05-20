import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";
import {
  LayoutGrid,
  List,
  ChevronDown,
  CheckCircle2,
  Star,
  Trash2,
  Search,
  PenSquare,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import { usePromptStore, timeAgo } from "@/lib/promptStore";
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

function MobileBottomBar() {
  const { openEditor } = usePromptStore();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/90 dark:bg-background/95 backdrop-blur-xl border-t border-border/30">
      <div
        className="flex items-center px-5 py-3"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}
      >
        <button
          aria-label="Buscar"
          onClick={() => document.querySelector<HTMLInputElement>("[data-search-input]")?.focus()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-muted-foreground active:bg-muted/60 transition-colors"
        >
          <Search className="size-[22px]" strokeWidth={1.7} />
        </button>

        <button
          onClick={() => openEditor()}
          aria-label="Novo prompt"
          className="flex-1 mx-3 flex items-center justify-center gap-2 bg-muted/70 dark:bg-muted/40 hover:bg-muted active:bg-muted rounded-xl px-4 py-2.5 min-h-[44px] transition-colors"
        >
          <Sparkles className="size-4 text-primary" />
          <span className="text-[14px] font-medium text-foreground">Novo prompt</span>
        </button>

        <button
          aria-label="Criar prompt"
          onClick={() => openEditor()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-muted-foreground active:bg-muted/60 transition-colors"
        >
          <PenSquare className="size-[22px]" strokeWidth={1.7} />
        </button>
      </div>
    </nav>
  );
}

function MobileTopNav() {
  const { view, viewArg, categories, userName, setView, setSidebarOpen, setSettingsOpen } =
    usePromptStore();

  const { icon, label } = useMemo(() => {
    if (view === "favorites") return { icon: "⭐", label: "Favoritos" };
    if (view === "recent") return { icon: "🕐", label: "Recentes" };
    if (view === "attachments") return { icon: "📎", label: "Anexos" };
    if (view === "trash") return { icon: "🗑️", label: "Lixeira" };
    if (view === "category") {
      const cat = categories.find((c) => c.id === viewArg);
      return { icon: "📁", label: cat?.name ?? "Pasta" };
    }
    if (view === "tag") return { icon: "#️⃣", label: viewArg ?? "Tag" };
    return { icon: "🏠", label: "Biblioteca" };
  }, [view, viewArg, categories]);

  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <div className="lg:hidden flex items-center h-14 px-4 gap-2 bg-background/90 backdrop-blur-xl border-b border-border/30 shrink-0">
      <button
        aria-label="Abrir menu"
        onClick={() => setSidebarOpen(true)}
        className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm shrink-0 active:scale-95 transition-transform"
      >
        {initials}
      </button>

      <button
        onClick={() => setView("all")}
        className="flex-1 flex items-center justify-center gap-1.5 bg-muted/60 rounded-full px-3 py-1.5 min-h-[36px] active:bg-muted transition-colors"
      >
        <span className="text-base leading-none">{icon}</span>
        <span className="text-[14px] font-medium text-foreground truncate">{label}</span>
        <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
      </button>

      <button
        aria-label="Buscar"
        onClick={() => document.querySelector<HTMLInputElement>("[data-search-input]")?.focus()}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-muted-foreground active:bg-muted/60 transition-colors"
      >
        <Search className="size-5" strokeWidth={1.7} />
      </button>

      <button
        aria-label="Configurações"
        onClick={() => setSettingsOpen(true)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-muted-foreground active:bg-muted/60 transition-colors"
      >
        <MoreHorizontal className="size-5" strokeWidth={1.7} />
      </button>
    </div>
  );
}

type MobileListRowProps = {
  emoji?: string;
  title: string;
  meta?: string;
  onClick: () => void;
  isFavorite?: boolean;
};

function MobileListRow({ emoji, title, meta, onClick, isFavorite }: MobileListRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3 min-h-[52px] active:bg-muted/60 transition-colors text-left"
    >
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-base">
        {emoji ?? "📝"}
      </div>
      <span className="text-[15px] flex-1 truncate text-foreground">{title}</span>
      {isFavorite && <Star className="size-3.5 fill-primary text-primary shrink-0" />}
      {meta && <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{meta}</span>}
    </button>
  );
}

function MobileHomeContent() {
  const { prompts, categories, setView, setSelected } = usePromptStore();
  const [recentsOpen, setRecentsOpen] = useState(true);
  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const [pastasOpen, setPastasOpen] = useState(true);

  const recentPrompts = useMemo(
    () =>
      prompts
        .filter((p) => !p.isArchived && p.lastUsedAt)
        .sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))
        .slice(0, 8),
    [prompts],
  );

  const favoritePrompts = useMemo(
    () => prompts.filter((p) => !p.isArchived && p.isFavorite).slice(0, 6),
    [prompts],
  );

  const SectionHeader = ({
    label,
    count,
    isOpen,
    onToggle,
    onViewAll,
  }: {
    label: string;
    count?: number;
    isOpen: boolean;
    onToggle: () => void;
    onViewAll?: () => void;
  }) => (
    <div className="flex items-center justify-between py-2 px-5">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm font-semibold text-foreground active:opacity-70 transition-opacity"
      >
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-200",
            !isOpen && "-rotate-90",
          )}
        />
        {label}
        {count !== undefined && (
          <span className="text-xs text-muted-foreground font-normal">({count})</span>
        )}
      </button>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
        >
          Ver tudo
        </button>
      )}
    </div>
  );

  return (
    <div className="lg:hidden space-y-1 pt-2">
      <section>
        <SectionHeader
          label="Recentes"
          count={recentPrompts.length}
          isOpen={recentsOpen}
          onToggle={() => setRecentsOpen((v) => !v)}
          onViewAll={() => setView("recent")}
        />
        {recentsOpen && recentPrompts.length > 0 && (
          <div className="flex gap-3 overflow-x-auto px-5 pb-3 pt-1 scrollbar-none">
            {recentPrompts.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className="shrink-0 w-[140px] bg-card rounded-2xl p-3.5 shadow-sm shadow-black/[0.06] text-left active:scale-95 transition-transform"
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-base mb-2">
                  📝
                </div>
                <p className="text-[13px] font-medium leading-tight line-clamp-2">{p.title}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{timeAgo(p.lastUsedAt)}</p>
              </button>
            ))}
          </div>
        )}
        {recentsOpen && recentPrompts.length === 0 && (
          <p className="text-sm text-muted-foreground px-5 pb-3">Nenhum prompt usado ainda.</p>
        )}
      </section>

      <div className="h-px bg-border/30 mx-5" />

      <section>
        <SectionHeader
          label="Favoritos"
          count={favoritePrompts.length}
          isOpen={favoritesOpen}
          onToggle={() => setFavoritesOpen((v) => !v)}
          onViewAll={() => setView("favorites")}
        />
        {favoritesOpen &&
          favoritePrompts.map((p) => (
            <MobileListRow
              key={p.id}
              title={p.title}
              meta={timeAgo(p.updatedAt)}
              isFavorite
              onClick={() => setSelected(p.id)}
            />
          ))}
        {favoritesOpen && favoritePrompts.length === 0 && (
          <p className="text-sm text-muted-foreground px-5 pb-3">Nenhum favorito ainda.</p>
        )}
      </section>

      <div className="h-px bg-border/30 mx-5" />

      <section>
        <SectionHeader
          label="Pastas"
          count={categories.length}
          isOpen={pastasOpen}
          onToggle={() => setPastasOpen((v) => !v)}
        />
        {pastasOpen &&
          categories.map((c) => {
            const count = prompts.filter((p) => p.categoryId === c.id && !p.isArchived).length;
            return (
              <MobileListRow
                key={c.id}
                emoji="📁"
                title={c.name}
                meta={String(count)}
                onClick={() => setView("category", c.id)}
              />
            );
          })}
        {pastasOpen && categories.length === 0 && (
          <p className="text-sm text-muted-foreground px-5 pb-3">Nenhuma pasta criada.</p>
        )}
      </section>
    </div>
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
        <MobileTopNav />
        <AppHeader />

        <div className="flex-1 flex min-h-0">
          <main
            className={cn(
              "flex-1 overflow-y-auto overscroll-contain py-5 lg:py-7",
              view === "all" && !search ? "px-0 md:px-7 lg:px-10" : "px-5 md:px-7 lg:px-10",
            )}
          >
            <div className="max-w-5xl pb-24 lg:pb-4">
              {view === "all" && !search && <MobileHomeContent />}

              <div className={cn(view === "all" && !search ? "hidden lg:block" : "")}>
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
                            {(Object.keys(SORT_LABELS) as (keyof typeof SORT_LABELS)[]).map(
                              (key) => (
                                <DropdownMenuItem
                                  key={key}
                                  onClick={() => setSortBy(key)}
                                  className={sortBy === key ? "font-medium text-primary" : ""}
                                >
                                  {SORT_LABELS[key]}
                                </DropdownMenuItem>
                              ),
                            )}
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
                      <PromptCard
                        key={p.id}
                        prompt={p}
                        mode={viewMode}
                        inTrash={view === "trash"}
                      />
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

                <div className="lg:hidden mt-4 px-5 md:px-0">
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
      <MobileBottomBar />
    </div>
  );
}
