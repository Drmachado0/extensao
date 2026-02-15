# Revisão sênior — Extensão Organic (ex-Organic)

## Resumo

Revisão focada em **performance**, **estabilidade** e **boas práticas**. Alterações aplicadas e recomendações adicionais.

---

## Melhorias implementadas

### 1. Popup — Cache de refs DOM (performance)

- **Problema:** A cada poll de status (~3 s), a seção Safety fazia vários `getElementById` (sfWarmup, sfHourlyCurrent, sfHourlyLimit, etc.), gerando trabalho desnecessário.
- **Solução:** Refs da seção Safety (safetySection, sfWarmup, sfHourlyCurrent, sfHourlyLimit, sfHourlyBar, sfHourlyCard, sfDailyCurrent, sfDailyLimitVal, sfDailyBar, sfDailyCard, sfAlert, sfAlertText, sfInfoText, sfUnblockCountdown) passaram a ser obtidas uma vez no carregamento e reutilizadas no callback do poll.
- **Arquivo:** `lovable-popup.js`

### 2. Content script — Throttle do monitor de botões (performance)

- **Problema:** `monitorButtonConditions` rodava a cada **100 ms**, fazendo consultas jQuery e alterações de classes/display com muita frequência.
- **Solução:** Intervalo aumentado para **300 ms**. A interface continua responsiva e a CPU é menos utilizada.
- **Arquivo:** `contentscript.js`

### 3. Content script — Log no storage (performance + armazenamento)

- **Problema:** Cada `outputMessage()` gravava o log completo em `chrome.storage.local` de forma síncrona, com risco de logs muito grandes e de atingir limites de storage.
- **Solução:**
  - **Debounce** de 1,5 s: várias mensagens em sequência disparam uma única gravação.
  - **Trim:** só são guardados os últimos **8.000 caracteres** do log.
- **Arquivo:** `contentscript.js` (variáveis `_organicLogSaveTimer`, `_GROWBOT_LOG_SAVE_DEBOUNCE_MS`, `_GROWBOT_LOG_MAX_CHARS`)

### 4. Background — Listeners de abas (estabilidade)

- **Situação:** Os handlers de `request.follow`, `request.openReelTab` e `request.openStoryTab` já usam o padrão **one-shot**: ao receber `status === 'complete'` para o `createdTabId`, chamam `chrome.tabs.onUpdated.removeListener(...)` antes de executar a lógica. Isso evita acúmulo de listeners.
- **Arquivo:** `backgroundscript.js` (já estava correto)

---

## Recomendações futuras (não implementadas)

### Performance

1. **Poll do popup:** Com o popup aberto, o intervalo de 3 s é razoável. Se no futuro quiser reduzir carga com várias abas do Instagram, pode-se enviar `GET_LOVABLE_STATUS` só para a aba ativa (em vez de todas) quando o popup solicitar.
2. **Alarms do background:** `lovable-command-poll` a cada 0,75 min (45 s) e `lovable-heartbeat` a cada 5 min estão adequados; aumentar o poll para 1 min reduziria um pouco o uso de CPU em troca de comandos remotos um pouco mais lentos.
3. **Content script — `organicActionRunner`:** Hoje roda a cada 1 s; está aceitável. Se no futuro for necessário aliviar mais a CPU, pode-se subir para 2 s ou acionar só quando a fila não estiver vazia.

### Código / manutenção

4. **`contentscript.js` (~8.7k linhas):** Vale considerar dividir em módulos (queue, follow/unfollow, like, settings, etc.) carregados sob demanda ou via build (bundler) para facilitar manutenção e testes.
5. **jQuery:** O painel injetado usa jQuery + jQuery UI + tablesorter. Para novas funcionalidades, preferir DOM nativo ou um subset de jQuery reduz tamanho e dependências; migração total é um projeto maior.
6. **Tratamento de erros:** Em vários `chrome.tabs.sendMessage` e `fetch`, o código já trata `chrome.runtime.lastError` e falhas de rede. Manter e estender esse padrão em pontos críticos (Supabase, Lovable, ações de follow/unfollow).

### Segurança

7. **Chaves no front:** `lovable-config.js` e trechos do background usam URL/API key do Supabase. Em produção, o ideal é não expor a service key; usar apenas anon key e RLS no Supabase já reduz risco.
8. **Storage:** `organicLog` e filas podem conter dados sensíveis; evitar enviar logs completos para terceiros e manter o trim do log (já implementado).

### Testes

9. **Cenários críticos:** Testar com limite por hora/dia atingido (timer de desbloqueio), com várias abas do Instagram abertas (poll, bridge, collector) e com popup aberto por muito tempo (intervalo de countdown, refs cacheadas).
10. **Recarregar extensão:** Após alterações, recarregar em `chrome://extensions` e testar fluxo completo (login Lovable, abrir painel, processar fila, limites de segurança).

---

## Checklist pós-revisão

- [x] Popup: refs Safety cacheadas
- [x] Content script: throttle 300 ms em `monitorButtonConditions`
- [x] Content script: debounce + trim do log no storage
- [x] Background: listeners one-shot confirmados
- [ ] (Opcional) Reduzir intervalo do command poll para 60 s
- [ ] (Opcional) Modularizar contentscript em médio prazo

---

*Revisão aplicada em fevereiro de 2025.*
