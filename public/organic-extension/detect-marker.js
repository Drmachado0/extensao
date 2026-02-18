// detect-marker.js — Marca a presença da extensão no dashboard Organic
(function() {
  'use strict';
  document.documentElement.setAttribute('data-organic-ext', 'true');
  window.__ORGANIC_EXT_INSTALLED__ = true;
  window.__ORGANIC_EXT_VERSION__ = chrome.runtime.getManifest().version;
  console.log('[Organic Extension] Extensão detectada v' + chrome.runtime.getManifest().version);
})();
