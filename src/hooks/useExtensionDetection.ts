import { useState, useCallback, useSyncExternalStore } from "react";

/**
 * Hook que detecta se a extensão Organic está instalada no navegador.
 *
 * A extensão injeta `data-organic-ext="true"` no <html> via content script (detect-marker.js).
 *
 * Usa um store singleton para evitar timers duplicados quando múltiplos
 * componentes (Banner + Badge) consomem o hook simultaneamente.
 *
 * Inclui MutationObserver para detectar a extensão em tempo real
 * (ex: se o usuário instala enquanto a página está aberta).
 */

// ─── Singleton Store ───────────────────────────────────────────────

type ExtState = {
  detected: boolean | null; // null = verificando
  version: string | null;
};

let state: ExtState = { detected: null, version: null };
const listeners = new Set<() => void>();
let initialized = false;

function emit() {
  listeners.forEach((l) => l());
}

function setState(partial: Partial<ExtState>) {
  state = { ...state, ...partial };
  emit();
}

function checkExtension(): boolean {
  if (document.documentElement.getAttribute("data-organic-ext") === "true") {
    return true;
  }
  if ((window as any).__ORGANIC_EXT_INSTALLED__) {
    return true;
  }
  return false;
}

function markDetected() {
  setState({
    detected: true,
    version: (window as any).__ORGANIC_EXT_VERSION__ || null,
  });
}

function initDetection() {
  if (initialized) return;
  initialized = true;

  // 1) Verificação imediata
  if (checkExtension()) {
    markDetected();
    return;
  }

  // 2) Retentativas com delays progressivos (content script pode demorar)
  const delays = [200, 500, 1500, 3000];
  const timeouts: ReturnType<typeof setTimeout>[] = [];

  delays.forEach((delay) => {
    timeouts.push(
      setTimeout(() => {
        if (state.detected === true) return;
        if (checkExtension()) {
          markDetected();
          timeouts.forEach(clearTimeout);
        }
      }, delay)
    );
  });

  // 3) Após último delay, marca como não detectada
  timeouts.push(
    setTimeout(() => {
      if (state.detected === null) {
        setState({ detected: false });
      }
    }, 3500)
  );

  // 4) MutationObserver — detecta se a extensão é instalada depois que a página carregou
  const observer = new MutationObserver(() => {
    if (state.detected === true) return;
    if (checkExtension()) {
      markDetected();
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-organic-ext"],
  });
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  initDetection();
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return state;
}

// ─── Hook público ──────────────────────────────────────────────────

export function useExtensionDetection() {
  const snap = useSyncExternalStore(subscribe, getSnapshot);

  const [dismissed, setDismissed] = useState(() => {
    try {
      const stored = localStorage.getItem("organic-ext-banner-dismissed");
      if (!stored) return false;
      const dismissedAt = Number(stored);
      return Date.now() - dismissedAt < 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  });

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem("organic-ext-banner-dismissed", String(Date.now()));
    } catch {}
  }, []);

  return {
    /** null = verificando, true = instalada, false = não encontrada */
    extensionDetected: snap.detected,
    /** Versão da extensão (se detectada) */
    extensionVersion: snap.version,
    /** Se o banner foi dispensado pelo usuário */
    dismissed,
    /** Dispensa o banner por 24h */
    dismiss,
    /** Se deve mostrar o banner */
    showBanner: snap.detected === false && !dismissed,
  };
}
