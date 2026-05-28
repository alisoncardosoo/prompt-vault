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
import { ThemedPromptIcon } from "./ThemedPromptIcon";
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
          prompt.isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
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
          "text-left bg-card/90 rounded-[20px] px-5 py-3.5 shadow-sm shadow-black/[0.06] hover:shadow-md hover:shadow-black/[0.10] hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4 min-h-[68px] active:scale-[0.99] active:shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          selected && "ring-2 ring-primary/40",
          inTrash && "opacity-70",
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

  const firstImage = prompt.attachments.find((a) => a.type.startsWith("image/"));
  const imageUrl = firstImage?.url || firstImage?.data;

  return (
    <article
      {...sharedProps}
      className={cn(
        "text-left bg-card/90 rounded-[16px] shadow-sm shadow-black/[0.06] hover:shadow-md hover:shadow-black/[0.10] hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-[310px] overflow-hidden active:scale-[0.99] active:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        selected && "ring-2 ring-primary/40",
        inTrash && "opacity-70",
      )}
    >
      {/* Image / icon banner */}
      <div className="h-[90px] shrink-0 relative bg-[#2e2e2e] flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <ThemedPromptIcon className="size-9 opacity-30" />
        )}
        {!inTrash && (
          <div className="absolute top-1 right-1">
            <FavBtn />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 gap-1.5">
        <h3 className="font-semibold text-[12px] leading-tight line-clamp-1 shrink-0">
          {prompt.title}
        </h3>

        {/* Tags — até 2 linhas */}
        {inTrash && daysLeft !== null ? (
          <span className="text-[11px] text-destructive/70 font-medium shrink-0">
            Expira em {daysLeft}d
          </span>
        ) : (
          <div className="flex flex-wrap gap-1 max-h-[56px] overflow-hidden shrink-0">
            {prompt.tags.map((t) => (
              <TagPill key={t} tag={t} />
            ))}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground line-clamp-3 shrink-0 leading-[1.45]">
          {prompt.description}
        </p>

        {/* Footer sempre visível no fundo via mt-auto */}
        <div className="mt-auto shrink-0 flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30">
          <span className="tabular-nums">{timeAgo(prompt.updatedAt)}</span>
          <div className="flex items-center gap-0.5">
            {!inTrash && <ShareBtn />}
            <CardMenu />
          </div>
        </div>
      </div>
    </article>
  );
}
