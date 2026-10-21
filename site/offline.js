// Register only in the local-files release shell. An update never reloads a
// running game or changes its private original files/saves.
(function () {
  if (!Module.localFiles) return;
  Module.offlineState = {phase:'checking', build:null};
  var notice = document.createElement('div'); notice.id = 'offline-notice'; notice.hidden = true;
  notice.style.cssText = 'position:fixed;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:1001;background:#142219;color:#fff;border:1px solid #8ca68d;border-radius:8px;padding:12px;font:14px system-ui';
  var text = document.createElement('span'), close = document.createElement('button'); close.textContent = 'Dismiss'; close.style.cssText = 'margin-left:12px;min-height:44px'; close.onclick = function () { notice.hidden = true; };
  notice.append(text, close); document.body.append(notice);
  function state(phase, message, build) {
    Module.offlineState = {phase:phase, build:build || null, message:message};
    dispatchEvent(new Event('simgolf-offline-state'));
    if (phase === 'error' || phase === 'update-ready') { text.textContent = message; notice.hidden = false; }
  }
  if (!navigator.serviceWorker) { state('error','Offline app storage is unavailable in this browser.'); return; }
  var updateWaiting = false;
  navigator.serviceWorker.addEventListener('message', function (event) {
    if (event.data?.type !== 'APP_STATUS') return;
    if (updateWaiting) return;
    state(event.data.complete ? 'ready' : 'error', event.data.complete ? 'App resources are stored for offline use.' : 'Offline app files are incomplete. Keep a backup of saves and reconnect before restarting.', event.data.build);
  });
  navigator.serviceWorker.register(new URL('service-worker.js', document.currentScript.src), {scope:'./', updateViaCache:'none'}).then(function (registration) {
    function status() { registration.active?.postMessage({type:'APP_STATUS'}); }
    function waiting() { if (registration.waiting && registration.active && navigator.serviceWorker.controller) { updateWaiting = true; state('update-ready','An update is downloaded. Save your game, then close all SimGolf windows and reopen to install it.'); } }
    waiting(); status();
    registration.addEventListener('updatefound', function () {
      var worker = registration.installing;
      if (!worker) return;
      state('installing','Storing app resources for offline use…');
      worker.addEventListener('statechange', function () {
        if (worker.state === 'installed') { waiting(); if (!registration.waiting) status(); }
        if (worker.state === 'redundant' && !registration.active) state('error','App files could not be stored for offline use. Stay online and try again.');
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', status);
    navigator.serviceWorker.ready.then(function () { status(); waiting(); });
  }).catch(function () { state('error','App resources could not be stored for offline use. Keep the device online while playing.'); });
})();
