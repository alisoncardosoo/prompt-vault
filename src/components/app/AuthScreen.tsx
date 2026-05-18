import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase";

type Mode = "signin" | "signup";

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const err = mode === "signin" ? await signIn(email, password) : await signUp(email, password);

    setLoading(false);

    if (err) {
      setError(translateError(err));
    } else if (mode === "signup") {
      setDone(true);
    }
  };

  if (!supabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center">
          <h1 className="text-base font-semibold text-destructive">Configuração incompleta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            As variáveis <code className="font-mono text-xs">VITE_SUPABASE_URL</code> e{" "}
            <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> não estão definidas
            neste deploy.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Adicione-as em <strong>Vercel → Settings → Environment Variables</strong> e faça um novo
            deploy.
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 flex justify-center">
            <img src="/icon-192.png" alt="PromptLibrary" className="size-16 rounded-2xl" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Verifique seu email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enviamos um link de confirmação para <strong>{email}</strong>. Clique nele para ativar
            sua conta.
          </p>
          <button
            onClick={() => {
              setDone(false);
              setMode("signin");
            }}
            className="mt-6 text-sm text-primary hover:underline"
          >
            Voltar para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <img src="/icon-192.png" alt="PromptLibrary" className="size-16 rounded-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">PromptLibrary</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin" ? "Entre na sua conta" : "Crie sua conta"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Aguarde…" : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              Não tem conta?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className="text-primary hover:underline"
              >
                Criar agora
              </button>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <button
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className="text-primary hover:underline"
              >
                Entrar
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Email ou senha incorretos.";
  if (msg.includes("Email not confirmed")) return "Confirme seu email antes de entrar.";
  if (msg.includes("User already registered")) return "Este email já está cadastrado.";
  if (msg.includes("Password should be")) return "A senha deve ter pelo menos 6 caracteres.";
  if (
    msg.includes("Load failed") ||
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError")
  )
    return "Erro de conexão. Verifique sua internet ou se o servidor dev foi reiniciado após criar o .env.local.";
  return msg;
}
