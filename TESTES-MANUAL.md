# Testes manuais — Organic (Fase 2)

Checklist de cenários críticos para executar antes de releases ou após mudanças relevantes. Marque cada item ao concluir.

---

## Pré-requisitos

- [ ] Extensão carregada em modo desenvolvedor (`chrome://extensions`).
- [ ] Conta do Instagram logada no navegador.
- [ ] (Opcional) Conta no dashboard Lovable para testes de sync.

---

## 1. Limite por hora (Safety Guard)

**Objetivo:** Verificar bloqueio por hora e timer de desbloqueio.

| # | Passo | OK? |
|---|--------|-----|
| 1.1 | Abrir Instagram e popup da extensão. | ☐ |
| 1.2 | Na seção **Proteção da conta**, em **Ajustar limites**, definir **Por hora** = 4 (ou valor baixo). Clicar em **Salvar**. | ☐ |
| 1.3 | Carregar fila e iniciar **Process Queue** (ex.: Follow) até executar 4 ações. | ☐ |
| 1.4 | Verificar que aparece **ATENÇÃO** / estado de bloqueio e o texto **"Desbloqueio em X min Y s"** (ou **"X h Y min"** se > 1 h). | ☐ |
| 1.5 | Verificar que o countdown atualiza (ex.: a cada segundo). | ☐ |
| 1.6 | Aguardar o tempo indicado (ou trocar hora do sistema para teste rápido) e confirmar que novas ações voltam a ser permitidas. | ☐ |

**Critério de sucesso:** Bloqueio respeitado; timer visível e correto; desbloqueio no momento esperado.

---

## 2. Limite diário (Safety Guard)

**Objetivo:** Verificar bloqueio diário e countdown em horas/minutos.

| # | Passo | OK? |
|---|--------|-----|
| 2.1 | Em **Ajustar limites**, definir **Por dia** = 5 (ou valor baixo). Salvar. | ☐ |
| 2.2 | Executar 5 ações (follow/unfollow/like) até atingir o limite diário. | ☐ |
| 2.3 | Verificar bloqueio e mensagem do tipo **"Desbloqueio em X h Y min"**. | ☐ |
| 2.4 | Confirmar que não é possível executar mais ações até o “próximo dia” (ou reset do contador). | ☐ |

**Critério de sucesso:** Limite diário aplicado; countdown em horas/minutos legível.

---

## 3. Várias abas do Instagram

**Objetivo:** Popup e collector estáveis com múltiplas abas.

| # | Passo | OK? |
|---|--------|-----|
| 3.1 | Abrir 2 ou 3 abas em `https://www.instagram.com` (ex.: feed, perfil, explorar). | ☐ |
| 3.2 | Abrir o popup da extensão. Verificar que o status mostra uma aba (ativa ou primeira) sem erros. | ☐ |
| 3.3 | Clicar em **Abrir Instagram + Organic** ou **Abrir IG List Collector**. | ☐ |
| 3.4 | Verificar que o painel do Organic e/ou o Collector aparecem na aba focada; sem erros na consola (F12). | ☐ |
| 3.5 | Trocar de aba do Instagram e abrir o popup de novo; confirmar que o status atualiza. | ☐ |

**Critério de sucesso:** Nenhuma quebra; popup reflete uma aba; collector/bridge funcionam.

---

## 4. Popup aberto por tempo prolongado (countdown)

**Objetivo:** Countdown e refs DOM estáveis com popup aberto.

| # | Passo | OK? |
|---|--------|-----|
| 4.1 | Deixar a conta em estado de bloqueio (ex.: limite por hora atingido) para o countdown aparecer. | ☐ |
| 4.2 | Manter o popup aberto por pelo menos 5 minutos. | ☐ |
| 4.3 | Verificar que o texto **"Desbloqueio em..."** continua atualizando (ex.: a cada 1 s). | ☐ |
| 4.4 | Verificar que os números de **Hora** e **Dia** e as barras de progresso não travam nem somem. | ☐ |

**Critério de sucesso:** Sem travamentos; countdown e UI da Safety atualizando.

---

## 5. Fluxo completo (Lovable + painel + fila + limites)

**Objetivo:** Fluxo principal sem erros na consola.

| # | Passo | OK? |
|---|--------|-----|
| 5.1 | Abrir o popup e fazer **login** no Lovable (se aplicável). | ☐ |
| 5.2 | Clicar em **Abrir Instagram + Organic** e aguardar o painel carregar na página. | ☐ |
| 5.3 | No painel, carregar uma **fila** (ex.: Load Current Page's Followers ou Load Queue). | ☐ |
| 5.4 | Ajustar **limites** na seção Proteção da conta (Por hora / Por dia / Por sessão) e clicar em **Salvar**. | ☐ |
| 5.5 | Iniciar **Process Queue** com uma ação (ex.: Follow ou Like Only) com poucos itens. | ☐ |
| 5.6 | Abrir a **consola** (F12) na aba do Instagram e no popup; verificar ausência de erros vermelhos durante o fluxo. | ☐ |

**Critério de sucesso:** Login, painel, fila, limites e processamento funcionam; sem erros na consola.

---

## 6. Recarregar extensão

**Objetivo:** Após recarregar, extensão e dados continuam utilizáveis.

| # | Passo | OK? |
|---|--------|-----|
| 6.1 | Em `chrome://extensions`, clicar em **Recarregar** na extensão Organic. | ☐ |
| 6.2 | Abrir novamente uma aba do Instagram e o popup. | ☐ |
| 6.3 | Verificar que o **login Lovable** permanece (se estava logado) ou que é possível logar de novo. | ☐ |
| 6.4 | Verificar que **limites** e **contadores** da Proteção da conta estão coerentes (storage preservado). | ☐ |
| 6.5 | Repetir um fluxo curto (abrir painel, carregar fila ou processar 1 ação) e confirmar que tudo responde. | ☐ |

**Critério de sucesso:** Extensão funciona após recarregar; storage preservado onde esperado.

---

## Registro de execução (opcional)

| Data       | Versão | Executado por | Cenários 1–6 | Observações |
|------------|--------|----------------|--------------|-------------|
| __________ | ______ | ______________ | ☐ Todos OK   | ____________ |
| __________ | ______ | ______________ | ☐ Todos OK   | ____________ |

---

## Quando executar

- Antes de marcar uma release como estável.
- Após alterações em: Safety Guard, popup, content script, bridge ou collector.
- Periodicamente (ex.: mensal) para regressão.

E2E (Puppeteer/Playwright) permanece opcional para uma fase posterior.
