# Planejamento — Recomendações futuras (Organic)

Documento de planejamento para as melhorias sugeridas na revisão sênior: **poll**, **alarms**, **modularização do contentscript**, **jQuery**, **segurança** e **testes**.

---

## Visão geral

| Fase | Foco              | Esforço estimado | Prioridade |
|------|-------------------|------------------|------------|
| 1    | Performance (poll/alarms) | Baixo (1–2 dias)  | Alta       |
| 2    | Testes e cenários críticos | Médio (2–4 dias) | Alta       |
| 3    | Segurança (chaves, storage) | Médio (2–3 dias) | Média      |
| 4    | Tratamento de erros       | Baixo–médio (1–3 dias) | Média  |
| 5    | Modularização contentscript | Alto (1–2 sprints) | Baixa   |
| 6    | jQuery (redução/migração) | Alto (1+ sprint) | Baixa     |

---

## Fase 1 — Performance (poll e alarms)

**Objetivo:** Reduzir uso de CPU e mensagens entre abas sem prejudicar a experiência.

### 1.1 Poll do popup — enviar só para aba ativa

| Item | Descrição |
|------|-----------|
| **O quê** | No `checkStatus()` do popup, ao pedir `GET_LOVABLE_STATUS`, enviar mensagem apenas para a **aba ativa** do Instagram (ou a primeira encontrada), em vez de depender de um fluxo que possa envolver várias abas. |
| **Onde** | `lovable-popup.js` (já usa `chrome.tabs.query({ active: true, currentWindow: true, ... })` e depois fallback para qualquer aba IG). Revisar se em algum caminho se envia para múltiplas abas. |
| **Resultado** | Garantir que nunca haja mais de uma requisição de status por ciclo de poll; documentar o comportamento. |
| **Esforço** | 0,5 dia (verificação + ajuste fino se necessário). |

### 1.2 Alarms do background — ajuste de intervalo

| Item | Descrição |
|------|-----------|
| **O quê** | Aumentar o intervalo de `lovable-command-poll` de **0,75 min (45 s)** para **1 min (60 s)**. |
| **Onde** | `backgroundscript.js`: `chrome.alarms.create('lovable-command-poll', { periodInMinutes: 1 });` |
| **Trade-off** | Comandos remotos (dashboard) podem levar até 1 min a ser aplicados; menos execuções no service worker. |
| **Esforço** | 0,5 dia (alteração + teste de comandos remotos). |

### 1.3 Content script — organicActionRunner condicional (opcional)

| Item | Descrição |
|------|-----------|
| **O quê** | Só executar `organicActionRunner` quando houver fila ativa ou bot “ligado”, ou aumentar o intervalo de 1 s para 2 s em modo ocioso. |
| **Onde** | `contentscript.js`: `setInterval(organicActionRunner, 1000)`. |
| **Risco** | Atraso na reação ao clicar em “Process Queue”; requer teste cuidadoso. |
| **Esforço** | 1 dia (lógica condicional + testes). |

**Entregáveis Fase 1**

- [x] Documentação do fluxo de poll (comentário no código: uma única aba, ativa ou primeira IG).
- [x] Alarm command-poll em 1 min (60 s); menos execuções no service worker.
- [x] `organicActionRunner`: intervalo de 1 s → 2 s (fila agendada; 2 s é suficiente e reduz CPU).

---

## Fase 2 — Testes e cenários críticos

**Objetivo:** Ter checklist reproduzível e cenários que garantam que os fluxos principais e a proteção continuam funcionando.

### 2.1 Checklist de testes manuais

| Cenário | Passos | Critério de sucesso |
|---------|--------|----------------------|
| Limite por hora | Configurar 4/hora, executar 4 ações | Timer “Desbloqueio em X h Y min” aparece; nova ação só após o tempo. |
| Limite diário | Configurar 5/dia, executar 5 ações | Bloqueio até “amanhã”; countdown em horas/min. |
| Várias abas IG | Abrir 2–3 abas instagram.com | Popup mostra status de uma aba; collector/bridge não quebram. |
| Popup aberto longo | Deixar popup aberto 5+ min com countdown ativo | Countdown atualiza; sem travamentos; refs cacheadas ok. |
| Fluxo completo | Login Lovable → Abrir painel → Carregar fila → Processar → Ajustar limites | Tudo funciona sem erro na consola. |
| Recarregar extensão | Recarregar em chrome://extensions | Fluxo completo ainda funciona; storage preservado onde esperado. |

