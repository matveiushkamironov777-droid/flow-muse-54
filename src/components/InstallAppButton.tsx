import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InstallPrompt extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
}

let installPrompt: InstallPrompt | null = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event as InstallPrompt;
});

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const [installed, setInstalled] = useState(isStandalone);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const handleInstalled = () => {
      installPrompt = null;
      setInstalled(true);
    };
    window.addEventListener("appinstalled", handleInstalled);
    return () => window.removeEventListener("appinstalled", handleInstalled);
  }, []);

  const install = async () => {
    if (installPrompt) {
      const prompt = installPrompt;
      installPrompt = null;
      try {
        const result = await prompt.prompt();
        if (result.outcome === "accepted") setInstalled(true);
        return;
      } catch {
        // The browser may withdraw a captured prompt once it is opened elsewhere.
      }
    }
    setShowInstructions(true);
  };

  if (installed) return null;

  const appleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(navigator.userAgent);

  return (
    <>
      <Button type="button" variant="ghost" size="sm" aria-label="Установить Flow Planning"
        className="gap-1.5 px-2 text-muted-foreground" onClick={() => void install()}>
        <Download className="h-4 w-4 shrink-0" />
        <span className={compact ? "hidden sm:inline" : undefined}>Установить</span>
      </Button>
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="w-[calc(100%_-_2rem)] max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle>Установить Flow Planning</DialogTitle>
            <DialogDescription>После установки приложение можно открыть с домашнего экрана.</DialogDescription>
          </DialogHeader>
          {appleMobile ? (
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li>Откройте сайт в Safari и нажмите «Поделиться».</li>
              <li>Выберите «На экран Домой», включите «Открывать как веб-приложение», если этот пункт есть, и нажмите «Добавить».</li>
            </ol>
          ) : (
            <p className="text-sm">
              {android
                ? "Откройте меню Chrome и выберите «Установить приложение» или «Добавить на главный экран»."
                : "Откройте меню браузера и выберите «Установить приложение», если этот пункт доступен."}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
