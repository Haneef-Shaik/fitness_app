/* ============================================================================
   FITLOG — shared design-file shell
   A domain file declares:  window.FITLOG = { title, intro, screens:[{id,name,route,html}] }
   then calls FitLogShell.mount().
   ========================================================================== */
(function(){
"use strict";

const I = {
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  fwd:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  dots:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5.5 5.5L20 6.5"/></svg>',
  trophy:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.35A5 5 0 0 1 13 14.9V17h3v2H8v-2h3v-2.1a5 5 0 0 1-2.65-2.9H8a4 4 0 0 1-4-4V5h3V3Zm0 4H6v1a2 2 0 0 0 1 1.7V7Zm10 0v2.7A2 2 0 0 0 18 8V7h-1Z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  repeat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5-11-6.5Z"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z"/></svg>',
  dumbbell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6.5 6.5v11M3.5 9v5M17.5 6.5v11M20.5 9v5M6.5 12h11"/></svg>',
  apple:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 8c-1.5-2-4-2.5-5.5-1C5 8.5 4.5 12 6 15.5c1 2.4 2.6 4 4 4 .8 0 1.3-.4 2-.4s1.2.4 2 .4c1.4 0 3-1.6 4-4 1.5-3.5 1-7-.5-8.5-1.5-1.5-4-1-5.5 1Z"/><path d="M12 8V5.5A2.5 2.5 0 0 1 14.5 3"/></svg>',
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"/><path d="M6 16v-5M11 16V7M16 16v-8M21 16v-3"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z"/><path d="M10.5 20a2 2 0 0 0 3 0"/></svg>',
  camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 8h3l1.5-2h9L18 8h3v12H3V8Z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  sparkle:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.6L19.5 9l-5.7 1.4L12 16l-1.8-5.6L4.5 9l5.7-1.4L12 2Zm6.5 11 .9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6Z"/></svg>',
  scale:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 11a4 4 0 0 1 8 0"/><path d="M12 11V8"/></svg>',
  timer:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="M14 6l4 4"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17.5v.01"/></svg>',
  cloudoff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 17H7a4 4 0 0 1-.7-7.94"/><path d="M8.5 5.5A5.5 5.5 0 0 1 17.9 9.2 3.9 3.9 0 0 1 20.5 14"/><path d="M3 3l18 18"/></svg>',
  filter:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 5h18M6 12h12M10 19h4"/></svg>',
  drag:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 4h10a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4Z"/><path d="M17 7h3v13H7"/></svg>',
  target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.8 4.8l1.6 1.6M17.6 17.6l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.8 19.2l1.6-1.6M17.6 6.4l1.6-1.6"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>'
};

const statusbar = '<div class="statusbar"><span class="num">18:42</span><span class="icons">'+
 '<svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor"><rect y="8" width="3" height="4" rx="1"/><rect x="4.5" y="5.5" width="3" height="6.5" rx="1"/><rect x="9" y="3" width="3" height="9" rx="1"/><rect x="13.5" width="3" height="12" rx="1"/></svg>'+
 '<svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor"><path d="M7.5 10.6 9.9 8a3.4 3.4 0 0 0-4.8 0l2.4 2.6ZM12.2 5.5a6.8 6.8 0 0 0-9.4 0l1.4 1.5a4.8 4.8 0 0 1 6.6 0l1.4-1.5ZM14.7 2.9a10.3 10.3 0 0 0-14.4 0l1.4 1.5a8.3 8.3 0 0 1 11.6 0l1.4-1.5Z"/></svg>'+
 '<svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x=".6" y=".6" width="21" height="10.8" rx="3" stroke="currentColor" stroke-opacity=".4"/><rect x="2.4" y="2.4" width="14" height="7.2" rx="1.8" fill="currentColor"/><path d="M23.2 4.2v3.6a2 2 0 0 0 0-3.6Z" fill="currentColor" fill-opacity=".4"/></svg>'+
 '</span></div>';
const homebar = '<div class="homebar"><i></i></div>';

/* bottom tab bar — `on` is one of home|train|nutrition|progress */
function tabbar(on){
  const t=(k,ic,lb)=>`<button class="tbi ${on===k?'on':''}">${ic}<span>${lb}</span></button>`;
  return `<div class="tabbar">${t('home',I.home,'Home')}${t('train',I.dumbbell,'Train')}
    <button class="fab" aria-label="Quick log">${I.plus}</button>
    ${t('nutrition',I.apple,'Nutrition')}${t('progress',I.chart,'Progress')}</div>`;
}

/* nav helpers */
function nav(o){
  o=o||{};
  const lead = o.close ? `<button class="ico" aria-label="Close">${I.close}</button>`
            : o.back===false ? '' : `<button class="ico" aria-label="Back">${I.back}</button>`;
  return `<div class="nav">${lead}<div><div class="ttl">${o.title||''}</div>
    ${o.sub?`<div class="sub">${o.sub}</div>`:''}</div>
    ${o.right?`<div class="right">${o.right}</div>`:''}</div>`;
}

const FitLogShell = {
  I, statusbar, homebar, tabbar, nav,
  phone: inner => `<div class="phone">${statusbar}${inner}${homebar}</div>`,

  mount(){
    const V = window.FITLOG;
    let active = V.screens[0].id;

    const phone = FitLogShell.phone;
    const byId  = id => V.screens.find(s=>s.id===id);

    function board(){
      document.getElementById('view-board').innerHTML =
        `<div class="board-head"><h1>${V.title}</h1><p class="meta">${V.intro}</p>
         <div class="legend"><span><b>${V.screens.length}</b> screens</span>
         <span><b>Dark</b> primary, light validated</span><span><b>390&times;844</b> frames</span>
         <span>Tap a frame to open it</span></div></div>
         <div class="board">${V.screens.map(s=>
           `<div class="cell"><div class="framewrap">${phone(s.html())}
            <button class="open" data-open="${s.id}" aria-label="Open ${s.id} ${s.name}"></button></div>
            <div class="cellcap"><span class="id">${s.id}</span><span class="nm">${s.name}</span>
            <span class="rt">${s.route}</span></div></div>`).join('')}</div>`;
    }
    function play(){
      const s=byId(active);
      document.getElementById('view-play').innerHTML =
        `<div class="play"><div class="rail"><h2>${V.title}</h2>
          ${V.screens.map(x=>`<button class="rb" data-open="${x.id}" aria-current="${x.id===active}">
            <span class="id">${x.id}</span><span class="nm">${x.name}</span></button>`).join('')}
          </div><div>${phone(s.html())}</div></div>`;
    }
    function setView(v){
      document.querySelectorAll('.tab').forEach(t=>t.setAttribute('aria-selected',String(t.dataset.view===v)));
      document.getElementById('view-board').hidden = v!=='board';
      document.getElementById('view-play').hidden  = v!=='play';
      if(v==='board') board(); else play();
      scrollTo({top:0});
    }
    document.addEventListener('click',e=>{
      const t=e.target.closest('.tab'); if(t){setView(t.dataset.view);return;}
      const o=e.target.closest('[data-open]'); if(o){active=o.dataset.open;setView('play');return;}
      if(V.onClick) V.onClick(e,{repaint(){const h=document.querySelector('#view-play .play > div:last-child');
        if(h) h.innerHTML=phone(byId(active).html());}, go(id){active=id;play();}, active:()=>active});
    });

    const root=document.documentElement, btn=document.getElementById('themeBtn'), lbl=document.getElementById('themeLbl');
    const isLight=()=>{const s=root.getAttribute('data-theme');
      return s==='light'||(!s&&matchMedia('(prefers-color-scheme: light)').matches);};
    function syncLbl(){ if(lbl){lbl.textContent=isLight()?'Light':'Dark';btn.setAttribute('aria-pressed',String(isLight()));} }
    if(btn) btn.addEventListener('click',()=>{root.setAttribute('data-theme',isLight()?'dark':'light');syncLbl();
      if(!document.getElementById('view-board').hidden) board(); else play();});
    matchMedia('(prefers-color-scheme: light)').addEventListener('change',syncLbl);
    syncLbl(); board();
  }
};
window.FitLogShell = FitLogShell;
})();
