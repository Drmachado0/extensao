/**
 * Copyright (C) Organic 2016-2023 - All Rights Reserved
 * backgroundscript.js — Service Worker (Manifest V3)
 * Fixes aplicados:
 *  - Listener único (sem duplo onMessage)
 *  - Memory leak: tabs.onUpdated listeners removidos após uso
 *  - winvars.js removido (arquivo inexistente)
 *  - Chave Supabase via LovableConfig (sem hardcode)
 *  - openBuyScreen/overrideFT removidos (código morto)
 *  - chrome.action.onClicked removido (código morto com default_popup)
 */

// =========================================================
// LOVABLE INTEGRATION — Alarms
// =========================================================
chrome.alarms.create('lovable-token-refresh', { periodInMinutes: 45 });
chrome.alarms.create('lovable-command-poll', { periodInMinutes: 0.75 });
chrome.alarms.create('lovable-heartbeat', { periodInMinutes: 5 });

async function lovableRefreshTokenInBackground() {
  try {
    var stored = await chrome.storage.local.get(['sb_access_token', 'sb_refresh_token', 'sb_token_expires_at']);
    if (!stored.sb_access_token || !stored.sb_refresh_token) return false;
    if (stored.sb_token_expires_at && Date.now() < (stored.sb_token_expires_at - 10 * 60 * 1000)) return false;

    // Usa as configs do LovableConfig se disponível, senão fallback
    var SUPABASE_URL = (typeof LovableConfig !== 'undefined' && LovableConfig.SUPABASE_URL)
      ? LovableConfig.SUPABASE_URL
      : 'https://ebyruchdswmkuynthiqi.supabase.co';
    var SUPABASE_KEY = (typeof LovableConfig !== 'undefined' && LovableConfig.SUPABASE_KEY)
      ? LovableConfig.SUPABASE_KEY
      : '';

    var res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
      body: JSON.stringify({ refresh_token: stored.sb_refresh_token })
    });
    if (res.ok) {
      var data = await res.json();
      await chrome.storage.local.set({
        sb_access_token: data.access_token,
        sb_refresh_token: data.refresh_token,
        sb_token_expires_at: Date.now() + (data.expires_in * 1000)
      });
      console.log('[Lovable:BG] Token renovado com sucesso');
      return true;
    } else {
      console.warn('[Lovable:BG] Falha ao renovar token:', res.status);
      return false;
    }
  } catch (e) {
    console.warn('[Lovable:BG] Erro ao renovar token:', e?.message || e);
    return false;
  }
}

chrome.alarms.onAlarm.addListener(async function (alarm) {
  if (!alarm.name.startsWith('lovable-')) return;
  if (alarm.name === 'lovable-token-refresh') {
    await lovableRefreshTokenInBackground();
    sendMessageToInstagramTabs({ type: 'TOKEN_UPDATED' });
    return;
  }
  var messageType = null;
  if (alarm.name === 'lovable-command-poll') messageType = 'LOVABLE_POLL_COMMANDS';
  else if (alarm.name === 'lovable-heartbeat') messageType = 'LOVABLE_HEARTBEAT';
  if (messageType) sendMessageToInstagramTabs({ type: messageType });
});

