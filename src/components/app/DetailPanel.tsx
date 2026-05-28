import { useEffect, useRef, useState } from "react";
import * as React from "react";
import {
  Star,
  Share2,
  MoreHorizontal,
  Copy,
  Pencil,
  Files,
  Trash2,
  Plus,
  X,
  FileText,
  Maximize2,
  Minimize2,
  Archive,
  Check,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  File,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { usePromptStore, type Prompt, timeAgo } from "@/lib/promptStore";
import { TagPill } from "./TagPill";
import { ThemedPromptIcon } from "./ThemedPromptIcon";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  getAttachmentPreviewUrl,
  isAttachmentSynced,
  uploadPromptAttachments,
} from "@/lib/attachmentStorage";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState(() => window.innerWidth >= 1024);
  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}

function AttachmentIcon({ type }: { type: string }) {
  if (type.startsWith("video/")) return <FileVideo className="size-8 text-blue-400" />;
  if (type.startsWith("audio/")) return <FileAudio className="size-8 text-purple-400" />;
  if (type === "application/pdf") return <FileText className="size-8 text-red-400" />;
  if (type.includes("word") || type.includes("document"))
    return <FileText className="size-8 text-blue-500" />;
  if (type.includes("sheet") || type.includes("excel"))
    return <FileText className="size-8 text-green-500" />;
  if (type.startsWith("text/") || type.includes("code"))
    return <FileCode className="size-8 text-yellow-400" />;
  if (type.includes("zip") || type.includes("tar"))
    return <FileArchive className="size-8 text-orange-400" />;
  return <File className="size-8 text-muted-foreground" />;
}

