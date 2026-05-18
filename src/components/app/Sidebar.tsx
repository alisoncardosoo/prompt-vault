import { useEffect, useState } from "react";
import {
  Star,
  Clock,
  Paperclip,
  Folder,
  Plus,
  Settings as SettingsIcon,
  RefreshCw,
  Tag,
  Library,
  PanelLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  Check,
} from "lucide-react";
import { usePromptStore, type Category } from "@/lib/promptStore";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

const catBg: Record<Category["color"], string> = {
  amber: "bg-cat-amber",
  lavender: "bg-cat-lavender",
  sky: "bg-cat-sky",
  mint: "bg-cat-mint",
  rose: "bg-cat-rose",
};

type NavItemProps = {
  active: boolean;
  onClick: () => void;
  icon: typeof Star;
  label: string;
  count?: number;
  dot?: string;
  collapsed?: boolean;
};

function NavItem({ active, onClick, icon: Icon, label, count, dot, collapsed }: NavItemProps) {
  const btn = (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center rounded-lg text-sm transition-colors min-h-[44px]",
        collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2.5",
        active
          ? "bg-primary/20 text-foreground font-medium"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 active:bg-sidebar-accent",
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      {!collapsed && dot && <span className={cn("size-2.5 rounded-sm shrink-0", dot)} />}
      {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
      {!collapsed && count !== undefined && (
        <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="right">
          {label}
          {count !== undefined ? ` (${count})` : ""}
        </TooltipContent>
      </Tooltip>
    );
  }

  return btn;
}

type SectionHeaderProps = {
  label: string;
  icon: typeof Star;
  collapsed?: boolean;
  action?: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
};

function SectionHeader({
  label,
  icon: Icon,
  collapsed,
  action,
  isOpen,
  onToggle,
}: SectionHeaderProps) {
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex justify-center py-1">
            <Icon className="size-3.5 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="px-3 pb-1.5 flex items-center justify-between">
      <button onClick={onToggle} className="flex items-center gap-1.5 flex-1 text-left group">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
          {label}
        </span>
        {onToggle && (
          <ChevronDown
            className={cn(
              "size-3 text-muted-foreground group-hover:text-foreground transition-all duration-200",
              !isOpen && "-rotate-90",
            )}
          />
        )}
      </button>
      {action}
    </div>
  );
}

function SidebarInner({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const {
    prompts,
    trashedPrompts,
    categories,
    view,
    viewArg,
    setView,
    sidebarOpen,
    setSidebarOpen,
    setSidebarCollapsed,
    setSettingsOpen,
    setCategoryColor,
    deleteCategory,
    renameCategory,
  } = usePromptStore();
  const tags = Array.from(new Set(prompts.flatMap((p) => p.tags))).slice(0, 8);
  const [openSections, setOpenSections] = useState({
    biblioteca: true,
    pastas: false,
    tags: false,
    organizacao: true,
  });

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const counts = {
    all: prompts.length,
    favorites: prompts.filter((p) => p.isFavorite).length,
    recent: prompts.filter((p) => p.lastUsedAt).length,
    attachments: prompts.reduce((s, p) => s + p.attachments.length, 0),
  };

  const nav = (cb: () => void) => () => {
    cb();
    onNavigate?.();
  };

  const handleRefreshApp = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      {/* Logo */}
      <div
        className={cn("flex items-center gap-2.5 shrink-0 p-4", collapsed && "justify-center px-0")}
      >
        <img src={logo} alt="PromptLibrary" className="size-9 rounded-lg shadow-sm shrink-0" />
        {!collapsed && (
          <>
            <span className="font-semibold text-[15px] flex-1">PromptLibrary</span>
            {!sidebarOpen && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className="p-1 rounded-lg text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground transition-colors"
                  >
                    <PanelLeft className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Recolher</TooltipContent>
              </Tooltip>
            )}
          </>
        )}
      </div>

      {/* Nav */}
      <div className={cn("flex-1 overflow-y-auto pb-4 space-y-5", collapsed ? "px-2" : "px-3")}>
        {/* Biblioteca */}
        <div>
          <SectionHeader
            label="Biblioteca"
            icon={Library}
            collapsed={collapsed}
            isOpen={openSections.biblioteca}
            onToggle={() => toggleSection("biblioteca")}
          />
          {openSections.biblioteca && (
            <div className="space-y-0.5 mt-1">
              <NavItem
                collapsed={collapsed}
                active={view === "all"}
                onClick={nav(() => setView("all"))}
                icon={Star}
                label="Todos os prompts"
                count={counts.all}
              />
              <NavItem
                collapsed={collapsed}
                active={view === "favorites"}
                onClick={nav(() => setView("favorites"))}
                icon={Star}
                label="Favoritos"
                count={counts.favorites}
              />
              <NavItem
                collapsed={collapsed}
                active={view === "recent"}
                onClick={nav(() => setView("recent"))}
                icon={Clock}
                label="Recentes"
                count={counts.recent}
              />
              <NavItem
                collapsed={collapsed}
                active={view === "attachments"}
                onClick={nav(() => setView("attachments"))}
                icon={Paperclip}
                label="Anexos"
                count={counts.attachments}
              />
              <NavItem
                collapsed={collapsed}
                active={view === "trash"}
                onClick={nav(() => setView("trash"))}
                icon={Trash2}
                label="Lixeira"
                count={trashedPrompts.length || undefined}
              />
            </div>
          )}
        </div>

        {/* Pastas */}
        <div>
          <SectionHeader
            label="Pastas"
            icon={Folder}
            collapsed={collapsed}
            isOpen={openSections.pastas}
            onToggle={() => toggleSection("pastas")}
            action={
              !collapsed ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground p-1 rounded">
                      <Plus className="size-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(
                      [
                        ["amber", "Âmbar"],
                        ["lavender", "Lavanda"],
                        ["sky", "Azul"],
                        ["mint", "Menta"],
                        ["rose", "Rosa"],
                      ] as const
                    ).map(([color, label]) => (
                      <DropdownMenuItem
                        key={color}
                        onClick={() => {
                          const name = prompt(`Nome da pasta (${label})?`);
                          if (name?.trim()) usePromptStore.getState().addCategory(name.trim(), color);
                        }}
                      >
                        <span className={cn("size-2.5 rounded-sm mr-2", catBg[color])} />
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : undefined
            }
          />
          {openSections.pastas && (
            <div className="space-y-0.5 mt-1">
              {categories.map((c) => {
                const count = prompts.filter((p) => p.categoryId === c.id).length;
                return (
                  <div key={c.id} className="relative group/folder">
                    <NavItem
                      collapsed={collapsed}
                      active={view === "category" && viewArg === c.id}
                      onClick={nav(() => setView("category", c.id))}
                      icon={Folder}
                      label={c.name}
                      count={count}
                      dot={catBg[c.color]}
                    />
                    {!collapsed && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/folder:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60">
                              <SettingsIcon className="size-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                const name = prompt("Novo nome da pasta:", c.name);
                                if (name?.trim()) renameCategory(c.id, name.trim());
                              }}
                            >
                              Renomear pasta
                            </DropdownMenuItem>
                            {(
                              [
                                ["amber", "Âmbar"],
                                ["lavender", "Lavanda"],
                                ["sky", "Azul"],
                                ["mint", "Menta"],
                                ["rose", "Rosa"],
                              ] as const
                            ).map(([color, label]) => (
                              <DropdownMenuItem key={color} onClick={() => setCategoryColor(c.id, color)}>
                                <span className={cn("size-2.5 rounded-sm mr-2", catBg[color])} />
                                {label}
                                {c.color === color && <Check className="size-3.5 ml-auto" />}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                if (
                                  confirm(`Excluir a pasta "${c.name}"? Os prompts não serão excluídos.`)
                                ) {
                                  deleteCategory(c.id);
                                }
                              }}
                            >
                              Excluir pasta
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <SectionHeader
            label="Tags"
            icon={Tag}
            collapsed={collapsed}
            isOpen={openSections.tags}
            onToggle={() => toggleSection("tags")}
          />
          {openSections.tags && (
            <div className="space-y-0.5 mt-1">
              {tags.map((t) => {
                const count = prompts.filter((p) => p.tags.includes(t)).length;
                return (
                  <NavItem
                    key={t}
                    collapsed={collapsed}
                    active={view === "tag" && viewArg === t}
                    onClick={nav(() => setView("tag", t))}
                    icon={Tag}
                    label={`#${t}`}
                    count={count}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Organização */}
        <div>
          <SectionHeader
            label="Organização"
            icon={SettingsIcon}
            collapsed={collapsed}
            isOpen={openSections.organizacao}
            onToggle={() => toggleSection("organizacao")}
          />
          {openSections.organizacao && (
            <div className="space-y-0.5 mt-1">
              <NavItem
                collapsed={collapsed}
                active={false}
                onClick={nav(() => document.getElementById("backup-btn")?.click())}
                icon={RefreshCw}
                label="Backup local"
              />
              <NavItem
                collapsed={collapsed}
                active={false}
                onClick={nav(() => setSettingsOpen(true))}
                icon={SettingsIcon}
                label="Configurações"
              />
            </div>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
          <div className="rounded-xl border border-sidebar-border/80 bg-background/65 p-3 space-y-2">
            <p className="text-xs text-muted-foreground">Publicado em: 18/05/2026, 18:44</p>
            <p className="text-xs text-muted-foreground">Pode haver versão mais nova</p>
            <button
              type="button"
              onClick={handleRefreshApp}
              className="w-full rounded-lg bg-primary/15 px-2.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-primary/25 active:bg-primary/30"
            >
              Atualizar app
            </button>
          </div>
        </div>
      )}

      {/* Expand button — only shown when collapsed, desktop only */}
      {!sidebarOpen && collapsed && (
        <div className="border-t border-sidebar-border shrink-0 flex justify-center p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Expandir</TooltipContent>
          </Tooltip>
        </div>
      )}
    </TooltipProvider>
  );
}

export function AppSidebar() {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = usePromptStore();

  return (
    <>
      {/* Desktop: always-visible sidebar — collapses to icon-only */}
      <aside
        className={cn(
          "hidden lg:flex shrink-0 bg-sidebar border-r border-sidebar-border flex-col h-screen transition-all duration-300 overflow-hidden",
          sidebarCollapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarInner collapsed={sidebarCollapsed} />
      </aside>

      {/* Mobile/Tablet: slide-in drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="p-0 w-72 bg-sidebar border-sidebar-border flex flex-col"
        >
          <SheetTitle className="sr-only">Navegação da biblioteca</SheetTitle>
          <SheetDescription className="sr-only">
            Menu lateral com filtros, pastas, tags e atalhos da biblioteca.
          </SheetDescription>
          <SidebarInner onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
