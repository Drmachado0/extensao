// lovable-config.js — Integração direta GrowBot + Lovable (sem Bridge)
// Configuração centralizada para todos os módulos Lovable
(function () {
  'use strict';

  const root = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : globalThis);

  root.LovableConfig = Object.freeze({
    VERSION: '2.5.0',

    // Supabase
    SUPABASE_URL: 'https://ebyruchdswmkuynthiqi.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXJ1Y2hkc3dta3V5bnRoaXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDQyMzYsImV4cCI6MjA4NjEyMDIzNn0.fKuLCySRNC_YJzO4gNM5Um4WISneTiSyhhhJsW3Ho18',

    // Dashboard
    DASHBOARD_URL: 'https://organicpublic.lovable.app',

    // Timings (ms)
    HEARTBEAT_INTERVAL: 5 * 60 * 1000,        // 5 min
    STATS_REPORT_INTERVAL: 5 * 60 * 1000,     // 5 min
    PROFILE_COLLECT_INTERVAL: 15 * 60 * 1000,  // 15 min
    COMMAND_POLL_INTERVAL: 45 * 1000,           // 45s
    RETRY_QUEUE_INTERVAL: 30 * 1000,            // 30s
    SCHEDULER_CHECK_INTERVAL: 30 * 1000,        // 30s
    LIVE_COUNTERS_INTERVAL: 30 * 1000,          // 30s — sync leve de contadores para dashboard
    QUEUE_SYNC_INTERVAL: 60 * 1000,             // 1 min
    SETTINGS_SYNC_INTERVAL: 2 * 60 * 1000,      // 2 min
    TOKEN_REFRESH_INTERVAL: 45 * 60 * 1000,     // 45 min

    // Limits
    RETRY_QUEUE_BATCH_SIZE: 10,
    RETRY_QUEUE_MAX_SIZE: 500,
    MAX_USERNAME_LENGTH: 30,
    QUEUE_FETCH_LIMIT: 50,

    // Safety Guard — Proteção contra ban (valores baseados nas normas do Instagram 2025/2026)
    // Default: "Conta Media" (3-12 meses) — perfil conservador e seguro
    SAFETY: {
      MAX_PER_HOUR: 12,           // Instagram permite ~10-20/hora — usamos 12 para margem
      MAX_PER_DAY: 80,            // Seguro: 80-100/dia para contas médias (era 100)
      MAX_PER_SESSION: 50,        // Limitar sessão para não concentrar ações (era 60)
      MAX_CONSECUTIVE_ERRORS: 3,  // Menos tolerância a erros
      MAX_CONSECUTIVE_BLOCKS: 1,  // 1 block = pausa imediata
      MAX_RATE_LIMITS: 1,         // 1 rate limit = pausa imediata
      ERROR_COOLDOWN_MINUTES: 25, // Cooldown mais longo para erros (era 20)
      BLOCK_COOLDOWN_MINUTES: 150,// 2.5 horas de pausa após block (era 2h)
      RATE_LIMIT_COOLDOWN_MINUTES: 90, // 1.5 hora após rate limit (era 1h)
      MIN_DELAY_SECONDS: 35,      // Intervalo mínimo entre ações (era 28)
      MAX_DELAY_SECONDS: 75,      // Intervalo máximo entre ações (era 60)
    },

    // Presets de segurança por idade da conta
    // Cada preset inclui: limites Lovable + timings nativos do GrowBot
    SAFETY_PRESETS: {
      nova: {
        label: 'Conta Nova (< 3 meses)',
        // Limites Lovable SafetyGuard
        MAX_PER_HOUR: 6,            // Muito conservador para contas novas (era 8)
        MAX_PER_DAY: 30,            // Max 30/dia (era 40)
        MAX_PER_SESSION: 20,        // Max 20/sessão (era 25)
        MAX_CONSECUTIVE_ERRORS: 2,
        MAX_CONSECUTIVE_BLOCKS: 1,
        MAX_RATE_LIMITS: 1,
        ERROR_COOLDOWN_MINUTES: 40, // 40min (era 30)
        BLOCK_COOLDOWN_MINUTES: 240, // 4 horas (era 3h)
        RATE_LIMIT_COOLDOWN_MINUTES: 120, // 2 horas (era 90min)
        MIN_DELAY_SECONDS: 55,      // Min 55s entre ações (era 45)
        MAX_DELAY_SECONDS: 120,     // Max 2min entre ações (era 90s)
        // Timings nativos GrowBot (aplicados diretamente no DOM/gblOptions)
        GROWBOT: {
          timeDelay: 120000,                    // 120s entre ações (era 90s)
          timeDelayAfterSkip: 4000,             // 4s após pular (era 3s)
          useRandomTimeDelay: true,             // Ativar aleatoriedade
          percentRandomTimeDelay: 0.40,         // ±40% variação (mais humano)
          timeDelayAfterSoftRateLimit: 2400000, // 40 min após soft rate limit (era 30min)
          timeDelayAfterHardRateLimit: 14400000,// 4 horas após hard rate limit (era 3h)
          timeDelayAfter429RateLimit: 7200000,  // 2 horas após 429 (era 90min)
          useTimeDelayAfterAdditionalInfo: true,
          timeDelayAfterAdditionalInfo: 4000,   // 4s após carregar info (era 3s)
          retriesAfterAdditionalInfo404: 3,     // Menos retries (era 5)
          maxPerEnabled: true,                  // Ativar limite de ações nativo
          maxPerActions: 30,                    // Max 30 ações (era 40)
          maxPerPeriod: 86400000,               // Por 24 horas
        },
      },
      media: {
        label: 'Conta Media (3-12 meses)',
        // Limites Lovable SafetyGuard
        MAX_PER_HOUR: 12,           // (era 15)
        MAX_PER_DAY: 80,            // (era 100)
        MAX_PER_SESSION: 50,        // (era 60)
        MAX_CONSECUTIVE_ERRORS: 3,
        MAX_CONSECUTIVE_BLOCKS: 1,
        MAX_RATE_LIMITS: 1,
        ERROR_COOLDOWN_MINUTES: 25, // (era 20)
        BLOCK_COOLDOWN_MINUTES: 150, // 2.5h (era 2h)
        RATE_LIMIT_COOLDOWN_MINUTES: 90, // 1.5h (era 1h)
        MIN_DELAY_SECONDS: 35,      // (era 28)
        MAX_DELAY_SECONDS: 75,      // (era 60)
        // Timings nativos GrowBot
        GROWBOT: {
          timeDelay: 75000,                     // 75s entre ações (era 60s)
          timeDelayAfterSkip: 3000,             // 3s após pular (era 2s)
          useRandomTimeDelay: true,
          percentRandomTimeDelay: 0.30,         // ±30% variação (era 25%)
          timeDelayAfterSoftRateLimit: 1800000, // 30 min após soft rate limit (era 20min)
          timeDelayAfterHardRateLimit: 10800000,// 3 horas após hard rate limit (era 2h)
          timeDelayAfter429RateLimit: 5400000,  // 90 min após 429 (era 60min)
          useTimeDelayAfterAdditionalInfo: true,
          timeDelayAfterAdditionalInfo: 3000,   // 3s (era 2s)
          retriesAfterAdditionalInfo404: 5,     // (era 8)
          maxPerEnabled: true,
          maxPerActions: 80,                    // (era 100)
          maxPerPeriod: 86400000,
        },
      },
      madura: {
        label: 'Conta Madura (> 1 ano)',
        // Limites Lovable SafetyGuard
        MAX_PER_HOUR: 20,           // (era 25)
        MAX_PER_DAY: 120,           // (era 150)
        MAX_PER_SESSION: 70,        // (era 80)
        MAX_CONSECUTIVE_ERRORS: 3,  // (era 4)
        MAX_CONSECUTIVE_BLOCKS: 1,
        MAX_RATE_LIMITS: 1,         // (era 2 — 1 é mais seguro)
        ERROR_COOLDOWN_MINUTES: 20, // (era 15)
        BLOCK_COOLDOWN_MINUTES: 120, // 2h (era 90min)
        RATE_LIMIT_COOLDOWN_MINUTES: 60, // 1h (era 45min)
        MIN_DELAY_SECONDS: 25,      // (era 20)
        MAX_DELAY_SECONDS: 55,      // (era 45)
        // Timings nativos GrowBot
        GROWBOT: {
          timeDelay: 55000,                     // 55s entre ações (era 45s)
          timeDelayAfterSkip: 2000,             // 2s (era 1s)
          useRandomTimeDelay: true,
          percentRandomTimeDelay: 0.30,         // ±30% variação (era 25%)
          timeDelayAfterSoftRateLimit: 1200000, // 20 min (era 15min)
          timeDelayAfterHardRateLimit: 7200000, // 2 horas (era 1.5h)
          timeDelayAfter429RateLimit: 3600000,  // 60 min após 429 (era 45min)
          useTimeDelayAfterAdditionalInfo: true,
          timeDelayAfterAdditionalInfo: 2000,
          retriesAfterAdditionalInfo404: 8,     // (era 10)
          maxPerEnabled: true,
          maxPerActions: 120,                   // (era 150)
          maxPerPeriod: 86400000,
        },
      },
    },

    // Instagram API
    IG_APP_ID: '936619743392459',
  });

  // Utilitário — sanitização de username
  root.LovableUtils = Object.freeze({
    sanitizeUsername(u) {
      if (!u) return null;
      return String(u).replace(/^@/, '').replace(/[^a-zA-Z0-9_.]/g, '').substring(0, root.LovableConfig.MAX_USERNAME_LENGTH || 30) || null;
    }
  });

  console.log(`[Lovable] Config v${root.LovableConfig.VERSION} carregado`);
})();