function PromptDetail({ prompt: p }: { prompt: Prompt }) {
  const {
    toggleFavorite,
    openEditor,
    duplicatePrompt,
    deletePrompt,
    markUsed,
    savePrompt,
    setSelected,
    categories,
  } = usePromptStore();
  const { user } = useAuth();
  const [addingTag, setAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [shared, setShared] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState<{ index: number } | null>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const category = categories.find((c) => c.id === p.categoryId);
  const firstImage = p.attachments.find((a) => a.type.startsWith("image/"));
  const heroImageUrl = firstImage?.url || firstImage?.data;

  useEffect(() => {
    if (!lightbox) return;
    const total = p.attachments.length;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((lb) => lb && { index: (lb.index + 1) % total });
      if (e.key === "ArrowLeft")
        setLightbox((lb) => lb && { index: (lb.index - 1 + total) % total });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, p.attachments.length]);

  useEffect(() => {
    if (addingTag) tagInputRef.current?.focus();
  }, [addingTag]);

  useEffect(() => {
    setAddingTag(false);
    setNewTag("");
  }, [p.id]);

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !p.tags.includes(tag)) {
      savePrompt({ ...p, tags: [...p.tags, tag] });
    }
    setNewTag("");
    setAddingTag(false);
  };

  const handleRemoveTag = (tag: string) => {
    savePrompt({ ...p, tags: p.tags.filter((t) => t !== tag) });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(p.content);
    markUsed(p.id);
    toast.success("Prompt copiado");
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(p.content);
    setShared(true);
    toast.success("Prompt copiado para o clipboard");
    setTimeout(() => setShared(false), 1500);
  };

  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const readers = files.map(
      (file) =>
        new Promise<Prompt["attachments"][number]>((resolve) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              id: Math.random().toString(36).slice(2, 10),
              name: file.name,
              size: file.size,
              type: file.type,
              data: reader.result as string,
            });
          reader.readAsDataURL(file);
        }),
    );
    Promise.all(readers).then(async (newAttachments) => {
      try {
        const nextAttachments = [...p.attachments, ...newAttachments];
        const uploadedAttachments =
          user?.id && nextAttachments.length > 0
            ? await uploadPromptAttachments(user.id, p.id, nextAttachments)
            : nextAttachments;
        savePrompt({ ...p, attachments: uploadedAttachments });
      } catch (err) {
        console.error(err);
        toast.error("Falha no envio do anexo para sincronização.");
      }
    });
    e.target.value = "";
  };

  return (
    <>
      {/* Mobile drag handle */}
      <div className="lg:hidden flex items-center justify-between pt-3 pb-2 px-4 shrink-0">
        <button
          onClick={() => setSelected(null)}
          aria-label="Fechar"
          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-muted-foreground active:bg-muted/60 transition-colors"
        >
          <X className="size-4" />
        </button>
        <div className="w-10 h-1 rounded-full bg-border" />
        <div className="w-9" />
      </div>

      {/* Hero banner — mirrors the card's image area but taller */}
      <div className="relative h-[130px] shrink-0 overflow-hidden bg-muted/40">
        {heroImageUrl ? (
          <>
            <img src={heroImageUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-card/10 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ThemedPromptIcon className="size-16 opacity-[0.12]" />
          </div>
        )}

        {/* Category badge */}
        {category && (
          <div className="absolute bottom-3 left-4">
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-background/70 backdrop-blur-sm text-foreground/70 border border-border/30">
              {category.name}
            </span>
          </div>
        )}

        {/* Favorite + close */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          <button
            onClick={() => toggleFavorite(p.id)}
            className="size-8 flex items-center justify-center rounded-lg bg-background/65 backdrop-blur-sm text-foreground/70 hover:bg-background/85 transition-colors"
          >
            <Star
              className={cn(
                "size-4",
                p.isFavorite ? "fill-amber-400 text-amber-400" : "text-foreground/60",
              )}
            />
          </button>
          <button
            onClick={() => setSelected(null)}
            aria-label="Fechar"
            className="hidden lg:flex size-8 items-center justify-center rounded-lg bg-background/65 backdrop-blur-sm text-foreground/70 hover:bg-background/85 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Title + actions */}
      <div className="px-5 pt-4 pb-3.5 border-b border-border/50 shrink-0">
        <div className="flex items-start gap-2">
          <h2 className="font-semibold text-[17px] lg:text-[18px] leading-snug flex-1">
            {p.title}
          </h2>
          <div className="flex items-center gap-0.5 shrink-0 -mt-0.5">
            <Button variant="ghost" size="icon" className="size-8" onClick={handleShare}>
              {shared ? <Check className="size-4 text-green-500" /> : <Share2 className="size-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditor(p.id)}>
                  <Pencil className="size-4 mr-2" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => duplicatePrompt(p.id)}>
                  <Files className="size-4 mr-2" /> Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => savePrompt({ ...p, isArchived: !p.isArchived })}>
                  <Archive className="size-4 mr-2" />
                  {p.isArchived ? "Desarquivar" : "Arquivar"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    if (confirm("Mover para a lixeira?")) {
                      deletePrompt(p.id);
                      setSelected(null);
                    }
                  }}
                >
                  <Trash2 className="size-4 mr-2" /> Mover para lixeira
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground flex-wrap">
          <Clock className="size-3 shrink-0" />
          <span>{timeAgo(p.updatedAt)}</span>
          {p.lastUsedAt && (
            <>
              <span className="opacity-40">·</span>
              <span>usado {timeAgo(p.lastUsedAt)}</span>
            </>
          )}
          {p.attachments.length > 0 && (
            <>
              <span className="opacity-40">·</span>
              <span>
                {p.attachments.length} {p.attachments.length === 1 ? "anexo" : "anexos"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {p.tags.map((t) => (
            <span key={t} className="group/tag relative inline-flex items-center">
              <TagPill tag={t} />
              <button
                onClick={() => handleRemoveTag(t)}
                className="absolute -top-1 -right-1 size-3.5 rounded-full bg-background border border-border text-muted-foreground hidden group-hover/tag:flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="size-2" />
              </button>
            </span>
          ))}
          {addingTag ? (
            <input
              ref={tagInputRef}
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTag();
                if (e.key === "Escape") {
                  setAddingTag(false);
                  setNewTag("");
                }
              }}
              onBlur={handleAddTag}
              className="h-5 w-24 rounded-md border border-primary px-1.5 text-[11px] outline-none bg-background"
              placeholder="nova tag"
            />
          ) : (
            <button
              onClick={() => setAddingTag(true)}
              className="size-5 rounded-md border border-dashed border-border text-muted-foreground flex items-center justify-center hover:bg-muted"
            >
              <Plus className="size-3" />
            </button>
          )}
        </div>

        {/* Description */}
        {p.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
        )}

        {/* Content — editor-style block */}
        <div className="rounded-xl overflow-hidden border border-border/40 shadow-sm">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[oklch(0.19_0.008_240)] border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-[#ff5f57]/60" />
                <div className="size-2.5 rounded-full bg-[#febc2e]/60" />
                <div className="size-2.5 rounded-full bg-[#28c840]/60" />
              </div>
              <span className="text-[11px] text-white/25 font-mono">prompt.txt</span>
            </div>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="size-6 rounded-md text-white/35 flex items-center justify-center hover:text-white/65 hover:bg-white/10 transition-colors"
            >
              {expanded ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
            </button>
          </div>
          <pre
            className={cn(
              "bg-code-bg text-code-fg px-4 py-3.5 text-[12.5px] font-mono leading-relaxed whitespace-pre-wrap break-words overflow-y-auto",
              expanded ? "max-h-none" : "max-h-[260px] lg:max-h-[360px]",
            )}
          >
            {p.content.split(/(\{\{[^}]+\}\})/g).map((part, i) =>
              part.match(/^\{\{[^}]+\}\}$/) ? (
                <span key={i} className="text-primary">
                  {part}
                </span>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
          </pre>
        </div>

        {/* Attachments */}
        {p.attachments.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Anexos
              </span>
              <div className="flex-1 h-px bg-border/50" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {p.attachments.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => setLightbox({ index: i })}
                  className="aspect-square bg-muted border border-border rounded-lg overflow-hidden flex flex-col items-center justify-center text-[10px] text-center relative group hover:ring-2 hover:ring-primary/50 transition-all"
                >
                  {a.type.startsWith("image/") && getAttachmentPreviewUrl(a) ? (
                    <>
                      <img
                        src={getAttachmentPreviewUrl(a) ?? undefined}
                        alt={a.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-1">
                        <span className="text-white text-[10px] truncate w-full opacity-0 group-hover:opacity-100 transition-opacity leading-tight">
                          {a.name}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 p-2 w-full">
                      <AttachmentIcon type={a.type} />
                      <span className="truncate w-full">{a.name}</span>
                      <span className="text-muted-foreground">{(a.size / 1024).toFixed(0)} KB</span>
                      {!isAttachmentSynced(a) && (
                        <span className="text-[9px] text-amber-600">não sincronizado</span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Add attachment */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleAddAttachment}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2.5 border border-dashed border-border/60 rounded-xl flex items-center justify-center gap-2 text-[12px] text-muted-foreground hover:bg-muted/40 hover:border-border transition-colors"
        >
          <Plus className="size-3.5" />
          Adicionar anexo
        </button>
      </div>

      {/* Lightbox */}
      {lightbox &&
        (() => {
          const a = p.attachments[lightbox.index];
          const total = p.attachments.length;
          return (
            <div
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
              onClick={() => setLightbox(null)}
            >
              {total > 1 && (
                <button
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox({ index: (lightbox.index - 1 + total) % total });
                  }}
                >
                  <ChevronLeft className="size-5" />
                </button>
              )}
              <div
                className="relative flex items-center justify-center max-w-[90vw] max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {a.type.startsWith("image/") && getAttachmentPreviewUrl(a) ? (
                  <img
                    src={getAttachmentPreviewUrl(a) ?? undefined}
                    alt={a.name}
                    className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
                  />
                ) : a.type === "application/pdf" && getAttachmentPreviewUrl(a) ? (
                  <iframe
                    src={getAttachmentPreviewUrl(a) ?? undefined}
                    title={a.name}
                    className="w-[80vw] h-[85vh] rounded-lg bg-white"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-white p-12 bg-white/5 rounded-2xl">
                    <AttachmentIcon type={a.type} />
                    <span className="text-sm">{a.name}</span>
                    <span className="text-xs text-white/50">{(a.size / 1024).toFixed(0)} KB</span>
                    {!isAttachmentSynced(a) && (
                      <span className="text-xs text-amber-300">Anexo local não sincronizado</span>
                    )}
                  </div>
                )}
              </div>
              {total > 1 && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox({ index: (lightbox.index + 1) % total });
                  }}
                >
                  <ChevronRight className="size-5" />
                </button>
              )}
              <button
                className="absolute top-3 right-3 size-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                onClick={() => setLightbox(null)}
              >
                <X className="size-4" />
              </button>
              {total > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs bg-black/40 px-3 py-1 rounded-full">
                  {lightbox.index + 1} / {total}
                </div>
              )}
            </div>
          );
        })()}

      {/* Action bar */}
      <div className="px-4 py-3.5 border-t border-border/50 shrink-0 space-y-2">
        <Button onClick={handleCopy} className="w-full h-11 gap-2 font-medium shadow-sm">
          <Copy className="size-4" />
          Copiar Prompt
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-9 gap-1.5 text-[13px]"
            onClick={() => openEditor(p.id)}
          >
            <Pencil className="size-3.5" />
            Editar
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-9 gap-1.5 text-[13px]"
            onClick={() => duplicatePrompt(p.id)}
          >
            <Files className="size-3.5" />
            Duplicar
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-9 shrink-0 text-destructive/60 hover:text-destructive hover:border-destructive/40"
            onClick={() => {
              if (confirm("Deletar este prompt?")) {
                deletePrompt(p.id);
                setSelected(null);
              }
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </>
  );
}

export function DetailPanel() {
  const { prompts, selectedId, setSelected } = usePromptStore();
  const isDesktop = useIsDesktop();
  const p = prompts.find((x) => x.id === selectedId);

  return (
    <>
      {/* Desktop: permanent side panel */}
      {p && (
        <aside className="hidden lg:flex w-[420px] shrink-0 border-l border-border bg-card flex-col h-full relative">
          <PromptDetail prompt={p} />
        </aside>
      )}

      {/* Mobile/Tablet: bottom sheet */}
      <Sheet open={!isDesktop && !!selectedId} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent
          side="bottom"
          className="p-0 bg-card border-x-0 flex flex-col rounded-t-2xl [&>button:first-child]:hidden"
          style={{ height: "92dvh" }}
        >
          <SheetTitle className="sr-only">
            {p ? `Detalhes do prompt ${p.title}` : "Detalhes do prompt"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Painel com conteudo, tags, anexos e acoes do prompt selecionado.
          </SheetDescription>
          {p && <PromptDetail prompt={p} />}
        </SheetContent>
      </Sheet>
    </>
  );
}
