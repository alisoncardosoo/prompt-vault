import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";
import {
  LayoutGrid,
  List,
  ChevronDown,
  Star,
  Trash2,
  Search,
  Plus,
  Sparkles,
  ArrowLeft,
  Hash,
  FileText,
  Home,
  Folder,
  Tag,
  Clock,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { usePromptStore, timeAgo } from "@/lib/promptStore";
import { AppSidebar } from "@/components/app/Sidebar";
import { AppHeader } from "@/components/app/Header";
import { CategoryCards } from "@/components/app/CategoryCards";
import { PromptCard } from "@/components/app/PromptCard";
import { DetailPanel } from "@/components/app/DetailPanel";
import { ThemedPromptIcon } from "@/components/app/ThemedPromptIcon";
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

type MobileSection = "home" | "todos" | "pastas" | "tags";

function useLocalStorage<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : fallback;
    } catch {
      return fallback;
    }
  });
  const set = (v: T) => {
    localStorage.setItem(key, JSON.stringify(v));
    setValue(v);
  };
  return [value, set];
}

function MobileBottomBar({ onSearchOpen }: { onSearchOpen: () => void }) {
  const { openEditor, setImageImportOpen } = usePromptStore();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/90 dark:bg-background/95 backdrop-blur-xl border-t border-border/30">
      <div
        className="flex items-center px-4 gap-3 py-3"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}
      >
        <button
          onClick={() => openEditor()}
          aria-label="Novo prompt"
          className="w-11 h-11 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground active:scale-95 transition-transform shadow-sm"
        >
          <Plus className="size-5" strokeWidth={2.5} />
        </button>

        <button
          onClick={() => setImageImportOpen(true)}
          aria-label="Importar com IA"
          className="w-11 h-11 shrink-0 rounded-full bg-violet-500 flex items-center justify-center text-white active:scale-95 transition-transform shadow-sm"
        >
          <Sparkles className="size-4.5" />
        </button>

        <button
          onClick={onSearchOpen}
          className="flex-1 h-11 bg-muted/60 border border-border/40 rounded-xl flex items-center gap-2 px-3 active:bg-muted/80 transition-colors"
        >
          <Search className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">Buscar prompts...</span>
        </button>
      </div>
    </nav>
  );
}

function MobileSearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { prompts, setSelected } = usePromptStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return prompts
      .filter(
        (p) =>
          !p.isArchived &&
          (p.title.toLowerCase().includes(q) ||
            p.content.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q))),
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [prompts, query]);

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border/30 shrink-0">
        <button
          onClick={onClose}
          aria-label="Fechar busca"
          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-muted-foreground active:bg-muted/60 transition-colors"
        >
          <ArrowLeft className="size-5" />
        </button>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar prompts..."
          className="flex-1 bg-transparent text-base outline-none text-foreground placeholder:text-muted-foreground"
          style={{ fontSize: "16px" }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain pb-6">
        {!query.trim() ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
            <Search className="size-9 opacity-30" />
            <p className="text-sm">Digite para buscar</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
            <p className="text-sm">Nenhum resultado para "{query}"</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold px-5 pt-4 pb-2 text-foreground">
              Resultados:{" "}
              <span className="font-normal text-muted-foreground">{results.length}</span>
            </p>
            <div className="px-5 flex flex-col gap-3">
              {results.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelected(p.id);
                    onClose();
                  }}
                >
                  <PromptCard prompt={p} mode="grid" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MobileTopNav({
  mobileSection,
  setMobileSection,
}: {
  mobileSection: MobileSection;
  setMobileSection: (s: MobileSection) => void;
}) {
  const { view, setView, setSidebarOpen } = usePromptStore();

  const tabs: { id: MobileSection; label: string; icon: typeof Home }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "todos", label: "Todos", icon: LayoutGrid },
    { id: "pastas", label: "Pastas", icon: Folder },
    { id: "tags", label: "Tags", icon: Tag },
  ];

  return (
    <div className="lg:hidden flex items-center h-14 px-4 gap-2 bg-background/90 backdrop-blur-xl border-b border-border/30 shrink-0">
      <button
        aria-label="Menu"
        onClick={() => setSidebarOpen(true)}
        className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl active:opacity-70 transition-opacity shrink-0"
      >
        <ThemedPromptIcon alt="Menu" className="size-7 shadow-sm" />
      </button>

      <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = mobileSection === id && view === "all";
          return (
            <button
              key={id}
              onClick={() => {
                setMobileSection(id);
                if (view !== "all") setView("all");
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-150 shrink-0",
                isActive
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type MobileListRowProps = {
  icon?: React.ReactNode;
  title: string;
  meta?: string;
  onClick: () => void;
  isFavorite?: boolean;
};

function MobileListRow({ icon, title, meta, onClick, isFavorite }: MobileListRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3 min-h-[52px] active:bg-muted/60 transition-colors text-left"
    >
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
        {icon ?? <FileText className="size-4" />}
      </div>
      <span className="text-[15px] flex-1 truncate text-foreground">{title}</span>
      {isFavorite && <Star className="size-3.5 fill-primary text-primary shrink-0" />}
      {meta && <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{meta}</span>}
    </button>
  );
}

function MobileHomeContent({ mobileSection }: { mobileSection: MobileSection }) {
  const { prompts, categories, setView, setSelected } = usePromptStore();
  const [pastasOpen, setPastasOpen] = useState(true);
  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const [recentsOpen, setRecentsOpen] = useState(true);
  const [recentsViewMode, setRecentsViewMode] = useLocalStorage<"list" | "cards">(
    "pref:recentsViewMode",
    "list",
  );
  const [todosViewMode, setTodosViewMode] = useLocalStorage<"list" | "cards">(
    "pref:todosViewMode",
    "list",
  );

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

  const allTags = useMemo(() => {
    const set = new Set<string>();
    prompts.filter((p) => !p.isArchived).forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [prompts]);

  const SectionHeader = ({
    label,
    count,
    isOpen,
    onToggle,
    onViewAll,
    actions,
  }: {
    label: string;
    count?: number;
    isOpen: boolean;
    onToggle: () => void;
    onViewAll?: () => void;
    actions?: React.ReactNode;
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
      <div className="flex items-center gap-1">
        {actions}
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            Ver tudo
          </button>
        )}
      </div>
    </div>
  );

  if (mobileSection === "todos") {
    const allPrompts = prompts
      .filter((p) => !p.isArchived)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return (
      <div className="lg:hidden pt-2">
        <div className="flex items-center justify-between px-5 pb-2">
          <span className="text-sm font-semibold text-foreground">
            Todos os prompts
            <span className="text-xs text-muted-foreground font-normal ml-1.5">
              ({allPrompts.length})
            </span>
          </span>
          <div className="flex items-center">
            <button
              onClick={() => setTodosViewMode("list")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                todosViewMode === "list" ? "text-foreground" : "text-muted-foreground",
              )}
              aria-label="Visualização em lista"
            >
              <List className="size-3.5" />
            </button>
            <button
              onClick={() => setTodosViewMode("cards")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                todosViewMode === "cards" ? "text-foreground" : "text-muted-foreground",
              )}
              aria-label="Visualização em cartões"
            >
              <LayoutGrid className="size-3.5" />
            </button>
          </div>
        </div>
        {allPrompts.length === 0 ? (
          <p className="text-sm text-muted-foreground px-5 pb-3">Nenhum prompt ainda.</p>
        ) : todosViewMode === "list" ? (
          allPrompts.map((p) => (
            <MobileListRow
              key={p.id}
              icon={<FileText className="size-4" />}
              title={p.title}
              meta={timeAgo(p.updatedAt)}
              isFavorite={p.isFavorite}
              onClick={() => setSelected(p.id)}
            />
          ))
        ) : (
          <div className="px-5 flex flex-col gap-3 pb-3">
            {allPrompts.map((p) => (
              <PromptCard key={p.id} prompt={p} mode="grid" />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (mobileSection === "tags") {
    return (
      <div className="lg:hidden pt-4 px-5">
        <p className="text-sm font-semibold text-foreground mb-3">Tags</p>
        {allTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma tag criada.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setView("tag", tag)}
                className="flex items-center gap-1.5 bg-muted/70 rounded-full px-3 py-1.5 text-sm active:scale-95 transition-transform"
              >
                <Hash className="size-3.5 text-muted-foreground" />
                <span>{tag}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (mobileSection === "pastas") {
    return (
      <div className="lg:hidden pt-4 px-5">
        <p className="text-sm font-semibold text-foreground mb-3">Pastas</p>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma pasta criada.</p>
        ) : (
          <CategoryCards />
        )}
      </div>
    );
  }

  return (
    <div className="lg:hidden space-y-1 pt-2">
      <section>
        <SectionHeader
          label="Pastas"
          count={categories.length}
          isOpen={pastasOpen}
          onToggle={() => setPastasOpen((v) => !v)}
        />
        {pastasOpen && categories.length > 0 && (
          <div className="px-5 pb-3 pt-1">
            <CategoryCards horizontal />
          </div>
        )}
        {pastasOpen && categories.length === 0 && (
          <p className="text-sm text-muted-foreground px-5 pb-3">Nenhuma pasta criada.</p>
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
              icon={<Star className="size-4 fill-primary text-primary" />}
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
          label="Recentes"
          count={recentPrompts.length}
          isOpen={recentsOpen}
          onToggle={() => setRecentsOpen((v) => !v)}
          onViewAll={() => setView("recent")}
          actions={
            <div className="flex items-center">
              <button
                onClick={() => setRecentsViewMode("list")}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  recentsViewMode === "list" ? "text-foreground" : "text-muted-foreground",
                )}
                aria-label="Visualização em lista"
              >
                <List className="size-3.5" />
              </button>
              <button
                onClick={() => setRecentsViewMode("cards")}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  recentsViewMode === "cards" ? "text-foreground" : "text-muted-foreground",
                )}
                aria-label="Visualização em cartões"
              >
                <LayoutGrid className="size-3.5" />
              </button>
            </div>
          }
        />
        {recentsOpen &&
          recentsViewMode === "list" &&
          recentPrompts.map((p) => (
            <MobileListRow
              key={p.id}
              icon={<Clock className="size-4" />}
              title={p.title}
              meta={timeAgo(p.lastUsedAt)}
              onClick={() => setSelected(p.id)}
            />
          ))}
        {recentsOpen && recentsViewMode === "cards" && recentPrompts.length > 0 && (
          <div className="px-5 flex flex-col gap-3 pb-3 pt-1">
            {recentPrompts.map((p) => (
              <PromptCard key={p.id} prompt={p} mode="grid" />
            ))}
          </div>
        )}
        {recentsOpen && recentPrompts.length === 0 && (
          <p className="text-sm text-muted-foreground px-5 pb-3">Nenhum prompt usado ainda.</p>
        )}
      </section>
    </div>
  );
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
    imageImportOpen,
    editorOpen,
    variablesOpen,
    settingsOpen,
    setImageImportOpen,
  } = usePromptStore();

  useEffect(() => {
    purgeTrashedPrompts();
  }, [purgeTrashedPrompts]);
  const [greeting] = useState(() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  });
  const [mobileSection, setMobileSection] = useState<MobileSection>("home");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const [viewMode, setViewMode] = useLocalStorage<"grid" | "list">("pref:viewMode", "grid");
  const [sortBy, setSortBy] = useLocalStorage<"recent" | "alpha" | "rating">(
    "pref:sortBy",
    "recent",
  );

  const SORT_LABELS = { recent: "Recente", alpha: "A–Z", rating: "Avaliação" } as const;

  useEffect(() => {
    setShowAll(false);
    setShowFolders(false);
  }, [view, viewArg, search]);

  // Daily auto-backup to localStorage (keeps last 7 days)
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastBackup = localStorage.getItem("promptlibrary-auto-backup-date");
    if (lastBackup === today) return;
    const state = usePromptStore.getState();
    if (!state.prompts.length && !state.categories.length) return;
    try {
      const data = JSON.stringify({
        prompts: state.prompts,
        categories: state.categories,
        userName: state.userName,
        exportedAt: Date.now(),
      });
      localStorage.setItem(`promptlibrary-backup-${today}`, data);
      localStorage.setItem("promptlibrary-auto-backup-date", today);
      // Keep only last 7 daily backups
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith("promptlibrary-backup-202")) keys.push(k);
      }
      keys.sort();
      keys.slice(0, Math.max(0, keys.length - 7)).forEach((k) => localStorage.removeItem(k));
      toast.success("Backup automático realizado", {
        description: `Dados salvos localmente — ${today}`,
        duration: 4000,
      });
    } catch {
      // localStorage cheio — silencia
    }
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
        <MobileTopNav mobileSection={mobileSection} setMobileSection={setMobileSection} />
        <AppHeader />

        <div className="flex-1 flex min-h-0">
          <main
            className={cn(
              "flex-1 overflow-y-auto overscroll-contain py-5 lg:py-7",
              view === "all" && !search ? "px-0 md:px-7 lg:px-10" : "px-5 md:px-7 lg:px-10",
            )}
          >
            <div className="max-w-5xl pb-24 lg:pb-4">
              {view === "all" && !search && <MobileHomeContent mobileSection={mobileSection} />}

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
                      {showFolders ? (
                        <div>
                          <div className="flex items-center gap-3 mb-5">
                            <button
                              onClick={() => setShowFolders(false)}
                              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ArrowLeft className="size-3.5" /> Voltar
                            </button>
                            <h2 className="text-base font-semibold">
                              Todas as pastas
                              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                                ({categories.length})
                              </span>
                            </h2>
                          </div>
                          <CategoryCards />
                        </div>
                      ) : (
                        <>
                          <CategoryCards limit={5} />
                          {categories.length > 5 && (
                            <button
                              onClick={() => setShowFolders(true)}
                              className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                            >
                              Ver mais {categories.length - 5} pasta
                              {categories.length - 5 > 1 ? "s" : ""} →
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {!showFolders && (
                      <div className="mt-6 lg:mt-8 mb-4">
                        <h2 className="text-base font-semibold">Prompts recentes</h2>
                      </div>
                    )}
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

                {!showFolders && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </main>

          <DetailPanel />
        </div>

        {/* Desktop-only footer */}
        <footer className="hidden lg:flex h-8 px-4 items-center justify-end text-[11px] text-muted-foreground border-t border-border/30 bg-background/50 shrink-0">
          <span>Desenvolvido por Alison Cardoso.</span>
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
      <MobileBottomBar onSearchOpen={() => setMobileSearchOpen(true)} />
      <MobileSearchDialog open={mobileSearchOpen} onClose={() => setMobileSearchOpen(false)} />
    </div>
  );
}
