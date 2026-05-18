import { Folder, FileCode2, Pencil, Box, User, MoreHorizontal, Trash2 } from "lucide-react";
import { usePromptStore } from "@/lib/promptStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const styles: Record<string, { bg: string; icon: typeof Folder; iconBg: string }> = {
  amber: {
    bg: "bg-cat-amber",
    icon: Folder,
    iconBg: "bg-amber-200/70 text-amber-700 dark:bg-amber-300/15 dark:text-amber-200",
  },
  lavender: {
    bg: "bg-cat-lavender",
    icon: FileCode2,
    iconBg: "bg-violet-200/70 text-violet-700 dark:bg-violet-300/15 dark:text-violet-200",
  },
  sky: {
    bg: "bg-cat-sky",
    icon: Pencil,
    iconBg: "bg-sky-200/70 text-sky-700 dark:bg-sky-300/15 dark:text-sky-200",
  },
  mint: {
    bg: "bg-cat-mint",
    icon: Box,
    iconBg: "bg-emerald-200/70 text-emerald-700 dark:bg-emerald-300/15 dark:text-emerald-200",
  },
  rose: {
    bg: "bg-cat-rose",
    icon: User,
    iconBg: "bg-rose-200/70 text-rose-700 dark:bg-rose-300/15 dark:text-rose-200",
  },
};

export function CategoryCards() {
  const { categories, prompts, setView, renameCategory, deleteCategory } = usePromptStore();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {categories.map((c) => {
        const s = styles[c.color];
        const Icon = s.icon;
        const count = prompts.filter((p) => p.categoryId === c.id).length;
        return (
          <button
            key={c.id}
            onClick={() => setView("category", c.id)}
            className={`${s.bg} rounded-xl p-4 text-left hover:shadow-md active:scale-[0.98] transition-all min-h-[120px] flex flex-col justify-between group relative`}
          >
            <div className="flex items-start justify-between">
              <div className={`size-9 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                <Icon className="size-4.5" />
              </div>
              {/* Always visible on mobile, hover-only on desktop */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <span className="min-w-[44px] min-h-[44px] -mt-2 -mr-2 flex items-center justify-center rounded-lg hover:bg-black/10 active:bg-black/10 cursor-pointer">
                      <MoreHorizontal className="size-4 text-foreground/60" />
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        const name = prompt("Novo nome da pasta:", c.name);
                        if (name?.trim()) renameCategory(c.id, name.trim());
                      }}
                    >
                      <Pencil className="size-4 mr-2" /> Renomear
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        if (confirm(`Excluir a pasta "${c.name}"? Os prompts não serão excluídos.`))
                          deleteCategory(c.id);
                      }}
                    >
                      <Trash2 className="size-4 mr-2" /> Excluir pasta
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div>
              <div className="font-semibold text-[15px]">{c.name}</div>
              <div className="text-xs text-foreground/60 mt-0.5">
                {count} {count === 1 ? "prompt" : "prompts"}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
