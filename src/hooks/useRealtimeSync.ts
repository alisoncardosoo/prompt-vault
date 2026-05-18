import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { usePromptStore } from "@/lib/promptStore";
import { dbToPrompt, type DbPrompt } from "@/lib/sync";
import type { Category } from "@/lib/promptStore";

export function useRealtimeSync(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`realtime:user:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prompts", filter: `user_id=eq.${userId}` },
        (payload) => {
          const store = usePromptStore.getState();
          if (payload.eventType === "DELETE") {
            store._realtimePromptDelete((payload.old as { id: string }).id);
          } else {
            const row = payload.new as DbPrompt;
            if (row.deleted_at !== null) {
              store._realtimePromptTrash(row.id, row.deleted_at!);
            } else {
              store._realtimePromptUpsert(dbToPrompt(row));
            }
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories", filter: `user_id=eq.${userId}` },
        (payload) => {
          const store = usePromptStore.getState();
          if (payload.eventType === "DELETE") {
            store._realtimeCategoryDelete((payload.old as { id: string }).id);
          } else {
            const row = payload.new as { id: string; name: string; color: Category["color"] };
            store._realtimeCategoryUpsert({ id: row.id, name: row.name, color: row.color });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload) => {
          const row = payload.new as { user_name?: string; theme?: "light" | "dark" | "system" };
          usePromptStore.getState()._realtimeProfileUpdate(row);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
