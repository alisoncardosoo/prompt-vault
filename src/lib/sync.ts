import { supabase } from "./supabase";
import type { Prompt, Category, TrashedPrompt } from "./promptStore";

// ─── DB row shapes ────────────────────────────────────────────────────────────

export type DbPrompt = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  description: string;
  category_id: string | null;
  tool: string;
  tags: string[];
  notes: string;
  rating: number;
  is_favorite: boolean;
  is_archived: boolean;
  attachments: Prompt["attachments"];
  created_at: number;
  updated_at: number;
  last_used_at: number | null;
  deleted_at: number | null;
};

type DbCategory = {
  id: string;
  user_id: string;
  name: string;
  color: Category["color"];
};

type DbProfile = {
  id: string;
  user_name: string;
  theme: "light" | "dark" | "system";
  ai_provider: string;
  ai_api_key: string;
};

function stripAttachmentPayload(
  attachments: Prompt["attachments"] | undefined,
): Prompt["attachments"] {
  if (!attachments || attachments.length === 0) return [];
  return attachments.map(({ id, name, size, type, path, url }) => ({
    id,
    name,
    size,
    type,
    path,
    url,
  }));
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function dbToPrompt(row: DbPrompt): Prompt {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    description: row.description,
    categoryId: row.category_id ?? "",
    tool: row.tool,
    tags: row.tags ?? [],
    notes: row.notes,
    rating: row.rating,
    isFavorite: row.is_favorite,
    isArchived: row.is_archived,
    attachments: stripAttachmentPayload(row.attachments ?? []),
    // Supabase Realtime envia bigint como string via WebSocket — coerce para número
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    lastUsedAt: row.last_used_at != null ? Number(row.last_used_at) : null,
  };
}

export function dbToTrashed(row: DbPrompt): TrashedPrompt {
  return { ...dbToPrompt(row), deletedAt: row.deleted_at! };
}

function promptToDb(userId: string, p: Prompt): DbPrompt {
  return {
    id: p.id,
    user_id: userId,
    title: p.title,
    content: p.content,
    description: p.description,
    category_id: p.categoryId || null,
    tool: p.tool,
    tags: p.tags,
    notes: p.notes,
    rating: p.rating,
    is_favorite: p.isFavorite,
    is_archived: p.isArchived,
    attachments: stripAttachmentPayload(p.attachments),
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    last_used_at: p.lastUsedAt,
    deleted_at: null,
  };
}

// ─── Load all user data from Supabase ─────────────────────────────────────────

export async function loadUserData(userId: string) {
  const [promptsRes, categoriesRes, profileRes] = await Promise.all([
    supabase.from("prompts").select("*").eq("user_id", userId),
    supabase.from("categories").select("*").eq("user_id", userId),
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
  ]);

  const rows: DbPrompt[] = promptsRes.data ?? [];
  const prompts = rows.filter((r) => r.deleted_at === null).map(dbToPrompt);
  const trashedPrompts = rows.filter((r) => r.deleted_at !== null).map(dbToTrashed);
  const categories: Category[] = (categoriesRes.data ?? []).map((r: DbCategory) => ({
    id: r.id,
    name: r.name,
    color: r.color,
  }));
  const profile = profileRes.data as DbProfile | null;

  return { prompts, trashedPrompts, categories, profile };
}

// ─── Push local data to Supabase (first login / migration) ───────────────────

export async function pushAllToSupabase(
  userId: string,
  prompts: Prompt[],
  trashedPrompts: TrashedPrompt[],
  categories: Category[],
  userName: string,
  theme: "light" | "dark" | "system",
) {
  const dbPrompts = [
    ...prompts.map((p) => promptToDb(userId, p)),
    ...trashedPrompts.map((p) => {
      const { deletedAt, ...prompt } = p;
      return { ...promptToDb(userId, prompt), deleted_at: deletedAt };
    }),
  ];

  const dbCategories = categories.map((c) => ({
    id: c.id,
    user_id: userId,
    name: c.name,
    color: c.color,
  }));

  await Promise.all([
    dbPrompts.length > 0
      ? supabase.from("prompts").upsert(dbPrompts, { onConflict: "id" })
      : Promise.resolve(),
    dbCategories.length > 0
      ? supabase.from("categories").upsert(dbCategories, { onConflict: "id" })
      : Promise.resolve(),
    supabase
      .from("profiles")
      .upsert({ id: userId, user_name: userName, theme }, { onConflict: "id" }),
  ]);
}

// ─── Individual sync operations (fire-and-forget) ────────────────────────────

export function syncUpsertPrompt(userId: string, prompt: Prompt) {
  supabase.from("prompts").upsert(promptToDb(userId, prompt), { onConflict: "id" }).then();
}

export function syncMoveToTrash(userId: string, promptId: string, deletedAt: number) {
  supabase
    .from("prompts")
    .update({ deleted_at: deletedAt })
    .eq("id", promptId)
    .eq("user_id", userId)
    .then();
}

export function syncRestoreFromTrash(userId: string, promptId: string) {
  supabase
    .from("prompts")
    .update({ deleted_at: null })
    .eq("id", promptId)
    .eq("user_id", userId)
    .then();
}

export function syncDeletePrompt(userId: string, promptId: string) {
  supabase.from("prompts").delete().eq("id", promptId).eq("user_id", userId).then();
}

export function syncUpsertCategory(userId: string, category: Category) {
  supabase
    .from("categories")
    .upsert(
      { id: category.id, user_id: userId, name: category.name, color: category.color },
      { onConflict: "id" },
    )
    .then();
}

export function syncDeleteCategory(userId: string, categoryId: string) {
  supabase.from("categories").delete().eq("id", categoryId).eq("user_id", userId).then();
}

export function syncUpdateProfile(
  userId: string,
  update: Partial<{
    user_name: string;
    theme: "light" | "dark" | "system";
    ai_provider: string;
    ai_api_key: string;
  }>,
) {
  supabase.from("profiles").update(update).eq("id", userId).then();
}
