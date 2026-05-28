import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  syncUpsertPrompt,
  syncMoveToTrash,
  syncRestoreFromTrash,
  syncDeletePrompt,
  syncUpsertCategory,
  syncDeleteCategory,
  syncUpdateProfile,
} from "./sync";

export type Prompt = {
  id: string;
  title: string;
  content: string;
  description: string;
  categoryId: string;
  tool: string;
  tags: string[];
  notes: string;
  rating: number;
  isFavorite: boolean;
  isArchived: boolean;
  attachments: {
    id: string;
    name: string;
    size: number;
    type: string;
    path?: string;
    url?: string;
    data?: string;
  }[];
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number | null;
};

export type TrashedPrompt = Prompt & { deletedAt: number };

const TRASH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type Category = {
  id: string;
  name: string;
  color: "amber" | "lavender" | "sky" | "mint" | "rose";
};

type State = {
  userId: string | null;
  prompts: Prompt[];
  categories: Category[];
  userName: string;
  selectedId: string | null;
  search: string;
  view: "all" | "favorites" | "recent" | "attachments" | "category" | "tag" | "tags" | "trash";
  viewArg: string | null;
  editorOpen: boolean;
  editingId: string | null;
  variablesOpen: boolean;
  variablesPromptId: string | null;
  commandOpen: boolean;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  settingsOpen: boolean;
  theme: "light" | "dark" | "system";
  aiProvider: "openai" | "anthropic" | "";
  aiApiKey: string;
  imageImportOpen: boolean;

  setUserId: (id: string | null) => void;
  setSidebarOpen: (b: boolean) => void;
  setSidebarCollapsed: (b: boolean) => void;
  setSettingsOpen: (b: boolean) => void;
  setTheme: (t: "light" | "dark" | "system") => void;
  setAIProvider: (p: "openai" | "anthropic" | "") => void;
  setAIApiKey: (k: string) => void;
  setImageImportOpen: (b: boolean) => void;
  _hydrateAISettings: (provider: string, key: string) => void;

  setSelected: (id: string | null) => void;
  setSearch: (s: string) => void;
  setView: (v: State["view"], arg?: string | null) => void;
  openEditor: (id?: string | null) => void;
  closeEditor: () => void;
  openVariables: (id: string) => void;
  closeVariables: () => void;
  setCommandOpen: (b: boolean) => void;
  setUserName: (n: string) => void;

  savePrompt: (
    p: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "lastUsedAt" | "attachments"> & {
      id?: string;
      attachments?: Prompt["attachments"];
    },
  ) => string;
  trashedPrompts: TrashedPrompt[];
  deletePrompt: (id: string) => void;
  restorePrompt: (id: string) => void;
  permanentlyDeletePrompt: (id: string) => void;
  emptyTrash: () => void;
  purgeTrashedPrompts: () => void;
  duplicatePrompt: (id: string) => void;
  toggleFavorite: (id: string) => void;
  markUsed: (id: string) => void;

  addCategory: (name: string, color: Category["color"]) => string;
  renameCategory: (id: string, name: string) => void;
  setCategoryColor: (id: string, color: Category["color"]) => void;
  deleteCategory: (id: string) => void;

  replaceAll: (data: {
    prompts: Prompt[];
    trashedPrompts?: TrashedPrompt[];
    categories: Category[];
    userName?: string;
    theme?: "light" | "dark" | "system";
  }) => void;

  // Realtime actions — update local state only, no Supabase writes
  _realtimePromptUpsert: (prompt: Prompt) => void;
  _realtimePromptTrash: (id: string, deletedAt: number) => void;
  _realtimePromptDelete: (id: string) => void;
  _realtimeCategoryUpsert: (cat: Category) => void;
  _realtimeCategoryDelete: (id: string) => void;
  _realtimeProfileUpdate: (update: {
    user_name?: string;
    theme?: "light" | "dark" | "system";
    ai_provider?: string;
    ai_api_key?: string;
  }) => void;
};

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => Date.now();
const stripAttachmentData = (attachments: Prompt["attachments"]): Prompt["attachments"] =>
  attachments.map(({ id, name, size, type, path, url }) => ({ id, name, size, type, path, url }));
