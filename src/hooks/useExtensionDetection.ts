import { useState, useCallback, useSyncExternalStore } from "react";

/**
 * Hook que detecta se a extensão Organic está instalada no navegador.
 *
 * Estratégia de detecção em camadas:
 * 1. Sinais DOM (data-organic-ext, window.__ORGANIC_EXT_INSTALLED__, etc.)
 * 2. Atributos no <html> que contenham "organic"
 * 3. window.postMessage da extensão
 * 4. visibilitychange para re-checar quando usuário volta à aba
 *
 * Nota: A detecção via Supabase (bot_online + last_heartbeat) é feita
 * diretamente nos componentes via useBotStatus, pois requer contexto de auth.
 */

// ─── Singleton Store ───────────────────────────────────────────────

type ExtState = {
  detected: boolean | null; // null = verificando
  version: string | null;
};

let state: ExtState = { detected: null, version: null };
const listeners = new Set<() => void>();
let initialized = false;
let timeoutIds: ReturnType<typeof setTimeout>[] = [];

function emit() {
  listeners.forEach((l) => l());
}

function setState(partial: Partial<ExtState>) {
  state = { ...state, ...partial };
  emit();
}

function checkExtension(): boolean {
  const win = window as any;
  const html = document.documentElement;

  // 1. Atributo canônico
  if (html.getAttribute("data-organic-ext") === "true") return true;

  // 2. Variáveis globais conhecidas
  if (win.__ORGANIC_EXT_INSTALLED__) return true;
  if (win.__ORGANIC_EXT_VERSION__) return true;
  if (win.__ORGANIC__) return true;
  if (win.__ORGANIC_BRIDGE__) return true;

  // 3. Qualquer atributo no <html> que contenha "organic"
  for (const attr of Array.from(html.attributes)) {
    if (attr.name.includes("organic") || attr.value.includes("organic-ext")) {
      return true;
    }
  }

  return false;
}

function getVersion(): string | null {
  const win = window as any;
  return (
    win.__ORGANIC_EXT_VERSION__ ||
    win.__ORGANIC__?.version ||
    null
  );
}

function markDetected() {
  clearAllTimeouts();
  setState({ detected: true, version: getVersion() });
}

function clearAllTimeouts() {
  timeoutIds.forEach(clearTimeout);
  timeoutIds = [];
}

function resetSingleton() {
  initialized = false;
  state = { detected: null, version: null };
  clearAllTimeouts();
}

function initDetection() {
  if (initialized) return;
  initialized = true;

  // 1) Verificação imediata
  if (checkExtension()) {
    markDetected();
    return;
  }

  // 2) Retentativas com delays progressivos
  const delays = [100, 300, 800, 1500, 3000];

  delays.forEach((delay) => {
    timeoutIds.push(
      setTimeout(() => {
        if (state.detected === true) return;
        if (checkExtension()) markDetected();
      }, delay)
    );
  });

  // 3) Após último delay, marca como não detectada (via DOM)
  timeoutIds.push(
    setTimeout(() => {
      if (state.detected === null) {
        setState({ detected: false });
      }
    }, 3500)
  );

  // 4) MutationObserver — detecta injeção de atributo em tempo real
  const observer = new MutationObserver(() => {
    if (state.detected === true) return;
    if (checkExtension()) markDetected();
  });

  observer.observe(document.documentElement, {
    attributes: true,
  });

  // 5) postMessage — extensão pode avisar via mensagem
  function onMessage(event: MessageEvent) {
    if (state.detected === true) return;
    const data = event.data;
    if (!data || typeof data !== "object") return;
    if (
      data.type === "ORGANIC_EXT_READY" ||
      data.source === "organic-extension" ||
      data.organicExt === true
    ) {
      markDetected();
    }
  }
  window.addEventListener("message", onMessage);

  // 6) visibilitychange — re-checar quando usuário volta à aba
  function onVisibility() {
    if (document.visibilityState !== "visible") return;
    if (state.detected === true) return;
    if (checkExtension()) markDetected();
  }
  document.addEventListener("visibilitychange", onVisibility);
}

// Reset em HMR para evitar singleton congelado em desenvolvimento
if (typeof window !== "undefined" && (import.meta as any).hot) {
  (import.meta as any).hot.dispose(() => {
    resetSingleton();
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
    /** null = verificando, true = instalada (DOM), false = não encontrada via DOM */
    extensionDetected: snap.detected,
    /** Versão da extensão (se detectada) */
    extensionVersion: snap.version,
    /** Se o banner foi dispensado pelo usuário */
    dismissed,
    /** Dispensa o banner por 24h */
    dismiss,
    /** Se deve mostrar o banner (apenas DOM — componente combina com Supabase) */
    showBanner: snap.detected === false && !dismissed,
  };
}
