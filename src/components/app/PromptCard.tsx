import type React from "react";
import { useState } from "react";
import {
  Star,
  Paperclip,
  MoreHorizontal,
  Pencil,
  Files,
  Trash2,
  Archive,
  RotateCcw,
  Share2,
  Check,
} from "lucide-react";
import { type Prompt, type TrashedPrompt, usePromptStore, timeAgo } from "@/lib/promptStore";
import { TagPill } from "./TagPill";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PromptCard({
  prompt,
  mode = "grid",
  inTrash = false,
}: {
  prompt: Prompt | TrashedPrompt;
  mode?: "grid" | "list";
  inTrash?: boolean;
}) {
  const {
    selectedId,
    setSelected,
    toggleFavorite,
    openEditor,
    duplicatePrompt,
    deletePrompt,
    savePrompt,
    restorePrompt,
    permanentlyDeletePrompt,
  } = usePromptStore();
  const selected = selectedId === prompt.id;

  const sharedProps = {
    role: "button" as const,
    tabIndex: 0,
    onClick: () => setSelected(prompt.id),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setSelected(prompt.id);
      }
    },
  };

  const FavBtn = () => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(prompt.id);
      }}
      className="shrink-0 p-1 -m-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
    >
      <Star
        className={cn(
          "size-4 transition-colors",
          prompt.isFavorite ? "fill-primary text-primary" : "text-muted-foreground/40",
        )}
      />
    </button>
  );

  const [copied, setCopied] = useState(false);
  const ShareBtn = () => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(prompt.content).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="shrink-0 p-1 -m-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
      title="Copiar prompt"
    >
      {copied ? (
        <Check className="size-4 text-green-500 transition-colors" />
      ) : (
        <Share2 className="size-4 text-muted-foreground/40 transition-colors hover:text-muted-foreground" />
      )}
    </button>
  );

  const daysLeft =
    inTrash && "deletedAt" in prompt
      ? Math.max(0, 30 - Math.floor((Date.now() - prompt.deletedAt) / 86400000))
      : null;

  const CardMenu = () => (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted active:bg-muted transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {inTrash ? (
            <>
              <DropdownMenuItem onClick={() => restorePrompt(prompt.id)}>
                <RotateCcw className="size-4 mr-2" /> Restaurar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  if (confirm("Excluir permanentemente? Esta ação não pode ser desfeita."))
                    permanentlyDeletePrompt(prompt.id);
                }}
              >
                <Trash2 className="size-4 mr-2" /> Excluir permanentemente
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => openEditor(prompt.id)}>
                <Pencil className="size-4 mr-2" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicatePrompt(prompt.id)}>
                <Files className="size-4 mr-2" /> Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => savePrompt({ ...prompt, isArchived: !prompt.isArchived })}
              >
                <Archive className="size-4 mr-2" /> {prompt.isArchived ? "Desarquivar" : "Arquivar"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  if (confirm("Mover para a lixeira?")) deletePrompt(prompt.id);
                }}
              >
                <Trash2 className="size-4 mr-2" /> Mover para lixeira
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (mode === "list") {
    return (
      <article
        {...sharedProps}
        className={cn(
          "text-left bg-card border border-border rounded-xl px-4 py-3 hover:shadow-md transition-all flex items-center gap-4 min-h-[64px] active:bg-muted/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          selected && "ring-2 ring-primary/50 border-primary/30",
          inTrash && "opacity-75",
        )}
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[14px] truncate">{prompt.title}</h3>
          <p className="text-[12px] text-muted-foreground truncate">{prompt.description}</p>
        </div>
        <div className="hidden sm:flex gap-1 shrink-0">
          {prompt.tags.slice(0, 3).map((t) => (
            <TagPill key={t} tag={t} />
          ))}
        </div>
        {inTrash && daysLeft !== null ? (
          <span className="text-xs text-destructive/70 shrink-0 tabular-nums">
            {daysLeft}d restantes
          </span>
        ) : (
          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
            {timeAgo(prompt.updatedAt)}
          </span>
        )}
        {!inTrash && <FavBtn />}
        {!inTrash && <ShareBtn />}
        <CardMenu />
      </article>
    );
  }

  return (
    <article
      {...sharedProps}
      className={cn(
        "text-left bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all flex flex-col gap-2.5 min-h-[180px] active:bg-muted/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        selected && "ring-2 ring-primary/50 border-primary/30",
        inTrash && "opacity-75",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-base lg:text-[15px] leading-tight">{prompt.title}</h3>
        {!inTrash && <FavBtn />}
      </div>

      <div className="flex flex-wrap gap-1">
        {prompt.tags.map((t) => (
          <TagPill key={t} tag={t} />
        ))}
      </div>

      <p className="text-[13px] text-muted-foreground line-clamp-3 flex-1">{prompt.description}</p>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        {inTrash && daysLeft !== null ? (
          <span className="text-destructive/70 font-medium">Expira em {daysLeft}d</span>
        ) : (
          <div className="flex items-center gap-1">
            <Paperclip className="size-3.5" />
            <span>{prompt.attachments.length}</span>
          </div>
        )}
        <span>{timeAgo(prompt.updatedAt)}</span>
        <div className="flex items-center gap-0.5">
          {!inTrash && <ShareBtn />}
          <CardMenu />
        </div>
      </div>
    </article>
  );
}
