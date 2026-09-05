"use strict";

/* =========================================================================
   定数
   ========================================================================= */
const PLATFORM_META = {
  INSTAGRAM: { label: "Instagram", slug: "instagram" },
  TIKTOK: { label: "TikTok", slug: "tiktok" },
  YOUTUBE: { label: "YouTube", slug: "youtube" },
};
const PLATFORM_ORDER = ["INSTAGRAM", "TIKTOK", "YOUTUBE"];
const MONTH_LABELS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const BRAND_LOGOS = {
  "sai-house": "assets/sai-house.jpg",
  "f-products": "assets/f-products.jpg",
  "inoue-group": "assets/inoue-group.png",
};
const BRAND_ORDER = ["sai-house", "f-products", "inoue-group"];
function sortBrands(brands){
  return [...brands].sort((a,b) => {
    const ia = BRAND_ORDER.indexOf(a.id), ib = BRAND_ORDER.indexOf(b.id);
    if (ia===-1 && ib===-1) return 0;
    if (ia===-1) return 1;
    if (ib===-1) return -1;
    return ia-ib;
  });
}
const SEED_BRANDS = [
  { id: "sai-house", name: "彩house", color: "#F39800", platforms: ["INSTAGRAM", "TIKTOK"] },
  { id: "f-products", name: "F.PRODUCTS", color: "#1b434e", platforms: ["INSTAGRAM"] },
  { id: "inoue-group", name: "INOUE-GROUP", color: "#4b5563", platforms: ["YOUTUBE"] },
];
const SEED_GLOSSARY = [
  { term: "インタラクション（インタラクション数）", reading: "いんたらくしょん", description: "投稿を見たユーザーが、いいね・コメント・保存・シェアなどのアクションを起こした回数の合計。" },
  { term: "インプレッション", reading: "いんぷれっしょん", description: "投稿がユーザーの画面に表示された回数。" },
  { term: "エンゲージメント率", reading: "えんげーじめんとりつ", description: "投稿を閲覧したユーザーのうち、インタラクションを起こしたユーザーの割合（インタラクション数÷総閲覧数）。" },
  { term: "おすすめ（レコメンド）", reading: "おすすめ", description: "TikTokやInstagramが、フォロー関係に関わらずユーザーの興味に合わせて投稿を表示するフィード機能。" },
  { term: "ストーリーズ（ST）", reading: "すとーりーず", description: "24時間で非表示になるInstagramの投稿形式。" },
  { term: "総閲覧数（リーチ／表示回数）", reading: "そうえつらんすう", description: "投稿が閲覧された合計回数。" },
  { term: "登録者数", reading: "とうろくしゃすう", description: "YouTubeチャンネルを登録しているユーザーの総数。" },
  { term: "非フォロワー", reading: "ひふぉろわー", description: "アカウントをフォローしていない状態で投稿を閲覧したユーザー。" },
  { term: "フィード（FD）", reading: "ふぃーど", description: "プロフィールやタイムラインに継続して表示される通常投稿。" },
  { term: "フォロワー数", reading: "ふぉろわーすう", description: "アカウントをフォローしているユーザーの総数。" },
  { term: "リール（RL）", reading: "りーる", description: "Instagramの短尺動画投稿形式。" },
  { term: "リンククリック数", reading: "りんくくりっくすう", description: "ストーリーズや投稿に設置したリンクがクリックされた回数。" },
];

/* =========================================================================
   ユーティリティ
   ========================================================================= */
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function fmtNum(v, digits){ if(v===null||v===undefined||Number.isNaN(v)) return "ー"; return Number(v).toLocaleString("ja-JP",{maximumFractionDigits:digits||0}); }
function toNumOrNull(v){ if(v===undefined||v===null) return null; const s=String(v).trim(); if(s==="") return null; const n=Number(s); return Number.isNaN(n)?null:n; }

function computeDelta(current, previous){
  if (current===null||current===undefined) return { current:null, previous: previous??null, diff:null, percent:null };
  if (previous===null||previous===undefined) return { current, previous:null, diff:null, percent:null };
  const diff = current - previous;
  const percent = previous===0 ? null : (diff/previous)*100;
  return { current, previous, diff, percent };
}
function resolveEngagementRate(r){
  if (r.engagementRate!==undefined && r.engagementRate!==null) return r.engagementRate;
  if (!r.interactions || !r.views) return null;
  return (r.interactions / r.views) * 100;
}
function previousMonthOf(y,m){ return m===1 ? {year:y-1, month:12} : {year:y, month:m-1}; }
function deltaBadgeHtml(delta, digits){
  if (delta.percent===null) return `<span class="delta none">前月データなし</span>`;
  const cls = delta.percent>0 ? "up" : delta.percent<0 ? "down" : "flat";
  const arrow = delta.percent>0 ? "▲" : delta.percent<0 ? "▼" : "→";
  const sign = delta.percent>0 ? "+" : "";
  return `<span class="delta ${cls}">${arrow} ${sign}${delta.percent.toFixed(1)}% 前月比</span>`;
}
function lighten(hex, amount){
  const c = hex.replace("#","");
  const n = parseInt(c.length===3 ? c.split("").map(x=>x+x).join("") : c, 16);
  const r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  const mix = ch => Math.round(ch + (255-ch)*amount);
  const h = v => v.toString(16).padStart(2,"0");
  return `#${h(mix(r))}${h(mix(g))}${h(mix(b))}`;
}
function fileToDataUrl(file, max, q){
  max = max || 480; q = q || 0.75;
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error || new Error("read error"));
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
        const sc = Math.min(1, max / Math.max(w, h || 1));
        w = Math.max(1, Math.round(w*sc)); h = Math.max(1, Math.round(h*sc));
        const c = document.createElement("canvas"); c.width=w; c.height=h;
        c.getContext("2d").drawImage(img,0,0,w,h);
        try{ resolve(c.toDataURL("image/jpeg", q)); }catch(e){ reject(e); }
      };
      img.onerror = () => reject(new Error("画像を読み込めませんでした"));
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/* =========================================================================
   状態
   ========================================================================= */
