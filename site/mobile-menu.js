// Basic mobile action menu. Original game commands/rules stay in the engine.
(function () {
  if (!Module.mobileMap) return;
  Module.menuQueue = [];
  var page='', open=false, last='', s={}, seenCourse=false, building=false, pendingHole=null, wasRound=false, lastTurn=0, lastReady=false, shotChoicesOpen=false, shotFingerprint='', infoOpen=false, scoreOpen=false, scoreFingerprint='', buildPage='', stripStamp='';
  var leaderboardOpen=false,wasTournament=false,leaderboardStamp='';
  var courseBadgeStamp='';
  var activeImprovement=-1,buildingChoices=false,panBuildTool=null,lastBuildTool=null;
  var landmarkBenefits=['Boosts nearby golfers’ happiness.','Prevents dandelions nearby.','Helps your golfer improve skills nearby.','Encourages happy outcomes in nearby golfer stories.'];
  function landmarkName(l){var n=l?.name.trim();return n?n.charAt(0).toUpperCase()+n.slice(1):'Landmark';}
  function landmarkPrice(l){return l.free?'Free · donated landmark':'$'+l.price.toLocaleString();}
  function openLandmarks(){openCatalogue('landmarks');}
  function openCatalogue(name){Module.cancelMapGesture();open=true;page=name;render();}
  var buildingBenefits=['Helps imaginative golfers.','Feeds hungry golfers.','Improves accurate golfers.','Encourages golfers to become members.','Helps long hitters.','Helps golfers play faster.','Increases property values.','Helps golfers stay happier.','Supports higher greens fees.'];
  var improvements=[['Ballwasher',0,3],['Pathway',1,0],['Building lot',2,5],['Bench',3,1],['Landmark',4,4],['Flower bed',5,2],['Scenic tree',6,16],['Scenic bridge',9,19]];
  var root=document.createElement('div');root.id='mobile-ui';
  var style=document.createElement('style');style.textContent=`
    #mobile-ui{position:fixed;inset:22px 0 0;z-index:30;pointer-events:none;color:#fff;font:15px system-ui,sans-serif}
    #sv-btn{display:none!important}
    #mobile-ui [hidden]{display:none!important}
    #mobile-ui button,#mobile-ui input{font:inherit;min-height:44px;box-sizing:border-box}
    #mobile-ui button{padding:9px 12px;border:1px solid #aaa;border-radius:5px;background:#243229;color:#fff;cursor:pointer;touch-action:manipulation;pointer-events:auto}
    #mobile-ui button[aria-pressed=true]{background:#496d42;border-color:#eee}
    #mobile-ui .icon{width:48px;height:48px;padding:10px}#mobile-ui .icon svg{width:26px;height:26px;display:block;pointer-events:none}
    #mobile-build-actions{position:absolute;right:calc(max(8px,env(safe-area-inset-right)) + 168px);bottom:calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px));display:flex;gap:6px}
    #mobile-cancel{position:absolute;left:max(8px,env(safe-area-inset-left));bottom:calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px))}
    #mobile-build-strip{position:absolute;left:max(8px,env(safe-area-inset-left));right:max(8px,env(safe-area-inset-right));bottom:max(8px,env(safe-area-inset-bottom));padding:6px;background:#142219f2;border:1px solid #879b86;border-radius:6px;pointer-events:auto;box-sizing:border-box}
    #mobile-build-strip .strip-title{font-size:13px;margin:0 0 4px}#mobile-build-strip .strip-items{display:flex;gap:6px;overflow-x:auto;overscroll-behavior:contain;touch-action:pan-x;padding-bottom:3px}
    #mobile-build-strip button{flex:0 0 88px;min-height:72px;padding:5px;font-size:12px;touch-action:pan-x}
    #mobile-build-strip canvas{width:64px;height:42px;object-fit:contain;display:block;margin:auto;image-rendering:pixelated;pointer-events:none}
    #mobile-build-strip span{display:block}#mobile-build-strip .variations{margin-top:6px}#mobile-build-strip .variations button{min-height:44px;flex-basis:108px}#mobile-build-strip .landmark-choice{flex-basis:auto;min-height:44px;white-space:nowrap}#mobile-build-strip svg{width:36px;height:42px;display:block;margin:auto;pointer-events:none}
    #mobile-panel.landmarks{left:max(8px,env(safe-area-inset-left));right:max(8px,env(safe-area-inset-right));top:max(8px,env(safe-area-inset-top));bottom:max(8px,env(safe-area-inset-bottom));width:auto;max-height:none!important;z-index:2;background:#142219}
    #mobile-ui.landmarks-open > :not(#mobile-panel){visibility:hidden}#mobile-panel.landmarks > button:first-child{position:sticky;top:0;z-index:1}
    #mobile-panel.landmarks .items{grid-template-columns:1fr;align-items:stretch}#mobile-panel.landmarks .landmark-card{display:flex;flex-direction:row;align-items:center;gap:12px;text-align:left;min-height:112px}#mobile-panel.landmarks .landmark-card strong{font-size:17px}#mobile-panel.landmarks .landmark-card span{font-size:14px;line-height:1.35}#mobile-panel.landmarks .landmark-card:disabled{opacity:.7}#mobile-panel.landmarks .landmark-status{font-weight:bold}
    #mobile-panel.landmarks .landmark-card canvas{width:88px;height:88px;object-fit:contain;flex:none;image-rendering:pixelated}#mobile-panel.landmarks .card-details{display:flex;flex-direction:column;gap:5px;min-width:0}
    #mobile-ui button:disabled{opacity:.45;cursor:default}
    #mobile-menu{position:absolute;top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right))}
    #mobile-panel{position:absolute;left:max(8px,env(safe-area-inset-left));top:calc(max(8px,env(safe-area-inset-top)) + 50px);width:min(330px,calc(100vw - env(safe-area-inset-left) - env(safe-area-inset-right) - 16px));max-height:calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 94px);overflow:auto;background:#142219f2;border:1px solid #aaa;border-radius:6px;padding:8px;box-sizing:border-box;pointer-events:auto;overscroll-behavior:contain}
    #mobile-panel h2{font-size:17px;margin:8px 0}#mobile-panel p{margin:8px 0;font-size:13px}
    #mobile-panel .items{display:grid;grid-template-columns:1fr 1fr;gap:6px}#mobile-panel .wide{grid-column:1/-1}
    #mobile-dialog-actions{position:absolute;right:max(8px,env(safe-area-inset-right));bottom:max(8px,env(safe-area-inset-bottom));display:flex;gap:6px}
    #mobile-panel input{width:100%;color:#111;background:white;border:1px solid #aaa;padding:6px}
    #mobile-round-controls{position:absolute;left:max(8px,env(safe-area-inset-left));right:80px;bottom:calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px) + 54px);display:flex;gap:6px;flex-wrap:wrap}
    #mobile-shot-choices{position:absolute;left:max(8px,env(safe-area-inset-left));right:max(8px,env(safe-area-inset-right));bottom:calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px) + 162px);display:flex;gap:6px;overflow:auto;padding:4px;background:#142219ed;border-radius:6px;pointer-events:auto;overscroll-behavior:contain}
    #mobile-shot-choices button{flex:0 0 auto}#mobile-shot-choices button[aria-pressed=true]{background:#496d42;border-color:#eee}
    #mobile-lot-controls{position:absolute;left:max(8px,env(safe-area-inset-left));right:max(8px,env(safe-area-inset-right));bottom:calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px) + 58px);display:flex;gap:10px;align-items:center;padding:8px;background:#142219f2;border-radius:6px;pointer-events:auto}#mobile-lot-controls div{flex:1;font-size:13px;line-height:1.4;text-align:center}#mobile-place-lot{flex:none;min-width:70px}
    #mobile-round-info{position:absolute;left:max(8px,env(safe-area-inset-left));right:max(8px,env(safe-area-inset-right));bottom:calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px) + 220px);max-height:24vh;overflow:auto;padding:6px;background:#142219ed;border-radius:6px;font-size:13px;text-align:center;pointer-events:auto}
    @media(min-width:720px){#mobile-round-controls{left:calc(max(8px,env(safe-area-inset-left)) + 54px);bottom:calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px) + 54px);right:180px}#mobile-shot-choices{bottom:calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px) + 108px)}#mobile-round-info{bottom:calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px) + 166px)}}
    #mobile-course-badge{position:absolute;left:max(8px,env(safe-area-inset-left));top:max(8px,env(safe-area-inset-top));display:flex;align-items:center;gap:0;padding:5px 8px 5px 0;box-sizing:border-box;width:calc(100% - max(8px,env(safe-area-inset-left)) - max(8px,env(safe-area-inset-right)) - 64px);max-width:620px;min-height:78px;pointer-events:none;isolation:isolate}
    #mobile-course-badge:before{content:"";position:absolute;inset:0 0 0 28px;background:rgba(20,34,25,.7794);border-radius:6px;z-index:-1}
    #mobile-course-badge canvas{width:72px;height:72px;object-fit:contain;flex:none;margin-right:4px;image-rendering:pixelated}
    #mobile-course-details{min-width:0;flex:1;display:grid;grid-template-columns:minmax(0,1fr) max-content;grid-template-rows:26px 20px 20px;column-gap:8px;align-items:center}
    #mobile-course-heading{grid-area:1/1;display:flex;align-items:baseline;gap:5px;min-width:0;white-space:nowrap}
    #mobile-course-name{font-size:17px;line-height:24px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
    #mobile-course-meta{font-size:11px;line-height:18px;font-weight:400;margin:0;white-space:nowrap;flex:none}
    #mobile-course-date{grid-area:2/1;font-size:12px;line-height:20px;white-space:nowrap}
    #mobile-course-row{grid-area:3/1;min-width:0}
    #mobile-course-indicators{font-size:11px;line-height:20px;display:flex;gap:4px;align-items:center;flex-wrap:nowrap;min-width:0}
    #mobile-course-indicators p{display:contents}#mobile-course-indicators p[hidden]{display:none!important}#mobile-course-indicators .course-counter{display:inline-flex;align-items:center;gap:2px;flex:none;white-space:nowrap}#mobile-course-indicators .course-counter svg{width:13px;height:13px;flex:none}
    #mobile-course-stats{display:contents}#mobile-course-stats span{grid-column:2;text-align:right;white-space:nowrap;font-size:12px;line-height:20px}
    #mobile-course-stats #mobile-course-money{grid-row:1;font-size:17px;line-height:24px;font-weight:600;color:#42ff42}
    #mobile-course-stats #mobile-course-money[data-negative=true]{color:#ff4242}
    /* Original HUD404bc0: Fun RGB5557ff0, Skill03ff; GDI expands5-bit channels. */
    #mobile-course-fun{grid-row:2;color:#ffff84}#mobile-course-skill{grid-row:3;color:#00ffff}
    @media(max-width:500px){#mobile-course-badge{max-width:none}#mobile-course-badge canvas{width:64px;height:72px}#mobile-course-details{column-gap:5px}#mobile-course-name,#mobile-course-stats #mobile-course-money{font-size:16px}#mobile-course-meta{font-size:10px}#mobile-course-indicators{gap:3px;font-size:10px}#mobile-course-indicators .course-counter svg{width:12px;height:12px}}
    @media(max-width:360px){#mobile-course-details{column-gap:3px}#mobile-course-heading{gap:3px}#mobile-course-indicators{gap:2px;font-size:9px}#mobile-course-indicators .course-counter{gap:1px}#mobile-course-indicators .course-counter svg{width:10px;height:10px}#mobile-course-stats span{font-size:10px}}
    #mobile-leaderboard-toggle{position:absolute;left:max(8px,env(safe-area-inset-left));top:calc(max(8px,env(safe-area-inset-top)) + var(--course-badge-space,0px));max-width:calc(100% - max(8px,env(safe-area-inset-left)) - max(8px,env(safe-area-inset-right)) - 64px)}
    #mobile-leaderboard{position:absolute;left:max(8px,env(safe-area-inset-left));top:calc(max(8px,env(safe-area-inset-top)) + var(--course-badge-space,0px) + 52px);width:min(330px,calc(100% - env(safe-area-inset-left) - env(safe-area-inset-right) - 16px));max-height:min(55dvh,calc(100% - max(8px,env(safe-area-inset-top)) - var(--course-badge-space,0px) - max(8px,env(safe-area-inset-bottom)) - 120px));overflow:auto;overscroll-behavior:contain;touch-action:pan-y;box-sizing:border-box;background:#142219f2;border:1px solid #879b86;border-radius:6px;padding:10px;pointer-events:auto}
    #mobile-leaderboard h2{font-size:16px;margin:0 0 6px}#mobile-leaderboard p{font-size:13px;margin:3px 0;overflow-wrap:anywhere}#mobile-leaderboard ol{list-style:none;margin:8px 0 0;padding:0}#mobile-leaderboard li{padding:6px 0;border-top:1px solid #556b58;font-size:14px;overflow-wrap:anywhere}
    #mobile-camera{position:absolute;right:max(8px,env(safe-area-inset-right));bottom:calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px));display:flex;gap:6px}
    #mobile-round-toggles{position:absolute;left:calc(max(8px,env(safe-area-inset-left)) + 54px);bottom:calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px));display:flex;gap:6px}#mobile-round-toggles button{padding:9px 8px}
    #mobile-scorecard{position:absolute;left:max(8px,env(safe-area-inset-left));right:max(8px,env(safe-area-inset-right));bottom:calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px) + 220px);max-height:32vh;overflow:auto;background:#142219f2;padding:8px;border-radius:6px;pointer-events:auto;text-align:center}
    #mobile-scorecard table{border-collapse:collapse;width:100%;font-size:13px}#mobile-scorecard th,#mobile-scorecard td{padding:4px;border-bottom:1px solid #556b58}#mobile-scorecard caption{padding:4px}#mobile-scorecard tr.current{background:#365137}
    @media(min-width:720px){#mobile-scorecard{bottom:calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px) + 166px)}}
    #mobile-build{position:absolute;right:max(8px,env(safe-area-inset-right));top:calc(max(8px,env(safe-area-inset-top)) + 50px)}
    #mobile-close-photo{position:absolute;left:max(8px,env(safe-area-inset-left));top:max(8px,env(safe-area-inset-top))}
    #mobile-open-hole{position:absolute;left:calc(max(8px,env(safe-area-inset-left)) + 54px);bottom:calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px));width:48px;height:48px;font-weight:bold}
    #mobile-closeup{position:absolute;right:max(8px,env(safe-area-inset-right));bottom:calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px) + 52px);background:#142219e8;border-radius:6px;padding:6px;pointer-events:none}
    #mobile-closeup output{min-width:40px;text-align:center}
    #mobile-message{position:absolute;top:calc(max(8px,env(safe-area-inset-top)) + 50px);left:max(8px,env(safe-area-inset-left));right:max(8px,env(safe-area-inset-right));margin:0 auto;max-width:480px;max-height:24%;overflow:auto;white-space:pre-wrap;text-align:center;padding:8px;box-sizing:border-box;border-radius:5px;background:#142219ed;text-shadow:0 1px #000;pointer-events:auto}
  `;document.head.appendChild(style);
  var menu=icon('Menu','M3 6h18M3 12h18M3 18h18',function(){if(Module.aimMode)Module.setAimMode(false);Module.cancelMapGesture();if(building)endBuild();open=!open;page='';render();});menu.id='mobile-menu';root.appendChild(menu);
  var buildShortcut=button('Build',function(){navigate('build');});buildShortcut.id='mobile-build';root.appendChild(buildShortcut);
  var openHole=button('H',function(){pendingHole={hole:s.hole,count:s.openHoles,time:performance.now()};command(0,104);});openHole.id='mobile-open-hole';openHole.setAttribute('aria-label','Open hole');openHole.title='Open hole';root.appendChild(openHole);
  var closePhoto=button('Close photo',function(){Module.setAimMode(false);Module.keyboardInput(27,27);});closePhoto.id='mobile-close-photo';root.appendChild(closePhoto);
  var camera=document.createElement('div');camera.id='mobile-camera';
  var pan=icon('Pan map','M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4M18 8l4 4-4 4',function(){
    if(building){
      if(panBuildTool!==null){
        var tool=panBuildTool;panBuildTool=null;command(tool.kind,tool.item,true);
        if(tool.variation!==undefined)command(14,tool.variation,true);
      }else{
        if(s.constructing&&lastBuildTool){panBuildTool=Object.assign({},lastBuildTool,{object:s.object,variationState:s.variation?Object.assign({},s.variation):null});if(s.variation)panBuildTool.variation=s.variation.selected;}
        Module.setMapMode(0);
      }
      render();
    }else {endBuild();open=false;render();}
  });pan.id='mobile-pan';
  camera.append(pan,icon('Rotate left','M3 10a9 9 0 1 1 2 8M3 4v6h6',function(){command(1,36);}),icon('Rotate right','M21 10a9 9 0 1 0-2 8M21 4v6h-6',function(){command(1,33);}));root.appendChild(camera);
  var buildActions=document.createElement('div');buildActions.id='mobile-build-actions';
  var remove=icon('Remove / Undo','M4 14l9-11 8 7-9 11H7l-3-3zM7 21h15M9 8l8 7',function(){Module.setMapMode(Module.mapMode===2?0:2);syncControls();});remove.id='mobile-remove';
  var cancel=icon('Cancel','M5 5l14 14M19 5L5 19',function(){endBuild();Module.keyboardInput(27,27);open=false;render();});cancel.id='mobile-cancel';buildActions.append(remove);root.append(buildActions,cancel);
  var strip=document.createElement('section');strip.id='mobile-build-strip';strip.setAttribute('aria-label','Construction choices');root.appendChild(strip);
  var lotControls=document.createElement('section');lotControls.id='mobile-lot-controls';lotControls.hidden=true;lotControls.setAttribute('aria-label','Building lot placement');var lotDetails=document.createElement('div');lotDetails.setAttribute('role','status');var placeLot=button('Place',function(){Module.requestLot();syncControls();});placeLot.id='mobile-place-lot';lotControls.append(lotDetails,placeLot);root.appendChild(lotControls);
  var roundControls=document.createElement('div');roundControls.id='mobile-round-controls';root.appendChild(roundControls);
  var shots=button('Shots',function(){if(s.staffRound){command(13,0,true);return;}shotChoicesOpen=!shotChoicesOpen;syncControls();});shots.id='mobile-shots';
  var aim=button('Aim',function(){Module.setAimMode(!Module.aimMode);syncControls();});aim.id='mobile-aim';
  var shoot=button('Shoot',function(){Module.requestShot();syncControls();});shoot.id='mobile-shoot';
  var centre=button('Golfer',function(){Module.setAimMode(false);command(12,0,true);});centre.setAttribute('aria-label','Centre on golfer');
  roundControls.append(shots,aim,shoot,centre);
  var choices=document.createElement('div');choices.id='mobile-shot-choices';choices.setAttribute('aria-label','Available shot types');root.appendChild(choices);
  var roundInfo=document.createElement('div');roundInfo.id='mobile-round-info';roundInfo.setAttribute('role','status');root.appendChild(roundInfo);
  var shotNames=['Straight shot','Fade (left to right)','Draw (right to left)','High backspin','Low punch'],shotValues=[0,-1,1,3,4];

  var toggles=document.createElement('div');toggles.id='mobile-round-toggles';
  var infoToggle=button('Info',function(){infoOpen=!infoOpen;if(infoOpen)scoreOpen=false;syncControls();});
  var scoreToggle=button('Score',function(){scoreOpen=!scoreOpen;if(scoreOpen)infoOpen=false;syncControls();});
  scoreToggle.setAttribute('aria-label','Scorecard');toggles.append(scoreToggle,infoToggle);root.appendChild(toggles);
  var scorecard=document.createElement('section');scorecard.id='mobile-scorecard';scorecard.setAttribute('aria-label','Round scorecard');root.appendChild(scorecard);
  var leaderboardToggle=button('Leaderboard',function(){leaderboardOpen=!leaderboardOpen;syncControls();});leaderboardToggle.id='mobile-leaderboard-toggle';leaderboardToggle.setAttribute('aria-controls','mobile-leaderboard');
  var leaderboard=document.createElement('section');leaderboard.id='mobile-leaderboard';leaderboard.setAttribute('aria-label','Live tournament leaderboard');root.append(leaderboardToggle,leaderboard);
  var status=document.getElementById('mobile-status');
  var courseBadge=document.createElement('div');courseBadge.id='mobile-course-badge';courseBadge.setAttribute('aria-label','Current course');courseBadge.hidden=true;
  var courseDetails=document.createElement('div');courseDetails.id='mobile-course-details';
  var courseName=document.createElement('span');courseName.id='mobile-course-name';var courseHeading=document.createElement('div');courseHeading.id='mobile-course-heading';var courseDate=document.createElement('span');courseDate.id='mobile-course-date';courseDetails.appendChild(courseHeading);
  var courseMeta=document.createElement('span');courseMeta.id='mobile-course-meta';courseHeading.append(courseName,courseMeta);
  var courseLots=document.createElement('p');courseLots.id='mobile-course-lots';
  var courseAwards=document.createElement('p');courseAwards.id='mobile-course-awards';
  var coursePro=document.createElement('p');coursePro.id='mobile-course-pro';
  var courseIndicators=document.createElement('div');courseIndicators.id='mobile-course-indicators';courseIndicators.append(courseLots,courseAwards,coursePro);var courseRow=document.createElement('div');courseRow.id='mobile-course-row';courseRow.append(courseIndicators);var courseStats=document.createElement('div');courseStats.id='mobile-course-stats';courseDetails.append(courseDate,courseRow,courseStats);courseBadge.append(courseDetails);root.appendChild(courseBadge);
  var courseMoney=document.createElement('span');courseMoney.id='mobile-course-money';var courseFun=document.createElement('span');courseFun.id='mobile-course-fun';var courseSkill=document.createElement('span');courseSkill.id='mobile-course-skill';courseStats.append(courseMoney,courseFun,courseSkill);

  var message=document.createElement('div');message.id='mobile-message';message.setAttribute('role','status');root.appendChild(message);
  var messageText=document.createTextNode('');message.appendChild(messageText);
  var acknowledge=button('Continue',function(){Module.keyboardInput(13,13);});
  var closeup=document.createElement('div');closeup.id='mobile-closeup';
  var zoomValue=document.createElement('output');zoomValue.setAttribute('aria-label','Close-up magnification');
  closeup.append(zoomValue);root.appendChild(closeup);
  var panel=document.createElement('section');panel.id='mobile-panel';panel.setAttribute('aria-label','Game menu');root.appendChild(panel);
  var dialog=document.createElement('div');dialog.id='mobile-dialog-actions';
  dialog.append(button('Keyboard',function(){open=true;page='keyboard';render();}),button('Enter',function(){Module.keyboardInput(13,13);}),button('Back',function(){Module.keyboardInput(27,27);}));root.appendChild(dialog);
  ['mousedown','mousemove','mouseup','click','pointerdown','pointerup','pointermove','touchstart','touchmove','touchend','wheel','keydown','keyup','keypress','beforeinput','input','compositionstart','compositionupdate','compositionend'].forEach(function(t){root.addEventListener(t,function(e){e.stopPropagation();});});
  document.body.appendChild(root);
  // Keep the pressed button alive while original status/rosters update. A
  // rebuilt panel between touch-down and release would lose the click.
  var menuPointers=new Set();
  root.addEventListener('pointerdown',function(e){menuPointers.add(e.pointerId);},true);
  ['pointerup','pointercancel'].forEach(function(type){addEventListener(type,function(e){menuPointers.delete(e.pointerId);},true);});
  addEventListener('blur',function(){menuPointers.clear();});

  function button(text,action){var b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',action);return b;}
  function icon(label,path,action){var b=button('',action);b.className='icon';b.setAttribute('aria-label',label);b.title=label;var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','2');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');var p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',path);svg.appendChild(p);b.appendChild(svg);return b;}
  function endBuild(){panBuildTool=null;lastBuildTool=null;building=false;buildPage='';pendingHole=null;Module.setMapMode(0);}
  function navigate(name){if(['build','course','terrain','buildings','improvements'].includes(name)){building=true;buildPage=name;stripStamp='';if(name==='improvements'){activeImprovement=-1;buildingChoices=false;}}else if(building)endBuild();page=name;open=true;if(name==='course'||name==='improvements')open=false;render();}
  // Read the actual loaded indexed artwork/palette. No original art is bundled
  // in this UI or exported to a public package. Unsupported layouts retain text.
  function tileArt(t){
    var u=function(a){return HEAPU32[a>>>2];},wrap=t.art,bm=u(wrap+4);if(!bm||u(wrap+8))return null;
    var bits=u(bm+20),stride=u(bm+44),w=u(bm+48),h=u(bm+52),pal=t.palette||u(bm+16)||u(u(0x1012873c)+4);
    if(u(bm+32)!==8||!bits||!pal||!w||!h||w>(t.large?1024:256)||h>(t.large?1024:256)||stride<w||bits+stride*h>HEAPU8.length||pal+1036>HEAPU8.length)return null;
    var mask=t.mask?u(t.mask+4):0,maskBits=mask?u(mask+20):0,maskStride=mask?u(mask+44):0;
    if(t.mask&&(!maskBits||u(mask+32)!==8||u(mask+48)!==w||u(mask+52)!==h||maskStride<w||maskBits+maskStride*h>HEAPU8.length))return null;
    var canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.setAttribute('aria-hidden','true');
    var ctx=canvas.getContext('2d'),im=ctx.createImageData(w,h);
    for(var y=0;y<h;y++)for(var x=0;x<w;x++){var c=HEAPU8[bits+y*stride+x],p=(y*w+x)*4,q=pal+12+c*4,m=maskBits?HEAPU8[maskBits+y*maskStride+x]:0,a=c===255||(t.withoutShadow&&c>=248)?0:255-m;
      // Original10025dd0 adds premultiplied source to mask*background.
      // Convert only an explicitly masked UI preview to canvas straight alpha.
      var factor=a&&maskBits?255/a:1;im.data[p]=HEAPU8[q]*factor;im.data[p+1]=HEAPU8[q+1]*factor;im.data[p+2]=HEAPU8[q+2]*factor;im.data[p+3]=a;}
    ctx.putImageData(im,0,0);return canvas;
  }
  Module.originalIndexedArt=tileArt;
  // Read-only equivalent of43d6f0: already loaded bank wrappers, last frame,
  // original toolbar palette. No animation advance, asset exports or RNG.
  function bankArt(bank,palette,frame){
    var start=HEAP32[(0x5a9370+bank*4)>>>2],n=HEAP32[(0x53f3e8+bank*4)>>>2];
    if(start<0||n<1)return null;
    var index=start+(frame===undefined?n-1:Math.max(0,Math.min(n-1,frame)));
    return tileArt({art:0x5aaa30+index*44,palette:HEAPU32[(0x81ca14+palette*88)>>>2],large:true,withoutShadow:true});
  }
  function improvementArt(kind,id){
    if(kind===4)return bankArt(0x168+id,100+id);
    if(kind===1)return bankArt(0x208+id,170+id);
    if(kind===2)return bankArt(0x1a3+Math.trunc(id/5)*6,45+id%5);
    if(kind===16)return bankArt(0x12f+id,180+id);
    if(kind===19)return bankArt(0x226+id,169);
    var b=s.buildingDetails?.[kind-6],level=b?.level||0;
    var banks=[0x17c,0x1ec,0x1e0,0x1d4,0x17e,0x1c2,0x1ce,0x1e6,0x1da];
    var palettes=[20,16,14,28,20,23,27,17,18];
    return kind>=6&&kind<=14?bankArt(banks[kind-6]+(kind===7?0:level),level&&![6,10].includes(kind)?kind+144:palettes[kind-6],[6,10].includes(kind)?HEAPU8[0x5a34e0]:0):null;
  }
  function variantLabel(kind,id){return ({1:'Bench',2:'Flower bed',16:'Scenic tree',19:'Scenic bridge'})[kind]+' '+(id+1);}

  var courseBadgeCounters='';
  function counter(parent,key,value,label,path){
    if(!value)return;
    var item=document.createElement('span');item.className='course-counter';item.dataset.counter=key;item.title=label+': '+value;item.setAttribute('role','img');item.setAttribute('aria-label',item.title);
    var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','2');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');var p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',path);svg.appendChild(p);item.append(svg,document.createTextNode(String(value)));parent.appendChild(item);
  }
  function syncCourseBadge(course){
    // No course exists while the asynchronous WASM module is loading. Do not
    // inspect its heap until the native publisher actually enters a course.
    if(!course){courseBadge.hidden=true;courseBadgeStamp='';Module.courseSummary=null;root.style.setProperty('--course-badge-space','0px');return;}
    // Original40daa0/45b9f0: custom name, or the active property's template.
    // Original40f5c0 draws the emblem selected by that same template byte.
    // Read only; never copy the shared formatting scratch buffer51a068.
    var index=HEAP32[0x59bf90>>>2],type=index>=0&&index<16?HEAP8[0x571ff4+index*46]:-1;
    var valid=course&&!s.photoActive&&type>=0&&type<16,template=0x4c1ea8+type*130;
    var offset=HEAP16[0x59d81c>>>1],name=valid?Module.readGameText(offset>=0&&offset<0x2324?0x56fcb0+offset:template+1,129):'';
    courseBadge.hidden=!valid||!name;
    if(!courseBadge.hidden){
      var emblem=HEAPU8[template],art=0x541710+emblem*44,mask=0x5791f8+emblem*44,bm=emblem<16?HEAPU32[(art+4)>>>2]:0;
      var stamp=JSON.stringify([name,art,bm,bm?HEAPU32[(bm+20)>>>2]:0,emblem<16?HEAPU32[(mask+4)>>>2]:0]);
      if(stamp!==courseBadgeStamp){
        courseName.textContent=name;courseBadge.title=name;
        courseBadge.querySelector('canvas')?.remove();
        var image=emblem<16?tileArt({art:art,mask:mask}):null;
        if(image){courseBadge.prepend(image);courseBadgeStamp=stamp;}else courseBadgeStamp='';
      }
      // Read original counters; hide zero values in the compact mobile HUD.
      // No lot, award, membership or difficulty writes occur here.
      var tick=HEAP32[0x834170>>>2],difficulty=HEAP32[0x822c88>>>2];
      var month=(Math.trunc(tick/1024)&7),year=2001+Math.trunc(tick/8192);
      var date=Module.readGameText(HEAPU32[(0x4c2908>>>2)+month],32)+' '+year;
      var difficultyText=difficulty>=0&&difficulty<4?Module.readGameText([0x4c6210,0x4c6204,0x4c61f8,0x4c61e8][difficulty],24).trim().replace(/,\s*$/,''):'';
      var flags=HEAPU32[0x59e7b8>>>2],pro=HEAP32[0x4c2e14>>>2];
      // Original436060 case2: the original selector remains authoritative.
      var proAvailable=!!(flags&0x2000)&&HEAPU32[0x5685f0>>>2]>1&&pro!==-1&&HEAP32[0x5a59f8>>>2]===-1&&!(flags&0x4200000);
      var proName=pro>=0&&pro<100?Module.readGameText(0x58dd50+pro*56,32):'';
      var summary={date:date,difficulty:difficultyText,lots:HEAP32[0x56d1b0>>>2],holeAwards:HEAP32[0x5a9cac>>>2],soldLots:HEAP32[0x5a9cb0>>>2],tournaments:HEAP32[0x5787cc>>>2],proWins:HEAP32[0x561258>>>2],proAvailable:proAvailable,proName:proName};
      Module.courseSummary=summary;
      courseDate.textContent=date;courseMeta.textContent=difficultyText;
      var cash=s.cash||0;courseMoney.textContent=(cash<0?'−$':'$')+Math.abs(cash).toLocaleString();courseMoney.dataset.negative=String(cash<0);
      courseFun.textContent='Fun '+s.funRating;courseSkill.textContent='Skill '+(s.skillRating/100).toFixed(2);
      var counters=JSON.stringify(summary);
      if(counters!==courseBadgeCounters){courseBadgeCounters=counters;
        courseLots.replaceChildren();courseAwards.replaceChildren();coursePro.replaceChildren();
        counter(courseLots,'lots',summary.lots,'Building lots available','M3 3h18v18H3z M3 9h18 M9 3v18');
        counter(courseAwards,'holeAwards',summary.holeAwards,'Hole awards','m12 3 3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1z');
        counter(courseAwards,'soldLots',summary.soldLots,'Sold lots','m3 11 9-8 9 8 M5 10v11h14V10 M10 21v-7h4v7');
        counter(courseAwards,'tournaments',summary.tournaments,'Tournament wins','M7 3h10v7a5 5 0 0 1-10 0z M7 5H3v3a4 4 0 0 0 4 4 M17 5h4v3a4 4 0 0 1-4 4 M12 15v6 M8 21h8');
        counter(courseAwards,'proWins',summary.proWins,'Pro wins','M5 21V3 M5 3h13l-3 5 3 5H5');
        counter(coursePro,'proAvailable',proAvailable?1:0,'Pro match available'+(proName?': '+proName:''),'m5 3 14 18 M19 3 5 21 M3 3h4 M17 3h4');
        for(var line of [courseLots,courseAwards,coursePro])line.hidden=!line.childElementCount;
      }
    }else {courseBadgeStamp='';Module.courseSummary=null;}
    root.style.setProperty('--course-badge-space',(courseBadge.hidden?0:courseBadge.getBoundingClientRect().height+8)+'px');
  }
  function syncBuildStrip(){
    strip.hidden=!s.course||!Module.mobileUI||!building||open||s.photoActive||!['course','improvements'].includes(buildPage);
    if(strip.hidden)return;
    var tiles=s.terrain||[],v=panBuildTool?.variationState||s.variation,selected=improvements.find(function(t){return activeImprovement<0?s.object===t[2]:activeImprovement===t[1];});
    var stamp=JSON.stringify([s.availableLots,s.landmarks,s.buildingDetails,buildPage,tiles,s.tool,s.object,v,Module.mapMode,buildingChoices,activeImprovement,s.buildings,panBuildTool]);
    if(stamp===stripStamp||menuPointers.size)return;stripStamp=stamp;
    var scroll=strip.querySelector('.strip-items')?.scrollLeft||0,subScroll=strip.querySelector('.variations')?.scrollLeft||0;strip.replaceChildren();
    var title=document.createElement('div');title.className='strip-title';title.textContent=(buildPage==='course'?'Course tiles':buildingChoices?'Improvements / Buildings':selected?'Improvements / '+selected[0]:'Improvements')+' · swipe for more';strip.appendChild(title);
    var row=document.createElement('div');row.className='strip-items';row.setAttribute('aria-label',buildPage==='course'?'Course tiles':'Improvement categories');strip.appendChild(row);
    function card(label,art,action){var b=button(label,action);b.setAttribute('aria-label',label);var image=art?tileArt({art:art}):null;if(image){var text=document.createElement('span');text.textContent=label;b.replaceChildren(image,text);}return b;}
    function toolMode(){panBuildTool=null;if(Module.mapMode!==0)Module.setMapMode(0);}
    if(buildPage==='course')tiles.forEach(function(t){var b=card(t.name,t.art,function(){toolMode();command(2,t.id);});b.setAttribute('aria-pressed',String(s.tool===t.id&&Module.mapMode!==2&&panBuildTool===null));b.dataset.terrain=t.id;row.appendChild(b);});
    else {
      improvements.forEach(function(t){var b=card(t[0],0x59ba68+t[1]*132,function(){buildingChoices=false;activeImprovement=t[1];toolMode();command(4,t[1]);if(t[1]===4)openLandmarks();});b.dataset.improvement=t[1];if(t[1]===2){b.disabled=s.availableLots<1;b.title=b.disabled?'No building lots available':'Drag a preview, then Place';}b.setAttribute('aria-pressed',String(!buildingChoices&&s.object===t[2]&&Module.mapMode!==2));row.appendChild(b);});
      var buildings=icon('Buildings','M3 21V8h8v13M11 21V3h10v18M6 11h2M6 15h2M14 7h4M14 11h4M14 15h4M1 21h22',function(){buildingChoices=true;activeImprovement=-1;stripStamp='';openCatalogue('buildings');});buildings.className='';var text=document.createElement('span');text.textContent='Buildings';buildings.appendChild(text);buildings.setAttribute('aria-pressed',String(buildingChoices));row.appendChild(buildings);
      if(buildingChoices||(v&&selected&&(s.object===selected[2]||panBuildTool?.object===selected[2]))){
        var sub=document.createElement('div');sub.className='strip-items variations';sub.setAttribute('aria-label',buildingChoices?'Building choices':'Improvement variations');strip.appendChild(sub);
        if(buildingChoices){var selectedBuilding=s.buildingDetails?.find(b=>b.kind===(panBuildTool?.object??s.object));var b=button(selectedBuilding?selectedBuilding.name+' · Change':'Choose building',function(){openCatalogue('buildings');});b.className='landmark-choice';sub.appendChild(b);}
        else if(s.object===4||panBuildTool?.object===4){var l=s.landmarks?.find(l=>l.id===v.selected),b=button(l?landmarkName(l)+' · '+(l.free?'Free':'$'+l.price.toLocaleString())+' · Change':'Choose landmark',openLandmarks);b.className='landmark-choice';b.dataset.landmarkChooser='true';sub.appendChild(b);}
        else for(let i=0;i<v.count;i++){let kind=panBuildTool?.object??s.object;var label=variantLabel(kind,i),b=button('',function(){toolMode();command(14,i);});b.setAttribute('aria-label',label);var image=improvementArt(kind,i);if(image)b.appendChild(image);var name=document.createElement('span');name.textContent=label;b.appendChild(name);b.setAttribute('aria-pressed',String(v.selected===i));b.dataset.variation=i;sub.appendChild(b);}
        sub.scrollLeft=subScroll;
      }
    }
    row.scrollLeft=scroll;
  }
  function command(kind,item,keep){
    Module.cancelMapGesture();
    if(building&&[2,3,4,7].includes(kind)){lastBuildTool={kind:kind,item:item};}
    if(building&&kind===14&&lastBuildTool)lastBuildTool.variation=item;
    // Original construction requires native full detail. Reach that through
    // the normal zoom command before selecting a brush, preserving its rules.
    if([2,3,4,7,14].includes(kind)&&Module.mapPresentation.zoom<1)Module.setMapZoom(1);
    if(Module.menuQueue.length<16)Module.menuQueue.push([kind,item]);
    if(kind===5&&item>=4&&item<=8)Module.refreshAimTarget();
    if(!keep){open=false;render();}
  }
  function mode(value){if(value===0){building=false;buildPage='';pendingHole=null;}Module.setMapMode(value);open=false;render();}
  function add(text,action,enabled,wide){var b=button(text,action);b.disabled=enabled===false;if(wide)b.className='wide';items.appendChild(b);return b;}
  function key(text,character){add(text,function(){command(0,character.charCodeAt(0));},s.course);}
  function vk(text,code){var b=add(text,function(){command(1,code);},s.course);return b;}
  function action(text,kind,item,enabled,keep){add(text,function(){command(kind,item,keep);},s.course&&enabled!==false);}
  var items;
  function render(){
    if(Module.atTitle){wasTournament=false;leaderboardOpen=false;leaderboardStamp='';seenCourse=false;open=false;page='';building=false;buildPage='';panBuildTool=null;lastBuildTool=null;pendingHole=null;shotChoicesOpen=false;lastReady=false;wasRound=false;}
    else seenCourse=seenCourse||!!s.wasCourse;
    root.hidden=!seenCourse;root.classList.toggle('landmarks-open',open&&['landmarks','buildings'].includes(page));panel.classList.toggle('landmarks',open&&['landmarks','buildings'].includes(page));panel.hidden=!open;dialog.hidden=!seenCourse||s.course;
    syncControls();message.hidden=!s.message||open||!Module.mobileUI;
    menu.setAttribute('aria-expanded',String(open));if(!open)return;
    panel.replaceChildren();
    panel.appendChild(button(['landmarks','buildings'].includes(page)?'Back to map':page?'Back to menu':'Close',function(){if(['landmarks','buildings'].includes(page)){open=false;page='';render();return;}if(page){if(building)endBuild();page='';render();}else{open=false;render();}}));
    var title=document.createElement('h2');title.textContent=page?({build:'Build',course:'Course',terrain:'Terrain',buildings:'Buildings',improvements:'Improvements',landmarks:'Landmarks',play:'Play',shots:'Shot types',manage:'Manage',system:'System',staff:'Employees',golfers:'Golfers',keyboard:'Keyboard'}[page]||page):'Menu';panel.appendChild(title);
    items=document.createElement('div');items.className='items';panel.appendChild(items);
    if(!page){['Build','Play','Manage','System'].forEach(function(name,i){add(name,function(){navigate(['build','play','manage','system'][i]);},true,true);});return;}
    if(['landmarks','buildings'].includes(page)){
      var isLandmark=page==='landmarks',note=document.createElement('p');note.textContent=isLandmark?'Choose a landmark, drag its preview to compare locations, then Place. The circle shows its influence. Locked landmarks require an original-game unlock.':'Choose a building, move its preview, then Place. Prices exclude site clearing; the location quote shows the total. Original unlock and upgrade requirements still apply.';panel.insertBefore(note,items);
      (isLandmark?s.landmarks:s.buildingDetails||[]).forEach(function(l){
        var b=button('',function(){panBuildTool=null;if(isLandmark){if(s.object!==4)command(4,4,true);command(14,l.id);}else{buildingChoices=true;activeImprovement=-1;command(3,l.id);}});b.className='landmark-card';b.setAttribute('aria-label',isLandmark?landmarkName(l):l.name);b.dataset[isLandmark?'landmark':'building']=l.id;b.disabled=!l.unlocked;
        b.setAttribute('aria-pressed',String(isLandmark?s.variation?.selected===l.id:s.object===l.kind));var image=improvementArt(isLandmark?4:l.kind,l.id);if(image)b.appendChild(image);
        var details=document.createElement('div');details.className='card-details';var name=document.createElement('strong');name.textContent=isLandmark?landmarkName(l):l.name;details.appendChild(name);
        for(var text of isLandmark?[landmarkPrice(l),landmarkBenefits[l.group],l.radius+' yd influence radius',l.unlocked?'Select to preview':'Locked']:['$'+l.price.toLocaleString()+' + site clearing',buildingBenefits[l.id],l.side+' × '+l.side+' tiles · '+(l.level?'Upgrade':'New building'),l.unlocked?'Select to preview':l.level>=2?'Maximum upgrade reached':'Locked']){var line=document.createElement('span');line.textContent=text;details.appendChild(line);}b.appendChild(details);items.appendChild(b);
      });
    }else if(page==='build'){
      ['Course','Terrain','Improvements'].forEach(function(n){add(n,function(){navigate(n.toLowerCase());},true,true);});
    }else if(page==='terrain'){
      ['Vertex','Square','Area'].forEach(function(n,i){action('Raise/lower '+n.toLowerCase(),7,i);});
    }else if(page==='play'){
      action('Golfer skills / profile',5,0);action('Practice round',5,1);
      add('Play a professional',function(){open=false;render();Module.openMatchPlayers(true);},s.course&&!s.roundActive);
      if(s.roundActive)add('Match players',function(){open=false;render();Module.openMatchPlayers(false);});
      action('Begin tournament',5,3);
      add('Shot types',function(){if(s.roundActive){shotChoicesOpen=true;open=false;render();}else navigate('shots');});add('Golfers',function(){command(5,9,true);navigate('golfers');});
      key('Place your golfer','p');key('End match / tournament','n');
    }else if(page==='shots'){
      ['Straight shot','Fade (left to right)','Draw (right to left)','High backspin','Low punch'].forEach(function(n,i){action(n,5,i+4,!!(s.shotMask&(1<<i)),true);});
      if(!s.shotMask){var p=document.createElement('p');p.textContent=s.roundActive?'Shot choices become available when your golfer is ready.':'Shot choices become available during your round.';panel.appendChild(p);}
    }else if(page==='golfers'){
      (s.golfers||[]).forEach(function(g){action(g.name,9,g.item);});
    }else if(page==='manage'){
      add('Hire employee',function(){open=false;render();Module.openStaffPanel('hire');},s.course);add('View employees',function(){open=false;render();Module.openStaffPanel('roster');},s.course);
      vk('Course report',112);vk('Player comments',113);vk('Histograph',114);vk('Financial report',115);vk('Routing map',116);vk('World map',117);vk('SGA evaluation',118);vk('Membership roster',120);vk('Professional accomplishments',121);action('Best scores',8,0);action('Top designers',8,2);
      key('Repeat last message','?');key('Clubhouse view','0');
    }else if(page==='staff'){
      (s.employees||[]).forEach(function(name,i){action(name||'Applicant '+(i+1),6,i+8,true,true);});
      action('Hire another employee',8,3);action('Move selected',6,4,s.employeeSelected>=0);action('Rename selected',6,6,s.employeeSelected>=0);
    }else if(page==='system'){
      if(Module.localFiles)add('Save files / backup',function(){open=false;render();Module.openLocalSaves();});
      key('Save game','S');key('Load game','L');action('Exit game',8,4);key(s.paused?'Resume game':'Pause game','P');
      add('Measure yardage',function(){mode(1);});add('Reset zoom',function(){Module.setMapZoom(1);});key('Next variation','\t');
      key('Save championship course','C');action('Preferences',8,1);
      add('Keyboard',function(){navigate('keyboard');});if(Module.saveHistoryUIEnabled)add('Save history / export',function(){Module.cancelMapGesture();open=false;render();if(Module.toggleSaveHistory)Module.toggleSaveHistory();});add(Module.mobileUI?'Show original controls':'Hide original controls',function(){Module.mobileUI=!Module.mobileUI;open=false;render();});
      add('Cancel / Back',function(){Module.keyboardInput(27,27);open=false;render();});
    }else if(page==='keyboard'){
      var p=document.createElement('p');p.textContent='Type a name in an open game dialog. Text is sent to that dialog.';panel.appendChild(p);
      var input=document.createElement('input');input.type='text';input.autocomplete='off';input.setAttribute('aria-label','Game text');panel.appendChild(input);
      add('Send text',function(){if(Module.sendGameText(input.value))input.value='';else p.textContent=Module.gameTextError;},s.textInput);
      add('Backspace',function(){Module.keyboardInput(8,8);});add('Enter',function(){leaveKeyboard();Module.keyboardInput(13,13);open=false;render();});add('Escape',function(){leaveKeyboard();Module.keyboardInput(27,27);open=false;render();});
    }
  }
  function syncControls(){
    var course=!!s.course&&!!Module.mobileUI;
    syncCourseBadge(course);
    var previewLot=course&&building&&!open&&!panBuildTool&&!s.photoActive&&((s.object===5&&s.availableLots>0)||(s.object===4&&s.variation?.selected>=0&&(s.variation.mask&(1<<s.variation.selected)))||([1,2,16,19].includes(s.object)&&s.variation?.selected>=0)||(s.object>=6&&s.object<=14))&&Module.mapMode!==2;
    if(previewLot&&!Module.lotMode&&Module.lotCanStart())Module.setLotMode(true);
    else if(!previewLot&&Module.lotMode)Module.setLotMode(false);
    var openingLot=lotControls.hidden&&previewLot&&Module.lotMode;
    lotControls.hidden=!previewLot||!Module.lotMode;
    if(!lotControls.hidden){Module.refreshLotTarget();var p=Module.lotPreview,ready=p&&p.serial===Module.lotSerial;placeLot.disabled=!ready||!p.valid||!!Module.lotPending;var money=v=>'$'+v.toLocaleString();lotDetails.textContent=Module.lotPending?'Placing…':!ready?'Drag to preview a location; Place confirms.':p.kind===4?landmarkName(s.landmarks?.[p.variant])+' · '+(p.free?'Free':money(p.price))+' · '+p.radius+' yd influence'+(p.reason?' · '+p.reason:''):p.kind!==5?((s.object>=6&&s.object<=14?s.buildings[s.object-6]:variantLabel(p.kind,p.variant))+' · '+money(p.price)+(p.reason?' · '+p.reason:'')):p.reason||('Lot value '+money(p.value)+' · Preparation '+money(p.preparation)+' · Profit '+money(p.profit));if(openingLot)Module.centreLotTarget();}

    camera.hidden=!course;buildActions.hidden=!course||s.photoActive;cancel.hidden=buildActions.hidden;remove.hidden=!building;remove.setAttribute('aria-pressed',String(Module.mapMode===2));pan.setAttribute('aria-pressed',String(panBuildTool!==null||(Module.mapMode===0&&!s.constructing)));syncBuildStrip();root.style.setProperty('--strip-space',(strip.hidden?0:strip.getBoundingClientRect().height+8)+'px');closeup.hidden=!course;closeup.style.bottom=lotControls.hidden?'':'calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px) + '+(64+lotControls.getBoundingClientRect().height)+'px)';roundControls.hidden=!course||!s.roundActive;
    toggles.style.bottom='calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px) + '+(building?54:0)+'px)';
    roundControls.style.bottom='calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px) + '+(building?108:54)+'px)';
    shots.textContent=s.staffRound?'Resume shots':'Shots';shots.disabled=!s.shotTurn&&!s.staffRound;aim.disabled=!s.shotTurn||s.photoActive||!!Module.shotPending;shoot.disabled=!s.shotReady||!Module.aimMode||!Module.aimCanShoot()||!!Module.shotPending;
    aim.textContent=Module.aimMode?'Pan':'Aim';aim.setAttribute('aria-pressed',String(!!Module.aimMode));
    closePhoto.hidden=!course||!s.photoActive;
    choices.hidden=!course||s.photoActive||!s.shotTurn||!shotChoicesOpen;
    var stamp=JSON.stringify([s.shotMask,s.shot,s.shotTurn]);
    if(stamp!==shotFingerprint){shotFingerprint=stamp;choices.replaceChildren();shotNames.forEach(function(name,i){var b=button(name,function(){command(5,i+4,true);});b.disabled=!s.shotTurn||!(s.shotMask&(1<<i));b.setAttribute('aria-pressed',String(s.shot===shotValues[i]));choices.appendChild(b);});}
    choices.style.bottom='calc(max(8px,env(safe-area-inset-bottom)) + var(--strip-space,0px) + '+((building?108:54)+roundControls.getBoundingClientRect().height+6)+'px)';
    var info=Module.roundHUD;roundInfo.textContent=(info?info.lines.filter(Boolean).join(' · '):'')+(Module.aimMode?' · Drag to aim; Shoot confirms.':'');
    roundInfo.hidden=!course||!s.roundActive||!infoOpen||!roundInfo.textContent;
    toggles.hidden=!course||!s.roundActive;infoToggle.setAttribute('aria-pressed',String(infoOpen));scoreToggle.setAttribute('aria-pressed',String(scoreOpen));
    scorecard.hidden=!course||!s.roundActive||!scoreOpen;
    var cards=s.scorecard||[],scoreStamp=JSON.stringify(cards);
    if(scoreOpen&&scoreStamp!==scoreFingerprint){
      scoreFingerprint=scoreStamp;scorecard.replaceChildren();
      var table=document.createElement('table'),caption=document.createElement('caption');caption.textContent='Round scorecard · current hole marked *';table.appendChild(caption);
      function row(values,heading,current){var tr=document.createElement('tr');if(current)tr.className='current';values.forEach(function(value){var cell=document.createElement(heading?'th':'td');cell.textContent=value;tr.appendChild(cell);});table.appendChild(tr);}
      row(['Hole','Par'].concat(cards.map(function(c){return c.name;})),true);
      (cards[0]?.holes||[]).forEach(function(h){row([String(h.hole)+(h.hole===cards[0].hole?' *':''),h.par].concat(cards.map(function(c){var entry=c.holes.find(function(n){return n.hole===h.hole;});return entry?.score>0?entry.score:(c.hole===h.hole?c.current+' (playing)':'—');})),false,h.hole===cards[0].hole);});
      row(['Finished total','—'].concat(cards.map(function(c){return c.holes.reduce(function(total,h){return total+(h.score>0?h.score:0);},0);})),true);scorecard.appendChild(table);
    }
    var tournament=!!s.tournamentActive,board=Module.tournamentBoard;
    if(tournament&&!wasTournament)leaderboardOpen=true;
    if(!tournament)leaderboardOpen=false;
    wasTournament=tournament;
    leaderboardToggle.hidden=!course||!tournament||s.photoActive;
    leaderboardToggle.setAttribute('aria-expanded',String(leaderboardOpen));leaderboardToggle.setAttribute('aria-pressed',String(leaderboardOpen));
    leaderboard.hidden=leaderboardToggle.hidden||!leaderboardOpen||open||!board||!!(s.fundsCheck&&s.message);
    var boardStamp=JSON.stringify(board);
    if(!leaderboard.hidden&&boardStamp!==leaderboardStamp){
      leaderboardStamp=boardStamp;var scroll=leaderboard.scrollTop;leaderboard.replaceChildren();
      var heading=document.createElement('h2');heading.textContent='Tournament leaderboard';leaderboard.appendChild(heading);
      board.headings.forEach(function(text){var p=document.createElement('p');p.textContent=text;leaderboard.appendChild(p);});
      var list=document.createElement('ol');board.rows.forEach(function(text){var li=document.createElement('li');li.textContent=text;list.appendChild(li);});leaderboard.appendChild(list);leaderboard.scrollTop=scroll;
    }
    Module.refreshAimReticle();
    buildShortcut.hidden=!course||!building||open;
    openHole.hidden=!course||!building||s.photoActive||!s.canOpenHole;
    openHole.disabled=!!pendingHole;
    message.style.top='calc(max(8px,env(safe-area-inset-top)) + '+Math.max(building&&!open?100:50,courseBadge.hidden?0:courseBadge.getBoundingClientRect().height+8)+'px)';
  }
  function leaveKeyboard(){
    if(root.contains(document.activeElement)&&document.activeElement.tagName==='INPUT')document.activeElement.blur();
    setTimeout(function(){window.scrollTo(0,0);syncVisibleArea();},80);
  }
  // Safari can retain a visual-viewport offset after focusing a name field.
  // Keep controls inside that viewport, then restore the page after dismissal.
  function syncVisibleArea(){
    var v=window.visualViewport;
    var header=document.getElementById('build-header').getBoundingClientRect().height;root.style.top=((v?v.offsetTop:0)+header)+'px';root.style.left=(v?v.offsetLeft:0)+'px';
    root.style.right='auto';root.style.bottom='auto';root.style.width=(v?v.width:innerWidth)+'px';root.style.height=Math.max(0,(v?v.height:innerHeight)-header)+'px';
    panel.style.maxHeight=Math.max(80,(v?v.height:innerHeight)-header-90)+'px';
  }
  if(window.visualViewport){visualViewport.addEventListener('resize',syncVisibleArea);visualViewport.addEventListener('scroll',syncVisibleArea);}
  addEventListener('simgolf-header-resize',syncVisibleArea);addEventListener('resize',syncVisibleArea);addEventListener('pageshow',syncVisibleArea);syncVisibleArea();
  setInterval(function(){
    s=Module.mobileState||{};
    Module.updateMapPresentation(!!s.course);
    if(s.course&&Module.mobileUI){
      if(s.photoActive&&(Module.aimMode||Module.shotPending))Module.setAimMode(false);
      if(s.shotTurn&&(!lastReady||s.turnSerial!==lastTurn)){buildPage='';lastTurn=s.turnSerial;shotChoicesOpen=true;building=false;Module.setAimMode(false);}
      if(lastReady&&!s.shotTurn){shotChoicesOpen=false;if(open&&page==='shots'){open=false;render();}Module.setAimMode(false);}
      lastReady=!!s.shotTurn;wasRound=!!s.roundActive;
    }
    zoomValue.textContent=(Module.mapPresentation.zoom.toFixed(2))+'×'+(Module.mapZoomNotice?.until>Date.now()?' · '+Module.mapZoomNotice.text:'');
    if(pendingHole&&s.course){if(s.openHoles>pendingHole.count||s.hole!==pendingHole.hole){building=false;buildPage='';open=false;page='';pendingHole=null;render();}else if(performance.now()-pendingHole.time>1200&&Module.menuResult?.kind===0&&Module.menuResult.item===104){pendingHole=null;}}
    syncControls();
    messageText.data=s.message||'';
    if(s.fundsCheck&&s.message){if(!message.contains(acknowledge))message.appendChild(acknowledge);}else if(message.contains(acknowledge))acknowledge.remove();
    message.hidden=!s.message||open||!Module.mobileUI;
    var tool=(s.terrain||[]).find(function(t){return t.id===s.tool;});
    status.hidden=!s.wasCourse||!Module.mobileUI;status.textContent=s.wasCourse?(s.paused?'Paused':'Playing')+(tool?' · '+tool.name:'')+(Module.mapMode===1?' · Measure':Module.mapMode===2?' · Remove / Undo':''):'';
    var fingerprint=JSON.stringify([s.wasCourse,s.course,s.textInput,s.terrain,s.buildings,s.golfers,s.employees,s.employeeSelected,s.tab,s.paused,s.roundActive,s.shotMask,Module.mobileUI]);
    if(last!==fingerprint&&!menuPointers.size){last=fingerprint;render();}
  },200);
})();

