/**
 * GrowBot + IG List Collector — Bridge Script v2
 *
 * Fixes aplicados:
 *  - TOGGLE_COLLECTOR agora chama _iglcTogglePanel() corretamente
 *  - OPEN_COLLECTOR chama _iglcOpenPanel() corretamente
 */

// ═══════════════════════════════════════════════════════
// BRIDGE: IG List Collector → GrowBot Queue
// ═══════════════════════════════════════════════════════

function _iglcIsGrowbotAvailable() {
  return (
    typeof acctsQueue !== 'undefined' &&
    Array.isArray(acctsQueue) &&
    typeof arrayOfUsersToDiv === 'function'
  );
}

function _iglcPushToGrowbot(accounts, replace) {
  if (!_iglcIsGrowbotAvailable()) return false;
  if (!Array.isArray(accounts) || accounts.length === 0) return false;
  try {
    if (replace) acctsQueue.length = 0;
    for (var i = 0; i < accounts.length; i++) {
      var acct = accounts[i];
      if (!acct.username && !acct.id) continue;
      acctsQueue.push(acct);
    }
    if (typeof arrayOfUsersToDiv === 'function') arrayOfUsersToDiv(acctsQueue, true);
    if (typeof updateCount === 'function') updateCount();
    if (typeof saveQueueToStorage === 'function') saveQueueToStorage();
    if (typeof printMessage === 'function') printMessage('[IG List Collector] ' + accounts.length + ' contas carregadas na fila');
    console.log('[IGLC Bridge] ' + accounts.length + ' contas injetadas (total: ' + acctsQueue.length + ')');
    return true;
  } catch (e) {
    console.error('[IGLC Bridge] Erro ao injetar contas:', e);
    return false;
  }
}

function _iglcTogglePanel() {
  var panel = document.getElementById('igListCollectorPanel');
  if (!panel) return;
  if (panel.classList.contains('hidden')) {
    panel.classList.remove('hidden');
  } else {
    panel.classList.add('hidden');
  }
}

function _iglcOpenPanel() {
  var panel = document.getElementById('igListCollectorPanel');
  if (panel) panel.classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════
// INJEÇÃO DE BOTÃO NO GROWBOT
// ═══════════════════════════════════════════════════════

function _iglcInjectGrowbotButton() {
  var maxAttempts = 60;
  var attempts = 0;

  function tryInject() {
    attempts++;
    var btnLoadSaved = document.getElementById('btnLoadSavedQueue');
    if (!btnLoadSaved) {
      if (attempts < maxAttempts) setTimeout(tryInject, 2000);
      return;
    }
    if (document.getElementById('btnIGLCCollector')) return;

    var btn = document.createElement('div');
    btn.className = 'igBotInjectedButton flex7';
    btn.id = 'btnIGLCCollector';
    btn.title = 'Abrir o IG List Collector para coletar listas de seguidores/seguindo e carregar na fila do GrowBot';
    btn.textContent = '\uD83D\uDCCB IG List Collector';
    btn.style.cssText = 'background:linear-gradient(135deg,#6C5CE7,#A855F7);color:#fff;font-weight:600;margin-top:4px;border:none;';
    btn.addEventListener('click', function () { _iglcOpenPanel(); });
    btnLoadSaved.parentNode.insertBefore(btn, btnLoadSaved.nextSibling);
    console.log('[IGLC Bridge] Botão "IG List Collector" injetado no GrowBot');
  }

  tryInject();
}

// ═══════════════════════════════════════════════════════
// LISTENER PARA MENSAGENS DO POPUP (fix: TOGGLE agora funciona)
// ═══════════════════════════════════════════════════════

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === 'TOGGLE_COLLECTOR') {
    _iglcTogglePanel(); // fix: estava faltando esta chamada
    sendResponse({ ok: true });
    return true;
  }
  if (request.type === 'OPEN_COLLECTOR') {
    _iglcOpenPanel();
    sendResponse({ ok: true });
    return true;
  }
});

// ═══════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _iglcInjectGrowbotButton);
} else {
  setTimeout(_iglcInjectGrowbotButton, 1000);
}

console.log('[IGLC Bridge] Bridge v2 carregado. GrowBot disponível:', _iglcIsGrowbotAvailable());