const state = {
  view: "home",
  brandSlug: null,
  platformSlug: null,
  year: null,
  month: null,
  editMode: false,
  brands: [],
  glossary: [],
  glossaryQuery: "",
  reportsUnsub: null,
  reports: [],           // 現在表示中ブランド+SNSの全レポート
  linkClicksUnsub: null,
  linkClicks: [],
  postHighlightsUnsub: null,
  postHighlights: [],
};

/* =========================================================================
   ルーティング（location.hash ベース）
   ========================================================================= */
function navigate(hash){ location.hash = hash; }
function syncRouteFromHash(){
  const raw = location.hash.replace(/^#/, "") || "/";
  const [path, qs] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  const q = {};
  (qs||"").split("&").filter(Boolean).forEach(kv => { const [k,v] = kv.split("="); q[decodeURIComponent(k)] = decodeURIComponent(v||""); });

  teardownDetailSubs();

  if (parts[0] === "b" && parts[1] && parts[2]){
    state.view = "platform";
    state.brandSlug = parts[1];
    state.platformSlug = parts[2];
    state.year = Number(q.y) || null;
    state.month = Number(q.m) || null;
    state.editMode = q.edit === "1";
    subscribeReports();
  } else if (parts[0] === "b" && parts[1]){
    state.view = "brand";
    state.brandSlug = parts[1];
  } else if (parts[0] === "glossary"){
    state.view = "glossary";
  } else {
    state.view = "home";
  }
  render();
}

function teardownDetailSubs(){
  if (state.reportsUnsub){ state.reportsUnsub(); state.reportsUnsub = null; }
  if (state.linkClicksUnsub){ state.linkClicksUnsub(); state.linkClicksUnsub = null; }
  if (state.postHighlightsUnsub){ state.postHighlightsUnsub(); state.postHighlightsUnsub = null; }
  state.reports = []; state.linkClicks = []; state.postHighlights = [];
}

/* =========================================================================
   起動・データ購読
   ========================================================================= */
async function boot(){
  applyStoredTheme();
  document.getElementById("themeToggle").onclick = toggleTheme;
  document.getElementById("brandHome").onclick = () => navigate("/");
  window.addEventListener("hashchange", syncRouteFromHash);

  DB.subscribe("brands", async (brands) => {
    if (!brands || brands.length === 0){
      for (const b of SEED_BRANDS){ await DB.set("brands/" + b.id, { name:b.name, color:b.color, platforms:b.platforms }); }
      return; // 再度subscribeが発火する
    }
    state.brands = sortBrands(brands);
    render();
  });

  DB.subscribe("glossary", async (items) => {
    if (!items || items.length === 0){
      for (const g of SEED_GLOSSARY){ await DB.add("glossary", g); }
      return;
    }
    state.glossary = items;
    if (state.view === "glossary") render();
  });

  syncRouteFromHash();
}

function subscribeReports(){
  const brand = getBrand();
  if (!brand) return;
  const platform = platformFromSlug(state.platformSlug);
  if (!platform) return;
  state.reportsUnsub = DB.subscribe("brands/" + brand.id + "/reports", (reports) => {
    state.reports = (reports || []).filter(r => r.platform === platform);
    ensureSelectedMonth();
    render();
    subscribeItemLists();
  });
}
function subscribeItemLists(){
  const reportId = currentReportId();
  if (state.linkClicksUnsub) state.linkClicksUnsub();
  if (state.postHighlightsUnsub) state.postHighlightsUnsub();
  state.linkClicksUnsub = DB.subscribe(reportPath() + "/linkClicks", (items) => { state.linkClicks = items || []; render(); });
  state.postHighlightsUnsub = DB.subscribe(reportPath() + "/postHighlights", (items) => { state.postHighlights = items || []; render(); });
}
function ensureSelectedMonth(){
  if (state.year && state.month) return;
  const now = new Date();
  const latest = state.reports[state.reports.length-1];
  state.year = latest ? latest.year : now.getFullYear();
  state.month = latest ? latest.month : now.getMonth()+1;
}

function getBrand(){ return state.brands.find(b => b.id === state.brandSlug) || null; }
function platformFromSlug(slug){ return PLATFORM_ORDER.find(p => PLATFORM_META[p].slug === slug) || null; }
function reportDocId(platform, y, m){ return platform + "_" + y + "_" + m; }
function currentReportId(){ return reportDocId(platformFromSlug(state.platformSlug), state.year, state.month); }
function reportPath(){ return "brands/" + state.brandSlug + "/reports/" + currentReportId(); }
function currentReport(){ return state.reports.find(r => r.year===state.year && r.month===state.month) || null; }
function previousReport(){ const p = previousMonthOf(state.year, state.month); return state.reports.find(r => r.year===p.year && r.month===p.month) || null; }

/* =========================================================================
   テーマ
   ========================================================================= */
function applyStoredTheme(){
  try{
    const stored = localStorage.getItem("sns_theme");
    if (stored === "dark") document.documentElement.setAttribute("data-theme","dark");
    else if (stored === "light") document.documentElement.setAttribute("data-theme","light");
  }catch(e){}
}
function toggleTheme(){
  const isDark = document.documentElement.getAttribute("data-theme") === "dark" ||
    (!document.documentElement.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const next = isDark ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try{ localStorage.setItem("sns_theme", next); }catch(e){}
}

/* =========================================================================
   レンダリング
   ========================================================================= */
function render(){
  const app = document.getElementById("app");
  document.getElementById("fabVideo").style.display = state.view === "home" ? "block" : "none";
  if (state.view === "home") app.innerHTML = renderHome();
  else if (state.view === "brand") app.innerHTML = renderBrand();
  else if (state.view === "platform") app.innerHTML = renderPlatform();
  else if (state.view === "glossary") app.innerHTML = renderGlossaryPage();
  wireView();
}

function renderHome(){
  const cards = state.brands.map(b => {
    const logo = BRAND_LOGOS[b.id];
    return `<a class="brand-card" href="#/b/${esc(b.id)}">
      <div class="logo${logo?"":" fallback"}" style="${logo?"":"background:"+esc(b.color)}">
        ${logo ? `<img src="${esc(logo)}" alt="${esc(b.name)}" />` : esc(b.name)}
      </div>
      <div class="bc-body"><b>${esc(b.name)}</b><p>SNS月次レポートを見る</p></div>
    </a>`;
  }).join("");

  return `
    <header class="no-print" style="margin-bottom:20px; background:var(--panel); display:inline-block; padding:14px 18px; border-radius:14px; box-shadow:var(--shadow)">
      <h1 style="font-size:22px">INOUE-GROUP SNS MONTHLY REPORT</h1>
      <p style="margin:4px 0 0; color:var(--ink-soft); font-size:13px">いのうえグループ SNS月次レポート</p>
    </header>
    <div class="brand-grid">${cards || `<p style="color:var(--ink-soft)">ブランドがありません。</p>`}</div>
    <a class="btn" href="#/glossary">用語一覧</a>
  `;
}

function renderBrand(){
  const brand = getBrand();
  if (!brand) return `<p>ブランドが見つかりません。</p><a class="btn" href="#/">← ブランド一覧</a>`;
  const cards = brand.platforms.map(p => {
    const meta = PLATFORM_META[p];
    const reports = []; // 概要のみ（詳細ページで読み込む）
    return `<a class="platform-card" href="#/b/${esc(brand.id)}/${meta.slug}">
      <div class="ph-top"><span class="ph-name">${platformIconSvg(p,18)} ${meta.label}</span></div>
      <div class="ph-label">タップして開く</div>
    </a>`;
  }).join("");
  return `
    <a class="no-print btn sm" href="#/">← ブランド一覧</a>
    <header style="margin:14px 0 18px; display:flex; align-items:center; gap:10px">
      <span style="width:20px;height:20px;border-radius:50%;background:${esc(brand.color)};display:inline-block"></span>
      <h1 style="font-size:22px">${esc(brand.name)}</h1>
    </header>
    <div class="platform-grid">${cards}</div>
  `;
}

function platformIconSvg(platform, size){
  size = size || 24;
  if (platform === "INSTAGRAM"){
    return `<svg width="${size}" height="${size}" viewBox="0 0 32 32"><defs><linearGradient id="igg" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#FFDD55"/><stop offset="45%" stop-color="#FF543E"/><stop offset="100%" stop-color="#C837AB"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#igg)"/><rect x="9" y="9" width="14" height="14" rx="4.5" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="16" cy="16" r="4" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="20.8" cy="11.2" r="1.1" fill="#fff"/></svg>`;
  }
  if (platform === "TIKTOK"){
    return `<svg width="${size}" height="${size}" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#010101"/><path d="M20 8.5c.6 1.6 1.8 2.7 3.6 2.9v2.6c-1.3.1-2.5-.3-3.6-1v6.1c0 2.9-2.2 4.9-4.8 4.9-2.6 0-4.8-2-4.8-4.7 0-2.8 2.4-4.9 5.1-4.7v2.6c-1.2-.2-2.4.6-2.4 2 0 1.2 1 2 2.1 2 1.2 0 2.2-.9 2.2-2.4V8.5H20Z" fill="#fff"/></svg>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#FF0000"/><rect x="8" y="11" width="16" height="10" rx="3" fill="#fff"/><path d="M14.5 13.8 19.5 16l-5 2.2v-4.4Z" fill="#FF0000"/></svg>`;
}

/* ---- SVGチャート ---- */
function svgLineChart(data, color, yTickStep){
  const w=560, h=180, padL=44, padR=10, padT=10, padB=22;
  const values = data.map(d=>d.value).filter(v=>v!==null && v!==undefined);
  if (values.length===0) return `<div style="height:180px;display:flex;align-items:center;justify-content:center;color:var(--ink-soft)">データがありません</div>`;
  let min = Math.min(...values), max = Math.max(...values);
  min = Math.floor(min*0.95); max = Math.ceil(max*1.05);
  if (yTickStep){ min = Math.floor(min/yTickStep)*yTickStep; max = Math.ceil(max/yTickStep)*yTickStep; }
  if (max===min) max = min+1;
  const n = data.length;
  const x = i => padL + (w-padL-padR) * (n<=1?0:i/(n-1));
  const y = v => padT + (h-padT-padB) * (1 - (v-min)/(max-min));
  let path = "", dots = "";
  data.forEach((d,i) => {
    if (d.value===null || d.value===undefined) return;
    const px=x(i), py=y(d.value);
    path += (path===""?"M":"L") + px.toFixed(1) + " " + py.toFixed(1) + " ";
    dots += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.5" fill="${color}"/>`;
  });
  const gridLines = [0,0.25,0.5,0.75,1].map(t => {
    const gy = padT + (h-padT-padB)*t;
    const val = max - (max-min)*t;
    return `<line x1="${padL}" y1="${gy}" x2="${w-padR}" y2="${gy}" stroke="currentColor" stroke-opacity="0.08"/><text x="${padL-6}" y="${gy+3}" font-size="9" text-anchor="end" fill="currentColor" opacity="0.5">${fmtNum(Math.round(val))}</text>`;
  }).join("");
  const labels = data.map((d,i) => (i%Math.ceil(n/6||1)===0) ? `<text x="${x(i)}" y="${h-6}" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.5">${esc(d.label)}</text>` : "").join("");
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:180px">${gridLines}${labels}<path d="${path}" fill="none" stroke="${color}" stroke-width="2"/>${dots}</svg>`;
}

function svgGroupedBar(categories, aLabel, aValues, bLabel, bValues, aColor, bColor){
  const w=560, h=200, padL=34, padR=10, padT=10, padB=34;
  const max = Math.max(1, ...aValues, ...bValues);
  const groupW = (w-padL-padR)/categories.length;
  const barW = groupW*0.32;
  let bars = "", labels = "";
  categories.forEach((cat,i) => {
    const gx = padL + groupW*i + groupW/2;
    const av = aValues[i]||0, bv = bValues[i]||0;
    const ah = (h-padT-padB) * (av/max), bh = (h-padT-padB) * (bv/max);
    bars += `<rect x="${(gx-barW-2).toFixed(1)}" y="${(h-padB-bh).toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="${bColor}"/>`;
    bars += `<rect x="${(gx+2).toFixed(1)}" y="${(h-padB-ah).toFixed(1)}" width="${barW.toFixed(1)}" height="${ah.toFixed(1)}" rx="3" fill="${aColor}"/>`;
    bars += `<text x="${(gx-barW-2+barW/2).toFixed(1)}" y="${(h-padB-bh-4).toFixed(1)}" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">${fmtNum(bv)}</text>`;
    bars += `<text x="${(gx+2+barW/2).toFixed(1)}" y="${(h-padB-ah-4).toFixed(1)}" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">${fmtNum(av)}</text>`;
    labels += `<text x="${gx.toFixed(1)}" y="${h-14}" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">${esc(cat)}</text>`;
  });
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:200px">
    <line x1="${padL}" y1="${h-padB}" x2="${w-padR}" y2="${h-padB}" stroke="currentColor" stroke-opacity="0.15"/>
    ${bars}${labels}
  </svg>
  <div class="legend"><span><i style="background:${aColor}"></i>${esc(aLabel)}</span><span><i style="background:${bColor}"></i>${esc(bLabel)}</span></div>`;
}

function svgEngagementCircles(engRate, interactions, views, color){
  const rows = [
    { label:"総閲覧数", delta: views, unit:"" },
    { label:"インタラクション数", delta: interactions, unit:"" },
    { label:"エンゲージメント率", delta: engRate, unit:"%" },
  ];
  const rowsHtml = rows.map(r => `<div style="margin-bottom:10px">
      <div style="font-weight:700;font-size:13px">${esc(r.label)}：${fmtNum(r.delta.current, r.unit==="%"?2:0)}${r.unit}
        ${r.delta.previous!==null ? `<span style="font-weight:400;color:var(--ink-soft)"> （前月${fmtNum(r.delta.previous, r.unit==="%"?2:0)}${r.unit}）</span>`:""}
      </div>
      <div style="margin-top:2px">${deltaBadgeHtml(r.delta)}</div>
    </div>`).join("");
  return `<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
    <svg width="160" height="180" viewBox="0 0 160 180">
      <circle cx="75" cy="90" r="72" fill="${color}" opacity="0.18"/>
      <circle cx="75" cy="90" r="48" fill="${color}" opacity="0.45"/>
      <circle cx="75" cy="90" r="24" fill="${color}"/>
      <g stroke="currentColor" stroke-opacity="0.35" stroke-width="1" fill="none">
        <path d="M121 35 L155 20" /><path d="M123 90 L155 90" /><path d="M90 108 L155 160" />
      </g>
    </svg>
    <div style="flex:1;min-width:200px">${rowsHtml}</div>
  </div>`;
}

function svgDonut(title, data, colors){
  const total = data.reduce((s,d)=>s+(d.value||0),0);
  if (total<=0) return `<div class="donut-cell"><div class="dt">${esc(title)}</div><div style="height:120px;display:flex;align-items:center;justify-content:center;color:var(--ink-soft);font-size:11px">データなし</div></div>`;
  const r=45, cx=55, cy=55; let angle=-90; const arcs=[];
  data.forEach((d,i) => {
    const frac = (d.value||0)/total;
    const a0 = angle, a1 = angle + frac*360; angle = a1;
    const large = (a1-a0)>180 ? 1 : 0;
    const p0 = polar(cx,cy,r,a0), p1 = polar(cx,cy,r,a1);
    arcs.push(`<path d="M${cx},${cy} L${p0.x},${p0.y} A${r},${r} 0 ${large} 1 ${p1.x},${p1.y} Z" fill="${colors[i%colors.length]}"/>`);
  });
  const legend = data.map((d,i) => `<span><i style="background:${colors[i%colors.length]}"></i>${esc(d.name)} ${d.value}%</span>`).join("");
  return `<div class="donut-cell"><div class="dt">${esc(title)}</div>
    <svg viewBox="0 0 110 110" style="width:100%;max-width:140px"><circle cx="55" cy="55" r="45" fill="var(--chip)"/>${arcs}<circle cx="55" cy="55" r="24" fill="var(--panel)"/></svg>
    <div class="legend">${legend}</div></div>`;
}
function polar(cx,cy,r,deg){ const rad=(deg*Math.PI)/180; return { x:(cx+r*Math.cos(rad)).toFixed(2), y:(cy+r*Math.sin(rad)).toFixed(2) }; }

function svgHBar(title, items, color){
  const sorted = [...items].sort((a,b)=>b.percent-a.percent);
  if (sorted.length===0) return `<div class="chart-box"><div class="ct-title">${esc(title)}</div><div style="color:var(--ink-soft);font-size:12px">データがありません</div></div>`;
  const max = Math.max(...sorted.map(s=>s.percent), 1);
  const rows = sorted.map(s => {
    const w = Math.max(2, (s.percent/max)*100);
    return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <div style="width:64px;font-size:11px;color:var(--ink-soft);flex:none">${esc(s.label)}</div>
      <div style="flex:1;background:var(--chip);border-radius:4px;overflow:hidden"><div style="width:${w}%;background:${color};height:14px"></div></div>
      <div style="width:40px;font-size:11px;text-align:right;flex:none">${s.percent}%</div>
    </div>`;
  }).join("");
  return `<div class="chart-box"><div class="ct-title">${esc(title)}</div>${rows}</div>`;
}

/* ---- プラットフォームページ ---- */
function renderPlatform(){
  const brand = getBrand();
  if (!brand) return `<p>読み込み中...</p>`;
  const platform = platformFromSlug(state.platformSlug);
  const meta = PLATFORM_META[platform];
  if (!state.year || !state.month) return `<p>読み込み中...</p>`;

  const report = currentReport() || {};
  const prev = previousReport();
  const isYoutube = platform === "YOUTUBE";
  const isInstagram = platform === "INSTAGRAM";

  const deltas = {
    followers: computeDelta(report.followers??null, prev?prev.followers:null),
    postsCount: computeDelta(report.postsCount??null, prev?prev.postsCount:null),
    interactions: computeDelta(report.interactions??null, prev?prev.interactions:null),
    likesCount: computeDelta(report.likesCount??null, prev?prev.likesCount:null),
    views: computeDelta(report.views??null, prev?prev.views:null),
    engagementRate: computeDelta(resolveEngagementRate(report), prev?resolveEngagementRate(prev):null),
  };

  const now = new Date();
  const optionMap = new Map();
  state.reports.forEach(r => optionMap.set(r.year+"-"+r.month, {year:r.year, month:r.month, hasData:true}));
  for (let i=0;i<12;i++){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const key = d.getFullYear()+"-"+(d.getMonth()+1);
    if (!optionMap.has(key)) optionMap.set(key, {year:d.getFullYear(), month:d.getMonth()+1, hasData:false});
  }
  const selKey = state.year+"-"+state.month;
  if (!optionMap.has(selKey)) optionMap.set(selKey, {year:state.year, month:state.month, hasData:false});
  const options = [...optionMap.values()].sort((a,b)=> a.year===b.year ? a.month-b.month : a.year-b.year);
  const monthSelect = `<select id="monthSelect" class="no-print" style="width:auto">
    ${options.map(o => `<option value="${o.year}-${o.month}" ${o.year===state.year&&o.month===state.month?"selected":""}>${o.year}年${MONTH_LABELS[o.month-1]}${o.hasData?"":"（未入力）"}</option>`).join("")}
  </select>`;

  const followersTrend = state.reports.map(r => ({ label:r.year+"/"+r.month, value:r.followers??null }));
  const viewsTrend = state.reports.map(r => ({ label:r.year+"/"+r.month, value:r.views??null }));

  const kpis = [
    { label: isYoutube?"チャンネル登録者数":"フォロワー数", delta: deltas.followers },
    { label: isYoutube?"動画投稿数":"投稿数", delta: deltas.postsCount },
    { label: "インタラクション数", delta: deltas.interactions },
    ...(isYoutube ? [{ label:"高評価数", delta: deltas.likesCount }] : []),
    { label: "総閲覧数", delta: deltas.views },
    { label: "エンゲージメント率", delta: deltas.engagementRate, unit:"%" },
  ];
  const kpiHtml = kpis.map(k => `<div class="kpi"><div class="k-label">${esc(k.label)}</div><div class="k-value">${fmtNum(k.delta.current, k.unit==="%"?2:0)}${k.unit||""}</div>${deltaBadgeHtml(k.delta)}</div>`).join("");

  let instagramExtras = "";
  if (isInstagram){
    const st=[report.stCount??0], fd=[report.fdCount??0], rl=[report.rlCount??0];
    const stP=[prev?prev.stCount||0:0], fdP=[prev?prev.fdCount||0:0], rlP=[prev?prev.rlCount||0:0];
    const shade1 = brand.color, shade2 = lighten(brand.color,0.4), shade3 = lighten(brand.color,0.7);
    instagramExtras += `<div class="chart-grid" style="margin-bottom:14px">
      <div class="chart-box"><div class="ct-title">投稿数の内訳（ST／FD／RL）</div>
        ${svgGroupedBar(["ST","FD","RL"], "今月", [report.stCount??0, report.fdCount??0, report.rlCount??0], "前月", [prev?prev.stCount||0:0, prev?prev.fdCount||0:0, prev?prev.rlCount||0:0], brand.color, "#cbd5e1")}
      </div>
      <div class="chart-box"><div class="ct-title">エンゲージメント</div>${svgEngagementCircles(deltas.engagementRate, deltas.interactions, deltas.views, brand.color)}</div>
    </div>
    <div class="chart-box" style="margin-bottom:14px"><div class="ct-title">コンテンツタイプ別閲覧数</div>
      <div class="donut-row">
        ${svgDonut("ユーザー属性比率", [{name:"フォロワー",value:report.followerViewPercent||0},{name:"非フォロワー",value:report.nonFollowerViewPercent||0}], [shade1,shade3])}
        ${svgDonut("コンテンツタイプ別", [{name:"ストーリーズ",value:report.storiesViewPercent||0},{name:"投稿",value:report.feedViewPercent||0},{name:"リール",value:report.reelsViewPercent||0}], [shade1,shade2,shade3])}
        ${svgDonut("性別比率", [{name:"女性",value:report.femalePercent||0},{name:"男性",value:report.malePercent||0}], [shade1,shade3])}
      </div>
    </div>
    <div class="chart-grid" style="margin-bottom:14px">
      ${svgHBar("閲覧上位の地域", report.topRegions||[], brand.color)}
      ${svgHBar("閲覧上位の年齢層", report.topAgeBrackets||[], brand.color)}
    </div>`;
  }

  const formHtml = state.editMode ? renderEditForm(report, isInstagram, isYoutube) : "";
  const viewToggleBtn = `<button id="toggleEdit" class="btn ${state.editMode?"":"primary"} no-print">${state.editMode?"閲覧モードに戻る":"編集する"}</button>`;

  let instagramManagers = "";
  if (isInstagram){
    instagramManagers = renderPostHighlights() + renderLinkClicks();
  }

  return `
    <a class="no-print btn sm" href="#/b/${esc(brand.id)}">← ${esc(brand.name)}</a>
    <header style="margin:14px 0 10px; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px">
      <div style="display:flex; align-items:center; gap:8px">${platformIconSvg(platform,22)}<h1 style="font-size:20px">${esc(brand.name)} / ${meta.label}</h1></div>
      <div style="display:flex; gap:8px; align-items:center">${monthSelect}${viewToggleBtn}</div>
    </header>
    <p style="color:var(--ink-soft); font-size:13px; margin-bottom:14px">${state.year}年${MONTH_LABELS[state.month-1]}の実績${prev?`（前月：${prev.year}年${MONTH_LABELS[prev.month-1]}と比較）`:"（前月データなし）"}</p>

    <div class="kpi-grid" style="margin-bottom:16px">${kpiHtml}</div>

    <div class="chart-grid" style="margin-bottom:14px">
      <div class="chart-box"><div class="ct-title">フォロワー数の推移</div>${svgLineChart(followersTrend, brand.color, 100)}</div>
      <div class="chart-box"><div class="ct-title">総閲覧数の推移</div>${svgLineChart(viewsTrend, brand.color)}</div>
    </div>

    ${instagramExtras}

    ${formHtml}

    <div class="no-print" style="margin:14px 0"><button id="pdfBtn" class="btn">PDFで保存</button></div>

    ${instagramManagers}
  `;
}

function renderEditForm(report, isInstagram, isYoutube){
  const regionRows = padRows(report.topRegions);
  const ageRows = padRows(report.topAgeBrackets);
  function padRows(items){
    const rows = (items||[]).map(i=>({label:i.label, percent:i.percent}));
    while (rows.length<4) rows.push({label:"",percent:""});
    return rows.slice(0,4);
  }
  function field(id, label, value, unit){
    return `<label class="fld"><span>${esc(label)}${unit?`（${unit}）`:""}</span><input type="number" step="any" id="${id}" value="${value===null||value===undefined?"":value}"></label>`;
  }
  return `<form id="reportForm" class="panel no-print">
    <h2>数値を入力</h2>
    <div class="row" style="margin-bottom:14px">
      ${field("f_followers", isYoutube?"チャンネル登録者数":"フォロワー数", report.followers)}
      ${isInstagram ? `
        ${field("f_st","投稿数：ST（ストーリーズ）", report.stCount)}
        ${field("f_fd","投稿数：FD（フィード）", report.fdCount)}
        ${field("f_rl","投稿数：RL（リール）", report.rlCount)}
      ` : field("f_posts", isYoutube?"動画投稿数":"投稿数", report.postsCount)}
      ${field("f_interactions","インタラクション数", report.interactions)}
      ${isYoutube ? field("f_likes","高評価数", report.likesCount) : ""}
      ${field("f_views","総閲覧数", report.views)}
    </div>
    <p style="font-size:12px;color:var(--ink-soft);margin-bottom:14px">エンゲージメント率はインタラクション数と総閲覧数から自動的に計算されます。</p>

    ${isInstagram ? `
    <h2>オーディエンス</h2>
    <div class="row" style="margin-bottom:10px">
      ${field("f_followerViewPercent","閲覧比率：フォロワー", report.followerViewPercent, "%")}
      ${field("f_nonFollowerViewPercent","閲覧比率：非フォロワー", report.nonFollowerViewPercent, "%")}
      ${field("f_storiesViewPercent","閲覧比率：ストーリーズ", report.storiesViewPercent, "%")}
      ${field("f_feedViewPercent","閲覧比率：投稿", report.feedViewPercent, "%")}
      ${field("f_reelsViewPercent","閲覧比率：リール", report.reelsViewPercent, "%")}
      ${field("f_femalePercent","性別比率：女性", report.femalePercent, "%")}
      ${field("f_malePercent","性別比率：男性", report.malePercent, "%")}
    </div>
    <div class="fld" style="margin-bottom:10px"><span>閲覧上位の地域（地域名・%）</span>
      <div class="row">${regionRows.map((r,i)=>`<input placeholder="地域名" id="region_l_${i}" value="${esc(r.label)}" style="width:110px"><input type="number" step="any" placeholder="%" id="region_p_${i}" value="${r.percent}" style="width:70px">`).join("")}</div>
    </div>
    <div class="fld" style="margin-bottom:10px"><span>閲覧上位の年齢層（年齢層・%）</span>
      <div class="row">${ageRows.map((r,i)=>`<input placeholder="25-34" id="age_l_${i}" value="${esc(r.label)}" style="width:80px"><input type="number" step="any" placeholder="%" id="age_p_${i}" value="${r.percent}" style="width:70px">`).join("")}</div>
    </div>
    ` : ""}

    <label class="fld" style="margin-bottom:12px"><span>まとめ・メモ</span><textarea id="f_notes">${esc(report.notes||"")}</textarea></label>
    <button type="submit" class="btn primary">保存する</button>
    <span id="formMsg" style="margin-left:10px;font-size:13px"></span>
  </form>`;
}

function renderLinkClicks(){
  const items = [...state.linkClicks].sort((a,b)=>b.clickCount-a.clickCount);
  const cards = items.map(it => `<div class="item-card">
    <img class="item-thumb tall" src="${it.imageData||''}" alt="${esc(it.title)}">
    <div class="item-title">${esc(it.title)}</div><div class="item-sub">${it.clickCount}件</div>
    <button class="no-print btn sm danger" data-del-linkclick="${it.id}">削除</button>
  </div>`).join("");
  return `<div class="panel">
    <h2>完成見学会などイベントのリンククリック数</h2>
    <div class="item-grid">${cards || `<p style="color:var(--ink-soft);font-size:13px">まだ登録がありません。</p>`}</div>
    <form id="linkClickForm" class="row no-print">
      <label class="fld"><span>タイトル</span><input id="lc_title" placeholder="例：鈴木様邸"></label>
      <label class="fld" style="min-width:90px"><span>クリック数</span><input type="number" id="lc_count"></label>
      <label class="fld"><span>画像</span><input type="file" accept="image/*" id="lc_image"></label>
      <button type="submit" class="btn">+ 追加</button>
    </form>
  </div>`;
}

function renderPostHighlights(){
  const items = state.postHighlights;
  const cards = items.map(it => {
    const eng = it.views ? (it.interactions/it.views*100) : null;
    return `<div class="item-card">
      <img class="item-thumb" src="${it.imageData||''}" alt="${esc(it.title)}">
      <div class="item-title">${esc(it.title)}</div>
      <div class="item-sub">閲覧数 ${fmtNum(it.views)}</div>
      <div class="item-sub">Int. ${fmtNum(it.interactions)}</div>
      <div class="item-sub">Eng率 ${eng===null?"ー":eng.toFixed(1)+"%"}</div>
      <button class="no-print btn sm danger" data-del-posthighlight="${it.id}">削除</button>
    </div>`;
  }).join("");
  return `<div class="panel">
    <h2>今月の投稿</h2>
    <div class="item-grid">${cards || `<p style="color:var(--ink-soft);font-size:13px">まだ登録がありません。</p>`}</div>
    <form id="postHighlightForm" class="row no-print">
      <label class="fld"><span>タイトル</span><input id="ph_title" placeholder="例：Living"></label>
      <label class="fld" style="min-width:90px"><span>閲覧数</span><input type="number" id="ph_views"></label>
      <label class="fld" style="min-width:90px"><span>インタラクション数</span><input type="number" id="ph_interactions"></label>
      <label class="fld"><span>画像</span><input type="file" accept="image/*" id="ph_image"></label>
      <button type="submit" class="btn">+ 追加</button>
    </form>
  </div>`;
}

function renderGlossaryPage(){
  const q = state.glossaryQuery.trim().toLowerCase();
  const filtered = state.glossary.filter(t => !q || t.term.toLowerCase().includes(q) || t.reading.includes(q) || t.description.toLowerCase().includes(q));
  const sorted = [...filtered].sort((a,b)=>a.reading.localeCompare(b.reading,"ja"));
  const groups = [];
  sorted.forEach(t => {
    const key = t.reading.charAt(0)||"?";
    let g = groups.find(x=>x.key===key);
    if (!g){ g={key,items:[]}; groups.push(g); }
    g.items.push(t);
  });
  const rows = groups.map(g => `<div class="glossary-row">
    <div class="glossary-idx">${esc(g.key)}</div>
    <div class="glossary-list">${g.items.map(t=>`<div class="glossary-item"><b>${esc(t.term)}</b><p>${esc(t.description)}</p></div>`).join("")}</div>
  </div>`).join("");

  return `
    <a class="btn sm" href="#/">← ブランド一覧</a>
    <h1 style="font-size:20px;margin:14px 0 4px">用語一覧</h1>
    <p style="color:var(--ink-soft);font-size:13px;margin-bottom:14px">SNSレポートで使われる専門用語をあいうえお順にまとめています。</p>
    <input type="search" id="glossarySearch" placeholder="用語を検索" value="${esc(state.glossaryQuery)}" style="margin-bottom:12px">
    <div class="panel" style="padding:0">${rows || `<p style="padding:14px;color:var(--ink-soft)">該当する用語が見つかりませんでした。</p>`}</div>
    <form id="glossaryForm" class="panel row" style="margin-top:14px">
      <label class="fld"><span>用語</span><input id="g_term" placeholder="例：CTR"></label>
      <label class="fld"><span>読み（ひらがな）</span><input id="g_reading" placeholder="例：しーてぃーあーる"></label>
      <label class="fld" style="flex:2; min-width:220px"><span>説明</span><input id="g_description"></label>
      <button type="submit" class="btn primary">追加する</button>
    </form>
  `;
}

/* =========================================================================
   イベント配線
   ========================================================================= */
function wireView(){
  if (state.view === "platform"){
    const ms = document.getElementById("monthSelect");
    if (ms) ms.onchange = () => { const [y,m] = ms.value.split("-"); navigate(`/b/${state.brandSlug}/${state.platformSlug}?y=${y}&m=${m}${state.editMode?"&edit=1":""}`); };

    const toggle = document.getElementById("toggleEdit");
    if (toggle) toggle.onclick = () => navigate(`/b/${state.brandSlug}/${state.platformSlug}?y=${state.year}&m=${state.month}${state.editMode?"":"&edit=1"}`);

    const pdfBtn = document.getElementById("pdfBtn");
    if (pdfBtn) pdfBtn.onclick = printReport;

    const form = document.getElementById("reportForm");
    if (form) form.onsubmit = onSubmitReportForm;

    const lcForm = document.getElementById("linkClickForm");
    if (lcForm) lcForm.onsubmit = onSubmitLinkClick;
    document.querySelectorAll("[data-del-linkclick]").forEach(btn => btn.onclick = () => DB.remove(reportPath()+"/linkClicks/"+btn.dataset.delLinkclick));

    const phForm = document.getElementById("postHighlightForm");
    if (phForm) phForm.onsubmit = onSubmitPostHighlight;
    document.querySelectorAll("[data-del-posthighlight]").forEach(btn => btn.onclick = () => DB.remove(reportPath()+"/postHighlights/"+btn.dataset.delPosthighlight));
  }
  if (state.view === "glossary"){
    const search = document.getElementById("glossarySearch");
    if (search) search.oninput = () => { state.glossaryQuery = search.value; render(); document.getElementById("glossarySearch").focus(); };
    const gForm = document.getElementById("glossaryForm");
    if (gForm) gForm.onsubmit = async (e) => {
      e.preventDefault();
      const term = document.getElementById("g_term").value.trim();
      const reading = document.getElementById("g_reading").value.trim();
      const description = document.getElementById("g_description").value.trim();
      if (!term || !reading || !description) return;
      await DB.add("glossary", { term, reading, description });
      gForm.reset();
    };
  }
}

async function onSubmitReportForm(e){
  e.preventDefault();
  const platform = platformFromSlug(state.platformSlug);
  const isInstagram = platform === "INSTAGRAM";
  const isYoutube = platform === "YOUTUBE";
  const g = id => document.getElementById(id);
  const data = {
    platform, year: state.year, month: state.month,
    followers: toNumOrNull(g("f_followers").value),
    interactions: toNumOrNull(g("f_interactions").value),
    views: toNumOrNull(g("f_views").value),
    notes: g("f_notes").value.trim() || null,
    engagementRate: null,
  };
  if (isYoutube) data.likesCount = toNumOrNull(g("f_likes").value);
  if (isInstagram){
    const st = toNumOrNull(g("f_st").value), fd = toNumOrNull(g("f_fd").value), rl = toNumOrNull(g("f_rl").value);
    data.stCount = st; data.fdCount = fd; data.rlCount = rl;
    data.postsCount = (st||0)+(fd||0)+(rl||0);
    ["followerViewPercent","nonFollowerViewPercent","storiesViewPercent","feedViewPercent","reelsViewPercent","femalePercent","malePercent"].forEach(k => {
      data[k] = toNumOrNull(g("f_"+k).value);
    });
    data.topRegions = readRows("region");
    data.topAgeBrackets = readRows("age");
  } else {
    data.postsCount = toNumOrNull(g("f_posts").value);
  }
  function readRows(prefix){
    const rows = [];
    for (let i=0;i<4;i++){
      const label = (g(prefix+"_l_"+i)||{}).value || "";
      const percent = (g(prefix+"_p_"+i)||{}).value || "";
      if (label.trim() && percent.trim()){ const n=Number(percent); if(!Number.isNaN(n)) rows.push({label:label.trim(), percent:n}); }
    }
    return rows;
  }

  await DB.merge(reportPath(), data);
  document.getElementById("formMsg").textContent = "保存しました";
  navigate(`/b/${state.brandSlug}/${state.platformSlug}?y=${state.year}&m=${state.month}`);
}

async function onSubmitLinkClick(e){
  e.preventDefault();
  const title = document.getElementById("lc_title").value.trim();
  const count = toNumOrNull(document.getElementById("lc_count").value);
  const file = document.getElementById("lc_image").files[0];
  if (!title || count===null) return;
  let imageData = null;
  if (file) imageData = await fileToDataUrl(file, 480, 0.75);
  await ensureReportExists();
  await DB.add(reportPath()+"/linkClicks", { title, clickCount: count, imageData, createdAt: Date.now() });
}
async function onSubmitPostHighlight(e){
  e.preventDefault();
  const title = document.getElementById("ph_title").value.trim();
  const views = toNumOrNull(document.getElementById("ph_views").value);
  const interactions = toNumOrNull(document.getElementById("ph_interactions").value);
  const file = document.getElementById("ph_image").files[0];
  if (!title || views===null || interactions===null) return;
  let imageData = null;
  if (file) imageData = await fileToDataUrl(file, 480, 0.75);
  await ensureReportExists();
  await DB.add(reportPath()+"/postHighlights", { title, views, interactions, imageData, createdAt: Date.now() });
}
async function ensureReportExists(){
  if (!currentReport()) await DB.merge(reportPath(), { platform: platformFromSlug(state.platformSlug), year: state.year, month: state.month });
}

/* ---- PDF出力（印刷専用エリアを組み立ててから印刷） ---- */
function printReport(){
  const brand = getBrand();
  const platform = platformFromSlug(state.platformSlug);
  const meta = PLATFORM_META[platform];
  const report = currentReport() || {};
  const prev = previousReport();
  const eng = resolveEngagementRate(report);
  const area = document.getElementById("printArea");
  area.innerHTML = `
    <div class="p-h1">${esc(brand.name)} / ${meta.label}</div>
    <div class="p-h2">${state.year}年${MONTH_LABELS[state.month-1]}の実績${prev?`（前月：${prev.year}年${MONTH_LABELS[prev.month-1]}と比較）`:""}</div>
    <div class="p-kpis">
      <div class="p-kpi"><div class="l">フォロワー数</div><div class="v">${fmtNum(report.followers)}</div></div>
      <div class="p-kpi"><div class="l">投稿数</div><div class="v">${fmtNum(report.postsCount)}</div></div>
      <div class="p-kpi"><div class="l">インタラクション数</div><div class="v">${fmtNum(report.interactions)}</div></div>
      <div class="p-kpi"><div class="l">総閲覧数</div><div class="v">${fmtNum(report.views)}</div></div>
      <div class="p-kpi"><div class="l">エンゲージメント率</div><div class="v">${eng===null?"ー":eng.toFixed(2)+"%"}</div></div>
    </div>
    <div class="p-section"><h3>まとめ・メモ</h3><div>${esc(report.notes||"（記載なし）")}</div></div>
  `;
  window.print();
}

boot();
