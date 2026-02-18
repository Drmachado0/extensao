
# Correção: Detecção da Extensão Organic

## Diagnóstico do Problema

A extensão está instalada e funcionando (screenshot confirma: "Conectado", "Ativo", "Sincronizando", Latência 1ms). O problema está em **como o webapp detecta a extensão**.

### Causa Raiz

O `useExtensionDetection.ts` verifica apenas duas coisas no DOM:
1. `document.documentElement.getAttribute("data-organic-ext") === "true"`
2. `window.__ORGANIC_EXT_INSTALLED__`

Mas a extensão está operando em modo **"Integração Direta (sem Bridge)"** — o que indica que ela se comunica **diretamente com o Supabase** (via `ig_accounts.last_heartbeat` e `ig_accounts.bot_online`), e provavelmente **não injeta** esses marcadores DOM nessa versão.

### Bug Secundário: Singleton Congelado

O singleton `initialized = true` nunca reseta. Se a página carregou antes da extensão terminar de inicializar (ou após um HMR/hot-reload), o estado fica preso em `detected: false` para sempre — mesmo que a extensão esteja ativa.

---

## Solução

### Estratégia 1: Detectar via Supabase (Principal)

Como a extensão já reporta heartbeat via `ig_accounts.last_heartbeat` e `bot_online = true`, podemos **usar `useBotStatus`** como fonte de verdade para a "extensão estar ativa". Se o bot está online (heartbeat recente), a extensão está conectada.

### Estratégia 2: Ampliar sinais DOM detectados

Verificar mais atributos que a extensão pode injetar além de `data-organic-ext`:
- `window.__ORGANIC_EXT_VERSION__`
- `window.__ORGANIC__`  
- Qualquer atributo no `<html>` com "organic"

### Estratégia 3: Corrigir singleton e adicionar reset

Adicionar `window.__ORGANIC_RESET_DETECTION__` e permitir re-checagem após reload do HMR. Usar `visibilitychange` para re-checar quando o usuário volta à aba.

---

## Implementação

### 1. Refatorar `useExtensionDetection.ts`

**Expandir `checkExtension()`** para cobrir mais sinais:
```
- data-organic-ext="true" no <html>
- window.__ORGANIC_EXT_INSTALLED__
- window.__ORGANIC_EXT_VERSION__ (qualquer versão)
- window.__ORGANIC__ (variável genérica)
- Qualquer atributo do <html> que contenha "organic"
```

**Corrigir o singleton** para resetar quando há HMR (verificar `import.meta.hot`).

**Adicionar event listener `visibilitychange`** — quando o usuário volta à aba após instalar a extensão, re-checar.

**Adicionar `message` event listener** — extensões Chrome podem usar `window.postMessage` para se comunicar com a página de forma mais confiável do que manipulação do DOM.

### 2. Integrar `useBotStatus` no `useExtensionDetection`

Criar novo hook `useExtensionStatus` que combina:
- Detecção DOM (extensão instalada localmente)
- Status do banco via `ig_accounts.bot_online + last_heartbeat` (extensão conectada ao Supabase)

O `ExtensionStatusBadge` e `ExtensionBanner` passam a usar a fonte de verdade **do banco** — se o bot reportou heartbeat nos últimos 5 minutos, a extensão está ativa e funcionando.

### 3. Atualizar `ExtensionBanner` e `ExtensionStatusBadge`

O banner **não deve aparecer** se o bot está online via Supabase (extensão conectada via integração direta).

O badge deve mostrar:
- **"Extensão ativa"** (verde) — se `bot_online = true` E heartbeat < 5 min
- **"Instalar extensão"** (âmbar) — se nenhum sinal detectado E sem heartbeat

---

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/hooks/useExtensionDetection.ts` | Ampliar detecção DOM + reset singleton + visibilitychange + postMessage |
| `src/components/ExtensionBanner.tsx` | Integrar `useBotStatus` — não mostrar banner se bot online via Supabase |

---

## Resultado Esperado

- Extensão instalada em modo "Integração Direta" → badge mostra **"Extensão ativa"** em verde
- Banner de instalação **não aparece** quando a extensão está conectada
- Se a extensão for desinstalada e o bot ficar offline por >5 min → banner volta a aparecer automaticamente