const stripPromptAttachmentData = (prompt: Prompt): Prompt => ({
  ...prompt,
  attachments: stripAttachmentData(prompt.attachments),
});

const seedCategories: Category[] = [
  { id: "cat-marketing", name: "Marketing", color: "amber" },
  { id: "cat-coding", name: "Coding", color: "lavender" },
  { id: "cat-design", name: "Design", color: "sky" },
  { id: "cat-product", name: "Product", color: "mint" },
  { id: "cat-personal", name: "Personal", color: "rose" },
];

const seedPrompts: Prompt[] = [
  {
    id: uid(),
    title: "Product Launch Email",
    categoryId: "cat-marketing",
    tool: "ChatGPT",
    tags: ["marketing", "email"],
    description:
      "Email announcing new product launch to waitlist subscribers. Friendly, exciting and clear CTA.",
    content: `Subject: Something great is launching soon! 🚀\n\nHi {{first_name}},\n\nWe've been working on something special and we're excited to finally share it with you.\n\n{{product_name}} is designed to help you {{benefit_1}} and {{benefit_2}}.\n\nBe the first to try it when we launch:\n\n{{cta_link}}\n\nTalk soon,\nThe {{company_name}} team`,
    notes: "",
    rating: 5,
    isFavorite: true,
    isArchived: false,
    attachments: [],
    createdAt: now() - 7200000,
    updatedAt: now() - 7200000,
    lastUsedAt: now() - 7200000,
  },
  {
    id: uid(),
    title: "SwiftUI Animation Explainer",
    categoryId: "cat-coding",
    tool: "Claude",
    tags: ["swiftui", "animation"],
    description: "Explain SwiftUI animation concepts with code examples.",
    content: `Explain how SwiftUI animations work using {{animation_type}}.\n\nInclude:\n- A minimal code example\n- The timing curve\n- Common pitfalls\n- A real-world use case`,
    notes: "",
    rating: 4,
    isFavorite: false,
    isArchived: false,
    attachments: [],
    createdAt: now() - 18000000,
    updatedAt: now() - 18000000,
    lastUsedAt: now() - 18000000,
  },
  {
    id: uid(),
    title: "Landing Page Copy",
    categoryId: "cat-marketing",
    tool: "ChatGPT",
    tags: ["copywriting", "landing-page"],
    description: "High converting landing page copy for SaaS product.",
    content: `Write landing page copy for {{product}}.\n\nAudience: {{audience}}\nMain benefit: {{benefit}}\n\nDeliver: headline, subhead, 3 feature bullets, CTA.`,
    notes: "",
    rating: 5,
    isFavorite: false,
    isArchived: false,
    attachments: [],
    createdAt: now() - 86400000,
    updatedAt: now() - 86400000,
    lastUsedAt: now() - 86400000,
  },
  {
    id: uid(),
    title: "Brainstorming Ideas",
    categoryId: "cat-personal",
    tool: "ChatGPT",
    tags: ["brainstorming", "ideas"],
    description: "Generate 10 unique marketing campaign ideas for a productivity app.",
    content: `Generate 10 unique {{type}} ideas for {{context}}.\n\nFor each idea include: name, one-line pitch, why it could work.`,
    notes: "",
    rating: 4,
    isFavorite: false,
    isArchived: false,
    attachments: [],
    createdAt: now() - 172800000,
    updatedAt: now() - 172800000,
    lastUsedAt: null,
  },
  {
    id: uid(),
    title: "Code Review Checklist",
    categoryId: "cat-coding",
    tool: "Cursor",
    tags: ["coding", "review"],
    description: "Checklist for reviewing Pull Requests and code quality.",
    content: `Review the diff below as a senior engineer.\n\nCheck:\n- correctness\n- edge cases\n- naming\n- security\n- tests\n\nDiff:\n{{diff}}`,
    notes: "",
    rating: 5,
    isFavorite: true,
    isArchived: false,
    attachments: [],
    createdAt: now() - 259200000,
    updatedAt: now() - 259200000,
    lastUsedAt: now() - 259200000,
  },
  {
    id: uid(),
    title: "User Persona Template",
    categoryId: "cat-design",
    tool: "ChatGPT",
    tags: ["design", "ux"],
    description: "Template for creating detailed user personas for products.",
    content: `Create a user persona for {{product}}.\n\nInclude: name, demographics, goals, frustrations, motivations, and a representative quote.`,
    notes: "",
    rating: 4,
    isFavorite: false,
    isArchived: false,
    attachments: [],
    createdAt: now() - 345600000,
    updatedAt: now() - 345600000,
    lastUsedAt: null,
  },
];