// Mobile presentation for the original golfer/profile allocation loops.
// All actions are queued for their actual native dialog; no skill writes here.
(function(){
  if(!Module.mobileMap)return;
  Module.profileQueue=[];
  var root=document.createElement('section');root.id='mobile-profile';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Golfer profile');
  var style=document.createElement('style');style.textContent=`
    #mobile-profile[hidden],#mobile-profile-return[hidden]{display:none!important}
    #mobile-profile [hidden]{display:none!important}
    body.mobile-profile-open #mobile-ui{visibility:hidden}body.mobile-profile-open #canvas{visibility:hidden}
    #mobile-profile{position:fixed;left:0;right:0;top:var(--profile-header,22px);bottom:0;z-index:65;display:flex;flex-direction:column;box-sizing:border-box;background:#142219;color:#fff;font:16px system-ui,sans-serif;padding:max(10px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));gap:10px}
    #mobile-profile button,#mobile-profile-return{font:inherit;min-width:48px;min-height:48px;padding:10px 14px;border:1px solid #8ca68d;border-radius:7px;background:#293d2b;color:#fff;touch-action:manipulation;box-sizing:border-box}
    #mobile-profile button:disabled{opacity:.4}#mobile-profile button[aria-selected=true]{background:#496d42;border-color:#eef6df}
    #mobile-profile h1{font-size:22px;line-height:1.2;margin:0}#mobile-profile h2{font-size:18px;margin:0 0 10px}#mobile-profile p{margin:6px 0;line-height:1.4}
    #mobile-profile .profile-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}#mobile-profile .profile-tabs{display:flex;gap:8px}#mobile-profile .profile-tabs button{flex:1}
    #mobile-profile .profile-points{padding:8px 10px;background:#243a28;border-radius:6px;margin:0;font-weight:600}
    #mobile-profile .profile-content{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:2px 2px 10px}
    #mobile-profile .editor-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}#mobile-profile .profile-face-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px}#mobile-profile .profile-face-grid canvas{width:auto;max-width:100%;height:100px;object-fit:contain}#mobile-profile input{font:inherit;width:100%;padding:12px;box-sizing:border-box;margin:12px 0}
    #mobile-profile .profile-summary{display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:start}#mobile-profile canvas{width:110px;height:215px;image-rendering:pixelated;border-radius:8px;background:#e8eadc}
    #mobile-profile .profile-traits{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}#mobile-profile .profile-traits span{padding:5px 8px;background:#304c33;border-radius:6px}
    #mobile-profile .skill-list{display:grid;grid-template-columns:1fr;gap:8px}#mobile-profile .skill-row{display:grid;grid-template-columns:minmax(0,1fr) 48px 52px 48px;gap:6px;align-items:center;padding:9px;background:#203425;border-radius:8px;border:1px solid #3d5941}
    #mobile-profile .skill-row.readonly{grid-template-columns:minmax(0,1fr) 70px}#mobile-profile .skill-label{font-weight:600;line-height:1.3}#mobile-profile .skill-rating{text-align:center;white-space:nowrap}#mobile-profile .skill-change{display:block;font-size:13px;color:#d1e9a8;font-weight:400}#mobile-profile .skill-meter{height:5px;margin-top:7px;border-radius:3px;background:#405447;overflow:hidden}#mobile-profile .skill-meter span{display:block;height:100%;background:#b8d68c}
    #mobile-profile footer{display:flex;gap:10px;justify-content:space-between;border-top:1px solid #456149;padding-top:10px}#mobile-profile .profile-confirm{max-width:560px;margin:auto;text-align:center}#mobile-profile .profile-confirm button{display:block;width:100%;margin-top:12px}#mobile-profile .profile-note{font-size:14px;color:#cfdbd0}
    #mobile-profile-return{position:fixed;right:max(8px,env(safe-area-inset-right));top:calc(var(--profile-header,22px) + 8px);z-index:66;background:#293d2b;color:white}
    @media(min-width:720px){#mobile-profile .skill-list{grid-template-columns:1fr 1fr}#mobile-profile .profile-summary{max-width:650px;margin:0 auto}#mobile-profile h1{font-size:20px}#mobile-profile{gap:6px}#mobile-profile .profile-tabs{max-width:400px}#mobile-profile .profile-heading{align-items:flex-start}}
  `;document.head.appendChild(style);
  var header=document.createElement('header');header.className='profile-heading';var title=document.createElement('h1');header.appendChild(title);root.appendChild(header);
  var points=document.createElement('p');points.className='profile-points';points.setAttribute('role','status');root.appendChild(points);
  var tabs=document.createElement('nav');tabs.className='profile-tabs';tabs.setAttribute('aria-label','Profile sections');root.appendChild(tabs);
  var profileTab=button('Profile',function(){tab='profile';fingerprint='';refresh();}),skillTab=button('Skills',function(){tab='skills';fingerprint='';refresh();});tabs.append(profileTab,skillTab);
  var content=document.createElement('div');content.className='profile-content';root.appendChild(content);
  var footer=document.createElement('footer');var original=button('Original editor',function(){send(3,0);}),done=button('Done',function(){send(2,0);});done.id='mobile-profile-done';footer.append(original,done);root.appendChild(footer);
  var returnButton=button('Mobile profile',function(){send(3,0);});returnButton.id='mobile-profile-return';returnButton.hidden=true;
  document.body.append(root,returnButton);
  var tab='profile',serial=0,fingerprint='',avatar=null,state=null,pressed=new Set();
  for(const type of ['pointerdown','pointerup','pointermove','pointercancel','mousedown','mouseup','mousemove','click','touchstart','touchmove','touchend','wheel','keydown','keyup','keypress','beforeinput','input','compositionstart','compositionupdate','compositionend']){root.addEventListener(type,e=>e.stopPropagation());returnButton.addEventListener(type,e=>e.stopPropagation());}
  root.addEventListener('pointerdown',e=>pressed.add(e.pointerId),true);for(const type of ['pointerup','pointercancel'])addEventListener(type,e=>pressed.delete(e.pointerId),true);addEventListener('blur',()=>pressed.clear());
  function button(text,action){var b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',action);return b;}
  function send(op,index){var s=Module.profileState;if(!s?.active||Module.profileQueue.length>=32)return;Module.cancelMapGesture();Module.profileQueue.push([s.serial,op,index]);}
  function text(tag,value){var e=document.createElement(tag);e.textContent=value;return e;}
  function showProfile(s){
    var summary=document.createElement('div');summary.className='profile-summary';avatar=null;
    if(s.artParts){avatar=document.createElement('canvas');avatar.width=110;avatar.height=215;avatar.setAttribute('role','img');avatar.setAttribute('aria-label','Original golfer portrait');summary.appendChild(avatar);}
    var detail=document.createElement('div');detail.append(text('h2',s.name||'Your golfer'));if(s.profession)detail.append(text('p',s.profession));
    var flags=s.appearance[1];var age=flags&4?'Mature':flags&2?'Middle-aged':flags&1?'Young':'';var relationship=flags&64?'Widowed':flags&32?'Divorced':flags&16?'Married':flags&8?'Single':'';detail.append(text('p',[age,relationship,s.appearance[12]&8?'Child':'Adult'].filter(Boolean).join(' · ')));
    var traits=document.createElement('div');traits.className='profile-traits';(s.traits||[]).filter(t=>t.active).forEach(t=>traits.append(text('span',t.name)));detail.appendChild(traits);
    detail.append(text('p',s.kind===2?'Assign the available points under Skills.':'View your current ratings under Skills.'));
    if(s.kind===1){
      var actions=document.createElement('div');actions.className='editor-actions';
      for(const [label,item]of [['Edit name',100],['Edit job title',101],['Change age',103],['Change relationship',102],['Body style',10],['Adult / child',11],['Choose face',12],['Shirt colour',13],['Trousers colour',14],['Skin tone',16],['Change gender',17]])actions.append(button(label,()=>send(6,item)));
      if(s.appearance[1]&128)actions.append(button('Hair colour',()=>send(6,15)));
      (s.traits||[]).forEach((t,i)=>{var b=button(t.name,()=>send(6,i+3));b.setAttribute('aria-pressed',String(t.active));actions.append(b);});
      for(const b of actions.querySelectorAll('button'))b.disabled=!!s.busy;detail.appendChild(actions);
      detail.append(text('p','Custom dialogue and advanced original options remain in Original editor.'));
    }
    summary.appendChild(detail);content.appendChild(summary);
  }
  function showSkills(s){
    var editable=s.kind===2&&s.total>0,list=document.createElement('div');list.className='skill-list';
    for(let i=0;i<10;i++){
      var row=document.createElement('div');row.className='skill-row'+(editable?'':' readonly');row.dataset.skill=i;
      var label=text('div',s.names[i]);label.className='skill-label';var change=s.skills[i]-s.base[i];if(editable&&change>0){var delta=text('span','+'+change+' assigned');delta.className='skill-change';label.appendChild(delta);}
      var meter=document.createElement('div');meter.className='skill-meter';var fill=document.createElement('span');fill.style.width=Math.min(100,s.skills[i]*10)+'%';meter.appendChild(fill);label.appendChild(meter);row.appendChild(label);
      if(editable){var minus=button('−',function(){send(1,i);});minus.setAttribute('aria-label','Decrease '+s.names[i]);minus.dataset.minus=i;minus.disabled=s.busy||s.skills[i]<=s.base[i]||s.skills[i]<=0;row.appendChild(minus);}
      var value=text('output',s.skills[i]+'/10');value.className='skill-rating';value.setAttribute('aria-label',s.names[i]+' rating');row.appendChild(value);
      if(editable){var plus=button('+',function(){send(0,i);});plus.setAttribute('aria-label','Increase '+s.names[i]);plus.dataset.plus=i;plus.disabled=s.busy||s.remaining<=0||s.skills[i]>=10;row.appendChild(plus);}
      list.appendChild(row);
    }
    content.appendChild(list);if(!editable){var note=text('p','These are your current skills. Allocation controls appear when the original game grants points to assign.');note.className='profile-note';content.appendChild(note);}
  }
  function drawAvatar(s){
    if(!avatar||!s.artParts||!Module.originalIndexedArt)return;
    var parts=s.artParts.map(p=>({...p,image:Module.originalIndexedArt(p)})).filter(p=>p.image);if(!parts.length)return;
    var left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
    for(const p of parts){p.dx=p.x+HEAP32[(p.art+32)>>2];p.dy=p.y+HEAP32[(p.art+36)>>2];left=Math.min(left,p.dx);top=Math.min(top,p.dy);right=Math.max(right,p.dx+p.image.width);bottom=Math.max(bottom,p.dy+p.image.height);}
    var ctx=avatar.getContext('2d'),scale=Math.min(avatar.width/(right-left),avatar.height/(bottom-top));ctx.clearRect(0,0,avatar.width,avatar.height);ctx.imageSmoothingEnabled=false;
    for(const p of parts)ctx.drawImage(p.image,(avatar.width-(right-left)*scale)/2+(p.dx-left)*scale,(avatar.height-(bottom-top)*scale)/2+(p.dy-top)*scale,p.image.width*scale,p.image.height*scale);
    avatar.dataset.parts=parts.length;
  }
  function showFaces(s){
    content.append(text('p','Choose a face · '+s.faceCount+' original choices'));
    var grid=document.createElement('div');grid.className='profile-face-grid';
    for(const f of s.faces){var b=button('Face '+(f.index+1),()=>send(7,f.item)),im=Module.originalIndexedArt({art:f.art});if(im)b.prepend(im);b.disabled=!!s.busy;grid.appendChild(b);}content.appendChild(grid);
    var controls=document.createElement('div');controls.className='editor-actions';
    if(s.facePage>0)controls.append(button('Previous faces',()=>send(7,11)));
    if(s.facePage+10<s.faceCount)controls.append(button('Next faces',()=>send(7,10)));
    controls.append(button('Cancel face selection',()=>send(7,12)));for(const b of controls.querySelectorAll('button'))b.disabled=!!s.busy;content.appendChild(controls);
  }
  function showTextEditor(s){
    content.append(text('label',s.profile===100?'Player name':'Job title'));var input=document.createElement('input');input.type='text';input.maxLength=s.total-1;input.autocomplete='off';input.setAttribute('aria-label',s.profile===100?'Player name':'Job title');input.value=s.profile===100?s.name:s.profession;content.appendChild(input);
    var error=text('p',''),save=button('Save changes',()=>{if(Module.sendGameText(input.value)){save.disabled=true;Module.keyboardInput(13,13);}else error.textContent=Module.gameTextError;});content.append(save,button('Cancel changes',()=>Module.keyboardInput(27,27)),error);
  }
  function refresh(){
    var s=Module.profileState,visible=!!(Module.mobileUI&&s?.active&&!s.fallback);
    root.hidden=!visible;returnButton.hidden=!(Module.mobileUI&&s?.active&&s.fallback);document.body.classList.toggle('mobile-profile-open',visible);
    var top=document.getElementById('build-header')?.getBoundingClientRect().bottom||22;document.documentElement.style.setProperty('--profile-header',top+'px');
    if(!visible){state=null;return;}
    if(serial!==s.serial){serial=s.serial;tab=s.kind===2?'skills':'profile';fingerprint='';Module.cancelMapGesture();if(Module.aimMode)Module.setAimMode(false);}
    state=s;var next=JSON.stringify([s.kind,s.serial,s.name,s.profession,s.skills,s.base,s.remaining,s.spent,s.busy,s.total,s.traits,s.appearance,s.facePage,tab]);
    if(next!==fingerprint&&!pressed.size){
      fingerprint=next;var scroll=content.scrollTop;content.replaceChildren();avatar=null;
      root.setAttribute('aria-label',s.kind===3&&Module.loadDeleteConfirm?'Delete saved game':'Golfer profile');
      title.textContent=s.kind===3?(Module.loadDeleteConfirm?'Delete saved game':'Unused skill points'):s.kind===4?'Choose golfer face':s.kind===5?(s.profile===100?'Edit player name':'Edit job title'):s.kind===2?'Assign golfer skills':'Golfer profile';
      points.hidden=s.kind!==2;points.textContent=s.remaining+' points remaining · '+s.spent+' assigned';
      tabs.hidden=s.kind>=3;footer.hidden=s.kind>=3;profileTab.setAttribute('aria-selected',String(tab==='profile'));skillTab.setAttribute('aria-selected',String(tab==='skills'));
      done.disabled=!!s.busy;original.disabled=!!s.busy;
      if(s.kind===3){var deleting=!!Module.loadDeleteConfirm,box=document.createElement('div');box.className='profile-confirm';box.append(text('h2',deleting?'Delete this saved game?':'You have unused skill points'),text('p',deleting?Module.loadDeleteName:(s.title||'').split('\n').filter(t=>t&&!/^ /.test(t)).join(' ')));if(deleting)box.appendChild(text('p','This removes the selected save. Your other saves are kept.'));var keep=button(deleting?'Keep saved game':'Keep allocating',function(){send(5,1);}),leave=button(deleting?'Delete saved game':'Continue without remaining points',function(){send(5,0);});keep.disabled=leave.disabled=!!s.busy;box.append(keep,leave);content.appendChild(box);}
      else if(s.kind===4)showFaces(s);else if(s.kind===5)showTextEditor(s);else if(tab==='profile')showProfile(s);else showSkills(s);
      content.scrollTop=scroll;
    }
    drawAvatar(s);
  }
  setInterval(refresh,100);addEventListener('resize',refresh);addEventListener('simgolf-header-resize',refresh);
})();

// Readable hiring and staff management over the original dialogs/selectors.
(function(){
  if(!Module.mobileMap)return;
  Module.staffHireQueue=[];
  var visible=false,state='',selected=null,confirm=null,pressed=new Set(),renameShown=false,warningText='',warningUntil=0,lastMessage='';
  var root=document.createElement('section');root.id='mobile-staff';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Employee management');
  var style=document.createElement('style');style.textContent=`
    #mobile-staff[hidden],#mobile-staff-return[hidden]{display:none!important}
    body.mobile-staff-open #mobile-ui,body.mobile-staff-open #canvas{visibility:hidden}
    #mobile-staff{position:fixed;inset:var(--staff-header,22px) 0 0;z-index:65;display:flex;flex-direction:column;gap:10px;box-sizing:border-box;padding:max(10px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));color:#fff;background:#142219;font:16px system-ui,sans-serif}
    #mobile-staff h1{margin:0;font-size:22px}#mobile-staff h2{margin:0;font-size:18px}#mobile-staff p{margin:4px 0;line-height:1.4}
    #mobile-staff header,#mobile-staff footer,#mobile-staff .staff-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}#mobile-staff header{justify-content:space-between}#mobile-staff footer{border-top:1px solid #456149;padding-top:10px}
    #mobile-staff button,#mobile-staff-return{font:inherit;min-height:48px;padding:10px 14px;border:1px solid #8ca68d;border-radius:7px;background:#293d2b;color:#fff;touch-action:manipulation;box-sizing:border-box}#mobile-staff button:disabled{opacity:.4}#mobile-staff button[aria-selected=true]{background:#496d42;border-color:#eef6df}
    #mobile-staff .staff-content{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain}#mobile-staff .staff-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(270px,100%),1fr));gap:8px}
    #mobile-staff .staff-card{display:grid;grid-template-columns:70px minmax(0,1fr);gap:12px;text-align:left;align-items:center;min-height:100px;width:100%}#mobile-staff .staff-card span{display:block;overflow-wrap:anywhere}#mobile-staff .staff-card strong{display:block;font-size:18px}#mobile-staff .staff-card canvas{width:70px;height:80px;object-fit:contain;image-rendering:pixelated}
    #mobile-staff .staff-note{padding:8px;background:#243a28;border-radius:6px}#mobile-staff input{font:inherit;width:100%;padding:12px;box-sizing:border-box;margin:12px 0}#mobile-staff .staff-confirm{max-width:560px;margin:auto;padding:12px;background:#243a28;border-radius:8px}
    #mobile-staff-return{position:fixed;right:max(8px,env(safe-area-inset-right));top:calc(var(--staff-header,22px) + 8px);z-index:66}
    @media(max-height:500px){#mobile-staff{gap:6px}#mobile-staff header h1{font-size:19px}#mobile-staff .staff-card{min-height:84px}#mobile-staff .staff-card canvas{height:64px}}
  `;document.head.appendChild(style);
  var header=document.createElement('header'),title=text('h1','Employees'),done=button('Back to course',close);header.append(title,done);root.appendChild(header);
  var note=text('p','');note.className='staff-note';note.setAttribute('role','status');root.appendChild(note);
  var warning=text('p','');warning.className='staff-note';warning.setAttribute('role','alert');warning.hidden=true;root.appendChild(warning);
  var content=document.createElement('div');content.className='staff-content';root.appendChild(content);
  var footer=document.createElement('footer');root.appendChild(footer);
  var original=button('Mobile employees',()=>hireCommand(-2));original.id='mobile-staff-return';original.hidden=true;document.body.append(root,original);
  for(const type of ['pointerdown','pointerup','pointermove','pointercancel','mousedown','mouseup','mousemove','click','touchstart','touchmove','touchend','wheel','keydown','keyup','keypress','beforeinput','input','compositionstart','compositionupdate','compositionend']){root.addEventListener(type,e=>e.stopPropagation());original.addEventListener(type,e=>e.stopPropagation());}
  root.addEventListener('pointerdown',e=>pressed.add(e.pointerId),true);for(const type of ['pointerup','pointercancel'])addEventListener(type,e=>pressed.delete(e.pointerId),true);addEventListener('blur',()=>pressed.clear());
  function text(tag,value){var e=document.createElement(tag);e.textContent=value;return e;}
  function button(label,fn){var b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);return b;}
  function command(kind,item){warningText='';Module.cancelMapGesture();if(Module.menuQueue.length<16)Module.menuQueue.push([kind,item]);state='';}
  function hireCommand(item){var h=Module.staffHire;if(h&&!h.busy&&Module.staffHireQueue.length<8){Module.cancelMapGesture();Module.staffHireQueue.push([h.serial,item]);state='';}}
  function close(){if(Module.staffHire){Module.keyboardInput(27,27);return;}if(Module.staffRenaming>=0){cancelRename();return;}visible=false;confirm=null;command(13,0);refresh();}
  Module.openStaffPanel=function(mode){visible=true;selected=null;confirm=null;state='';Module.setAimMode(false);command(mode==='hire'?8:5,mode==='hire'?3:10);refresh();};
  function portrait(art,role){if(!Module.originalIndexedArt||!art)return null;var image=Module.originalIndexedArt({art:art,palette:Module.staffOptions?.[role]?.palette,withoutShadow:true});if(image)image.setAttribute('aria-hidden','true');return image;}
  function card(row,art,choose,active,busy){var b=button('',choose);b.className='staff-card';b.dataset.employee=row.id===undefined?'':row.id;b.dataset.choice=row.item;b.setAttribute('aria-label',row.name+' · '+row.role);b.setAttribute('aria-selected',String(active));b.disabled=busy;var im=portrait(art,row.roleIndex===undefined?row.item:row.roleIndex);if(im)b.appendChild(im);else b.appendChild(text('span',''));var detail=document.createElement('span');detail.append(text('strong',row.name),text('span',row.role),text('span','$'+row.weekly.toLocaleString()+' / week'));b.appendChild(detail);return b;}
  function selectedAction(op,row){command(15,(row.id<<6)|(row.roleIndex<<3)|op);}
  function renameText(value){
    if(/[^\x20-\x7e]/.test(value)){Module.gameTextError='Use letters, numbers and standard punctuation.';return false;}
    if(!Module.mobileState?.textInput||Module.gameTextQueue.length){Module.gameTextError='Please wait and try again.';return false;}
    // Original text entry begins at the end of the existing name. Clear it
    // with acknowledged characters in the same FIFO, then type/confirm.
    for(var i=0;i<31;i++)Module.gameTextQueue.push(8);
    if(!Module.sendGameText(value))return false;Module.keyboardInput(13,13);return true;
  }
  function cancelRename(){renameText(Module.staffRenameOriginal||'');}

  function refresh(){
    var s=Module.mobileState||{},h=Module.staffHire,rename=Module.staffRenaming>=0;
    if(s.message&&s.message!==lastMessage){warningText=s.message;warningUntil=Date.now()+8000;}lastMessage=s.message||'';warning.textContent=warningText;warning.hidden=!warningText||Date.now()>warningUntil;
    if(Module.atTitle){visible=false;confirm=null;selected=null;}
    var showing=Module.mobileUI&&(h&&!h.fallback||visible&&(rename||s.course&&s.staffOpen));
    root.hidden=!showing;original.hidden=!(Module.mobileUI&&h?.fallback);document.body.classList.toggle('mobile-staff-open',!!showing);
    document.documentElement.style.setProperty('--staff-header',(document.getElementById('build-header')?.getBoundingClientRect().bottom||22)+'px');
    if(!showing){state='';return;}
    var rows=s.staff||[],row=rows.find(r=>r.id===selected);if(!row)confirm=null;
    var nativeSelected=rows.find(r=>r.item===s.employeeSelected+8),busy=!!(h?.busy||Module.menuQueue.length||Module.staffHireQueue.length);
    var next=JSON.stringify([h?.serial,h?.busy,h?.fallback,rename,s.staffOffset,s.staffTotal,s.employeeSelected,rows,selected,confirm,busy]);
    if(state===next||pressed.size)return;state=next;
    // Keep an active text field intact as the original dialog ticks.
    if(rename&&renameShown)return;renameShown=rename;
    var scroll=content.scrollTop;content.replaceChildren();footer.replaceChildren();done.textContent=h?'Cancel hiring':rename?'Cancel rename':'Back to course';
    if(rename){
      title.textContent='Rename employee';var name=(rows.find(r=>r.id===Module.staffRenaming)||{}).name||'';note.textContent='Enter a name for this employee.';
      var label=text('label','Employee name'),input=document.createElement('input');input.maxLength=30;input.autocomplete='off';input.setAttribute('aria-label','Employee name');input.value=name;label.appendChild(input);content.appendChild(label);
      var error=text('p','');content.appendChild(error);footer.append(button('Save employee name',()=>{if(!renameText(input.value))error.textContent=Module.gameTextError;}),button('Cancel rename',cancelRename));return;
    }
    if(h){
      title.textContent='Hire an employee';note.textContent='Choose an employee. Weekly wages and hiring requirements follow the original game.';var list=document.createElement('div');list.className='staff-list';
      for(const o of h.options)list.appendChild(card(o,o.art,()=>hireCommand(o.item),false,busy));content.appendChild(list);footer.appendChild(button('Original hiring screen',()=>hireCommand(-2)));
    }else if(confirm&&row&&nativeSelected?.id===row.id){
      title.textContent='Fire employee';note.textContent=row.name+' · '+row.role;var box=document.createElement('div');box.className='staff-confirm';box.append(text('h2','Fire '+row.name+'?'),text('p','The game charges a $2,500 dismissal fee.'));var keep=button('Keep employee',()=>{confirm=null;state='';refresh();}),fire=button('Confirm fire',()=>{confirm=null;selectedAction(1,row);selected=null;});keep.disabled=fire.disabled=busy;box.append(keep,fire);content.appendChild(box);
    }else{
      title.textContent='Employees';note.textContent=s.staffTotal+' employed'+(s.staffTotal?' · Select someone to manage.':' · Hire your first employee.');
      var list=document.createElement('div');list.className='staff-list';for(const r of rows){var art=Module.staffOptions?.[r.roleIndex]?.art;list.appendChild(card(r,art,()=>{selected=r.id;confirm=null;command(6,r.item);},nativeSelected?.id===r.id,busy));}content.appendChild(list);
      var actions=document.createElement('div');actions.className='staff-actions';var enabled=!!(row&&nativeSelected?.id===row.id)&&!busy;
      for(const [label,fn]of [['Move employee',()=>{selectedAction(2,row);visible=false;refresh();}],['Rename employee',()=>selectedAction(3,row)],['Fire employee',()=>{confirm=row.id;state='';refresh();}]]){var b=button(label,fn);b.disabled=!enabled;actions.appendChild(b);}content.appendChild(actions);
      var hire=button('Hire employee',()=>{selected=null;command(8,3);});hire.disabled=busy;footer.appendChild(hire);
      if(s.staffOffset>0){var prev=button('Previous employees',()=>{selected=null;command(6,2);});prev.disabled=busy;footer.appendChild(prev);}
      if(s.staffTotal-s.staffOffset>8){var more=button('More employees',()=>{selected=null;command(6,3);});more.disabled=busy;footer.appendChild(more);}
    }
    content.scrollTop=scroll;
  }
  setInterval(refresh,100);addEventListener('resize',refresh);addEventListener('simgolf-header-resize',refresh);
})();

