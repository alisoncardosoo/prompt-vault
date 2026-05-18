import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon, Monitor, Download, Upload, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePromptStore } from "@/lib/promptStore";

export function SettingsModal() {
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
  } = usePromptStore();

  const [nameInput, setNameInput] = useState(userName);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settingsOpen) setNameInput(userName);
  }, [settingsOpen, userName]);

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
    a.download = `promptlibrary-${new Date().toISOString().slice(0, 10)}.json`;
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