export const usePromptStore = create<State>()(
  persist(
    (set, get) => ({
      userId: null,
      prompts: seedPrompts,
      trashedPrompts: [],
      categories: seedCategories,
      userName: "Allison",
      selectedId: null,
      search: "",
      view: "all",
      viewArg: null,
      editorOpen: false,
      editingId: null,
      variablesOpen: false,
      variablesPromptId: null,
      commandOpen: false,
      sidebarOpen: false,
      sidebarCollapsed: false,
      settingsOpen: false,
      theme: "system",
      aiProvider: "",
      aiApiKey: "",
      imageImportOpen: false,

      setUserId: (id) => set({ userId: id }),
      setSidebarOpen: (b) => set({ sidebarOpen: b }),
      setSidebarCollapsed: (b) => set({ sidebarCollapsed: b }),
      setSettingsOpen: (b) => set({ settingsOpen: b }),
      setTheme: (t) => {
        set({ theme: t });
        const { userId } = get();
        if (userId) syncUpdateProfile(userId, { theme: t });
      },

      setAIProvider: (p) => {
        set({ aiProvider: p });
        const { userId } = get();
        if (userId) syncUpdateProfile(userId, { ai_provider: p });
      },
      setAIApiKey: (k) => {
        set({ aiApiKey: k });
        const { userId } = get();
        if (userId) syncUpdateProfile(userId, { ai_api_key: k });
      },
      setImageImportOpen: (b) => set({ imageImportOpen: b }),
      _hydrateAISettings: (provider, key) =>
        set({
          aiProvider: provider as "openai" | "anthropic" | "",
          aiApiKey: key,
        }),

      setSelected: (id) => set({ selectedId: id }),
      setSearch: (s) => set({ search: s }),
      setView: (view, arg = null) => set({ view, viewArg: arg }),
      openEditor: (id = null) => set({ editorOpen: true, editingId: id }),
      closeEditor: () => set({ editorOpen: false, editingId: null }),
      openVariables: (id) => set({ variablesOpen: true, variablesPromptId: id }),
      closeVariables: () => set({ variablesOpen: false, variablesPromptId: null }),
      setCommandOpen: (b) => set({ commandOpen: b }),
      setUserName: (n) => {
        set({ userName: n });
        const { userId } = get();
        if (userId) syncUpdateProfile(userId, { user_name: n });
      },

      savePrompt: (p) => {
        const id = p.id ?? uid();
        const existing = get().prompts.find((x) => x.id === id);
        const next: Prompt = {
          id,
          title: p.title,
          content: p.content,
          description: p.description,
          categoryId: p.categoryId,
          tool: p.tool,
          tags: p.tags,
          notes: p.notes,
          rating: p.rating,
          isFavorite: p.isFavorite,
          isArchived: p.isArchived,
          attachments: p.attachments ?? existing?.attachments ?? [],
          createdAt: existing?.createdAt ?? now(),
          updatedAt: now(),
          lastUsedAt: existing?.lastUsedAt ?? null,
        };
        set({
          prompts: existing
            ? get().prompts.map((x) => (x.id === id ? next : x))
            : [next, ...get().prompts],
          selectedId: id,
        });
        const { userId } = get();
        if (userId) syncUpsertPrompt(userId, next);
        return id;
      },

      deletePrompt: (id) => {
        const prompt = get().prompts.find((x) => x.id === id);
        if (!prompt) return;
        const deletedAt = now();
        const alive = get().trashedPrompts.filter((x) => now() - x.deletedAt < TRASH_TTL_MS);
        set({
          prompts: get().prompts.filter((x) => x.id !== id),
          trashedPrompts: [{ ...prompt, deletedAt }, ...alive],
          selectedId: get().selectedId === id ? null : get().selectedId,
        });
        const { userId } = get();
        if (userId) syncMoveToTrash(userId, id, deletedAt);
      },

      restorePrompt: (id) => {
        const trashed = get().trashedPrompts.find((x) => x.id === id);
        if (!trashed) return;
        const { deletedAt: _d, ...prompt } = trashed;
        set({
          trashedPrompts: get().trashedPrompts.filter((x) => x.id !== id),
          prompts: [prompt, ...get().prompts],
          selectedId: id,
          view: "all",
        });
        const { userId } = get();
        if (userId) syncRestoreFromTrash(userId, id);
      },

      permanentlyDeletePrompt: (id) => {
        set({ trashedPrompts: get().trashedPrompts.filter((x) => x.id !== id) });
        const { userId } = get();
        if (userId) syncDeletePrompt(userId, id);
      },

      emptyTrash: () => {
        const ids = get().trashedPrompts.map((x) => x.id);
        set({ trashedPrompts: [] });
        const { userId } = get();
        if (userId) ids.forEach((id) => syncDeletePrompt(userId, id));
      },

      purgeTrashedPrompts: () =>
        set({
          trashedPrompts: get().trashedPrompts.filter((x) => now() - x.deletedAt < TRASH_TTL_MS),
        }),

      duplicatePrompt: (id) => {
        const p = get().prompts.find((x) => x.id === id);
        if (!p) return;
        const copy: Prompt = {
          ...p,
          id: uid(),
          title: p.title + " (copy)",
          createdAt: now(),
          updatedAt: now(),
          isFavorite: false,
        };
        set({ prompts: [copy, ...get().prompts], selectedId: copy.id });
        const { userId } = get();
        if (userId) syncUpsertPrompt(userId, copy);
      },

      toggleFavorite: (id) => {
        const updated = get().prompts.map((x) =>
          x.id === id ? { ...x, isFavorite: !x.isFavorite } : x,
        );
        set({ prompts: updated });
        const { userId } = get();
        if (userId) {
          const p = updated.find((x) => x.id === id);
          if (p) syncUpsertPrompt(userId, p);
        }
      },

      markUsed: (id) => {
        const updated = get().prompts.map((x) => (x.id === id ? { ...x, lastUsedAt: now() } : x));
        set({ prompts: updated });
        const { userId } = get();
        if (userId) {
          const p = updated.find((x) => x.id === id);
          if (p) syncUpsertPrompt(userId, p);
        }
      },

      addCategory: (name, color) => {
        const id = "cat-" + uid();
        const category: Category = { id, name, color };
        set({ categories: [...get().categories, category] });
        const { userId } = get();
        if (userId) syncUpsertCategory(userId, category);
        return id;
      },

      renameCategory: (id, name) => {
        const updated = get().categories.map((c) => (c.id === id ? { ...c, name } : c));
        set({ categories: updated });
        const { userId } = get();
        if (userId) {
          const c = updated.find((x) => x.id === id);
          if (c) syncUpsertCategory(userId, c);
        }
      },

      setCategoryColor: (id, color) => {
        const updated = get().categories.map((c) => (c.id === id ? { ...c, color } : c));
        set({ categories: updated });
        const { userId } = get();
        if (userId) {
          const c = updated.find((x) => x.id === id);
          if (c) syncUpsertCategory(userId, c);
        }
      },

      deleteCategory: (id) => {
        set({ categories: get().categories.filter((c) => c.id !== id) });
        const { userId } = get();
        if (userId) syncDeleteCategory(userId, id);
      },

      replaceAll: (data) =>
        set({
          prompts: data.prompts,
          trashedPrompts: data.trashedPrompts ?? get().trashedPrompts,
          categories: data.categories,
          userName: data.userName ?? get().userName,
          theme: data.theme ?? get().theme,
          selectedId: null,
        }),

      _realtimePromptUpsert: (prompt) => {
        const { prompts, trashedPrompts } = get();
        const inActive = prompts.find((x) => x.id === prompt.id);
        const inTrash = trashedPrompts.find((x) => x.id === prompt.id);
        if (inActive) {
          set({ prompts: prompts.map((x) => (x.id === prompt.id ? prompt : x)) });
        } else if (inTrash) {
          set({
            trashedPrompts: trashedPrompts.filter((x) => x.id !== prompt.id),
            prompts: [prompt, ...prompts],
          });
        } else {
          set({ prompts: [prompt, ...prompts] });
        }
      },

      _realtimePromptTrash: (id, deletedAt) => {
        const { prompts, trashedPrompts, selectedId } = get();
        const inActive = prompts.find((x) => x.id === id);
        const inTrash = trashedPrompts.find((x) => x.id === id);
        if (inActive) {
          set({
            prompts: prompts.filter((x) => x.id !== id),
            trashedPrompts: [
              { ...inActive, deletedAt },
              ...trashedPrompts.filter((x) => x.id !== id),
            ],
            selectedId: selectedId === id ? null : selectedId,
          });
        } else if (inTrash) {
          // Já está na lixeira — só atualiza deletedAt caso seja diferente
          set({
            trashedPrompts: trashedPrompts.map((x) => (x.id === id ? { ...x, deletedAt } : x)),
          });
        }
      },

      _realtimePromptDelete: (id) => {
        const { prompts, trashedPrompts, selectedId } = get();
        set({
          prompts: prompts.filter((x) => x.id !== id),
          trashedPrompts: trashedPrompts.filter((x) => x.id !== id),
          selectedId: selectedId === id ? null : selectedId,
        });
      },

      _realtimeCategoryUpsert: (cat) => {
        const { categories } = get();
        const exists = categories.find((c) => c.id === cat.id);
        set({
          categories: exists
            ? categories.map((c) => (c.id === cat.id ? cat : c))
            : [...categories, cat],
        });
      },

      _realtimeCategoryDelete: (id) =>
        set({ categories: get().categories.filter((c) => c.id !== id) }),

      _realtimeProfileUpdate: (update) => {
        if (update.user_name !== undefined) set({ userName: update.user_name });
        if (update.theme !== undefined) set({ theme: update.theme });
        if (update.ai_provider !== undefined)
          set({ aiProvider: update.ai_provider as "openai" | "anthropic" | "" });
        if (update.ai_api_key !== undefined) set({ aiApiKey: update.ai_api_key });
      },
    }),
    {
      name: "promptlibrary-v1",
      partialize: (s) => ({
        prompts: s.prompts.map(stripPromptAttachmentData),
        trashedPrompts: s.trashedPrompts.map((prompt) => ({
          ...stripPromptAttachmentData(prompt),
          deletedAt: prompt.deletedAt,
        })),
        categories: s.categories,
        userName: s.userName,
        theme: s.theme,
        aiProvider: s.aiProvider,
        aiApiKey: s.aiApiKey,
      }),
    },
  ),
);

export const TAG_COLORS = ["amber", "lavender", "sky", "mint", "rose"] as const;
export function tagColor(tag: string): (typeof TAG_COLORS)[number] {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_COLORS[h % TAG_COLORS.length];
}

export function extractVariables(content: string): string[] {
  const set = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let m;
  while ((m = re.exec(content))) set.add(m[1]);
  return Array.from(set);
}

export function fillVariables(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => values[k] ?? `{{${k}}}`);
}

export function timeAgo(ts: number | null): string {
  if (!ts) return "never";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