// Continue/Load: sort presentation by real file timestamps. Original43b610
// still enumerates, previews, loads and cancels through its own input loop.
(function(){
  if(!Module.mobileMap)return;
  var style=document.createElement('style');style.textContent=`
    #mobile-load[hidden],#mobile-load-return[hidden]{display:none!important}
    body.mobile-load-open #canvas,body.mobile-load-open #mobile-ui,body.mobile-load-open #mobile-status{visibility:hidden}
    #mobile-load{position:fixed;z-index:60;box-sizing:border-box;display:flex;flex-direction:column;background:#142219;color:white;font:15px system-ui,sans-serif;padding:10px max(12px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));overflow:hidden}
    #mobile-load h1{font-size:21px;margin:0 0 5px}#mobile-load h2{font-size:18px;margin:0 0 8px;overflow-wrap:anywhere}#mobile-load p{line-height:1.4;margin:5px 0 10px}#mobile-load .note{font-size:13px;color:#c2cec3}
    #mobile-load-content{min-height:0;flex:1;overflow:hidden;display:flex;flex-direction:column;gap:12px}
    #mobile-load-list{flex:0 0 36%;min-height:72px;min-width:0;overflow:auto;overscroll-behavior:contain;touch-action:pan-y;display:flex;flex-direction:column;gap:6px;padding:2px;box-sizing:border-box}
    #mobile-load button,#mobile-load-return{font:inherit;min-height:44px;border:1px solid #879b86;border-radius:6px;color:#fff;background:#243229;padding:10px 12px;touch-action:manipulation;cursor:pointer}
    #mobile-load button:disabled{opacity:.5;cursor:default}#mobile-load button[aria-pressed=true]{border-color:#d7f2b9;background:#496d42}
    #mobile-load-list button{flex:none;min-height:66px;text-align:left;overflow-wrap:anywhere}#mobile-load-list strong,#mobile-load-list time,#mobile-load-list small{display:block}#mobile-load-list time,#mobile-load-list small{font-size:13px;color:#d0dccd;margin-top:4px}
    #mobile-load-preview{flex:1;min-height:0;min-width:0;overflow:auto;overscroll-behavior:contain;padding:12px;border:1px solid #556b58;border-radius:6px;box-sizing:border-box;overflow-wrap:anywhere}
    #mobile-load-preview .course-heading{display:flex;align-items:center;gap:10px}#mobile-load-preview canvas{width:48px;height:48px;object-fit:contain;image-rendering:pixelated;flex:none}#mobile-load-preview dl{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:12px 0}#mobile-load-preview dt{color:#c2cec3}#mobile-load-preview dd{margin:0;text-align:right}
    #mobile-load-preview table{width:100%;border-collapse:collapse;font-size:14px}#mobile-load-preview th,#mobile-load-preview td{padding:7px 4px;border-bottom:1px solid #556b58;text-align:center}#mobile-load-preview caption{font-weight:600;margin:8px 0}
    #mobile-load footer{display:flex;flex-wrap:wrap;gap:6px;padding-top:10px;flex:none}#mobile-load footer button:first-child{flex:1;background:#496d42}#mobile-load-status{min-height:20px;font-size:13px;margin:4px 0}
    #mobile-load-return{position:fixed;z-index:61;left:max(8px,env(safe-area-inset-left));bottom:max(8px,env(safe-area-inset-bottom));background:#142219}
    @media(min-width:700px) and (min-aspect-ratio:1/1){#mobile-load-content{flex-direction:row}#mobile-load-list{flex:1;min-height:0}}
  `;document.head.appendChild(style);
  var root=document.createElement('section');root.id='mobile-load';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Continue saved game');
  function text(tag,value){var e=document.createElement(tag);e.textContent=value;return e;}
  function button(label,action){var b=text('button',label);b.type='button';b.addEventListener('click',action);return b;}
  var heading=text('h1','Continue saved game'),note=text('p','Newest files first, using actual save/modified times. Older imports may show when copied.');note.className='note';
  var content=document.createElement('div');content.id='mobile-load-content';var list=document.createElement('div');list.id='mobile-load-list';list.setAttribute('aria-label','Saved games, newest first');var preview=document.createElement('section');preview.id='mobile-load-preview';preview.setAttribute('aria-label','Selected course preview');content.append(list,preview);
  var status=text('div','');status.id='mobile-load-status';status.setAttribute('role','status');
  var footer=document.createElement('footer'),load=button('Load selected game',()=>send(1,state.selected)),cancel=button('Cancel',()=>send(2,0)),original=button('Original load screen',()=>send(3,0)),remove=button('Delete selected save',()=>send(4,state.selected));remove.id='mobile-load-delete';footer.append(load,remove,cancel,original);root.append(heading,note,content,status,footer);
  var back=button('Mobile saved games',()=>send(3,0));back.id='mobile-load-return';back.hidden=true;document.body.append(root,back);
  var state={},serial=0,stamp='',previewStamp='',pending=null,autoSelected=false,pointers=new Set();
  function send(op,index){if(!state.active)return;Module.cancelMapGesture();pending={op:op,index:index};(Module.loadQueue||(Module.loadQueue=[])).push([state.serial,op,index,state.rows?.find(r=>r.index===index)?.name]);refresh();}
  ['mousedown','mousemove','mouseup','click','pointerdown','pointermove','pointerup','touchstart','touchmove','touchend','wheel','keydown','keyup','keypress','beforeinput','input','compositionstart','compositionupdate','compositionend'].forEach(t=>root.addEventListener(t,e=>e.stopPropagation()));
  ['mousedown','mouseup','click','pointerdown','pointerup','touchstart','touchend'].forEach(t=>back.addEventListener(t,e=>e.stopPropagation()));
  root.addEventListener('pointerdown',e=>pointers.add(e.pointerId),true);['pointerup','pointercancel'].forEach(t=>addEventListener(t,e=>pointers.delete(e.pointerId),true));addEventListener('blur',()=>pointers.clear());
  function bounds(){var v=visualViewport,header=document.getElementById('build-header').getBoundingClientRect().height;root.style.top=((v?v.offsetTop:0)+header)+'px';root.style.left=(v?v.offsetLeft:0)+'px';root.style.width=(v?v.width:innerWidth)+'px';root.style.height=Math.max(0,(v?v.height:innerHeight)-header)+'px';}
  function showPreview(s){
    var p=s.preview,key=JSON.stringify([s.selected,p]);if(key===previewStamp)return;previewStamp=key;preview.replaceChildren();
    if(!p){preview.appendChild(text('p','Select a save to see its course and hole details.'));return;}
    var title=document.createElement('div');title.className='course-heading';var art=p.art?Module.originalIndexedArt?.({art:p.art,mask:p.mask}):null;if(art)title.appendChild(art);title.appendChild(text('h2',p.name||'Selected course'));preview.appendChild(title);
    preview.appendChild(text('p',(s.rows.find(r=>r.index===s.selected)?.name||'').replace(/\.sve$/i,'')));
    var dl=document.createElement('dl');for(var row of [['Holes',p.holes.length],['Total par',p.par],['Total yards',p.yards],['Money','$'+p.cash.toLocaleString()],['Fun rating',p.fun],['Length skill',p.length.toFixed(2)],['Accuracy skill',p.accuracy.toFixed(2)],['Imagination',p.imagination.toFixed(2)],['Designer',p.designer],['Theme',p.theme]]){dl.append(text('dt',row[0]),text('dd',String(row[1])));}preview.appendChild(dl);
    if(p.holes.length){var table=document.createElement('table');table.appendChild(text('caption','Course holes'));var tr=document.createElement('tr');for(var label of ['Hole','Par','Yards'])tr.appendChild(text('th',label));table.appendChild(tr);for(var h of p.holes){var tr=document.createElement('tr');for(var value of [h.hole,h.par,h.yards])tr.appendChild(text('td',String(value)));table.appendChild(tr);}preview.appendChild(table);}
  }
  function refresh(){
    state=Module.loadState||{};var visible=!!state.active&&!state.suspended&&!state.fallback;root.hidden=!visible;back.hidden=!state.active||!!state.suspended||!state.fallback;document.body.classList.toggle('mobile-load-open',visible);if(!state.active){pending=null;serial=0;return;}
    if(serial!==state.serial){serial=state.serial;stamp=previewStamp='';pending=null;autoSelected=false;list.scrollTop=content.scrollTop=0;}
    if(pending&&(!(Module.loadQueue?.length))&&!state.busy&&(pending.op!==0||state.selected===pending.index))pending=null;
    if(!visible)return;bounds();var busy=!!state.busy||!!pending;load.disabled=busy||state.selected<0||!state.preview;remove.disabled=busy||state.selected<0||!state.preview;cancel.disabled=!!pending;original.disabled=busy;
    status.textContent=busy?'Updating course preview…':state.rows.length?(state.rows.length+' saved game'+(state.rows.length===1?'':'s')+' · newest first'):'No saved games found.';
    var rows=(state.rows||[]).slice().sort((a,b)=>(b.modified||0)-(a.modified||0)||a.name.localeCompare(b.name));var key=JSON.stringify([rows,state.selected,busy]);
    if(key!==stamp&&!pointers.size){stamp=key;var scroll=list.scrollTop;list.replaceChildren();
      for(var row of rows){let index=row.index;var b=button('',()=>send(0,index));b.dataset.save=row.name;b.setAttribute('aria-label',row.name);b.setAttribute('aria-pressed',String(row.index===state.selected));b.disabled=busy;var label=row.name.replace(/\.sve$/i,'');if(/^&autosave/i.test(label))label=label.replace(/^&/,'');else if(/^&quitsave$/i.test(label))label='Last exit';b.appendChild(text('strong',label));var date=text('time',row.modified?'Last saved '+new Date(row.modified).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}):'Save time unavailable');if(row.modified)date.dateTime=new Date(row.modified).toISOString();b.appendChild(date);list.appendChild(b);}
      list.scrollTop=scroll;
    }
    showPreview(state);
    if(!autoSelected&&!busy&&rows.length){autoSelected=true;if(state.selected<0)send(0,rows[0].index);}
  }
  setInterval(refresh,100);addEventListener('resize',bounds);addEventListener('simgolf-header-resize',bounds);if(visualViewport){visualViewport.addEventListener('resize',bounds);visualViewport.addEventListener('scroll',bounds);}
})();

