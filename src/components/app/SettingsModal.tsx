import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Bot,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePromptStore } from "@/lib/promptStore";
import { useAuth } from "@/lib/auth";

export function SettingsModal() {
  const { updatePassword } = useAuth();
  const {
    settingsOpen,
    setSettingsOpen,
    userName,
    setUserName,
    theme,
    setTheme,
    prompts,
    categories,
    trashedPrompts,
    emptyTrash,
    replaceAll,
    aiProvider,
    setAIProvider,
    aiApiKey,
    setAIApiKey,
  } = usePromptStore();

  const [nameInput, setNameInput] = useState(userName);
  const [keyInput, setKeyInput] = useState(aiApiKey);
  const [showKey, setShowKey] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settingsOpen) {
      setNameInput(userName);
      setKeyInput(aiApiKey);
      setShowKey(false);
      setNewPassword("");
      setConfirmPassword("");
      setSavingPassword(false);
    }
  }, [settingsOpen, userName, aiApiKey]);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      setUserName(trimmed);
      toast.success("Nome atualizado");
    }
  };

  const handleExport = () => {
    const s = usePromptStore.getState();
    const data = {
      prompts: s.prompts,
      categories: s.categories,
      userName: s.userName,
      exportedAt: Date.now(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-vault-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exportado");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.prompts || !data.categories) throw new Error("invalid");
        replaceAll(data);
        toast.success("Biblioteca importada com sucesso");
        setSettingsOpen(false);
      } catch {
        toast.error("Arquivo inválido");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleEmptyTrash = () => {
    emptyTrash();
    toast.success("Lixeira esvaziada");
  };

  const handleResetAll = () => {
    if (!confirm("Apagar todos os dados? Esta ação não pode ser desfeita.")) return;
    localStorage.removeItem("promptlibrary-v1");
    window.location.reload();
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }

    setSavingPassword(true);
    const err = await updatePassword(newPassword);
    setSavingPassword(false);

    if (err) {
      toast.error(err);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    toast.success("Senha atualizada com sucesso.");
  };

  const themeOptions = [
    { value: "light" as const, icon: Sun, label: "Claro" },
    { value: "dark" as const, icon: Moon, label: "Escuro" },
    { value: "system" as const, icon: Monitor, label: "Sistema" },
  ];

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Perfil */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Perfil
            </h3>
            <div className="space-y-1.5">
              <Label htmlFor="settings-name">Nome de exibição</Label>
              <div className="flex gap-2">
                <Input
                  id="settings-name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  placeholder="Seu nome"
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleSaveName}>
                  Salvar
                </Button>
              </div>
            </div>
          </section>

          <Separator />

          {/* Aparência */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Aparência
            </h3>
            <div className="flex gap-2">
              {themeOptions.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg border text-sm transition-colors",
                    theme === value
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </section>

          <Separator />

          {/* Segurança */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Segurança
            </h3>
            <div className="space-y-1.5">
              <Label htmlFor="settings-new-password">Nova senha</Label>
              <Input
                id="settings-new-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-confirm-password">Confirmar nova senha</Label>
              <Input
                id="settings-confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button
              variant="outline"
              className="w-full"
              disabled={savingPassword}
              onClick={handleChangePassword}
            >
              {savingPassword ? "Salvando..." : "Trocar senha"}
            </Button>
          </section>

          <Separator />

          {/* Backup */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Backup & Dados
            </h3>
            <p className="text-xs text-muted-foreground">
              Os dados são salvos localmente no navegador. Exporte regularmente para não perder
              nada.
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleExport}
              >
                <Download className="size-4" />
                Exportar backup (JSON)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-4" />
                Importar backup
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </div>
          </section>

          <Separator />

          {/* Biblioteca */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Biblioteca
            </h3>
            <div className="bg-muted rounded-lg p-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prompts</span>
                <span className="font-medium">{prompts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pastas</span>
                <span className="font-medium">{categories.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Na lixeira</span>
                <span className="font-medium">{trashedPrompts.length}</span>
              </div>
            </div>
            {trashedPrompts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive border-destructive/30"
                onClick={handleEmptyTrash}
              >
                <Trash2 className="size-3.5" />
                Esvaziar lixeira ({trashedPrompts.length})
              </Button>
            )}
          </section>

          <Separator />

          {/* Integração IA */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Integração IA
            </h3>
            <p className="text-xs text-muted-foreground">
              Usada para analisar screenshots e extrair prompts automaticamente.
            </p>

            <div className="space-y-1.5">
              <Label>Provedor</Label>
              <div className="flex gap-2">
                {(["openai", "anthropic"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setAIProvider(p)}
                    className={cn(
                      "flex-1 py-2 rounded-lg border text-sm transition-colors",
                      aiProvider === p
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {p === "openai" ? "OpenAI (GPT-4o)" : "Anthropic (Claude)"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="settings-apikey">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="settings-apikey"
                    type={showKey ? "text" : "password"}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setAIApiKey(keyInput.trim());
                        toast.success("API key salva");
                      }
                    }}
                    placeholder={aiProvider === "openai" ? "sk-..." : "sk-ant-..."}
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAIApiKey(keyInput.trim());
                    toast.success("API key salva");
                  }}
                >
                  Salvar
                </Button>
              </div>
            </div>

            {aiApiKey && aiProvider && (
              <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                <Bot className="size-3.5" />
                {aiProvider === "openai" ? "GPT-4o" : "Claude"} configurado
              </p>
            )}
          </section>

          <Separator />

          {/* Zona de risco */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-destructive">
              Zona de risco
            </h3>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleResetAll}
            >
              <AlertTriangle className="size-4" />
              Apagar todos os dados
            </Button>
            <p className="text-xs text-muted-foreground">
              Remove todos os prompts, pastas e configurações. Não pode ser desfeito.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
