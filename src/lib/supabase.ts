import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key || url === "undefined") {
  console.error(
    "[Prompt Vault] Variáveis de ambiente Supabase não encontradas.\n" + "VITE_SUPABASE_URL:",
    url,
    "\n" + "VITE_SUPABASE_ANON_KEY:",
    key ? "(definida)" : "(indefinida)",
  );
}

export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  key || "placeholder",
);
export const supabaseConfigured = Boolean(url && key && url !== "undefined");
