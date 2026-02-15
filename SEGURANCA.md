# Segurança e privacidade — Organic (Fase 3)

Documento de referência para chaves, armazenamento e boas práticas.

---

## 1. Chaves Supabase

### Regra

- **No front (extensão):** usa-se **apenas a chave anon** do Supabase.
- **Nunca** colocar no código (popup, content script, background) a chave **service_role** ou qualquer chave com permissões elevadas.

### Onde está a chave

- `lovable-config.js` — `SUPABASE_KEY` (anon)
- `backgroundscript.js` — refresh de token no service worker (mesma anon key)
- `lovable-popup.js` e `lovable-supabase.js` — usam `LovableConfig.SUPABASE_KEY`

O payload do JWT da chave usada contém `"role":"anon"`. Isso garante que todas as operações passem pelas políticas do Supabase.

### RLS (Row Level Security)

No **painel do Supabase** (supabase.com → projeto):

1. Em cada tabela usada pela extensão (`ig_accounts`, `target_queue`, `bot_commands`, etc.), **ative RLS**.
2. Crie políticas que restrinjam:
   - **SELECT/UPDATE/DELETE** aos registros do próprio usuário (ex.: `auth.uid() = user_id` ou `ig_account_id` vinculado ao usuário).
   - **INSERT** apenas com dados coerentes ao usuário autenticado.

Assim, mesmo que a anon key vaze, um atacante só acessa o que as políticas permitirem (em geral só os dados do próprio usuário após login).

---

## 2. Armazenamento local e logs

### O que fica no navegador

- **chrome.storage.local:** tokens de login (Supabase), filas, contadores, limites de segurança, configurações, último log da extensão (`organicLog`).
- O log é **limitado** (últimos ~8.000 caracteres) e gravado com debounce para não sobrecarregar o storage.

### Política

- **Não enviar** `organicLog` nem filas completas para terceiros (servidores externos, analytics, suporte) **sem consentimento explícito** do usuário.
- O envio ao **Supabase/Lovable** é feito após **login** do usuário e contém apenas dados necessários ao funcionamento (contas IG vinculadas, fila de alvo, comandos, configurações). Esses dados ficam sob as políticas e RLS do seu projeto Supabase.
- Para **suporte**: se o usuário quiser enviar o log (ex.: por e-mail), ele pode copiá-lo manualmente; a extensão não envia o log automaticamente para ninguém.

---

## 3. Checklist rápido (revisão de código)

- [ ] Nenhum arquivo da extensão contém `service_role` nem chave com role diferente de `anon`.
- [ ] Novos endpoints ou tabelas no Supabase têm RLS ativo e políticas restritivas.
- [ ] Nenhum novo envio de log ou fila completa para domínios externos sem consentimento.

---

## 4. Tratamento de erros (Fase 4)

- **Popup → content script:** O popup usa o helper `sendMessageSafe(tabId, message)`, que retorna uma Promise e rejeita com `chrome.runtime.lastError` quando a mensagem falha (aba fechada, content script não injetado, etc.). Todos os fluxos que usam `sendToIg` / `_sendToTab` e o poll de status (`GET_LOVABLE_STATUS`) passam por esse helper.
- **Callbacks diretos:** Nos botões "Abrir Instagram + Organic" e "Abrir IG List Collector", o callback de `chrome.tabs.sendMessage` verifica `chrome.runtime.lastError` antes de mudar foco de aba, para não assumir sucesso quando o content script ainda não respondeu.
- **Supabase:** O módulo `lovable-http.js` já implementa retry com backoff para `fetch`; manter esse padrão em chamadas críticas (login, sync, safety).

---

*Fase 3 e 4 do planejamento — fevereiro 2025.*
