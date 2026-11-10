// Included only in public packages configured for community usage reporting.
(() => {
  'use strict';
  const script = document.currentScript;
  if (location.origin !== 'https://fourtempers-code.github.io' ||
      location.pathname !== '/sgmobile-alpha/golf.html' || !Module.localFiles) return;

  const endpoint = script.dataset.endpoint;
  const prefix = 'sgmobile-usage:';
  const batchSeconds = 300;
  const expiry = 7 * 86400000;
  const pending = new Map();
  const request = (path, options) => fetch(endpoint + path, {
    credentials: 'omit', referrerPolicy: 'no-referrer', ...options
  });

  const ua = navigator.userAgent;
  const appleTablet = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const device = appleTablet ? 'ipad' : /iPhone|iPod/i.test(ua) ? 'iphone' :
    /Android/i.test(ua) ? 'android' : /Windows|Macintosh|CrOS|Linux/i.test(ua) ? 'computer' : 'unknown';
  const browser = /Edg(?:e|A|iOS)?\//i.test(ua) ? 'edge' : /OPR\/|OPT\//i.test(ua) ? 'opera' :
    /Firefox\/|FxiOS\//i.test(ua) ? 'firefox' : /SamsungBrowser\//i.test(ua) ? 'samsung' :
    /Chrome\/|CriOS\//i.test(ua) ? 'chrome' :
    /Version\/.*Safari\//i.test(ua) ? 'safari' :
    /AppleWebKit/i.test(ua) ? 'webkit' : 'unknown';
  const launch = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches ?
    'home-screen' : 'browser';
  const dimensions = { build: Module.buildInfo.id, device, browser, launch };

  let counted = false, sessions = 0, ms = 0, last = performance.now(), previouslyActive = false;
  let sending = false;
  function checkpoint() {
    const seconds = Math.min(batchSeconds, Math.floor(ms / 1000));
    if (!sessions && !seconds) return;
    const data = { id: crypto.randomUUID(), ...dimensions, sessions, seconds };
    const entry = { savedAt: Date.now(), data };
    pending.set(data.id, entry);
    // Independent keys avoid a read/modify/write race between tabs. A retry
    // keeps the same ID, including after the browser closes.
    try { localStorage.setItem(prefix + data.id, JSON.stringify(entry)); } catch {}
    sessions = 0;
    ms -= seconds * 1000;
    outbox();
  }

  function outbox() {
    const cutoff = Date.now() - expiry;
    for (const [id, entry] of pending) if (entry.savedAt < cutoff) pending.delete(id);
    const entries = new Map(pending);
    try {
      for (const key of Object.keys(localStorage).filter(key => key.startsWith(prefix))) {
        let entry;
        try { entry = JSON.parse(localStorage.getItem(key)); } catch {}
        if (entry?.data?.id && entry.savedAt >= cutoff) entries.set(entry.data.id, entry);
        else localStorage.removeItem(key);
      }
    } catch {}
    const ordered = [...entries.values()].sort((a, b) => b.savedAt - a.savedAt);
    for (const entry of ordered.slice(144)) {
      pending.delete(entry.data.id);
      try { localStorage.removeItem(prefix + entry.data.id); } catch {}
    }
    return ordered.slice(0, 144).reverse();
  }

  async function send() {
    if (sending || navigator.onLine === false) return;
    sending = true;
    try {
      for (const entry of outbox().slice(0, 8)) {
        const response = await request('/collect', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry.data), keepalive: true, signal: AbortSignal.timeout?.(8000)
        });
        if (!response.ok && response.status !== 400) break;
        pending.delete(entry.data.id);
        try { localStorage.removeItem(prefix + entry.data.id); } catch {}
        if (document.hidden) break;
      }
    } catch {} finally { sending = false; }
  }

  function sample() {
    const now = performance.now(), elapsed = now - last;
    const playable = Module.mobileState?.course && Module.mapCourseReady &&
      !Module.atTitle && !Module.courseLoading?.active && !Module.rulesetBlocked;
    const visible = !document.hidden;
    const active = !!(visible && playable && !Module.mobileState.paused && !Module.gameClock?.held);
    // Discard long scheduling gaps from phone sleep and app suspension.
    if (active && previouslyActive && elapsed <= 2500) ms += elapsed;
    last = now;
    previouslyActive = active;
    if (visible && playable && !counted) {
      counted = true;
      sessions = 1;
      checkpoint();
      void send();
    }
    if (ms >= batchSeconds * 1000) checkpoint();
  }

  function flush() {
    sample();
    previouslyActive = false;
    checkpoint();
    void send();
  }

  Module.mountPublicUsage = (version, privacy, footer) => {
    const style = document.createElement('style');
    style.textContent = `
      #public-usage-totals{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0 0 18px}
      #public-usage-totals>div{display:grid;grid-template-rows:1fr auto;gap:4px;padding:10px 6px;
        border:1px solid var(--menu-border);border-radius:16px;background:linear-gradient(#f4f5ff,#e0e5fa);
        box-shadow:0 2px 0 #39315d20;color:var(--menu-text)}
      #public-usage-totals>div+div{background:linear-gradient(#fffaf0,#f7ebca)}
      #public-usage-totals dt{display:flex;flex-direction:column;align-items:center;justify-content:start;
        gap:4px;font-size:12px;font-weight:750;line-height:1.25}
      #public-usage-totals svg{width:20px;height:20px;color:var(--menu-accent)}
      #public-usage-totals>div+div svg{color:var(--menu-warning)}
      #public-usage-totals dd{margin:0;font-size:clamp(21px,6vw,29px);font-weight:850;
        line-height:1.1;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
      #local-install .install-footer .install-privacy{max-width:440px;margin:14px auto 0}
    `;
    document.head.append(style);
    const total = document.createElement('dl');
    total.id = 'public-usage-totals';
    total.hidden = true;
    total.innerHTML = `
      <div>
        <dt><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M7 20V4l12 4-12 4M3 20h8"/>
        </svg>SG Mobile Sessions</dt>
        <dd></dd>
      </div>
      <div>
        <dt><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3 2"/>
        </svg>Hours Played</dt>
        <dd></dd>
      </div>
    `;
    const [sessionValue, hoursValue] = total.querySelectorAll('dd');
    version.after(total);
    privacy.textContent = 'Game files and saves stay on this device. Public builds report course sessions, play time, build version, Home Screen or browser launch, and broad device and browser categories.';
    footer.append(privacy);
    request('/totals', { signal: AbortSignal.timeout?.(5000) }).then(async response => {
      if (!response.ok) return;
      const { sessions, seconds } = await response.json();
      if (!Number.isSafeInteger(sessions) || sessions < 0 ||
          !Number.isSafeInteger(seconds) || seconds < 0) return;
      const hours = Number((seconds / 3600).toFixed(1));
      sessionValue.textContent = sessions.toLocaleString();
      hoursValue.textContent = hours.toLocaleString();
      total.hidden = false;
    }).catch(() => {});
  };

  setInterval(sample, 1000);
  setInterval(send, 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flush();
    else { sample(); void send(); }
  });
  addEventListener('pagehide', flush);
  addEventListener('online', send);
  void send();
})();
