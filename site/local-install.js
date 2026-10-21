// Current mobile shell + user's original files. No original files leave this
// browser; no installation/saves/log network endpoints are used in this mode.
(function () {
  'use strict';
  if (!Module.localFiles) return;
  var base = new URL('./', location.href), realFetch = window.fetch.bind(window);
  var storage = null, gameDirs = new Map(), selected = [], active = null, worker = null;
  var resolveReady, rejectReady, settled = false;
  var ready = new Promise(function (resolve, reject) { resolveReady = resolve; rejectReady = reject; });
  // Catch immediately; the runtime attaches its preRun handler after loading.
  ready.catch(function () {});
  Module.localInstall = { phase: 'checking', generation: null, error: '' };
  var css = document.createElement('style');
  // The historical prototype's cream/green first-run layout, using only the
  // maintainer-supplied app icon and official Discord symbol. No game artwork
  // or remotely loaded fonts, social widgets or donation widgets.
  css.textContent = `
    #local-install[hidden],#local-install [hidden]{display:none!important}
    #local-install{position:fixed;inset:0;z-index:1000;overflow:auto;box-sizing:border-box;
      padding:max(24px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));
      background:radial-gradient(ellipse 90% 46% at 5% 100%,#609a4b33 0 55%,transparent 56%),radial-gradient(ellipse 95% 46% at 96% 110%,#9ebb6640 0 62%,transparent 63%),linear-gradient(167deg,#fafaf0,#f4f3db 53%,#e9efd8);
      color:#143e27;font:16px/1.5 system-ui,-apple-system,sans-serif;display:flex;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
    #local-install>div{width:100%;max-width:600px;margin:auto;text-align:center;flex-shrink:0}
    #local-install .install-brand{display:flex;align-items:center;justify-content:center;gap:16px;margin:0 0 22px;text-align:left}
    #local-install .install-brand img{width:88px;height:88px;border-radius:22px;box-shadow:0 5px 12px #194f231c}
    #local-install .install-brand strong{display:block;font:850 clamp(27px,7vw,42px)/1.05 ui-rounded,system-ui,sans-serif;letter-spacing:-.04em;color:#165630}
    #local-install .install-brand span{display:block;margin-top:6px;color:#546651;font-size:14px}
    #local-install .install-card{border:2px solid #26653b;border-radius:27px;padding:clamp(20px,5vw,32px);background:linear-gradient(157deg,#fffff7fa,#faf8e2f5);box-shadow:0 7px 0 #19552624,0 14px 35px #12392114}
    #local-install .eyebrow{font-size:11px;letter-spacing:.16em;font-weight:800;color:#2c7240;margin:0 0 12px}
    #local-install h1{font-size:clamp(23px,5.6vw,32px);line-height:1.15;letter-spacing:-.04em;color:#104c2a;margin:0 0 12px}
    #local-install p{margin:12px 0}#local-install .install-lead{color:#546651;margin:0 auto 20px;max-width:390px}
    #local-install button,#local-install input{font:inherit;max-width:100%;box-sizing:border-box}
    #local-install button{min-height:48px;padding:10px 16px;margin:10px 4px 0;background:#eff3df;color:#174d2e;border:1px solid #77965d;border-radius:13px;cursor:pointer}
    #local-install button:disabled{opacity:.5;cursor:wait}
    #local-install .install-picker,#local-install #local-install-play{position:relative;display:block;width:100%;min-height:76px;padding:16px 18px;box-sizing:border-box;text-align:left;border:2px solid #115330;border-radius:19px;background:linear-gradient(#dff376,#b4db3b 47%,#92c52a);box-shadow:0 3px 0 #638d1b,inset 0 0 0 2px #ffffff8c;color:#124d2d;cursor:pointer}
    #local-install .install-picker:has(input[hidden]){display:none}
    #local-install .install-picker:has(input:disabled){opacity:.5;cursor:wait}
    #local-install .install-picker input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:inherit}
    #local-install .install-picker strong{display:block;font-size:20px;line-height:1.2;letter-spacing:-.02em}
    #local-install .install-picker span{display:block;font-size:12px;margin-top:5px;color:#345d37}
    #local-install #local-install-play{text-align:center;font-size:22px;font-weight:800}
    #local-install .install-picker:focus-within,#local-install button:focus-visible,#local-install a:focus-visible{outline:3px solid #a56716;outline-offset:4px}
    #local-install progress{width:100%;height:16px;margin-top:14px;accent-color:#3f8a39}
    #local-install #local-install-message{font-size:14px;font-weight:600;overflow-wrap:anywhere;color:#386046}
    #local-install #local-install-message.error{color:#9b241d;background:#ffece4;border:1px solid #cf8c7c;border-radius:12px;padding:10px}
    #local-install .minor{color:#546651;font-size:12px}#local-install .install-privacy{color:#2b6438;font-size:13px;margin:20px 0 0}
    #local-install .install-footer{font-size:12px;margin-top:22px;color:#546651}
    #local-install a{color:#215f38;text-underline-offset:3px}
    #local-install .install-donate,#local-install .install-community{display:grid;grid-template-columns:44px minmax(0,1fr) 16px;align-items:center;gap:12px;width:100%;padding:15px 16px;box-sizing:border-box;border-radius:18px;text-align:left;text-decoration:none;min-height:76px;line-height:1.25}
    #local-install .install-donate{margin:0 0 26px;border:1px solid #a87b26;background:linear-gradient(135deg,#fff0bb,#ffd16a);color:#49370e;box-shadow:0 4px 0 #b88a30,inset 0 1px 0 #fff9df}
    #local-install .install-community{margin:0 0 20px;border:1px solid #4752c4;background:#5865f2;color:#fff;box-shadow:0 4px 0 #3d48b8,inset 0 1px 0 #ffffff38}
    #local-install .install-link-copy strong{display:block;font-size:16px;font-weight:800;letter-spacing:-.02em}
    #local-install .install-link-copy small{display:block;margin-top:4px;font-size:12px;line-height:1.4;font-weight:500}
    #local-install .install-heart{width:42px;height:42px;display:grid;place-items:center;border-radius:14px;background:#fff9e6;color:#ba433b;font-size:25px}
    #local-install .install-community img{display:block;width:36px;height:27px;margin:auto}
    #local-install .install-link-arrow{font-size:19px;opacity:.85}
    #local-install .install-donate:active,#local-install .install-community:active{transform:translateY(2px);box-shadow:none}
    @media(max-width:360px){#local-install .install-donate,#local-install .install-community{grid-template-columns:36px minmax(0,1fr);gap:10px;padding:13px}#local-install .install-heart{width:36px;height:36px}#local-install .install-link-arrow{display:none}}
    #local-install .install-identity{overflow-wrap:anywhere;font-size:11px}
    @media(max-height:500px){#local-install .install-brand{margin-bottom:14px}#local-install .install-brand img{width:60px;height:60px;border-radius:15px}#local-install .install-card{padding:20px}}
  `;
  document.head.append(css);
  function node(tag, value) { var e = document.createElement(tag); e.textContent = value; return e; }
  var root = node('section', ''); root.id = 'local-install'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'local-install-heading');
  var box = node('div', ''), card = node('div', ''); card.className = 'install-card';
  var brand = node('div', ''); brand.className = 'install-brand';
  var icon = node('img', ''); icon.src = new URL('icons/simgolf-mobile.png', base).href; icon.alt = ''; icon.width = 88; icon.height = 88;
  var brandName = node('div', ''); brandName.append(node('strong', 'SimGolf Mobile'), node('span', 'Your course. In your pocket.')); brand.append(icon, brandName);
  var eyebrow = node('p', 'WELCOME TO THE ALPHA'); eyebrow.className = 'eyebrow';
  var heading = node('h1', 'Ready to build your course?'); heading.id = 'local-install-heading';
  var intro = node('p', 'Select your original SimGolf files once to start playing.'); intro.className = 'install-lead';
  var info = node('p', 'Checking local storage…'); info.id = 'local-install-message'; info.setAttribute('role', 'status'); info.setAttribute('aria-live', 'polite');
  var identity = node('p', Module.buildInfo.version + ' · ' + Module.buildInfo.id); identity.className = 'install-identity';
  var picker = document.createElement('input'); picker.id = 'local-install-files'; picker.type = 'file'; picker.multiple = true; picker.accept = '.iso,.bin,.img,.mdf,.exe,.zip,.7z,.rar'; picker.setAttribute('aria-label', 'Select your original game files');
  var pickLabel = node('label', ''); pickLabel.className = 'install-picker'; pickLabel.htmlFor = picker.id;
  pickLabel.append(node('strong', 'Choose Game Files'), node('span', 'Select your disc image and compatible game executable'), picker);
  var help = node('p', 'Use your original disc image (.iso) and the supported v1.02 game executable (.exe). Import happens locally; the game files are not included.'); help.className = 'minor';
  var bar = document.createElement('progress'); bar.max = 1; bar.value = 0; bar.hidden = true; bar.setAttribute('aria-label', 'Game file import progress');
  var play = node('button', 'Play'); play.id = 'local-install-play'; play.hidden = true;
  var replace = node('button', 'Import replacement files'); replace.hidden = true;
  var cancel = node('button', 'Cancel import'); cancel.hidden = true;
  var privacy = node('p', 'Your game files stay on this device.'); privacy.className = 'install-privacy';
  var note = node('p', 'Keep backups of your saves. Clearing this site’s browser data removes local files. Intro-video conversion is not available in this alpha.'); note.className = 'minor';
  var footer = node('div', ''); footer.className = 'install-footer';
  var donate = node('a', ''); donate.className = 'install-donate'; donate.setAttribute('aria-label', 'Donate to this project on Ko-fi');
  donate.href = 'https://ko-fi.com/sgmobile'; donate.target = '_blank'; donate.rel = 'noopener noreferrer';
  var heart = node('span', '♥'); heart.className = 'install-heart'; heart.setAttribute('aria-hidden', 'true');
  var donateCopy = node('span', ''); donateCopy.className = 'install-link-copy'; donateCopy.append(node('strong', 'Donate to this project'), node('small', 'Support development on Ko-fi · optional'));
  var donateArrow = node('span', '↗'); donateArrow.className = 'install-link-arrow'; donateArrow.setAttribute('aria-hidden', 'true'); donate.append(heart, donateCopy, donateArrow);
  var community = node('a', ''); community.className = 'install-community'; community.setAttribute('aria-label', 'Join SimGolf Mobile Discord');
  community.href = 'https://discord.gg/RDKJBWdGAg'; community.target = '_blank'; community.rel = 'noopener noreferrer';
  var discordIcon = node('img', ''); discordIcon.src = new URL('icons/discord-symbol.svg', base).href; discordIcon.alt = ''; discordIcon.width = 36; discordIcon.height = 27;
  var communityCopy = node('span', ''); communityCopy.className = 'install-link-copy'; communityCopy.append(node('strong', 'Join SimGolf Mobile Discord'), node('small', 'Share your course, feedback & ideas'));
  var communityArrow = node('span', '↗'); communityArrow.className = 'install-link-arrow'; communityArrow.setAttribute('aria-hidden', 'true'); community.append(discordIcon, communityCopy, communityArrow);
  var guide = node('a', 'Setup & supported files'); guide.href = new URL('README.txt', base).href; guide.target = '_blank'; guide.rel = 'noopener';
  var notices = node('a', 'Third-party notices & source'); notices.href = new URL('THIRD_PARTY_NOTICES.txt', base).href; notices.target = '_blank'; notices.rel = 'noopener';
  var links = node('p', ''); links.append(guide, document.createTextNode(' · '), notices);
  card.append(eyebrow, donate, community, heading, intro, pickLabel, help, info, bar, play, replace, cancel, privacy, note);
  footer.append(links, identity); box.append(brand, card, footer); root.append(box); document.body.append(root);
  for (var type of ['pointerdown','pointerup','pointermove','mousedown','mouseup','click','touchstart','touchmove','touchend','wheel','keydown','keyup','keypress']) root.addEventListener(type, function (e) { e.stopPropagation(); });

  function status(phase, message, error) {
    Module.localInstall.phase = phase; Module.localInstall.error = error ? message : '';
    info.textContent = message; info.className = error ? 'error' : '';
  }
  function messageError(e) { return e && e.message || String(e); }
  function validPath(path) {
    return typeof path === 'string' && path.length > 0 && path.split('/').every(function (p) { return p && p !== '.' && p !== '..' && !/[\\:\0]/.test(p); });
  }
  async function fileAt(top, path) {
    if (!validPath(path)) throw new Error('Invalid local game-file path.');
    var parts = path.split('/'), dir = top;
    for (var part of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(part);
    return (await dir.getFileHandle(parts[parts.length - 1])).getFile();
  }
  async function local(path) {
    try {
      var parts = path.split('/').map(decodeURIComponent), key = parts.slice(0, -1).join('/'), dir = gameDirs.get(key);
      if (!validPath(parts.join('/'))) throw new Error('Invalid path');
      if (!dir) { dir = storage; for (var part of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(part); gameDirs.set(key, dir); }
      return new Response(await (await dir.getFileHandle(parts[parts.length - 1])).getFile());
    } catch (e) { return new Response('', {status:404}); }
  }
  window.fetch = function (input, init) {
    var url = new URL(input instanceof Request ? input.url : String(input), location.href);
    if (url.origin === base.origin && url.pathname.startsWith(base.pathname)) {
      var path = url.pathname.slice(base.pathname.length);
      // The release shell never probes a remote save endpoint, even before import.
      if (path === 'saves/' || path.startsWith('saves/')) return Promise.resolve(new Response('', {status:404}));
      if (path.startsWith('game/') || path.startsWith('assets/')) {
        if (!storage) return Promise.resolve(new Response('', {status:404}));
        return local(path.startsWith('assets/') ? 'game/' + path.slice(7) : path);
      }
    }
    return realFetch(input, init);
  };
  window.simgolfStorage = async function () {
    if (!storage) throw new Error('Original game files are not installed.');
    return storage;
  };
  async function hash(bytes) {
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }
  var compatibility = realFetch(new URL('compatibility.json', base)).then(function (r) { if (!r.ok) throw new Error('App compatibility information could not be loaded.'); return r.json(); });
  compatibility.catch(function () {});
  async function inspect(opfs, name) {
    var top = await opfs.getDirectoryHandle(name), meta = JSON.parse(await (await fileAt(top, 'installed.json')).text());
    if (meta.version !== 1 || !Array.isArray(meta.files) || !meta.files.length) throw new Error('Unsupported or unfinished installation.');
    if (!meta.files.every(function (f) { return Array.isArray(f) && validPath(f[0]) && Number.isSafeInteger(f[1]) && f[1] >= 0; })) throw new Error('Invalid original-file inventory.');
    var images = {}, expected = (await compatibility).images;
    for (var n of ['golf.bin', 'jgld.bin']) {
      images[n] = new Uint8Array(await (await fileAt(top, 'image/' + n)).arrayBuffer());
      if (await hash(images[n]) !== expected[n]) throw new Error('The installed game files do not match this engine version.');
    }
    await fileAt(top, 'game/' + meta.files.find(function (f) { return f[0].toLowerCase() === 'jackal.pcx'; })?.[0]);
    return {name:name, top:top, meta:meta, images:images};
  }
  function installedView() {
    picker.hidden = true; play.hidden = false; replace.hidden = false; cancel.hidden = true; bar.hidden = true;
    status('installed', 'Your original game files are ready.');
  }
  async function discover() {
    var opfs = await navigator.storage.getDirectory(), candidates = [];
    for await (var entry of opfs.values()) {
      if (entry.kind === 'directory' && (entry.name === 'simgolf' || entry.name.startsWith('simgolf-install-'))) {
        try { candidates.push(await inspect(opfs, entry.name)); } catch (e) { console.warn('Local installation not selected:', entry.name, messageError(e)); }
      }
    }
    candidates.sort(function (a, b) { return (b.meta.created || 0) - (a.meta.created || 0); });
    return candidates[0] || null;
  }
  async function start() {
    if (!active || settled) return;
    play.disabled = true; replace.disabled = true; picker.disabled = true;
    try {
      storage = active.top; gameDirs.clear(); Module.localInstall.generation = active.name;
      if (navigator.storage.persist) await navigator.storage.persist().catch(function () {});
      settled = true; status('starting', 'Loading the game…'); resolveReady(active);
    } catch (e) { play.disabled = false; replace.disabled = false; picker.disabled = false; status('error', messageError(e), true); }
  }
  play.onclick = start;
  replace.onclick = function () { picker.hidden = false; selected = []; cancel.hidden = false; play.hidden = true; replace.hidden = true; status('selecting', 'Choose replacement files. Your current installation and saves will be preserved.'); };
  cancel.onclick = function () {
    if (worker) { worker.terminate(); worker = null; }
    selected = []; picker.disabled = false; picker.value = ''; bar.hidden = true;
    if (active) installedView(); else { cancel.hidden = true; status('selecting', 'Import cancelled. Choose your original files to try again.'); }
  };
  picker.onchange = function () {
    if (!picker.files.length || worker) return;
    for (var file of picker.files) if (!selected.some(function (old) { return old.name === file.name && old.size === file.size; })) selected.push(file);
    picker.value = ''; picker.disabled = true; cancel.hidden = false; bar.hidden = false; bar.value = 0;
    status('importing', 'Checking your files…');
    var job = worker = new Worker(new URL('install-worker.js', base));
    worker.onmessage = async function (event) {
      if (worker !== job) return;
      var m = event.data;
      if (m.progress !== undefined) { bar.value = m.progress; status('importing', m.text); }
      if (m.error) { worker.terminate(); worker = null; picker.disabled = false; status('error', m.error, true); }
      if (m.done) {
        worker.terminate(); worker = null;
        try { active = await discover(); if (!active) throw new Error('The completed installation could not be validated.'); picker.disabled = false; selected = []; installedView(); await start(); }
        catch (e) { picker.disabled = false; status('error', messageError(e), true); }
      }
    };
    worker.onerror = function () { if (worker !== job) return; if (worker) worker.terminate(); worker = null; picker.disabled = false; status('error', 'Import stopped. Your previous installation and saves are preserved. Choose files to retry.', true); };
    worker.postMessage({files:selected, options:{convertVideos:false}});
  };
  // Explicit file transfer is separate from the deferred save-history UI.
  var saveRoot = node('section', ''); saveRoot.id = 'local-save-files'; saveRoot.hidden = true;
  saveRoot.setAttribute('role', 'dialog'); saveRoot.setAttribute('aria-modal', 'true');
  var saveBox = node('div', ''), saveHeading = node('h1', 'Save files'), saveInfo = node('p', 'Download a backup or import an original save.');
  var saveInput = document.createElement('input'); saveInput.type = 'file'; saveInput.accept = '.sve'; saveInput.multiple = true; saveInput.id = 'local-save-import'; saveInput.setAttribute('aria-label', 'Import saved games');
  var saveList = node('div', ''), saveClose = node('button', 'Back to game'); saveClose.onclick = function () { saveRoot.hidden = true; };
  saveBox.append(saveHeading, saveInfo, saveInput, saveList, saveClose); saveRoot.append(saveBox); document.body.append(saveRoot);
  css.textContent += '#local-save-files[hidden],#local-title-saves[hidden]{display:none!important}#local-save-files{position:fixed;inset:0;z-index:999;background:#142219;color:white;overflow:auto;padding:max(24px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));box-sizing:border-box;font:17px/1.5 system-ui,sans-serif}#local-save-files>div{max-width:650px;margin:auto}#local-save-files button,#local-title-saves{font:inherit;min-height:48px;padding:10px 14px;background:#385a39;color:white;border:1px solid #9ab69a;border-radius:8px;margin:6px 0}#local-save-files input{font:inherit;max-width:100%}#local-save-files .save-file{display:flex;justify-content:space-between;align-items:center;gap:10px;border-bottom:1px solid #3d5941}#local-save-files .save-file span{overflow-wrap:anywhere}#local-title-saves{position:fixed;bottom:max(12px,env(safe-area-inset-bottom));right:max(12px,env(safe-area-inset-right));z-index:50}';
  for (var type of ['pointerdown','pointerup','pointermove','mousedown','mouseup','click','touchstart','touchmove','touchend','wheel','keydown','keyup','keypress']) saveRoot.addEventListener(type, function (e) { e.stopPropagation(); });
  var titleSaves = node('button', 'Save files'); titleSaves.id = 'local-title-saves'; titleSaves.hidden = true; document.body.append(titleSaves);
  function saveFolder() { return '/game/' + (FS.readdir('/game').find(function (d) { return d.toLowerCase() === 'saved games'; }) || 'Saved Games'); }
  function listSaves() {
    saveList.replaceChildren();
    for (var name of FS.readdir(saveFolder()).filter(function (n) { return /\.sve$/i.test(n); }).sort()) {
      var row = node('div', ''); row.className = 'save-file'; row.append(node('span', name));
      (function (name) {
        var download = node('button', 'Download'); download.setAttribute('aria-label', 'Download ' + name);
        download.onclick = async function () {
          if (!await Module.persistFlush()) saveInfo.textContent = 'Local saving failed. Downloading the current memory copy so you can keep a backup.';
          var bytes = FS.readFile(saveFolder() + '/' + name), href = URL.createObjectURL(new Blob([bytes], {type:'application/octet-stream'}));
          var a = document.createElement('a'); a.href = href; a.download = name; a.click(); setTimeout(function () { URL.revokeObjectURL(href); }, 60000);
        }; row.append(download);
      })(name);
      saveList.append(row);
    }
    if (!saveList.childNodes.length) saveList.append(node('p', 'No local saved games yet.'));
  }
  Module.openLocalSaves = function () {
    if (!Module.saveImport || !Module.persistFlush) return;
    Module.cancelMapGesture(); if (Module.aimMode) Module.setAimMode(false);
    saveRoot.hidden = false; saveInfo.textContent = 'Download a backup or import an original save. Existing files require confirmation before replacement.'; listSaves();
  };
  titleSaves.onclick = Module.openLocalSaves;
  saveInput.onchange = async function () {
    saveInput.disabled = true;
    try {
      for (var file of saveInput.files) {
        if (!/\.sve$/i.test(file.name) || /[\\/:\0]/.test(file.name) || file.name.length > 90 || !file.size) throw new Error('Choose an original .sve save with a simple filename.');
        var exists = FS.analyzePath(saveFolder() + '/' + file.name).exists;
        if (exists && !confirm('Replace the local save “' + file.name + '”?')) continue;
        Module.saveImport(file.name, new Uint8Array(await file.arrayBuffer()));
        if (!await Module.persistFlush()) throw new Error('The save could not be stored durably. Keep this page open and download a backup.');
      }
      listSaves(); saveInfo.textContent = 'Import stored on this device. Close this panel, then use Continue or Load game.';
    } catch (e) { saveInfo.textContent = messageError(e); }
    finally { saveInput.disabled = false; saveInput.value = ''; }
  };
  setInterval(function () { titleSaves.hidden = !(Module.localInstall.phase === 'ready' && Module.atTitle && Module.saveImport) || !saveRoot.hidden; }, 250);
  async function prepare() {
    if (!isSecureContext || typeof WebAssembly.Suspending !== 'function' || !navigator.storage?.getDirectory) {
      picker.hidden = true; throw new Error('This browser needs WebAssembly JSPI and private file storage. Try a supported Safari version over HTTPS.');
    }
    await compatibility;
    active = await discover();
    if (active) installedView(); else status('selecting', 'Select the disc image and the supported v1.02 game executable. ZIP and 7z archives can also be inspected locally.');
  }
  prepare().catch(function (e) { picker.hidden = true; status('error', messageError(e), true); rejectReady(e); });
  Module.preRun = Module.preRun || [];
  Module.preRun.push(function () {
    addRunDependency('simgolf-local-files');
    ready.then(function (installed) {
      FS.mkdirTree('/image'); FS.mkdirTree('/assets');
      for (var n of ['golf.bin','jgld.bin']) FS.writeFile('/image/' + n, installed.images[n]);
      var manifest = installed.meta.files.filter(function (f) { return !/^(docs|ereg)\//i.test(f[0]) && !/\.(exe|dll|lib)$/i.test(f[0]); });
      FS.writeFile('/game.manifest', manifest.map(function (f) { return f[0] + '\t' + f[1] + '\n'; }).join(''));
      FS.writeFile('/assets/sound-files.txt', manifest.filter(function (f) { return /\.wav$/i.test(f[0]); }).map(function (f) { return f[0]; }).join('\n'));
      root.hidden = true; status('ready', 'Ready'); removeRunDependency('simgolf-local-files');
    }).catch(function (e) { root.hidden = false; status('error', messageError(e), true); });
  });
})();
