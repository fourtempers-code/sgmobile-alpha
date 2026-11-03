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
      background:radial-gradient(ellipse 90% 46% at 5% 100%,#67679b33 0 55%,transparent 56%),radial-gradient(ellipse 95% 46% at 96% 110%,#aaaad240 0 62%,transparent 63%),linear-gradient(167deg,#ededf8,#c7c7e7 53%,#9e9ec8);
      color:var(--menu-text);font:16px/1.5 system-ui,-apple-system,sans-serif;display:flex;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
    #local-install>div{width:100%;max-width:600px;margin:auto;text-align:center;flex-shrink:0}
    #local-install .install-brand{display:flex;align-items:center;justify-content:center;gap:16px;margin:0 0 22px;text-align:left}
    #local-install .install-brand img{width:88px;height:88px;border-radius:22px;box-shadow:0 5px 12px #39315d1c}
    #local-install .install-brand strong{display:block;font:850 clamp(27px,7vw,42px)/1.05 ui-rounded,system-ui,sans-serif;letter-spacing:-.04em;color:var(--menu-text)}
    #local-install .install-brand span{display:block;margin-top:6px;color:var(--menu-muted);font-size:14px}
    #local-install .install-card{border:2px solid var(--menu-border);border-radius:27px;padding:clamp(20px,5vw,32px);background:linear-gradient(157deg,#ededf8fa,#e1e1f3f5);box-shadow:0 7px 0 #39315d24,0 14px 35px #39315d14}
    #local-install .eyebrow{font-size:11px;letter-spacing:.16em;font-weight:800;color:var(--menu-accent);margin:0 0 12px}
    #local-install h1{font-size:clamp(23px,5.6vw,32px);line-height:1.15;letter-spacing:-.04em;color:var(--menu-text);margin:0 0 12px}
    #local-install p{margin:12px 0}#local-install .install-lead{color:var(--menu-muted);margin:0 auto 20px;max-width:390px}
    #local-install button,#local-install input{font:inherit;max-width:100%;box-sizing:border-box}
    #local-install button{min-height:48px;padding:10px 16px;margin:10px 4px 0;background:var(--menu-button);color:var(--menu-text);border:1px solid var(--menu-border);border-radius:13px;cursor:pointer}
    #local-install button:disabled{opacity:.5;cursor:wait}
    #local-install .install-picker,#local-install #local-install-play{position:relative;display:block;width:100%;min-height:76px;padding:16px 18px;box-sizing:border-box;text-align:left;border:2px solid var(--menu-focus);border-radius:19px;background:linear-gradient(#e1e1f3,#c3cef6 47%,#a9b8e7);box-shadow:0 3px 0 #727094,inset 0 0 0 2px #ffffff8c;color:var(--menu-text);cursor:pointer}
    #local-install .install-picker:has(input[hidden]){display:none}
    #local-install .install-picker:has(input:disabled){opacity:.5;cursor:wait}
    #local-install .install-picker input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:inherit}
    #local-install .install-picker strong{display:block;font-size:20px;line-height:1.2;letter-spacing:-.02em}
    #local-install .install-picker span{display:block;font-size:12px;margin-top:5px;color:var(--menu-muted)}
    #local-install #local-install-play{text-align:center;font-size:22px;font-weight:800}
    #local-install .install-picker:focus-within,#local-install button:focus-visible,#local-install a:focus-visible{outline:3px solid var(--menu-focus);outline-offset:4px}
    #local-install progress{width:100%;height:16px;margin-top:14px;accent-color:var(--menu-accent)}
    #local-install #local-install-message{font-size:14px;font-weight:600;overflow-wrap:anywhere;color:var(--menu-muted)}
    #local-install #local-install-message.error{color:#9b241d;background:#ffece4;border:1px solid #cf8c7c;border-radius:12px;padding:10px}
    #local-install .minor{color:var(--menu-muted);font-size:12px}#local-install .install-privacy{color:var(--menu-muted);font-size:13px;margin:20px 0 0}
    #local-install .install-footer{font-size:12px;margin-top:22px;color:var(--menu-muted)}
    #local-install a{color:var(--menu-accent);text-underline-offset:3px}
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
    #local-install .install-setup{margin:0 0 20px;padding:15px 16px;border:1px solid var(--menu-line);border-radius:15px;background:var(--menu-button);text-align:left;font-size:14px}
    #local-install .install-setup h2{margin:0 0 8px;font-size:17px;color:var(--menu-text)}
    #local-install .install-setup p{margin:8px 0}
    #local-install .install-setup ol{margin:10px 0;padding-left:22px}
    #local-install .install-setup li{margin:10px 0;overflow-wrap:anywhere}
    #local-install .install-setup a{font-weight:700}
    #local-install .install-version{font-size:12px;line-height:1.4;color:var(--menu-muted);margin:-6px 0 16px}
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
  var releaseVersion = node('p', 'Version ' + Module.buildInfo.version.replace(/^alpha/i, '')); releaseVersion.id = 'local-install-version'; releaseVersion.className = 'install-version';
  var heading = node('h1', 'Ready to build your course?'); heading.id = 'local-install-heading';
  var intro = node('p', 'Select your original SimGolf files once to start playing.'); intro.className = 'install-lead';
  var info = node('p', 'Checking local storage…'); info.id = 'local-install-message'; info.setAttribute('role', 'status'); info.setAttribute('aria-live', 'polite');
  var identity = node('p', Module.buildInfo.version + ' · ' + Module.buildInfo.id); identity.className = 'install-identity';
  var picker = document.createElement('input'); picker.id = 'local-install-files'; picker.type = 'file'; picker.multiple = true; picker.accept = '.iso,.bin,.img,.mdf,.exe,.zip,.7z,.rar'; picker.setAttribute('aria-label', 'Select your original game files');
  var pickLabel = node('label', ''); pickLabel.className = 'install-picker'; pickLabel.htmlFor = picker.id;
  pickLabel.append(node('strong', 'Choose Game Files'), node('span', 'Select your disc image and compatible game executable'), picker);
  var quickGuide = node('section', ''); quickGuide.className = 'install-setup'; quickGuide.setAttribute('aria-labelledby', 'local-install-setup-heading');
  var setupHeading = node('h2', 'Quick setup'); setupHeading.id = 'local-install-setup-heading';
  var setupFiles = node('ol', '');
  var discStep = node('li', ''); discStep.append(node('strong', 'Game disc or archive: '), document.createTextNode('a SimGolf .iso file, or a .zip / .7z archive containing the disc image. See '));
  var archiveLink = node('a', 'Internet Archive'); archiveLink.href = 'https://archive.org/details/sid-meiers-sim-golf-1641547'; archiveLink.target = '_blank'; archiveLink.rel = 'noopener noreferrer'; discStep.append(archiveLink, document.createTextNode('.'));
  var exeStep = node('li', ''); exeStep.append(node('strong', 'Compatible no-CD executable: '), document.createTextNode('the supported v1.02 .exe file. See '));
  var executableLink = node('a', 'Abandonware DOS'); executableLink.href = 'https://www.abandonwaredos.com/abandonware-game.php?abandonware=Sid+Meier%27s+SimGolf&gid=2317'; executableLink.target = '_blank'; executableLink.rel = 'noopener noreferrer'; exeStep.append(executableLink, document.createTextNode('.'));
  setupFiles.append(discStep, exeStep);
  quickGuide.append(setupHeading, node('p', 'Save both files in the Files app on your device.'), setupFiles, node('p', 'When both files are ready, tap Choose Game Files above and select them to begin.'));
  var help = node('p', 'The installer checks file compatibility before starting. Your game files are installed locally.'); help.className = 'minor';
  var bar = document.createElement('progress'); bar.max = 1; bar.value = 0; bar.hidden = true; bar.setAttribute('aria-label', 'Game file import progress');
  var play = node('button', 'Play'); play.id = 'local-install-play'; play.hidden = true;
  var replace = node('button', 'Import replacement files'); replace.hidden = true;
  var cancel = node('button', 'Cancel import'); cancel.hidden = true;
  var privacy = node('p', 'Your game files stay on this device.'); privacy.className = 'install-privacy';
  var note = node('p', 'Keep backups of your saves. Clearing this site’s browser data removes local files. The opening movie plays from your local game files.'); note.className = 'minor';
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
  card.append(eyebrow, releaseVersion, donate, community, heading, intro, pickLabel, info, bar, quickGuide, help, play, replace, cancel, privacy, note);
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
    quickGuide.hidden = true; picker.hidden = true; play.hidden = false; replace.hidden = false; cancel.hidden = true; bar.hidden = true;
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
    if(!Module.noVideos)Module.prepareBinkAudio?.();
    try {
      storage = active.top; gameDirs.clear(); Module.localInstall.generation = active.name;
      if (navigator.storage.persist) await navigator.storage.persist().catch(function () {});
      settled = true; status('starting', 'Loading the game…'); resolveReady(active);
    } catch (e) { play.disabled = false; replace.disabled = false; picker.disabled = false; status('error', messageError(e), true); }
  }
  // Keep the native runtime behind its existing preRun promise until an
  // explicit edition choice. This also runs after a successful first import.
  var editions=node('section','');editions.id='game-edition';editions.hidden=true;editions.setAttribute('role','dialog');editions.setAttribute('aria-modal','true');editions.setAttribute('aria-labelledby','game-edition-heading');
  var editionCard=node('div','');editionCard.className='edition-card';
  var editionIcon=node('img','');editionIcon.src=icon.src;editionIcon.alt='';editionIcon.width=72;editionIcon.height=72;
  var editionHeading=node('h1','How would you like to play?');editionHeading.id='game-edition-heading';editionHeading.tabIndex=-1;
  var editionIntro=node('p','Two ways to play. The same SimGolf at heart.');editionIntro.className='edition-lead';
  var editionOptions=node('div','');editionOptions.className='edition-options';
  var editionButtons=[];
  function editionOption(value,title,subtitle,details){
    var b=node('button','');b.type='button';b.id='game-edition-'+value;b.setAttribute('aria-label',title);
    var mark=node('span',value==='classic'?'Original gameplay':'Alpha features');mark.className='edition-badge';
    b.append(mark,node('strong',title),node('span',subtitle),node('small',details));
    b.onclick=async function(){
      if(settled||!active)return;
      if(value==='enhanced'){showEnhancedSettings();return;}
      await launchEdition(value);
    };
    editionButtons.push(b);editionOptions.append(b);
  }
  editionOption('classic','Classic','Familiar play, made for your screen.','Original game pace with the mobile menus, touch controls and visual improvements.');
  editionOption('enhanced','Enhanced','SimGolf with a little more freedom.','Choose your extras: faster speeds, pause controls and clubhouse relocation. Set each one just how you like it.');
  var editionShared=node('p','Both modes use your installed game files and saved games. Choose a mode each time you launch.');editionShared.className='edition-shared';
  var editionBack=node('button','Back');editionBack.type='button';editionBack.id='game-edition-back';editionBack.onclick=function(){editions.hidden=true;root.inert=false;root.hidden=false;play.focus();};
  var editionVersion=node('small','Version '+Module.buildInfo.version.replace(/^alpha/i,''));editionVersion.className='edition-version';
  editionCard.append(editionIcon,editionHeading,editionIntro,editionOptions,editionShared,editionBack,editionVersion);editions.append(editionCard);document.body.append(editions);
  css.textContent+=`
    #game-edition[hidden]{display:none!important}
    #game-edition{position:fixed;inset:0;z-index:1001;display:flex;overflow:auto;box-sizing:border-box;overscroll-behavior:contain;padding:max(24px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));background:radial-gradient(ellipse at 50% 0%,#faf9ff,#ceceeb 55%,#9e9ec8);color:var(--menu-text);font:16px/1.5 system-ui,-apple-system,sans-serif}
    #game-edition .edition-card{width:100%;max-width:800px;flex:none;margin:auto;text-align:center}
    #game-edition img{display:block;margin:0 auto 14px;border-radius:20px;box-shadow:0 6px 20px #39315d26}
    #game-edition h1{font-size:clamp(24px,4vw,34px);line-height:1.2;margin:0 0 8px;letter-spacing:-.035em}
    #game-edition .edition-lead{margin:0 0 24px;color:var(--menu-muted)}
    #game-edition .edition-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;text-align:left}
    #game-edition .edition-options button{display:flex;flex-direction:column;align-items:flex-start;gap:10px;min-height:240px;box-sizing:border-box;width:100%;border:2px solid #727094;border-radius:24px;padding:24px;background:linear-gradient(155deg,#fffff5,#efeddf);color:#1c2541;box-shadow:0 5px 0 #72709450,inset 0 1px #fff;text-align:left;font:inherit;touch-action:manipulation;cursor:pointer}
    #game-edition #game-edition-enhanced{background:linear-gradient(155deg,#f7f5ff,#c3cef6);border-color:#67679b}
    #game-edition .edition-options strong{font-size:30px;line-height:1.2;letter-spacing:-.03em}
    #game-edition .edition-badge{font-size:11px;line-height:20px;font-weight:750;letter-spacing:.08em;text-transform:uppercase;padding:2px 9px;background:#fff9;border-radius:99px;color:#39315d}
    #game-edition .edition-options small{font-size:14px;line-height:1.55;color:#343456}
    #game-edition .edition-shared{font-size:13px;color:var(--menu-muted);max-width:530px;margin:24px auto 14px}
    #game-edition-back{min-height:48px;min-width:120px;padding:10px 22px;background:#e1e1f3;color:#1c2541;border:1px solid #727094;border-radius:99px;font:inherit;cursor:pointer;touch-action:manipulation}
    #game-edition button:focus-visible{outline:3px solid #244781;outline-offset:4px}
    #game-edition .edition-options button:active{transform:translateY(3px);box-shadow:none}
    #game-edition .edition-version{display:block;margin-top:16px;font-size:12px;color:#343456}
    @media(max-width:540px){#game-edition .edition-options{grid-template-columns:1fr;gap:14px}#game-edition .edition-options button{min-height:0;padding:20px;gap:8px}#game-edition img{width:60px;height:60px}#game-edition .edition-lead{margin-bottom:18px}}
    @media(max-height:500px) and (min-width:541px){#game-edition img{display:none}#game-edition .edition-options button{min-height:0;padding:18px}#game-edition .edition-shared{margin:16px auto 8px}}
  `;
  for(var eventType of ['pointerdown','pointerup','pointermove','mousedown','mouseup','click','touchstart','touchmove','touchend','wheel','keydown','keyup','keypress'])editions.addEventListener(eventType,function(e){e.stopPropagation();});
  // The catalog is also the feature policy, so a future explicitly Enhanced
  // addition gets a preference here without forking the shared game/runtime.
  var enhancedSettings=node('section','');enhancedSettings.id='enhanced-settings';enhancedSettings.hidden=true;enhancedSettings.setAttribute('role','dialog');enhancedSettings.setAttribute('aria-modal','true');enhancedSettings.setAttribute('aria-labelledby','enhanced-settings-heading');
  var settingsCard=node('div','');settingsCard.className='enhanced-card';
  var settingsHeader=node('header',''),settingsBrand=node('img','');settingsBrand.src=icon.src;settingsBrand.alt='';settingsBrand.width=60;settingsBrand.height=60;
  var settingsHeadingBox=node('div',''),settingsEyebrow=node('span','ENHANCED');settingsEyebrow.className='enhanced-eyebrow';
  var settingsHeading=node('h1','Your game. Your way.');settingsHeading.id='enhanced-settings-heading';settingsHeading.tabIndex=-1;settingsHeadingBox.append(settingsEyebrow,settingsHeading);settingsHeader.append(settingsBrand,settingsHeadingBox);
  var settingsIntro=node('p','Choose the extras you’d like to play with.');settingsIntro.className='enhanced-intro';
  var settingsTools=node('div','');settingsTools.className='enhanced-tools';var settingsCount=node('span','');settingsCount.id='enhanced-settings-count';settingsCount.setAttribute('aria-live','polite');
  var enableAll=node('button','Enable all');enableAll.type='button';enableAll.id='enhanced-enable-all';var disableAll=node('button','Disable all');disableAll.type='button';disableAll.id='enhanced-disable-all';settingsTools.append(settingsCount,enableAll,disableAll);
  var settingsList=node('div','');settingsList.className='enhanced-list';settingsList.setAttribute('role','group');settingsList.setAttribute('aria-label','Enhanced features');
  var featureInputs=new Map();
  var featureIcons={speed:'<path d="m5 5 8 7-8 7m9-14 8 7-8 7"/>',pause:'<path d="M8 5v14M16 5v14"/>',clubhouse:'<path d="m3 11 9-8 9 8M6 9v12h12V9M10 21v-7h4v7"/>'};
  for(var feature of Module.enhancedFeatureCatalog){
    let f=feature;var row=node('label','');row.className='enhanced-feature';row.htmlFor='enhanced-feature-'+f.id;
    var image=node('span','');image.className='enhanced-feature-icon';image.setAttribute('aria-hidden','true');image.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+(featureIcons[f.icon]||featureIcons.speed)+'</svg>';
    var copy=node('span','');copy.className='enhanced-feature-copy';var title=node('strong',f.name);title.id='enhanced-label-'+f.id;var description=node('span',f.description);description.id='enhanced-description-'+f.id;copy.append(title,description);
    var switchBox=node('span','');switchBox.className='enhanced-switch-box';var input=document.createElement('input');input.type='checkbox';input.id=row.htmlFor;input.setAttribute('role','switch');input.setAttribute('aria-labelledby',title.id);input.setAttribute('aria-describedby',description.id);var onOff=node('span','');onOff.className='enhanced-on-off';onOff.setAttribute('aria-hidden','true');switchBox.append(input,onOff);row.append(image,copy,switchBox);settingsList.append(row);featureInputs.set(f.id,{input:input,label:onOff,row:row});
    input.onchange=function(){Module.setEnhancedPreference(f.id,this.checked);refreshEnhancedSettings();};
  }
  var settingsFooter=node('footer',''),settingsNote=node('p','Your choices are remembered on this device.');settingsNote.id='enhanced-settings-note';var settingsActions=node('div','');settingsActions.className='enhanced-actions';var settingsBack=node('button','Back');settingsBack.type='button';settingsBack.id='enhanced-settings-back';var settingsStart=node('button','Start Enhanced');settingsStart.type='button';settingsStart.id='enhanced-settings-start';settingsActions.append(settingsBack,settingsStart);settingsFooter.append(settingsNote,settingsActions);settingsCard.append(settingsHeader,settingsIntro,settingsTools,settingsList,settingsFooter);enhancedSettings.append(settingsCard);document.body.append(enhancedSettings);
  function refreshEnhancedSettings(){
    var total=Module.enhancedFeatureCatalog.length,count=0;
    for(var [id,item]of featureInputs){var enabled=Module.enhancedPreferences[id];item.input.checked=enabled;item.label.textContent=enabled?'On':'Off';item.row.dataset.enabled=String(enabled);if(enabled)count++;}
    settingsCount.textContent=count+' of '+total+' enabled';enableAll.disabled=count===total;disableAll.disabled=count===0;
    settingsNote.textContent=Module.enhancedPreferencesSaved===false?'Your choices will apply to this launch.':'Your choices are remembered on this device.';
  }
  function showEnhancedSettings(){editions.hidden=true;enhancedSettings.hidden=false;enhancedSettings.scrollTop=0;refreshEnhancedSettings();settingsHeading.focus({preventScroll:true});}
  function setAllFeatures(value){for(var f of Module.enhancedFeatureCatalog)Module.setEnhancedPreference(f.id,value);refreshEnhancedSettings();}
  enableAll.onclick=function(){setAllFeatures(true);};disableAll.onclick=function(){setAllFeatures(false);};
  function closeLoadingSettings(){Module.loadingEditionSettings=false;enhancedSettings.hidden=true;var button=document.getElementById('initial-loading-switch');if(button){button.disabled=!Module.canChangeLoadingEdition();button.focus({preventScroll:true});}}
  settingsBack.onclick=function(){if(Module.loadingEditionSettings){closeLoadingSettings();return;}if(settled)return;enhancedSettings.hidden=true;editions.hidden=false;document.getElementById('game-edition-enhanced').focus({preventScroll:true});};
  async function launchEdition(value){
    if(settled||!active||!Module.selectGameEdition(value))return;
    for(var b of editionButtons)b.disabled=true;editionBack.disabled=settingsBack.disabled=settingsStart.disabled=true;enableAll.disabled=disableAll.disabled=true;for(var item of featureInputs.values())item.input.disabled=true;
    await start();if(settled){enhancedSettings.hidden=editions.hidden=true;root.inert=false;root.hidden=true;}
  }
  settingsStart.onclick=function(){
    if(Module.loadingEditionSettings){if(Module.switchLoadingEdition('enhanced'))closeLoadingSettings();return;}
    launchEdition('enhanced');
  };
  Module.requestLoadingEditionSwitch=function(){
    if(Module.loadingEditionSettings||!Module.canChangeLoadingEdition())return false;
    if(Module.gameEdition==='enhanced')return Module.switchLoadingEdition('classic');
    Module.loadingEditionSettings=true;
    for(var item of featureInputs.values())item.input.disabled=false;
    settingsBack.disabled=settingsStart.disabled=false;settingsStart.textContent='Play Enhanced';
    showEnhancedSettings();return true;
  };
  enhancedSettings.addEventListener('keydown',function(e){if(Module.loadingEditionSettings&&e.key==='Escape'){e.preventDefault();closeLoadingSettings();}});
  for(var type of ['pointerdown','pointerup','pointermove','mousedown','mouseup','click','touchstart','touchmove','touchend','wheel','keydown','keyup','keypress'])enhancedSettings.addEventListener(type,function(e){e.stopPropagation();});
  css.textContent+=`
    #enhanced-settings[hidden]{display:none!important}
    #enhanced-settings{position:fixed;inset:0;z-index:1001;display:flex;overflow:auto;scroll-padding-block:24px 160px;box-sizing:border-box;overscroll-behavior:contain;padding:max(22px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));background:radial-gradient(ellipse at 12% 0%,#f8f7ff,#d0d0ed 50%,#9e9ec8);color:#1c2541;font:16px/1.5 system-ui,-apple-system,sans-serif}
    #enhanced-settings .enhanced-card{width:100%;max-width:760px;flex:none;margin:auto}
    #enhanced-settings header{display:flex;align-items:center;gap:18px;margin-bottom:12px}
    #enhanced-settings header img{border-radius:17px;box-shadow:0 4px 14px #39315d25;flex:none}
    #enhanced-settings .enhanced-eyebrow{font-size:11px;letter-spacing:.18em;font-weight:800;color:#514b7c}
    #enhanced-settings h1{font-size:clamp(25px,4vw,34px);line-height:1.15;letter-spacing:-.035em;margin:4px 0 0}
    #enhanced-settings .enhanced-intro{margin:0 0 20px;color:#343456}
    #enhanced-settings .enhanced-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:14px}
    #enhanced-settings-count{margin-right:auto;font-size:13px;font-weight:650;color:#514b7c}
    #enhanced-settings button{min-height:48px;border:1px solid #79749c;border-radius:999px;padding:10px 18px;background:#efeff9;color:#1c2541;font:inherit;touch-action:manipulation;cursor:pointer}
    #enhanced-settings .enhanced-tools button{min-height:44px;font-size:13px;padding:8px 14px}
    #enhanced-settings button:disabled{opacity:.45;cursor:default}
    #enhanced-settings .enhanced-list{display:flex;flex-direction:column;gap:12px}
    #enhanced-settings .enhanced-feature{display:grid;grid-template-columns:44px minmax(0,1fr) 52px;align-items:center;gap:16px;padding:20px;border:1px solid #a19dc0;border-radius:22px;background:linear-gradient(130deg,#f9f8ffeb,#e4e6f7dc);box-shadow:0 3px 0 #72709420;cursor:pointer;touch-action:manipulation}
    #enhanced-settings .enhanced-feature[data-enabled=true]{border-color:#7777ad;background:linear-gradient(130deg,#fbfaff,#dbe1fa)}
    #enhanced-settings .enhanced-feature-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;background:#c4c9ef;color:#3e467c}
    #enhanced-settings .enhanced-feature-icon svg{width:26px;height:26px}
    #enhanced-settings .enhanced-feature-copy strong{display:block;font-size:18px;line-height:1.3;letter-spacing:-.015em;margin-bottom:5px}
    #enhanced-settings .enhanced-feature-copy>span{display:block;font-size:14px;line-height:1.5;color:#454569}
    #enhanced-settings .enhanced-switch-box{display:flex;flex-direction:column;align-items:center;gap:4px}
    #enhanced-settings input{appearance:none;-webkit-appearance:none;position:relative;display:block;flex:none;box-sizing:border-box;width:52px;height:30px;margin:0;border:1px solid #8883a7;border-radius:99px;background:#b5b3cb;cursor:pointer;touch-action:manipulation;transition:background .18s ease}
    #enhanced-settings input::after{content:'';position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 4px #39315d44;transition:transform .18s ease}
    #enhanced-settings input:checked{background:#4d639f;border-color:#3f5289}#enhanced-settings input:checked::after{transform:translateX(22px)}
    #enhanced-settings .enhanced-on-off{font-size:11px;line-height:14px;font-weight:700;color:#514b7c}
    #enhanced-settings footer{position:sticky;bottom:0;margin-top:18px;padding:14px 0 0;background:linear-gradient(#c7c7e700,#c7c7e7 16px);border-radius:16px;z-index:1}
    #enhanced-settings-note{margin:0 0 10px;font-size:12px;color:#454569;text-align:center}
    #enhanced-settings .enhanced-actions{display:flex;gap:12px;padding-bottom:2px}
    #enhanced-settings-back{flex:1}#enhanced-settings-start{flex:2;background:linear-gradient(#fffef2,#ffdf75)!important;border-color:#67628e!important;font-weight:750!important;box-shadow:inset 0 1px #fff,0 3px 0 #72709444}
    #enhanced-settings :is(input,button):focus-visible{outline:3px solid #244781;outline-offset:4px}
    @media(max-width:540px){#enhanced-settings .enhanced-feature{grid-template-columns:36px minmax(0,1fr) 52px;gap:12px;padding:16px 12px}#enhanced-settings .enhanced-feature-icon{width:36px;height:36px}#enhanced-settings .enhanced-feature-icon svg{width:23px;height:23px}#enhanced-settings .enhanced-feature-copy strong{font-size:16px}#enhanced-settings .enhanced-feature-copy>span{font-size:13px}#enhanced-settings-count{width:100%}#enhanced-settings .enhanced-tools button{flex:1}}
    @media(max-height:500px) and (min-width:541px){#enhanced-settings header img{width:46px;height:46px}#enhanced-settings .enhanced-feature{padding:14px 18px}#enhanced-settings .enhanced-intro{margin-bottom:12px}#enhanced-settings footer{padding-top:12px}}
    @media(prefers-reduced-motion:reduce){#enhanced-settings input,#enhanced-settings input::after{transition:none}}
  `;

  function chooseEdition(){
    if(!active||settled||worker)return;
    if(!Module.noVideos)Module.prepareBinkAudio?.();
    root.inert=true;root.hidden=true;editions.hidden=false;editions.scrollTop=0;editionHeading.focus();
  }
  Module.showEditionNotice=function(message){
    var notice=document.getElementById('game-edition-notice');
    if(!notice){notice=node('div','');notice.id='game-edition-notice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');document.body.append(notice);}
    notice.textContent=message;notice.hidden=false;clearTimeout(Module.editionNoticeTimer);Module.editionNoticeTimer=setTimeout(function(){notice.hidden=true;},6000);
  };
  css.textContent+='#game-edition-notice[hidden]{display:none!important}#game-edition-notice{position:fixed;z-index:1002;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 76px);left:max(16px,env(safe-area-inset-left));right:max(16px,env(safe-area-inset-right));max-width:540px;margin:auto;padding:16px 20px;box-sizing:border-box;border:1px solid #727094;border-radius:16px;background:#ededf8f5;color:#1c2541;box-shadow:0 4px 18px #1c254133;font:15px/1.5 system-ui,sans-serif;pointer-events:none}';
  play.onclick = chooseEdition;
  replace.onclick = function () { quickGuide.hidden = false; picker.hidden = false; selected = []; cancel.hidden = false; play.hidden = true; replace.hidden = true; status('selecting', 'Choose replacement files. Your current installation and saves will be preserved.'); };
  cancel.onclick = function () {
    if (worker) { worker.terminate(); worker = null; }
    selected = []; picker.disabled = false; picker.value = ''; bar.hidden = true;
    if (active) installedView(); else { cancel.hidden = true; status('selecting', 'Import cancelled. Choose your original files to try again.'); }
  };
  picker.onchange = function () {
    if (!picker.files.length || worker) return;
    if(!Module.noVideos)Module.prepareBinkAudio?.();
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
        try { active = await discover(); if (!active) throw new Error('The completed installation could not be validated.'); picker.disabled = false; selected = []; installedView(); }
        catch (e) { picker.disabled = false; status('error', messageError(e), true); }
      }
    };
    worker.onerror = function () { if (worker !== job) return; if (worker) worker.terminate(); worker = null; picker.disabled = false; status('error', 'Import stopped. Your previous installation and saves are preserved. Choose files to retry.', true); };
    worker.postMessage({files:selected, options:{convertVideos:false}});
  };
  // File transfer and retained snapshots share the mobile Save files page.
  var saveRoot = node('section', ''); saveRoot.id = 'local-save-files'; saveRoot.hidden = true;
  saveRoot.setAttribute('role', 'dialog'); saveRoot.setAttribute('aria-modal', 'true');
  var saveBox = node('div', ''), saveHeading = node('h1', 'Save files'), saveInfo = node('p', 'Download a backup or import an original save.');
  var saveInput = document.createElement('input'); saveInput.type = 'file'; saveInput.accept = '.sve'; saveInput.multiple = true; saveInput.id = 'local-save-import'; saveInput.setAttribute('aria-label', 'Import saved games');
  saveInput.hidden = true;
  var saveChoose = node('button', 'Import from Files…'); saveChoose.id = 'local-save-choose';
  var saveHelp = node('p', 'Newest files first, using actual save/modified times. Older imports may show when copied. Save to… opens a location chooser or your device’s sharing options when supported. Download uses your browser’s download location. Import from Files… lets you browse for .sve files.');
  var saveList = node('div', ''), saveClose = node('button', 'Back to game'); saveClose.id = 'local-save-close';
  var saveTabs=node('nav','');saveTabs.setAttribute('aria-label','Save files views');saveTabs.className='save-views';
  var filesTab=node('button','Saved games'),historyTab=node('button','Backup history');filesTab.id='local-saved-games';historyTab.id='local-backup-history';saveTabs.append(filesTab,historyTab);
  var historyView=false,historyRequest=0,saveReturnFocus=null;
  function closeSaves(){if(transferBusy)return;saveRoot.hidden=true;Module.saveFilesOpen=Module.backupHistoryOpen=false;historyRequest++;saveReturnFocus?.focus?.({preventScroll:true});}
  saveClose.onclick=closeSaves;
  saveRoot.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();closeSaves();}});
  saveInfo.id = 'local-save-status'; saveInfo.setAttribute('role', 'status'); saveInfo.setAttribute('aria-live', 'polite');
  var saveToolbar=node('header','');saveToolbar.className='save-toolbar';saveToolbar.append(saveHeading,saveClose);saveBox.append(saveToolbar, saveInfo, saveTabs, saveHelp, saveChoose, saveInput, saveList); saveRoot.append(saveBox); document.body.append(saveRoot);
  css.textContent += '#local-save-files[hidden],#local-title-actions[hidden],#local-title-saves[hidden]{display:none!important}#local-save-files{position:fixed;left:var(--screen-left,0px);top:var(--screen-top,0px);width:var(--screen-width,100%);height:var(--screen-height,100dvh);z-index:999;background:var(--menu-bg);color:var(--menu-text);overflow:auto;padding:max(24px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));box-sizing:border-box;font:17px/1.5 system-ui,sans-serif}#local-save-files>div{max-width:650px;margin:auto}#local-save-files button,#local-title-saves{font:inherit;min-height:48px;padding:10px 14px;background:var(--menu-button);color:var(--menu-text);border:1px solid var(--menu-border);border-radius:8px;margin:6px 0}#local-save-files input{font:inherit;max-width:100%}#local-save-files .save-file{display:flex;justify-content:space-between;align-items:center;gap:10px;border-bottom:1px solid var(--menu-line)}#local-save-files .save-file span{overflow-wrap:anywhere}#local-title-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;position:fixed;left:calc(var(--screen-left,0px) + max(12px,env(safe-area-inset-left)));bottom:calc(var(--screen-bottom-gap,0px) + max(12px,env(safe-area-inset-bottom)));right:calc(var(--screen-right-gap,0px) + max(12px,env(safe-area-inset-right)));z-index:50}';
  for (var type of ['pointerdown','pointerup','pointermove','mousedown','mouseup','click','touchstart','touchmove','touchend','wheel','keydown','keyup','keypress']) saveRoot.addEventListener(type, function (e) { e.stopPropagation(); });
  var titleActions = node('div', ''); titleActions.id = 'local-title-actions'; titleActions.hidden = true;
  var titleSaves = node('button', 'Save files'); titleSaves.id = 'local-title-saves'; titleSaves.hidden = true; titleActions.append(titleSaves); document.body.append(titleActions);
  function saveFolder() { return '/game/' + (FS.readdir('/game').find(function (d) { return d.toLowerCase() === 'saved games'; }) || 'Saved Games'); }
  var transferBusy = false;
  function transferStatus(phase, message, name) {
    saveInfo.textContent = message;Module.saveTransfer = {phase:phase,name:name||'',message:message};
    saveInfo.scrollIntoView?.({block:'nearest'});
  }
  function transferLock(busy) {
    transferBusy=busy;saveChoose.disabled=saveInput.disabled=filesTab.disabled=historyTab.disabled=busy;
    for(var b of saveList.querySelectorAll('button'))b.disabled=busy;
    saveClose.disabled=busy;saveRoot.setAttribute('aria-busy',String(busy));
  }
  function canShareFile(file) {
    try { return !!navigator.share && !!navigator.canShare?.({files:[file]}); } catch (_) { return false; }
  }
  function exportSave(name,choose){return exportBytes(name,FS.readFile(saveFolder()+'/'+name),choose);}
  async function exportBytes(name,bytes,choose) {
    if(transferBusy)return;transferLock(true);
    try {
      // Snapshot the current save synchronously. Invoke native pickers/sharing
      // inside the click's activation, before any persistence/network await.
      var file = new File([bytes],name,{type:'application/octet-stream'});
      if(choose && typeof window.showSaveFilePicker==='function') {
        transferStatus('choosing','Choose where to save '+name+'.',name);
        var handle=await window.showSaveFilePicker({suggestedName:name,id:'simgolf-save-backups',startIn:'documents',types:[{description:'SimGolf saved game',accept:{'application/octet-stream':['.sve']}}]});
        var writable=await handle.createWritable();
        try { await writable.write(file);await writable.close(); } catch(error) { try { await writable.abort(); } catch(_) {} throw error; }
        transferStatus('saved','Saved '+name+' to the location you chose.',name);
      } else if(choose && canShareFile(file)) {
        transferStatus('sharing','Choose Save to Files or another destination for '+name+'.',name);
        await navigator.share({files:[file],title:name});
        transferStatus('shared','Returned from sharing '+name+'. If you chose Save to Files, look in the folder you selected.',name);
      } else {
        var href=URL.createObjectURL(file),a=document.createElement('a');a.href=href;a.download=name;a.hidden=true;document.body.append(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(href);},60000);
        transferStatus('download-requested','Download requested: '+name+'. Check Downloads in your browser or the Files app. Your browser controls the download location; this app cannot confirm the file reached that folder.',name);
      }
    } catch(error) {
      transferStatus(error.name==='AbortError'?'cancelled':'error',error.name==='AbortError'?'Save cancelled. Your local saved game is unchanged.':'Could not export '+name+': '+messageError(error)+'. Your local saved game is unchanged; try Download instead.',name);
    } finally { transferLock(false); }
  }
  function listSaves() {
    saveList.replaceChildren();
    // Use the same persistent write/modified time as Continue. Lazy original
    // files have no saved timestamp; their fetch time must not make them new.
    var saves=FS.readdir(saveFolder()).filter(function(n){return /\.sve$/i.test(n);}).map(function(name){
      return {name:name,modified:Module.gameFileModified?.('Saved Games/'+name)||null};
    }).sort(function(a,b){return (b.modified||0)-(a.modified||0)||a.name.localeCompare(b.name);});
    for (var saved of saves) {
      var name=saved.name,row=node('div','');row.className='save-file';row.dataset.save=name;
      var details=node('div','');details.className='save-file-details';details.append(node('span',name));
      var date=node('time',saved.modified?'Last saved '+new Date(saved.modified).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}):'Save time unavailable');
      if(saved.modified)date.dateTime=new Date(saved.modified).toISOString();details.append(date);row.append(details);
      (function (name) {
        var actions=node('div','');actions.className='save-file-actions';
        var example=new File([FS.readFile(saveFolder()+'/'+name)],name,{type:'application/octet-stream'});
        if(typeof window.showSaveFilePicker==='function'||canShareFile(example)) {
          var choose=node('button','Save to…');choose.setAttribute('aria-label','Save to '+name);choose.onclick=function(){exportSave(name,true);};actions.append(choose);
        }
        var download = node('button', 'Download'); download.setAttribute('aria-label', 'Download ' + name);
        download.onclick = function () { exportSave(name,false); };actions.append(download);row.append(actions);
      })(name);
      saveList.append(row);
    }
    if (!saveList.childNodes.length) saveList.append(node('p', 'No local saved games yet.'));
  }
  css.textContent+='#local-save-files .save-file-details{flex:1 1 220px;min-width:0}#local-save-files .save-file-details time{display:block;font-size:.85em;opacity:.8;margin-top:3px}#local-save-files .save-file-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;flex-shrink:0}#local-save-files .save-file{flex-wrap:wrap;padding:10px 0}#local-save-status{position:sticky;top:max(8px,env(safe-area-inset-top));z-index:2;padding:10px;background:var(--menu-panel);border-radius:8px;overflow-wrap:break-word}body.mobile-rail-visible #local-save-files{padding-right:calc(max(18px,env(safe-area-inset-right)) + 64px)}';
  function snapshotFilename(snap){return 'Backup '+new Date(snap.time).toISOString().replace(/[:.]/g,'-')+' '+snap.id+'.sve';}
  async function snapshotAction(id,restore){
    if(transferBusy)return;transferLock(true);
    try{
      const snap=await Module.saveHistory.get(id);
      if(!snap)throw new Error('That backup is no longer available. Reopen Backup history to refresh the list.');
      if(!restore){transferLock(false);await exportBytes(snapshotFilename(snap),snap.bytes,false);return;}
      let name='Restored '+new Date(snap.time).toISOString().replace(/[:.]/g,'-')+' '+snap.id+'.sve',suffix=1;
      const base=name.slice(0,-4);while(FS.readdir(saveFolder()).some(n=>n.toLowerCase()===name.toLowerCase()))name=base+' ('+(suffix++)+').sve';
      Module.saveImport(name,new Uint8Array(snap.bytes));
      if(!await Module.persistFlush())throw new Error('The restored copy could not be stored durably. Keep this page open and download the original backup.');
      transferStatus('restored','Restored a separate saved game: '+name+'. Back to game, then Continue or Load game to open it. Your current game and the original backup are unchanged.',name);
    }catch(error){transferStatus('error',messageError(error));}
    finally{transferLock(false);}
  }
  async function listHistory(){
    const request=++historyRequest;saveList.replaceChildren(node('p','Loading backup history…'));
    try{
      if(!Module.saveHistory)throw new Error('Backup history is not ready yet.');
      const snaps=await Module.saveHistory.list();if(request!==historyRequest||!historyView||saveRoot.hidden)return;
      saveList.replaceChildren();
      for(const snap of snaps){
        const row=node('div','');row.className='save-file';row.dataset.snapshot=String(snap.id);
        const details=node('div','');details.className='save-file-details';details.append(node('span',snap.name.replace(/^&/,'')));
        const date=node('time',new Date(snap.time).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}));date.dateTime=new Date(snap.time).toISOString();details.append(date,node('small',Math.round(snap.size/1024)+' KB'));row.append(details);
        const actions=node('div','');actions.className='save-file-actions';
        const restore=node('button','Restore copy');restore.setAttribute('aria-label','Restore backup '+snap.id);restore.onclick=()=>snapshotAction(snap.id,true);
        const download=node('button','Download');download.setAttribute('aria-label','Download backup '+snap.id);download.onclick=()=>snapshotAction(snap.id,false);actions.append(restore,download);row.append(actions);saveList.append(row);
      }
      if(!snaps.length)saveList.append(node('p','No backup snapshots yet. Save a game, or play for three minutes to create an autosave.'));
      if(transferBusy)for(const b of saveList.querySelectorAll('button'))b.disabled=true;
    }catch(error){if(request===historyRequest){saveList.replaceChildren(node('p','Backup history unavailable: '+messageError(error)));}}
  }
  function selectSaveView(history){
    if(transferBusy)return;historyView=history;Module.backupHistoryOpen=history;historyRequest++;
    filesTab.setAttribute('aria-pressed',String(!history));historyTab.setAttribute('aria-pressed',String(history));
    saveChoose.hidden=history;saveInput.hidden=true;
    saveHelp.textContent=history?'Newest first · 20 recent backups, plus up to 20 older copies at 30-minute intervals. Restore copy adds a saved game you can open from Continue or Load game. Stored on this device.':'Newest files first, using actual save/modified times. Older imports may show when copied. Save to… opens a location chooser or your device’s sharing options when supported. Download uses your browser’s download location. Import from Files… lets you browse for .sve files.';
    transferStatus('ready',history?'Backup history · saved games and autosaves':'Choose a save to export, or import from Files. Existing files require confirmation before replacement.');
    if(history)listHistory();else listSaves();
  }
  filesTab.onclick=()=>selectSaveView(false);historyTab.onclick=()=>selectSaveView(true);
  css.textContent+='#local-save-files .save-views{display:flex;gap:8px;flex-wrap:wrap}#local-save-files .save-views button[aria-pressed="true"]{background:var(--menu-selected,#fff3a0);box-shadow:inset 0 0 0 2px var(--menu-border)}#local-save-files small{display:block;opacity:.7}#local-save-files [hidden]{display:none!important}#local-save-files .save-toolbar{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--menu-bg);padding:4px 0 10px}#local-save-files .save-toolbar h1{font-size:27px;line-height:1.15;margin:4px 0}#local-save-close{flex-shrink:0}#local-save-status{position:static;font-size:15px;line-height:1.35;margin:8px 0}#local-save-files nav+ p{font-size:14px;line-height:1.4}#local-save-files .save-file-actions button{font-size:16px}';
  Module.openLocalSaves = function () {
    if (!Module.saveImport || !Module.persistFlush) return;
    Module.cancelMapGesture(); if (Module.aimMode) Module.setAimMode(false);
    saveReturnFocus=document.activeElement;saveRoot.hidden=false;Module.saveFilesOpen=true;selectSaveView(false);saveRoot.scrollTop=0;filesTab.focus({preventScroll:true});
  };
  titleSaves.onclick = Module.openLocalSaves;
  new ResizeObserver(function(){Module.refreshCanvasPresentation?.();}).observe(titleActions);
  async function importSaves(files) {
    if(transferBusy||!files.length)return;transferLock(true);
    var imported=0,skipped=0;
    try {
      for (var file of files) {
        if (!/\.sve$/i.test(file.name) || /[\\/:\0]/.test(file.name) || file.name.length > 90 || !file.size) throw new Error('Choose an original .sve save with a simple filename.');
        var exists = FS.analyzePath(saveFolder() + '/' + file.name).exists;
        if (exists && !confirm('Replace the local save “' + file.name + '”?')) {skipped++;continue;}
        transferStatus('importing','Importing '+file.name+'…',file.name);
        Module.saveImport(file.name, new Uint8Array(await file.arrayBuffer()));
        if (!await Module.persistFlush()) throw new Error('The save could not be stored durably. Keep this page open and download a backup.');
        imported++;
      }
      listSaves();transferStatus('imported','Import stored on this device: '+imported+' saved game'+(imported===1?'':'s')+(skipped?' ('+skipped+' kept unchanged)':'')+'. Close this panel, then use Continue or Load game.');
    } catch (e) { transferStatus('error',messageError(e)+(imported?' '+imported+' earlier file(s) were imported.':''));listSaves(); }
    finally { transferLock(false);saveInput.value=''; }
  }
  saveInput.onchange=function(){importSaves(Array.from(saveInput.files));};
  saveChoose.onclick=async function(){
    if(transferBusy)return;
    if(typeof window.showOpenFilePicker!=='function'){saveInput.click();return;}
    transferLock(true);
    try {
      var handles=await window.showOpenFilePicker({multiple:true,id:'simgolf-save-imports',startIn:'documents',types:[{description:'SimGolf saved game',accept:{'application/octet-stream':['.sve']}}]});
      var files=await Promise.all(handles.map(function(h){return h.getFile();}));transferLock(false);await importSaves(files);
    } catch(error) {transferStatus(error.name==='AbortError'?'cancelled':'error',error.name==='AbortError'?'Import cancelled. Your local saved games are unchanged.':'Could not open the file chooser: '+messageError(error)+'. Try the basic file picker below.');}
    finally {transferLock(false);}
    // A browser can expose a picker API but deny it in the current context.
    // Keep a user-activated ordinary picker available after that failure.
    if(Module.saveTransfer?.phase==='error')saveInput.hidden=false;
  };
  setInterval(function () { titleSaves.hidden = titleActions.hidden = !(Module.localInstall.phase === 'ready' && Module.atTitle && Module.saveImport) || !saveRoot.hidden; }, 250);
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