### 2.2 Documentar e automatizar (opcional)

| Item | Descrição |
|------|-----------|
| **O quê** | Criar `TESTES-MANUAL.md` com os cenários acima e, se possível, testes E2E (e.g. Puppeteer/Playwright para popup + content em página fake). |
| **Esforço** | 2–3 dias para doc + 2–4 dias se E2E for introduzido. |

**Entregáveis Fase 2**

- [x] `TESTES-MANUAL.md` com checklist detalhado (limite hora/dia, várias abas, popup prolongado, fluxo completo, recarregar extensão).
- [x] Referência no README ao checklist.
- [ ] (Opcional) Execução do checklist em cada release; setup E2E em fase posterior.

---

## Fase 3 — Segurança (chaves e storage)

**Objetivo:** Reduzir superfície de ataque e uso indevido de dados.

### 3.1 Chaves no front (Supabase)

| Item | Descrição |
|------|-----------|
| **O quê** | Garantir que apenas a **anon key** do Supabase seja usada no front (popup, content script, config). Nunca expor service key ou chaves com permissões elevadas. |
| **Onde** | `lovable-config.js`, `backgroundscript.js` (refresh token), qualquer outro arquivo que use `SUPABASE_KEY`. |
| **Ação** | Revisar todas as referências; configurar **RLS (Row Level Security)** no Supabase para que a anon key só acesse o que for permitido por política. |
| **Esforço** | 1–2 dias (código + políticas RLS). |

### 3.2 Storage e dados sensíveis

| Item | Descrição |
|------|-----------|
| **O quê** | Política clara: não enviar `organicLog` ou filas completas para terceiros (exceto se usuário consentir explicitamente, ex.: suporte). Manter trim do log (já implementado). |
| **Onde** | Código que envia dados para backend/dashboard; README ou aviso de privacidade. |
| **Esforço** | 0,5–1 dia (revisão + doc). |

**Entregáveis Fase 3**

- [x] Apenas anon key no front; comentários em `lovable-config.js` e `backgroundscript.js`; RLS documentado em `SEGURANCA.md`.
- [x] Texto sobre storage e logs em `SEGURANCA.md` e resumo na seção "Segurança e privacidade" do README.

---

## Fase 4 — Tratamento de erros

**Objetivo:** Comportamento previsível em falhas de rede, abas fechadas e API.

### 4.1 Pontos a reforçar

| Área | Ação |
|------|------|
| **chrome.tabs.sendMessage** | Sempre verificar `chrome.runtime.lastError` e não assumir resposta válida. |
| **Supabase / fetch** | Retry com backoff já existe em parte; estender para endpoints críticos (login, sync, safety config). |
| **Ações follow/unfollow/like** | Em 429/403/400, garantir que LovableSafety e UI são atualizados e que o usuário vê feedback (ex.: mensagem no log ou no popup). |

### 4.2 Padrão sugerido

- Função helper `sendMessageSafe(tabId, msg)` que retorna Promise e rejeita com `lastError` quando houver.
- Em chamadas Supabase, usar um wrapper que loga falha e opcionalmente notifica o usuário (toast ou status no popup).

**Entregáveis Fase 4**

- [x] Revisão dos usos de `sendMessage` no popup: `_sendToTab` passou a usar `sendMessageSafe`; `GET_LOVABLE_STATUS` refatorado para Promise + `.catch()`; callbacks dos botões toggle/open verificam `lastError` antes de mudar aba.
- [x] Helper `sendMessageSafe(tabId, message)` no popup, retornando Promise e rejeitando com `lastError`; uso em todos os fluxos críticos (sendToIg, checkStatus).

---

## Fase 5 — Modularização do contentscript

**Objetivo:** Facilitar manutenção, testes e onboarding; reduzir risco de regressões.

### 5.1 Situação atual

- Um único arquivo `contentscript.js` com milhares de linhas (queue, follow, unfollow, like, stories, settings, UI, log, etc.).

### 5.2 Estratégia sugerida