// Read-only matchup presentation. Starting still goes through the original
// Play a professional selector; no player, offer, skill or reward writes.
(function(){
  if(!Module.mobileMap)return;
  var shown=false,preview=false,offered=-1,introSerial=0,stamp='',pressed=new Set(),portraits=new Map(),manifest=null;
  function text(tag,value){var e=document.createElement(tag);e.textContent=value;return e;}
  function button(label,fn){var b=text('button',label);b.type='button';b.addEventListener('click',fn);return b;}
  var style=document.createElement('style');style.textContent=`
    #mobile-match[hidden]{display:none!important}#mobile-match [hidden]{display:none!important}
    body.mobile-match-open #mobile-ui,body.mobile-match-open #canvas{visibility:hidden}
    #mobile-match{position:fixed;inset:var(--match-header,22px) 0 0;z-index:64;display:flex;flex-direction:column;gap:8px;box-sizing:border-box;padding:max(8px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));background:#142219;color:#fff;font:16px system-ui,sans-serif}
    #mobile-match h1{font-size:18px;text-align:center;margin:0}#mobile-match h2{font-size:16px;line-height:1.25;margin:5px 0 0;min-height:2.5em;overflow-wrap:anywhere;font-weight:600}#mobile-match p{margin:0;line-height:1.3}
    #mobile-match-content{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;touch-action:pan-y;padding:0 2px}
    #mobile-match-comparison{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;font-variant-numeric:tabular-nums}#mobile-match-comparison col:first-child,#mobile-match-comparison col:last-child{width:24%}
    #mobile-match-comparison th,#mobile-match-comparison td{text-align:center;vertical-align:middle;padding:9px 4px;border-bottom:1px solid #3d5941;overflow-wrap:anywhere}
    #mobile-match-comparison thead th{position:sticky;top:0;z-index:1;background:#142219;padding:6px 2px 10px;vertical-align:top}#mobile-match-comparison thead th:nth-child(2){font-size:14px;color:#c8d8ca;vertical-align:bottom}
    #mobile-match-comparison tbody th{font-size:15px;font-weight:400;line-height:1.3}#mobile-match-comparison td{font-size:20px;font-weight:600;white-space:nowrap}
    #mobile-match .match-person{display:flex;flex-direction:column;align-items:center;min-width:0}#mobile-match .match-person p{font-size:12px;color:#c8d8ca;margin-top:4px}#mobile-match canvas{width:72px;height:72px;max-width:100%;object-fit:contain;image-rendering:pixelated;border-radius:8px;background:#e8eadc}#mobile-match .portrait-pending{display:flex;width:72px;height:72px;align-items:center;justify-content:center;font-size:12px;font-weight:400;color:#cad8cb}
    #mobile-match .higher{color:#64e879}#mobile-match .lower{color:#ffe082}#mobile-match .tie,#mobile-match .uncompared{color:#fff}
    #mobile-match footer{display:flex;gap:10px;flex:none}#mobile-match button{font:inherit;min-height:48px;padding:10px 14px;border:1px solid #8ca68d;border-radius:7px;background:#293d2b;color:white;touch-action:manipulation}#mobile-match button:disabled{opacity:.4}#mobile-match-start{margin-left:auto;background:#496d42!important}#mobile-match-status{font-size:13px;margin:0}
    @media(max-width:350px){#mobile-match-comparison tbody th{font-size:13px}#mobile-match-comparison td{font-size:17px}#mobile-match h2{font-size:14px}#mobile-match canvas{width:58px;height:58px}}
    @media(max-height:500px){#mobile-match{gap:5px}#mobile-match canvas,#mobile-match .portrait-pending{width:48px;height:48px}#mobile-match-comparison thead th{padding-top:0;padding-bottom:6px}#mobile-match h2{font-size:14px}#mobile-match-comparison th,#mobile-match-comparison td{padding-top:7px;padding-bottom:7px}}
  `;document.head.append(style);
  var root=document.createElement('section');root.id='mobile-match';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Match players');
  var heading=text('h1','Play a Pro'),status=text('p','');status.id='mobile-match-status';status.setAttribute('role','status');var content=document.createElement('div');content.id='mobile-match-content';
  var footer=document.createElement('footer'),back=button('Back to course',()=>{shown=false;refresh();}),start=button('Start pro match',()=>{
    var m=Module.readMatchPlayers();
    if(!m?.available||m.offer!==offered){offered=m?.offer??-1;stamp='';refresh();status.textContent='The available match changed. Review the current players before starting.';return;}
    if(Module.menuQueue.length>=16)return;
    Module.cancelMapGesture();Module.menuQueue.push([5,2]);shown=false;refresh();
  });start.id='mobile-match-start';var proceed=button('Continue to match',()=>{if(Module.proIntro)Module.keyboardInput(13,13);});proceed.id='mobile-match-continue';footer.append(back,start,proceed);root.append(heading,content,status,footer);document.body.append(root);
  for(const type of ['pointerdown','pointerup','pointermove','pointercancel','mousedown','mouseup','mousemove','click','touchstart','touchmove','touchend','wheel','keydown','keyup','keypress'])root.addEventListener(type,e=>e.stopPropagation());
  root.addEventListener('pointerdown',e=>pressed.add(e.pointerId),true);for(const type of ['pointerup','pointercancel'])addEventListener(type,e=>pressed.delete(e.pointerId),true);addEventListener('blur',()=>pressed.clear());
  function player(profile,id,label,values){
    var p=0x4d6088+profile*560;
    return {id:id,profile:profile,label:label,name:Module.readGameText(p+16,16),profession:Module.readGameText(p,16),appearance:Array.from(HEAPU8.subarray(p+32,p+48)),skills:Array.from(values)};
  }
  function embeddedHead(bytes){
    // Original golfer-file format: PCX at0x72a, three140px expressions.
    var p=0x72a;if(bytes.length<p+128+769)return null;var d=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    if(bytes[p]!==10||bytes[p+2]!==1||bytes[p+3]!==8||bytes[p+65]!==1)return null;
    var w=d.getUint16(p+8,true)-d.getUint16(p+4,true)+1,h=d.getUint16(p+10,true)-d.getUint16(p+6,true)+1,stride=d.getUint16(p+66,true),pal=bytes.length-768;
    if(w!==140||h!==420||stride<w||stride>4096||bytes[pal-1]!==12)return null;
    var pixels=new Uint8ClampedArray(140*140*4),pos=p+128,total=0,limit=stride*140;
    while(total<limit){if(pos>=pal-1)return null;var code=bytes[pos++],n=(code&192)===192?code&63:1,value=code;if((code&192)===192){if(pos>=pal-1)return null;value=bytes[pos++];}if(!n||total+n>stride*h)return null;
      for(var i=0;i<n&&total<limit;i++,total++){var x=total%stride,y=Math.floor(total/stride);if(x<w){var q=(y*w+x)*4,c=pal+value*3;pixels[q]=bytes[c];pixels[q+1]=bytes[c+1];pixels[q+2]=bytes[c+2];pixels[q+3]=value===255?0:255;}}}
    var canvas=document.createElement('canvas');canvas.width=canvas.height=140;canvas.getContext('2d').putImageData(new ImageData(pixels,140,140),0,0);return canvas;
  }
  function previewPortrait(card,offer){
    var theme=Module.readGameText(0x567328,100),key='Themes/'+theme+'/'+card.name+'.glf',entry=portraits.get(key);
    if(!entry){
      var base=Array.from(HEAPU8.subarray(0x4e06e8,0x4e06e8+16)),t=0x58dd50+offer*56;
      base[1]=HEAPU8[t+32]&4?137:9;base[3]=((HEAPU8[t+32]&3)<<4)|HEAPU8[t+34];base[4]=HEAPU8[t+35];base[5]=HEAPU8[t+36];base[7]=HEAPU8[t+33];
      entry={appearance:base,ready:false,source:'original-fallback',head:null};portraits.set(key,entry);
      var file=null,canonical=null;
      try{file=FS.readFile('/game/'+key);}catch(e){}
      if(!file){
        if(!manifest){manifest=new Map();try{for(var line of FS.readFile('/game.manifest',{encoding:'utf8'}).split('\n')){var name=line.split('\t')[0];if(name)manifest.set(name.toLowerCase(),name);}}catch(e){}}
        canonical=manifest.get(key.toLowerCase());if(canonical)try{file=FS.readFile('/game/'+canonical);}catch(e){}
      }
      function finish(bytes){if(bytes?.length>=0x230){entry.appearance=Array.from(bytes.subarray(32,48));entry.head=entry.appearance[2]>=20?embeddedHead(bytes):null;entry.source='original-file';}entry.ready=true;stamp='';setTimeout(refresh,0);}
      if(file)finish(file);
      else if(canonical)fetch('game/'+canonical.split('/').map(encodeURIComponent).join('/')).then(r=>r.ok?r.arrayBuffer():null).then(b=>finish(b?new Uint8Array(b):null)).catch(()=>finish(null));
      else entry.ready=true;
    }
    card.previewKey=key;card.portraitSource=entry.source;card.appearance=entry.ready?entry.appearance:null;card.portraitReady=entry.ready;
  }
  Module.readMatchPlayers=function(){
    // The native publisher is the startup/course gate. Never inspect an
    // uninitialized heap or stale course records at the title screen.
    var s=Module.mobileState;if(!(s?.course||Module.proIntro)||!Module.mapCourseReady)return null;
    var names=Array.from({length:10},(_,i)=>Module.readGameText(HEAPU32[(0x4c2c3c>>2)+i],100)),cards=[],offer=HEAP32[0x4c2e14>>2],flags=HEAPU32[0x59e7b8>>2];
    var available=!!(flags&0x2000)&&HEAP32[0x5685f0>>2]>1&&offer>=0&&offer<100&&!s.roundActive&&!(flags&0x4200000);
    if(s.roundActive){
      var ids=[s.roundGolfer],other=HEAP16[(0x57955a+s.roundGolfer*256)>>1];if(other>=0&&other<152&&other!==s.roundGolfer&&HEAP8[0x5794d9+other*256]>0)ids.push(other);
      for(var id of ids){var profile=HEAP16[(0x57956e+id*256)>>1];if(profile<0||profile>=152)continue;cards.push(player(profile,id,id===s.roundGolfer?'You':'Opponent',HEAPU8.subarray(0x5795a8+id*256,0x5795a8+id*256+10)));}
    }else{
      cards.push(player(0,-1,'You',HEAPU8.subarray(0x5a5a04,0x5a5a04+10)));
      if(available){var p=0x58dd50+offer*56,pro={id:-1,profile:null,label:'Opponent',name:Module.readGameText(p,32),profession:Module.readGameText(0x4c593c,32),skills:Array.from(HEAPU8.subarray(p+37,p+47))};previewPortrait(pro,offer);cards.push(pro);}
    }
    return {available:available,offer:offer,round:s.roundActive,names:names,players:cards};
  };
  function portrait(card){
    if(!card?.appearance||!Module.originalIndexedArt)return null;
    var a=card.appearance,gender=a[1]&128?0:1,face=a[2],source;
    if(card.previewKey&&face>=20)source=portraits.get(card.previewKey)?.head;
    else source=Module.originalIndexedArt({art:face<20?0x59e7c0+(face+gender*20)*132:0x5628e8+(face+gender*72)*132});
    if(!source)return null;var canvas=document.createElement('canvas');canvas.width=canvas.height=140;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',card.name+' portrait');canvas.dataset.source=card.portraitSource||'loaded-profile';
    var scale=Math.min(140/source.width,140/source.height),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(source,(140-source.width*scale)/2,(140-source.height*scale)/2,source.width*scale,source.height*scale);return canvas;
  }
  function person(card){
    var h=document.createElement('th');h.scope='col';if(!card){h.textContent='No opponent';return h;}var box=document.createElement('div');box.className='match-person';box.dataset.player=card.label;var pic=portrait(card);
    if(pic)box.append(pic);else {var pending=text('span',card.portraitReady===false?'Loading portrait…':'Portrait unavailable');pending.className='portrait-pending';box.append(pending);}
    box.append(text('h2',card.name),text('p',card.label));h.append(box);return h;
  }
  function comparison(m){
    var table=document.createElement('table');table.id='mobile-match-comparison';table.setAttribute('aria-label','Golfer skill comparison');var cols=document.createElement('colgroup');for(var i=0;i<3;i++)cols.append(document.createElement('col'));table.append(cols);
    var head=document.createElement('thead'),names=document.createElement('tr'),skill=text('th','Skill');skill.scope='col';names.append(person(m.players[0]),skill,person(m.players[1]));head.append(names);table.append(head);var body=document.createElement('tbody');
    for(var i=0;i<10;i++){var row=document.createElement('tr');row.dataset.skill=i;var label=text('th',m.names[i]);label.scope='row';var left=m.players[0]?.skills[i],right=m.players[1]?.skills[i];
      function value(n,other,card){var cell=text('td',n===undefined?'—':n*10+'%'),rank=n===undefined||other===undefined?'uncompared':n>other?'higher':n<other?'lower':'tie';cell.className=rank;cell.dataset.relation=rank;cell.setAttribute('aria-label',(card?.name||'No opponent')+' · '+m.names[i]+': '+(n===undefined?'unavailable':n*10+'%')+(rank==='tie'?' · equal':rank==='uncompared'?'':' · '+rank));return cell;}
      row.append(value(left,right,m.players[0]),label,value(right,left,m.players[1]));body.append(row);}
    table.append(body);content.append(table);
  }
  Module.openMatchPlayers=function(before){shown=true;preview=!!before;offered=Module.readMatchPlayers()?.offer??-1;stamp='';Module.cancelMapGesture();if(Module.aimMode)Module.setAimMode(false);refresh();};
  function refresh(){
    if(Module.atTitle||!Module.mobileUI)shown=false;
    var intro=Module.proIntro;if(intro&&Module.mobileUI&&intro.serial!==introSerial){introSerial=intro.serial;shown=true;preview=false;stamp='';Module.cancelMapGesture();if(Module.aimMode)Module.setAimMode(false);}
    if(!intro&&introSerial){introSerial=0;shown=false;}
    var m=shown?Module.readMatchPlayers():null,visible=shown&&!!m&&!Module.mobileState.photoActive;
    root.hidden=!visible;document.body.classList.toggle('mobile-match-open',visible);document.documentElement.style.setProperty('--match-header',(document.getElementById('build-header')?.getBoundingClientRect().bottom||22)+'px');if(!visible)return;
    heading.textContent=intro?'Play a Pro':m.round?'Match players':'Play a Pro';back.hidden=!!intro;proceed.hidden=!intro;start.hidden=!!intro||m.round||!preview;start.disabled=!m.available;
    var next=JSON.stringify([m,!!intro]);if(next===stamp||pressed.size)return;stamp=next;var scroll=content.scrollTop;content.replaceChildren();
    status.textContent=intro?'Review both golfers, then Continue to match.':m.round?'Current original-game skill ratings. Close this view to return to the same match.':m.available?'Review both golfers, then start the available professional match.':'No professional match is currently available. Continue developing the course to receive an original-game offer.';
    comparison(m);content.scrollTop=scroll;
  }
  setInterval(refresh,150);addEventListener('resize',refresh);addEventListener('simgolf-header-resize',refresh);
})();
