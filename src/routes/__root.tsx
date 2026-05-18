import { useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AuthScreen } from "@/components/app/AuthScreen";
import { usePromptStore } from "@/lib/promptStore";
import { loadUserData, pushAllToSupabase } from "@/lib/sync";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Pagina nao encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A pagina que voce tentou abrir nao existe mais ou mudou de endereco.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar para a biblioteca
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Nao foi possivel carregar esta pagina
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo saiu do esperado por aqui. Tente recarregar ou volte para a biblioteca.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar para a biblioteca
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function AppGate() {
  const { user, loading } = useAuth();
  const { replaceAll, setUserId, prompts, trashedPrompts, categories, userName, theme } =
    usePromptStore();
  const synced = useRef(false);

  useRealtimeSync(user?.id ?? null);

  useEffect(() => {
    if (!user || synced.current) return;
    synced.current = true;

    setUserId(user.id);

    loadUserData(user.id).then(
      ({ prompts: cloud, trashedPrompts: cloudTrashed, categories: cloudCats, profile }) => {
        const hasCloudData = cloud.length > 0 || cloudCats.length > 0;

        if (hasCloudData) {
          // Cloud has data — use it as source of truth
          replaceAll({
            prompts: cloud,
            trashedPrompts: cloudTrashed,
            categories: cloudCats,
            userName: profile?.user_name,
            theme: profile?.theme,
          });
        } else {
          // First login — push local data to cloud
          pushAllToSupabase(user.id, prompts, trashedPrompts, categories, userName, theme);
        }
      },
    );
  }, [user, setUserId, replaceAll, prompts, trashedPrompts, categories, userName, theme]);

  // Reset sync flag on logout
  useEffect(() => {
    if (!user) {
      synced.current = false;
      setUserId(null);
    }
  }, [user, setUserId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return <Outlet />;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </QueryClientProvider>
  );
}