| Etapa | Descrição | Esforço |
|-------|-----------|---------|
| 5.1 | **Inventário** — Listar funções globais e dependências (quem chama quem, variáveis globais). | 1–2 dias |
| 5.2 | **Agrupamento** — Definir módulos: ex. `queue.js`, `follow-unfollow.js`, `like.js`, `settings.js`, `ui-log.js`, `api-instagram.js`. | 0,5 dia |
| 5.3 | **Build** — Introduzir bundler (esbuild, Rollup ou Webpack) que gera um único `contentscript.bundle.js` a partir dos módulos, mantendo a ordem de injeção atual no manifest. | 2–3 dias |
| 5.4 | **Extração** — Mover um módulo por vez (ex. primeiro “log + outputMessage”), testar, depois próximo. | 1–2 semanas |
| 5.5 | **Compatibilidade** — Manter globais necessários para Lovable (ex. `gblOptions`, `acctsQueue`) ou injetá-las via um pequeno “core” que os módulos recebem. | Contínuo |

### 5.3 Riscos e mitigações

- **Quebra de ordem de execução:** Manter a mesma ordem de inicialização que o código atual (ex. queue antes de follow).
- **Variáveis globais:** Documentar quais são compartilhadas; evitar duplicar estado entre módulos.

**Entregáveis Fase 5**

- [ ] Documento de arquitetura do content script (módulos e dependências).
- [ ] Pipeline de build que gera `contentscript.bundle.js`.
- [ ] Pelo menos 2 módulos extraídos e funcionando (ex. log + queue).

---

## Fase 6 — jQuery (redução ou migração)

**Objetivo:** Reduzir dependência de jQuery quando fizer sentido (novo código ou refactors).

### 6.1 Abordagem incremental

| Etapa | Descrição | Esforço |
|-------|-----------|---------|
| 6.1 | **Novo código** — Em funcionalidades novas, usar DOM nativo (`querySelector`, `addEventListener`, `classList`, etc.). | Contínuo |
| 6.2 | **Subset** — Se ainda for necessário “jQuery-like”, considerar lib mínima (ex. “cash” ou “umbrella”) só onde precisar. | 1–2 dias de POC |
| 6.3 | **Migração total** — Substituir jQuery/jQuery UI/tablesorter no painel injetado é um projeto grande (formulários, tabs, tablesorter, drag-and-drop). Só recomendar se houver necessidade forte (ex.: remover jQuery para reduzir tamanho da extensão). | 2+ sprints |

### 6.2 Prioridade

- **Baixa** no curto prazo: o sistema funciona; benefício é manutenção e tamanho a longo prazo.

**Entregáveis Fase 6**

- [ ] Decisão registrada: “novo código sem jQuery” ou “POC com lib mínima”.
- [ ] (Opcional) Migração de uma tela ou componente piloto.

---

## Cronograma sugerido (referência)

| Período | Fase | Entrega |
|---------|------|---------|
| Semana 1–2 | Fase 1 | Poll/alarms ajustados e documentados. |
| Semana 2–3 | Fase 2 | Checklist de testes manual e primeira execução completa. |
| Semana 3–4 | Fase 3 | Chaves e storage revisados; RLS e doc. |
| Semana 4–5 | Fase 4 | Tratamento de erros revisado em pontos críticos. |
| Sprint 2–3 | Fase 5 | Arquitetura + build + 2 módulos extraídos. |
| Backlog | Fase 6 | Aplicar “novo código sem jQuery”; migração total só se priorizado. |

---

## Resumo de prioridades

1. **Fazer primeiro:** Fase 1 (performance) e Fase 2 (testes) — baixo esforço, alto retorno em estabilidade e confiança.
2. **Em seguida:** Fase 3 (segurança) e Fase 4 (erros) — importantes para produção e robustez.
3. **Médio prazo:** Fase 5 (modularização) — melhora sustentabilidade do código.
4. **Quando houver capacidade:** Fase 6 (jQuery) — melhoria contínua, sem urgência.

---

---

## Registro de conclusão

- **Fase 1** — Concluída: poll documentado (uma aba), command-poll 60 s, action runner 2 s.
- **Fase 2** — Concluída: `TESTES-MANUAL.md` criado com 6 cenários; README atualizado com link ao checklist.
- **Fase 3** — Concluída: `SEGURANCA.md` (chaves anon, RLS, storage/logs); comentários no código; seção no README.
- **Fase 4** — Concluída: `sendMessageSafe` no popup; _sendToTab e GET_LOVABLE_STATUS usam o helper; lastError nos callbacks dos botões; secção em SEGURANCA.md.

*Planejamento criado em fevereiro de 2025. Revisar e atualizar conforme conclusão de cada fase.*
