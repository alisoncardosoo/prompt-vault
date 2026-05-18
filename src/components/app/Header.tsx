import { Search, Plus, Menu, Sparkles } from "lucide-react";
import { usePromptStore } from "@/lib/promptStore";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const { search, setSearch, openEditor, setCommandOpen, setSidebarOpen, setImageImportOpen } =
    usePromptStore();

  const handleExport = () => {
    const s = usePromptStore.getState();
    const data = {
      prompts: s.prompts,
      categories: s.categories,
      userName: s.userName,
      exportedAt: Date.now(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promptlibrary-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="h-14 lg:h-14 px-3 lg:px-4 flex items-center gap-2 lg:gap-3 border-b border-border bg-background/80 backdrop-blur shrink-0">
      {/* Mobile hamburger — 44px touch target */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden min-w-[44px] min-h-[44px] text-muted-foreground shrink-0"
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </Button>

      {/* Search — anchored left, grows to fill space */}
      <div className="flex-1 relative min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          data-search-input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setCommandOpen(false)}
          placeholder="Buscar prompts, tags, conteúdo..."
          className="w-full bg-card border border-border rounded-lg pl-9 pr-3 lg:pr-14 h-11 lg:h-9 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          style={{ fontSize: "16px" }}
        />
        <kbd className="hidden lg:block absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground border border-border rounded px-1.5 py-0.5 bg-muted">
          ⌘K
        </kbd>
      </div>

      {/* Importar imagem */}
      <Button
        variant="outline"
        onClick={() => setImageImportOpen(true)}
        className="h-11 lg:h-9 gap-1.5 shrink-0 active:scale-95 transition-all"
        title="Importar prompt de imagem"
      >
        <Sparkles className="size-4" />
        <span className="hidden md:inline">Importar</span>
      </Button>

      {/* Novo prompt — anchored right, 44px on mobile */}
      <Button
        onClick={() => openEditor()}
        className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 lg:h-9 gap-1.5 shadow-sm shrink-0 active:scale-95 transition-all"
      >
        <Plus className="size-4" />
        <span className="hidden sm:inline">Novo prompt</span>
      </Button>

      {/* Hidden — keeps Sidebar export shortcut working */}
      <button id="backup-btn" onClick={handleExport} className="hidden" aria-hidden />
    </header>
  );
}
