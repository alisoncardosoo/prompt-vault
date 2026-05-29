import { useEffect, useRef, useState } from "react";
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
  LayoutGrid,
  HardDrive,
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
import { cn } from "@/lib/utils";
import { ThemedPromptIcon } from "@/components/app/ThemedPromptIcon";
import { TagPill } from "@/components/app/TagPill";
import { useAuth } from "@/lib/auth";
import { getAccountStorageUsage } from "@/lib/attachmentStorage";

// Limite de armazenamento do plano gratuito do Supabase Storage.
const STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024; // 1 GB

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function StorageCard({ usedBytes, fileCount }: { usedBytes: number; fileCount: number }) {
  const pct = Math.min(100, (usedBytes / STORAGE_LIMIT_BYTES) * 100);
  const near = pct >= 80;
  return (
    <div className="rounded-xl border border-border/40 bg-sidebar-accent/30 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <HardDrive className="size-3.5 text-muted-foreground shrink-0" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Armazenamento
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            near ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${Math.max(pct, usedBytes > 0 ? 2 : 0)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>
          {formatBytes(usedBytes)} de {formatBytes(STORAGE_LIMIT_BYTES)}
        </span>
        <span>
          {fileCount} {fileCount === 1 ? "arquivo" : "arquivos"}
        </span>
      </div>
    </div>
  );
}

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
        "w-full flex items-center rounded-xl text-sm transition-colors min-h-[44px]",
        collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2.5",
        active
          ? "bg-primary/15 text-foreground font-medium"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 active:bg-sidebar-accent/60",
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
  const tags = Array.from(new Set(prompts.flatMap((p) => p.tags))).sort();
  const [showAllTags, setShowAllTags] = useState(false);
  const tagsRef = useRef<HTMLDivElement>(null);
  const [tagsOverflow, setTagsOverflow] = useState(false);
  const [openSections, setOpenSections] = useState({
    biblioteca: true,
    pastas: false,
    organizacao: true,
  });

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    const el = tagsRef.current;
    if (!el || showAllTags) return;
    setTagsOverflow(el.scrollHeight > el.clientHeight + 1);
  }, [tags, showAllTags]);

  const counts = {
    all: prompts.length,
    favorites: prompts.filter((p) => p.isFavorite).length,
    recent: prompts.filter((p) => p.lastUsedAt).length,
    attachments: prompts.reduce((s, p) => s + p.attachments.length, 0),
  };

  // Uso de armazenamento: soma local dos anexos (ativos + lixeira) usada como
  // fallback enquanto o tamanho real do bucket não chega do Supabase.
  const allAttachments = [...prompts, ...trashedPrompts].flatMap((p) => p.attachments);
  const localUsedBytes = allAttachments.reduce((s, a) => s + (a.size || 0), 0);

  // Uso real consultado no bucket do Supabase (inclui arquivos órfãos).
  const { user } = useAuth();
  const [remoteUsage, setRemoteUsage] = useState<{ bytes: number; files: number } | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setRemoteUsage(null);
      return;
    }
    let cancelled = false;
    getAccountStorageUsage(user.id)
      .then((usage) => {
        if (!cancelled) setRemoteUsage(usage);
      })
      .catch((err) => {
        console.error("Falha ao consultar uso do Storage:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, counts.attachments]);

  const storageUsedBytes = remoteUsage?.bytes ?? localUsedBytes;
  const storageFileCount = remoteUsage?.files ?? allAttachments.length;

  const nav = (cb: () => void) => () => {
    cb();
    onNavigate?.();
  };

  return (
    <TooltipProvider delayDuration={300}>
      {/* Logo */}
      <div
        className={cn("flex items-center gap-2.5 shrink-0 p-4", collapsed && "justify-center px-0")}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="rounded-xl hover:bg-sidebar-accent/60 transition-colors p-0.5"
              >
                <ThemedPromptIcon className="size-9 drop-shadow-sm shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Expandir</TooltipContent>
          </Tooltip>
        ) : (
          <ThemedPromptIcon className="size-9 drop-shadow-sm shrink-0" />
        )}
        {!collapsed && (
          <>
            <span className="font-semibold text-[15px] flex-1">Prompt Vault</span>
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
                icon={LayoutGrid}
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
                          if (name?.trim())
                            usePromptStore.getState().addCategory(name.trim(), color);
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
                              <DropdownMenuItem
                                key={color}
                                onClick={() => setCategoryColor(c.id, color)}
                              >
                                <span className={cn("size-2.5 rounded-sm mr-2", catBg[color])} />
                                {label}
                                {c.color === color && <Check className="size-3.5 ml-auto" />}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Excluir a pasta "${c.name}"? Os prompts não serão excluídos.`,
                                  )
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
          <SectionHeader label="Tags" icon={Tag} collapsed={collapsed} />
          <div className="space-y-0.5 mt-1">
            <NavItem
              collapsed={collapsed}
              active={view === "tags"}
              onClick={nav(() => setView("tags"))}
              icon={Tag}
              label="Todas as tags"
              count={tags.length || undefined}
            />
          </div>
          {!collapsed && tags.length > 0 && (
            <>
              <div
                ref={tagsRef}
                className={cn(
                  "flex flex-wrap gap-1.5 mt-1 px-2 pb-1",
                  !showAllTags && "max-h-[280px] overflow-hidden",
                )}
              >
                {tags.map((t) => (
                  <TagPill
                    key={t}
                    tag={t}
                    active={view === "tag" && viewArg === t}
                    onClick={nav(() => setView("tag", t))}
                  />
                ))}
              </div>
              {tagsOverflow && (
                <button
                  onClick={() => setShowAllTags((v) => !v)}
                  className="mt-1 px-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showAllTags ? "Ver menos" : "Ver todas"}
                </button>
              )}
            </>
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

      {/* Armazenamento */}
      {!collapsed ? (
        <div className="border-t border-border/30 shrink-0 p-3">
          <StorageCard usedBytes={storageUsedBytes} fileCount={storageFileCount} />
        </div>
      ) : (
        <div className="border-t border-border/30 shrink-0 flex justify-center p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-1.5 text-muted-foreground">
                <HardDrive className="size-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              Armazenamento: {formatBytes(storageUsedBytes)} de {formatBytes(STORAGE_LIMIT_BYTES)}
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Expand button — only shown when collapsed, desktop only */}
      {!sidebarOpen && collapsed && (
        <div className="border-t border-border/30 shrink-0 flex justify-center p-3">
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
          "hidden lg:flex shrink-0 bg-sidebar/80 backdrop-blur-2xl border-r border-border/30 flex-col h-screen transition-all duration-300 overflow-hidden",
          sidebarCollapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarInner collapsed={sidebarCollapsed} />
      </aside>

      {/* Mobile/Tablet: slide-in drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          hideClose
          className="p-0 w-72 bg-sidebar border-sidebar-border/30 flex flex-col"
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