// =========================================================
// LISTENER UNIFICADO (fix: sem duplo onMessage)
// =========================================================
var mainOrganicTabId = 0;
var lastStoryAcct;
var clickedViewStoryTabIds = [];

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

  // --- LOVABLE / COLLECTOR ---
  if (request.type === 'TOGGLE_COLLECTOR' || request.type === 'OPEN_COLLECTOR') {
    sendMessageToInstagramTabs({ type: request.type });
    sendResponse({ ok: true });
    return true;
  }

  // --- ORGANIC: follow em nova aba ---
  if (request.follow) {
    var u = request.follow;
    chrome.tabs.create({ url: 'https://www.instagram.com/' + u.username }, function (tab) {
      var targetTabId = tab.id;
      var onUpdated = function (tabId, info) {
        if (tabId !== targetTabId || info.status !== 'complete') return;
        chrome.tabs.onUpdated.removeListener(onUpdated); // fix memory leak
        setTimeout(function () {
          chrome.tabs.sendMessage(tab.id, { hideOrganic: true });
          chrome.tabs.sendMessage(tab.id, { clickSomething: 'button div[dir="auto"]:contains("Follow")' });
        }, 3000);
        setTimeout(function () { chrome.tabs.remove(tab.id); }, 20000);
      };
      chrome.tabs.onUpdated.addListener(onUpdated);
    });
    sendResponse();
    return true;
  }

  // --- ORGANIC: reel em nova aba ---
  if (request.openReelTab) {
    var shortcode = request.openReelTab.code || request.openReelTab.shortcode;
    chrome.tabs.create({ url: 'https://www.instagram.com/p/' + shortcode }, function (tab) {
      var targetTabId = tab.id;
      var onUpdated = function (tabId, info) {
        if (tabId !== targetTabId || info.status !== 'complete') return;
        chrome.tabs.onUpdated.removeListener(onUpdated); // fix memory leak
        chrome.tabs.sendMessage(tabId, { hideOrganic: true });
        setTimeout(function () { chrome.tabs.sendMessage(tabId, { hideOrganic: true }); }, 3000);
        if (request.openReelTab.LikeWhenWatchingReel) {
          setTimeout(function () {
            chrome.tabs.sendMessage(tabId, { clickSomething: 'svg[aria-label="Like"][width="24"]', parent: 'div[role="button"]' });
          }, ((request.openReelTab.video_duration || 20) * 750));
        }
        if (request.openReelTab.SaveWhenWatchingReel) {
          setTimeout(function () {
            chrome.tabs.sendMessage(tabId, { clickSomething: 'svg[aria-label="Save"]', parent: 'div[role="button"]' });
          }, ((request.openReelTab.video_duration || 20) * 750) + 2000);
        }
        setTimeout(function () { chrome.tabs.remove(tab.id); }, ((request.openReelTab.video_duration || 20) * 1000) + 1000);
      };
      chrome.tabs.onUpdated.addListener(onUpdated);
    });
    sendResponse();
    return true;
  }

  // --- ORGANIC: story ---
  if (request.closeStoryTab) {
    var hasStory = clickedViewStoryTabIds.includes(request.closeStoryTab.tabId);
    chrome.tabs.sendMessage(mainOrganicTabId, {
      closedStory: true,
      acct: lastStoryAcct,
      tabId: request.closeStoryTab.tabId,
      viewed: hasStory
    });
    chrome.tabs.remove(request.closeStoryTab.tabId);
    sendResponse();
    return true;
  }

  if (request.openStoryTab) {
    mainOrganicTabId = sender.tab.id;
    lastStoryAcct = request.openStoryTab.acct;
    chrome.tabs.create({ url: 'https://www.instagram.com/stories/' + request.openStoryTab.username }, function (tab) {
      var targetTabId = tab.id;
      var onUpdated = function (tabId, info) {
        if (tabId !== targetTabId || info.status !== 'complete') return;
        chrome.tabs.onUpdated.removeListener(onUpdated); // fix memory leak
        chrome.tabs.sendMessage(tabId, { hideOrganic: true });
        setTimeout(function () { chrome.tabs.sendMessage(tabId, { hideOrganic: true }); }, 3000);
        if (!clickedViewStoryTabIds.includes(tabId)) {
          setTimeout(function () {
            chrome.tabs.sendMessage(tabId, { clickViewStory: true, clickSomething: true, tabId: tabId });
          }, 1234);
        }
        if (request.openStoryTab.LikeWhenWatchingStory) {
          setTimeout(function () {
            chrome.tabs.sendMessage(tabId, { clickSomething: 'svg[aria-label="Like"][width="24"]', parent: 'div[role="button"]' });
          }, 3000);
        }
        if (request.openStoryTab.ReplyWhenWatchingStory) {
          var probability = request.openStoryTab.ReplyProbability || 0.2;
          if (Math.random() < probability) {
            setTimeout(function () {
              var templates = request.openStoryTab.ReplyTemplates || [];
              if (templates.length > 0) {
                var replyText = templates[Math.floor(Math.random() * templates.length)];
                chrome.tabs.sendMessage(tabId, { replyToStory: true, replyText: replyText });
              }
            }, 5000);
          }
        }
      };
      chrome.tabs.onUpdated.addListener(onUpdated);
    });
    return true;
  }

  if (request.viewedStory) {
    var tabId = sender.tab.id;
    if (!clickedViewStoryTabIds.includes(tabId)) clickedViewStoryTabIds.push(tabId);
    sendResponse();
    return true;
  }

  if (request.updatewanted === true) {
    gblIgBotUser.init();
    sendResponse();
    return true;
  }

  if (request.guidCookie) {
    gblIgBotUser.overrideGuid(request.guidCookie);
    sendResponse();
    return true;
  }

  if (request.ig_user) {
    gblIgBotUser.ig_users.push(request.ig_user);
    gblIgBotUser.ig_users = uniq(gblIgBotUser.ig_users);
    gblIgBotUser.current_ig_username = request.ig_user.username;
    if (request.ig_user_account_stats) {
      gblIgBotUser.account_growth_stats.push(request.ig_user_account_stats);
      gblIgBotUser.account_growth_stats = uniq(gblIgBotUser.account_growth_stats);
    }
    checkInstallDate();
    gblIgBotUser.saveToLocal();
    // Nota: saveToServer removido para não enviar dados sem consentimento explícito
    sendResponse();
    return true;
  }

  // Resposta padrão para mensagens não tratadas
  sendResponse();
  return true;
});

// =========================================================
// ORGANIC USER OBJECT
// =========================================================
var gblIgBotUser = {
  user_guid: undefined,
  install_date: new Date().toUTCString(),
  instabot_install_date: undefined,
  ig_users: [],
  licenses: {},
  actions: [{ date: '', action: '' }],
  account_growth_stats: [],
  options: {},

  init: async function () {
    this.user_guid = await this.getPref('organic_user_guid');
    if (!this.user_guid || this.user_guid == false) {
      this.user_guid = this.uuidGenerator();
      this.setPref('organic_user_guid', this.user_guid);
    }
  },

  overrideGuid: function (newGuid) {
    this.user_guid = newGuid;
    this.setPref('organic_user_guid', this.user_guid);
  },

  uuidGenerator: function () {
    var S4 = function () { return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); };
    return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4());
  },

  getPref: async function (name) {
    return new Promise(function (resolve) {
      chrome.storage.local.get(name, function (value) {
        resolve(Object.keys(value).length > 0 ? value[name] : false);
      });
    });
  },

  setPref: async function (name, value) {
    chrome.storage.local.set({ [name]: value });
  },

  saveToLocal: function () {
    chrome.storage.local.set({ igBotUser: JSON.stringify(gblIgBotUser) });
  }
};

// =========================================================
// INSTALL / UPDATE
// =========================================================
var instabot_free_trial_time = 259200000;
var first_run = false;
var todaysdate = new Date();
var today = todaysdate.getTime();
var timeSinceInstall;

chrome.runtime.onInstalled.addListener(installedOrUpdated);

function installedOrUpdated() {
  gblIgBotUser.init();
  chrome.tabs.create({ url: 'https://www.instagram.com' }, function (tab) {
    setTimeout(function () { sendMessageToInstagramTabs({ extension_updated: true }); }, 5000);
  });
}

async function checkInstallDate() {
  var installDate = await gblIgBotUser.getPref('instabot_install_date');
  if (installDate == false) {
    first_run = true;
    installDate = '' + today;
    gblIgBotUser.setPref('instabot_install_date', installDate);
  }
  gblIgBotUser.instabot_install_date = installDate;
  gblIgBotUser.install_date = new Date(+installDate).toUTCString();
  timeSinceInstall = today - installDate;
  checkLicenseOnServer();
}

// =========================================================
// HELPERS
// =========================================================
function sendMessageToInstagramTabs(message) {
  chrome.tabs.query({
    url: ['https://www.instagram.com/', 'https://www.instagram.com/*', 'https://www.organicforfollowers.com/*']
  }, function (tabs) {
    for (var i = 0; i < tabs.length; i++) {
      chrome.tabs.sendMessage(tabs[i].id, message).catch(function () {});
    }
  });
}

function checkLicenseOnServer() {
  var url = 'https://www.organicforfollowers.com/check_subscription.php?guid=' +
    gblIgBotUser.user_guid + '&ign=' + btoa(gblIgBotUser.current_ig_username || '');
  fetch(url, { method: 'GET' })
    .then(function (r) { return r.text(); })
    .then(function (data) {
      // Sempre licenciado para uso local
      allLicensesFetched(1, parseInt(data) === 1 ? { organic_license: 1 } : {});
    })
    .catch(function () {
      allLicensesFetched(1, {});
    });
}

function allLicensesFetched(count, licenses) {
  sendMessageToInstagramTabs({
    instabot_install_date: gblIgBotUser.instabot_install_date,
    instabot_free_trial_time: instabot_free_trial_time,
    instabot_has_license: true,
    igBotUser: gblIgBotUser
  });
  gblIgBotUser.licenses = licenses || {};
  gblIgBotUser.saveToLocal();
}

function uniq(ar) {
  return Array.from(new Set(ar.map(JSON.stringify))).map(JSON.parse);
}
