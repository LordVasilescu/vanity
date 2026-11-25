// (c) 2026 Mathew. All rights reserved.
// Vanity front end: hash-routed single page. Views: home, vault, check, looks, bijou, tryon, discover, shop, organizer, profile.
"use strict";
const $ = (s, el = document) => el.querySelector(s);
const view = $("#view");
const S = { state: null, items: [], filter: "all" };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => n == null ? "-" : "$" + Number(n).toLocaleString(undefined, { maximumFractionDigits: n < 10 ? 2 : 0 });
// pictures come as small webp copies: 720 px for big views, 360 px in grids and strips (full size is never needed on a phone)
const media = rel => ON.media(rel);
const thumb = rel => ON.media(rel);
new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) for (const i of (n.tagName === "IMG" ? [n] : n.getElementsByTagName("img"))) if (!i.hasAttribute("decoding")) i.decoding = "async"; })
  .observe(document.documentElement, { childList: true, subtree: true });
const CAT_LABEL = { tops: "Tops", bottoms: "Bottoms", dresses: "Dresses", outerwear: "Outerwear", shoes: "Shoes", bags: "Bags", jewelry: "Jewelry", accessories: "Accessories", makeup: "Makeup" };
const COLOR_HEX = { black: "#111", white: "#f7f7f5", ivory: "#f4efe1", cream: "#efe4cc", beige: "#d9c4a3", camel: "#c19a6b", tan: "#c8a27a", brown: "#6f4a33", chocolate: "#4a2e20", grey: "#8d8d8d", gray: "#8d8d8d", charcoal: "#3a3a3a", navy: "#1f2b4d", denim: "#4a6a94", blue: "#3466c2", "sky": "#8fc1ea", red: "#c3262b", burgundy: "#6d1a2a", wine: "#6a1b2c", pink: "#f0a6be", blush: "#f2c6c2", rose: "#d97a8c", fuchsia: "#d0338a", purple: "#7a4bb0", lavender: "#c4b2e6", lilac: "#c8a6dc", green: "#3e8e57", emerald: "#1f7a55", olive: "#6f7440", sage: "#a3b18a", mint: "#a8e0c8", teal: "#1f8a8a", yellow: "#efd043", mustard: "#c99a2e", orange: "#e57a2e", coral: "#f08070", rust: "#a84b2a", gold: "#d4af37", silver: "#c0c0c8", nude: "#e0b9a0", taupe: "#8b7d6b", khaki: "#b5a77a", champagne: "#e8cda0", peach: "#f5b997" };
const hex = c => COLOR_HEX[(c || "").toLowerCase()] || COLOR_HEX[(c || "").toLowerCase().split(" ").pop()] || "#777";

// GET answers are kept for a few seconds (and shared while in flight) so tab switches don't wait on the tunnel;
// any change (POST/PATCH/DELETE) drops them all.
const API_CACHE = new Map(), API_TTL = 20000, NO_CACHE = /^\/api\/(state|jobs)/;
function api(path, opts = {}) {
  const m = opts.method || (opts.body ? "POST" : "GET");
  if (m !== "GET") { API_CACHE.clear(); return apiFetch(path, opts).finally(() => API_CACHE.clear()); }
  if (NO_CACHE.test(path)) return apiFetch(path, opts);
  const hit = API_CACHE.get(path);
  if (hit && Date.now() - hit.t < API_TTL) return hit.p.then(d => structuredClone(d));
  const p = apiFetch(path, opts);
  API_CACHE.set(path, { t: Date.now(), p });
  p.catch(() => API_CACHE.delete(path));
  return p.then(d => structuredClone(d));
}
// warm the other tabs' data while the phone is idle
function prefetchTabs() {
  const go = () => ["/api/items", "/api/outfits?n=7", "/api/looks", "/api/foryou", "/api/exchange", "/api/checks", "/api/me", "/api/bijou"]
    .forEach((u, i) => setTimeout(() => api(u).catch(() => { }), i * 120));
  (window.requestIdleCallback || (f => setTimeout(f, 1200)))(go, { timeout: 2500 });
}
function apiFetch(path, opts = {}) { return ON.call(path, opts); }
function toast(msg, ms = 2600) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), ms); }

// ---------- icons (clean SVG, no emojis) ----------
const IC = {
  camera: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.6"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  gem: '<svg viewBox="0 0 24 24"><path d="M6 3h12l3 5-9 13L3 8z M3 8h18 M9 3l3 18 3-18"/></svg>',
  hanger: '<svg viewBox="0 0 24 24"><path d="M12 7a2 2 0 1 1 2-2M12 7v1.5L3.5 15a1.3 1.3 0 0 0 .8 2.3h15.4a1.3 1.3 0 0 0 .8-2.3L12 8.5"/></svg>',
  mirror: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="10" rx="6" ry="7.5"/><path d="M9 21h6M12 17.5V21M9.5 7.5l2-2"/></svg>',
  spark: '<svg viewBox="0 0 24 24"><path d="M12 2l2.2 6.6L21 9l-5.4 4.1L17.6 20 12 16l-5.6 4 2-6.9L3 9l6.8-.4z"/></svg>',
  bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  grid: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
  compass: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>',
  crown: '<svg viewBox="0 0 24 24"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  send: '<svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-2-6z"/></svg>',
  wand: '<svg viewBox="0 0 24 24"><path d="M4 20L16 8M14 4v3M19 9h-3M18 5l-2 2M10 3l.7 1.6L12.3 5l-1.6.7L10 7.3l-.7-1.6L7.7 5l1.6-.4z"/></svg>',
  ribbon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/></svg>',
};

const ART = n => `static/art/${n}.webp`;
const AI = (n, cls = "bi") => `<img class="${cls}" src="${ART(n)}" alt="">`;

// ---------- feel: haptics + soft sound (Web Audio, unlocked on the first tap) ----------
let tapped = false; addEventListener("pointerdown", () => tapped = true, { capture: true });
const buzz = p => { try { tapped && navigator.vibrate && navigator.vibrate(p); } catch { } };  // haptics only after a real tap
const SND = (() => {
  let ac = null;
  const ctx = () => { if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (A) ac = new A(); } if (ac && ac.state === "suspended") ac.resume(); return ac; };
  const tone = (f, t0, dur, vol, type = "sine") => {
    const a = ctx(); if (!a) return; const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0;
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
  };
  return {
    unlock: ctx,
    chime() { [[1318.5, 0], [1760, .12], [2093, .26], [2637, .42]].forEach(([f, t]) => { tone(f, t, 2.2, .07); tone(f * 2.01, t, 1.2, .015); }); },
    tick() { tone(2400, 0, .03, .02, "triangle"); },
    land() { tone(880, 0, .5, .05); tone(1320, .05, .6, .03); },
    thud() { tone(90, 0, .35, .25, "sine"); tone(180, 0, .12, .08, "triangle"); },
    coin() { tone(1975, 0, .25, .05, "square"); tone(2637, .07, .35, .04, "square"); },
    flip() { tone(600, 0, .08, .03, "triangle"); },
  };
})();
addEventListener("pointerdown", () => SND.unlock(), { once: true, capture: true });

// ---------- sparkle particles (subtle) ----------
const spk = (() => {
  const c = $("#sparkle"), x = c.getContext("2d"); let P = [];
  const fit = () => { c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio; };
  fit(); addEventListener("resize", fit);
  function loop() {
    x.clearRect(0, 0, c.width, c.height);
    P = P.filter(p => p.life > 0);
    for (const p of P) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.life -= 1;
      const a = Math.min(1, p.life / 30), r = p.r * devicePixelRatio;
      x.fillStyle = `rgba(${p.col},${a})`; x.save(); x.translate(p.x * devicePixelRatio, p.y * devicePixelRatio); x.rotate(p.life / 10);
      x.beginPath(); x.moveTo(0, -r * 2); x.lineTo(r * .5, 0); x.lineTo(0, r * 2); x.lineTo(-r * .5, 0); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(-r * 2, 0); x.lineTo(0, r * .5); x.lineTo(r * 2, 0); x.lineTo(0, -r * .5); x.closePath(); x.fill(); x.restore();
    }
    if (P.length) requestAnimationFrame(loop); else x.clearRect(0, 0, c.width, c.height);
  }
  return (cx = innerWidth / 2, cy = innerHeight / 2, n = 26) => {
    const start = !P.length;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3.2;
      P.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5, r: 1.5 + Math.random() * 2.5, life: 50 + Math.random() * 40, col: Math.random() < .7 ? "232,205,160" : "242,198,194" });
    }
    if (start) requestAnimationFrame(loop);
  };
})();

function reward(r, ev) {
  if (!r) return;
  const pt = ev && ev.clientX ? [ev.clientX, ev.clientY] : [innerWidth / 2, innerHeight / 3];
  spk(pt[0], pt[1]);
  toast(`+${r.xp} Style XP`);
  if (r.level_up) setTimeout(() => levelUp(r.level), 700);
  refreshState();
}
function questDone(q) { if (q) setTimeout(() => { spk(innerWidth / 2, innerHeight / 2, 40); toast(`Daily quest complete  +${q.xp} XP`, 3200); refreshState(); }, 900); }
function levelUp(l) {
  sheet(`<div class="levelup">${AI("medal", "lvmedal")}<div class="eyebrow">Closet Level</div><div class="big">${l.level}</div><h2 style="margin:6px 0">${esc(l.title)}</h2>
    <p class="mute">Your closet just leveled up. Keep adding, wearing and styling.</p><button class="btn wide" onclick="closeSheet()">Gorgeous</button></div>`);
  for (let i = 0; i < 4; i++) setTimeout(() => spk(innerWidth * (.2 + .2 * i), innerHeight * .4, 30), i * 220);
}

// ---------- cinematic first launch: velvet curtain, vault door, gold dust, her name, a chime ----------
function launch(name) {
  let seen = false; try { seen = sessionStorage.getItem("vanity_in") === "1" && !location.search.includes("intro"); } catch { }
  if (seen) return;
  const L = $("#launch"), h = new Date().getHours();
  const hi = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  L.innerHTML = `<div class="glowfloor"></div><div class="cur l"></div><div class="cur r"></div><div class="door"></div>
    <div class="stage"><button class="btn lx-tap" id="lxGo">View my closet</button></div><canvas></canvas>`;
  L.classList.remove("hidden", "gone", "open");
  const cv = $("canvas", L), x = cv.getContext("2d"), dpr = devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  const dust = Array.from({ length: 70 }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: .4 + Math.random() * 1.6, v: .15 + Math.random() * .5, p: Math.random() * 6 }));
  let run = true, burst = 0;
  (function loop(t) {
    if (!run) return; x.clearRect(0, 0, cv.width, cv.height);
    for (const d of dust) {
      d.y -= d.v * (1 + burst * 6); d.x += Math.sin(t / 900 + d.p) * .3; if (d.y < -5) { d.y = innerHeight + 5; d.x = Math.random() * innerWidth; }
      const a = .35 + .45 * Math.sin(t / 400 + d.p * 3);
      x.fillStyle = `rgba(240,214,170,${Math.max(0, a)})`; x.beginPath(); x.arc(d.x * dpr, d.y * dpr, d.r * dpr, 0, 7); x.fill();
    }
    burst *= .985; requestAnimationFrame(loop);
  })(0);
  let opened = false;
  const open = () => {
    if (opened) return; opened = true; try { sessionStorage.setItem("vanity_in", "1"); } catch { }
    SND.chime(); buzz([12, 60, 18]); burst = 1; L.classList.add("open");
    setTimeout(() => spk(innerWidth / 2, innerHeight * .4, 50), 500);
    setTimeout(() => L.classList.add("gone"), 2100);
    setTimeout(() => { run = false; L.classList.add("hidden"); L.innerHTML = ""; }, 3200);
  };
  $("#lxGo").onclick = open; L.onclick = e => { if (e.target === L || e.target.classList.contains("door")) open(); };
}

// ---------- state / header ----------
async function refreshState() {
  S.state = await api("/api/state");
  const l = S.state.level;
  $("#lvlNum").textContent = l.level; $("#lvlTitle").textContent = l.title;
  $("#lvlRing").style.strokeDashoffset = 94.2 * (1 - l.pct / 100);
  if (!S.coinFlying) $("#walletN").textContent = money(S.state.money_saved || 0);
  renderQueue(S.state.queue);
  return S.state;
}
async function loadItems() { S.items = (await api("/api/items")).items; return S.items; }

// ---------- sheets ----------
function sheet(html) { const m = $("#modal"); m.innerHTML = `<div class="sheet"><div class="grab"></div>${html}</div>`; m.classList.remove("hidden"); return m.firstChild; }
function closeSheet() { $("#modal").classList.add("hidden"); $("#modal").innerHTML = ""; }
$("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeSheet(); });

// ---------- photo picking ----------
function pickPhoto(camera = true) {
  return new Promise(res => {
    const inp = camera ? $("#file") : $("#fileLib");
    inp.value = ""; inp.onchange = () => { const f = inp.files[0]; if (!f) return res(null); shrink(f).then(res); };
    inp.click();
  });
}
function shrink(file, max = 1400) {
  return new Promise(res => {
    const img = new Image(); img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement("canvas");
      c.width = img.width * s; c.height = img.height * s; c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", .88)); URL.revokeObjectURL(img.src);
    }; img.src = URL.createObjectURL(file);
  });
}
function photoChoice(title, onPick) {
  sheet(`<h3>${esc(title)}</h3><p class="mute small">Snap it or pick from your photos. Vanity does the rest.</p>
    <div class="grid2" style="margin-top:14px"><button class="btn" id="pcCam">${AI("camera")} Camera</button><button class="btn ghost" id="pcLib">Photos</button></div>`);
  $("#pcCam").onclick = async () => { const d = await pickPhoto(true); if (d) onPick(d); };
  $("#pcLib").onclick = async () => { const d = await pickPhoto(false); if (d) onPick(d); };
}

// ---------- item card ----------
const FOIL = { Statement: 1, Couture: 1, Icon: 1 };
function card(it, extra = "") {
  return `<div class="card t-${it.rarity}" data-tier="${it.rarity}" data-id="${it.id}"><div class="flipper">
    <div class="face front"><span class="tier">${it.rarity}</span>${extra}<span class="flip-hint"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4"/></svg></span>
      <div class="art photo"><img src="${thumb(it.photo || it.img)}" alt="" loading="lazy"></div>
      <div class="nm">${esc(it.name || it.subtype || "Piece")}</div>
      <div class="meta"><span>${(it.colors || []).slice(0, 3).map(c => `<i class="swatch" style="background:${hex(c)}"></i>`).join("")}</span><span>${it.wears || 0} wear${it.wears == 1 ? "" : "s"}</span></div>
      ${FOIL[it.rarity] ? '<i class="foil"></i>' : ""}</div>
    <div class="face back"><div class="bt">${it.rarity}</div><div class="bn">${esc(it.name || "Piece")}</div>
      <dl><div><dt>${it.wears || 0}</dt><dd>Wears</dd></div><div><dt>${it.cpw == null ? "-" : money(it.cpw)}</dt><dd>Per wear</dd></div>
      <div><dt>${it.in_outfits == null ? "-" : Number(it.in_outfits).toLocaleString()}</dt><dd>Outfits</dd></div><div><dt>${money(it.price)}</dt><dd>Paid</dd></div></dl>
      <button class="btn" data-open>Open</button></div></div></div>`;
}
// cards tilt under the finger and the foil slides with it
function tilt(c) {
  const f = c.querySelector(".flipper"); if (!f) return;
  c.onpointermove = e => {
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    f.classList.add("tilting"); f.style.setProperty("--rx", (-y * 14).toFixed(1) + "deg"); f.style.setProperty("--ry", (x * 16).toFixed(1) + "deg");
    c.style.setProperty("--mx", (50 + x * 80).toFixed(0) + "%"); c.style.setProperty("--my", (50 + y * 80).toFixed(0) + "%");
  };
  c.onpointerleave = c.onpointercancel = c.onpointerup = () => { f.classList.remove("tilting"); f.style.setProperty("--rx", "0deg"); f.style.setProperty("--ry", "0deg"); };
}
// tap flips a card to its stats; "Open" on the back opens the full piece
function bindCards(root, open = itemSheet) {
  root.querySelectorAll(".card").forEach(tilt);
  root.querySelectorAll(".card[data-id]").forEach(c => c.onclick = e => {
    if (e.target.closest("[data-open]")) { open(+c.dataset.id); return; }
    c.classList.toggle("flipped"); SND.flip(); buzz(8);
  });
}

// ---------- router ----------
const VIEWS = {};
async function route() {
  const [name, arg] = (location.hash.slice(1) || "home").split("/");
  document.querySelectorAll("nav a").forEach(a => a.classList.toggle("on", a.dataset.tab === name));
  view.innerHTML = `<div class="loader"><div class="shimmer-orb"></div></div>`;
  window.scrollTo(0, 0);
  try { await (VIEWS[name] || VIEWS.home)(arg); view.animate && view.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 340, easing: "cubic-bezier(.2,.8,.2,1)" }); }
  catch (e) { view.innerHTML = `<div class="empty"><h3>Not quite</h3><p>${esc(e.message)}</p><button class="btn ghost" onclick="route()">Try again</button></div>`; }
}
addEventListener("hashchange", route);

// ---------- HOME ----------
// one hero (today's outfit), a quiet stats row, three actions, then short photo strips
VIEWS.home = async () => {
  const [s, od, items, ex] = await Promise.all([refreshState(), api("/api/outfits?n=7").catch(() => ({ best: [] })),
    api("/api/items").catch(() => ({ items: [] })), api("/api/exchange").catch(() => ({ listings: [] }))]);
  launch(s.profile.name);
  const looks = od.best || [], day = Math.floor(Date.now() / 864e5);
  const today = looks.length ? looks[day % looks.length] : null, more = looks.filter(o => o !== today).slice(0, 3);
  const pic = it => media(it.photo || it.img);
  const order = ["dresses", "tops", "outerwear", "bottoms", "shoes", "bags", "jewelry", "accessories", "makeup"];
  const sorted = o => [...o.items].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
  const mosaic = o => `<div class="h-mosaic">${sorted(o).slice(0, 4).map(it => `<img src="${pic(it)}" alt="" loading="lazy">`).join("")}</div>`;
  const vibe = o => { const v = o.items.map(i => i.vibe).find(Boolean) || "easy"; return v[0].toUpperCase() + v.slice(1); };
  let shot = null;
  if (today) { S.coverIds = today.items.map(i => i.id); try { const c = JSON.parse(s.profile.cover || "null"); if (c && c.key === S.coverIds.join(",")) shot = c.img; } catch { } }
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const recent = [...(items.items || [])].sort((a, b) => b.created - a.created).slice(0, 8);
  const picks = (ex.listings || []).filter(l => !l.mine && l.status === "open").slice(0, 8);
  const short = n => n >= 1e4 ? Math.round(n / 1e3) + "k" : Number(n).toLocaleString();
  view.innerHTML = `<div class="home">
  <div class="h-date">${esc(date)}</div>
  <h1 class="h-title">Today's outfit</h1>
  ${today ? `<a href="#looks" class="h-hero">${shot ? `<img class="h-shot" src="${media(shot)}" alt="">` : mosaic(today)}</a>
  <div class="h-under"><div><b>The ${esc(vibe(today))} look</b><span>${today.items.length} pieces from your closet</span></div>
    <button class="h-link" id="shootCover">${shot ? "Reshoot" : "See it on me"}</button></div>` : `<a href="#vault" class="h-hero h-empty">Add a few pieces to get today's outfit</a>`}
  <div class="h-stats"><a href="#vault"><b>${s.count}</b><span>Pieces</span></a><a href="#looks"><b>${short(s.outfits.total)}</b><span>Outfits</span></a><a href="#profile"><b>${money(s.money_saved)}</b><span>Saved</span></a></div>
  <div class="h-actions"><a href="#vault" data-add>Add piece</a><a href="#check">Do I own this?</a><a href="#bijou">Ask Bijou</a></div>
  ${more.length ? `<div class="h-sec"><h2>More for today</h2><a href="#looks">See all</a></div>
  <div class="h-row">${more.map(o => `<a href="#looks" class="h-look">${mosaic(o)}<b>The ${esc(vibe(o))} look</b><span>${o.items.length} pieces</span></a>`).join("")}</div>` : ""}
  ${recent.length ? `<div class="h-sec"><h2>Just added</h2><a href="#vault">Closet</a></div>
  <div class="h-row">${recent.map(it => `<button class="h-piece" data-id="${it.id}"><img src="${pic(it)}" alt="" loading="lazy"><span>${esc(it.name)}</span></button>`).join("")}</div>` : ""}
  ${picks.length ? `<div class="h-sec"><h2>From other women</h2><a href="#shop/buy">Shop</a></div>
  <div class="h-row">${picks.map(l => `<a href="#shop/buy" class="h-piece"><img src="${thumb(l.img)}" alt="" loading="lazy"><span>${esc(l.name)}</span><em>${l.credits} credits</em></a>`).join("")}</div>` : ""}
  <div class="h-sec"><h2>More</h2></div>
  <div class="h-list">${[["#tryon", "Try it on me"], ["#find", "Find it online"], ["#discover", "Discover"], ["#organizer", "Organizer"]].map(([h, t]) => `<a href="${h}">${t}<i>›</i></a>`).join("")}</div>
  </div>`;
  view.querySelectorAll(".h-piece[data-id]").forEach(b => b.onclick = () => itemSheet(+b.dataset.id));
  $("[data-add]").onclick = e => { e.preventDefault(); photoChoice("Add to the Closet", addFlow); };
  if ($("#shootCover")) $("#shootCover").onclick = shootHero;
};
// renders today's outfit on the fixed model; the photo replaces the mosaic when done
async function shootHero() {
  const btn = $("#shootCover"); btn.disabled = true; btn.textContent = "Starting...";
  let job; try { job = await api("/api/render", { body: { item_ids: S.coverIds, style: "model", cover: true } }); } catch (e) { toast(e.message); btn.disabled = false; btn.textContent = "See it on me"; return; }
  const poll = async () => {
    const j = await api("/api/jobs/" + job.id); const b = $("#shootCover"); if (!b) return;
    if (j.status === "done") { refreshState(); VIEWS.home(); return; }
    if (j.status === "error") { toast(j.error); b.disabled = false; b.textContent = "See it on me"; return; }
    b.textContent = j.status === "queued" ? "Waiting..." : `Shooting ${j.progress || 0}%`; setTimeout(poll, 1500);
  };
  poll();
}
const questLink = k => ({ wear_unworn: "vault", add_two: "vault", make_outfit: "looks", check_buy: "check", ask_bijou: "bijou" }[k] || "home");
const tile = (href, ic, t, sub) => `<a href="${href}" class="tile glass satin"><img class="art3d" src="static/icons/${href.slice(1)}.webp" alt=""><div><b>${t}</b><span>${sub}</span></div></a>`;
// slot-machine roll-up: every digit is a reel that spins and lands left to right
function slot(el, n) {
  const str = Number(n || 0).toLocaleString(), digits = [...str].filter(c => /\d/.test(c)).length;
  let di = 0;
  el.innerHTML = `<span class="slot">${[...str].map(c => {
    if (!/\d/.test(c)) return `<span class="sep">${c}</span>`;
    const spins = 2 + di, d = 1.1 + di * .28; di++;
    return `<span class="reel" style="--d:${d}s" data-to="${spins * 10 + +c}">${Array.from({ length: spins * 10 + 10 }, (_, k) => `<i>${k % 10}</i>`).join("")}</span>`;
  }).join("")}</span>`;
  const reels = [...el.querySelectorAll(".reel")];
  requestAnimationFrame(() => requestAnimationFrame(() => reels.forEach(r => r.style.transform = `translateY(${-r.dataset.to * 1.04}em)`)));
  reels.forEach((r, i) => setTimeout(() => { SND.tick(); buzz(6); }, (1.1 + i * .28) * 900));
  return new Promise(res => setTimeout(() => { el.classList.add("landed"); SND.land(); buzz([10, 30, 20]); res(); }, (1.1 + (digits - 1) * .28) * 1000 + 80));
}
function countUp(el, n) { const t0 = performance.now(), d = 1200; const step = t => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(n * e).toLocaleString(); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }

// ---------- VAULT ----------
VIEWS.vault = async () => {
  await loadItems();
  const counts = {}; S.items.forEach(i => counts[i.category] = (counts[i.category] || 0) + 1);
  const cats = ["all", ...Object.keys(CAT_LABEL).filter(c => counts[c])];
  if (!cats.includes(S.filter)) S.filter = "all";
  const list = S.items.filter(i => S.filter === "all" || i.category === S.filter);
  view.innerHTML = `<div class="row between" style="margin:10px 0 6px"><div><div class="eyebrow">The Closet</div><h1>${S.items.length} pieces</h1></div>
    <button class="btn" id="addBtn">${AI("camera")} Add</button></div>
    <div class="chips">${cats.map(c => `<button class="chip ${c === S.filter ? "on" : ""}" data-c="${c}">${c === "all" ? "All" : CAT_LABEL[c]}<span class="n">${c === "all" ? S.items.length : counts[c]}</span></button>`).join("")}</div>
    <div class="cards">
      <button class="addcard" id="addCard"><div>${AI("camera", "")}<div style="margin-top:6px;font-family:var(--serif);font-size:18px">Add a piece</div><div class="small mute">snap, we tag it</div></div></button>
      ${list.map(i => card(i)).join("")}
    </div>`;
  view.querySelectorAll(".chip").forEach(b => b.onclick = () => { S.filter = b.dataset.c; VIEWS.vault(); });
  $("#addBtn").onclick = $("#addCard").onclick = () => photoChoice("Add to the Closet", addFlow);
  bindCards(view);
};

async function addFlow(dataUrl) {
  sheet(`<div class="loader"><div class="shimmer-orb"></div><h3>Cataloguing your piece</h3><div class="mute small">Reading the colours</div></div>`);
  let d;
  try { d = await api("/api/items/analyze", { body: { image: dataUrl } }); }
  catch (e) { sheet(`<div class="empty"><h3>Hmm</h3><p>${esc(e.message)}</p></div>`); return; }
  confirmSheet(d);
}
function chipRow(name, options, val) {
  return `<div class="chips" data-f="${name}">${options.map(o => `<button class="chip ${String(o).toLowerCase() === String(val || "").toLowerCase() ? "on" : ""}" data-v="${esc(o)}">${esc(CAT_LABEL[o] || o)}</button>`).join("")}</div>`;
}
function confirmSheet(d) {
  const t = d.tags || {};
  const f = { name: t.name || "", category: t.category, subtype: t.subtype || "", colors: t.colors || [], pattern: t.pattern || "solid", season: t.season || "all", vibe: t.vibe || "casual", brand: t.brand_guess || "", price: t.price_guess || "" };
  const el = sheet(`<div class="preview flip"><img src="${media(d.img)}"></div>
    ${t._error ? `<p class="mute small" style="text-align:center">${esc(t._error)}</p>` : `<p class="mute small" style="text-align:center;margin:8px 0 0">Tap anything that is off. Everything else is done.</p>`}
    <div class="field"><label>Name</label><input class="txt" id="fName" value="${esc(f.name)}" placeholder="e.g. Black Silk Slip Dress"></div>
    <div class="field"><label>Category</label>${chipRow("category", d.options.categories, f.category)}</div>
    <div class="field"><label>Colours</label><div class="chips">${f.colors.map(c => `<span class="chip"><i class="swatch" style="background:${hex(c)}"></i>${esc(c)}</span>`).join("") || '<span class="mute small">none detected</span>'}</div></div>
    <div class="field"><label>Vibe</label>${chipRow("vibe", d.options.vibes, f.vibe)}</div>
    <div class="field"><label>Season</label>${chipRow("season", d.options.seasons, f.season)}</div>
    <div class="grid2"><div class="field"><label>Price paid</label><input class="txt" id="fPrice" inputmode="decimal" value="${esc(f.price)}"></div>
    <div class="field"><label>Brand</label><input class="txt" id="fBrand" value="${esc(f.brand)}" placeholder="optional"></div></div>
    <button class="btn wide" id="fSave" style="margin-top:18px">Add to the Closet</button>`);
  el.querySelectorAll(".chips[data-f] .chip.on").forEach(c => c.parentNode.scrollLeft = c.offsetLeft - 20);
  el.querySelectorAll(".chips[data-f]").forEach(row => row.querySelectorAll(".chip").forEach(b => b.onclick = () => {
    row.querySelectorAll(".chip").forEach(x => x.classList.remove("on")); b.classList.add("on"); f[row.dataset.f] = b.dataset.v;
  }));
  $("#fSave").onclick = async ev => {
    ev.target.disabled = true;
    try {
      const r = await api("/api/items", { body: { ...f, draft: d.draft, name: $("#fName").value || f.subtype || "New piece", price: $("#fPrice").value, brand: $("#fBrand").value } });
      reveal(r.item, ev); reward(r.reward, ev); questDone(r.quest);
      if (location.hash === "#vault" || !location.hash || location.hash === "#home") route();
    } catch (e) { toast(e.message); ev.target.disabled = false; }
  };
}
function reveal(it) {
  sheet(`<div style="text-align:center"><div class="eyebrow">New ${esc(it.rarity)} piece</div>
    <div style="max-width:220px;margin:14px auto" class="loot" id="newCard">${card(it)}</div>
    <button class="btn wide" onclick="closeSheet()">Into the Closet</button></div>`);
  spk(innerWidth / 2, innerHeight * .45, 40); SND.land(); buzz([10, 40, 10]);
  bindCards($("#newCard"), () => closeSheet());
}
function itemSheet(id) {
  const it = S.items.find(i => i.id === id); if (!it) return;
  const el = sheet(`<div class="detail"><div class="row between"><span class="tier" style="position:static;--tier:var(--t-${it.rarity.toLowerCase()})">${it.rarity}</span><span class="mute small">${esc(CAT_LABEL[it.category] || it.category)} - ${esc(it.subtype || "")}</span></div>
    <div class="preview photo"><img src="${media(it.photo || it.img)}"></div><h2 style="margin:6px 0 2px;text-align:center">${esc(it.name)}</h2>
    <div class="mute small" style="text-align:center">${esc([it.brand, it.vibe, it.season, it.pattern].filter(Boolean).join("  -  "))}</div>
    <div class="kv"><div><b id="dW">${it.wears || 0}</b><span>Wears</span></div><div><b>${money(it.price)}</b><span>Paid</span></div><div><b id="dC">${it.cpw == null ? "-" : money(it.cpw)}</b><span>Per wear</span></div></div>
    <button class="btn wide" id="dWear" style="margin-top:16px">Wore it today</button>
    <button class="btn ghost" style="width:100%;margin-top:10px" onclick="listSheet(${it.id})">Sell or trade it</button><div class="grid2" style="margin-top:10px"><a class="btn ghost" href="#looks/${it.id}" onclick="closeSheet()">Style it</a><button class="btn ghost" id="dDel">Remove</button></div></div>`);
  $("#dWear").onclick = async ev => {
    const r = await api(`/api/items/${id}/wear`, { method: "POST" });
    Object.assign(it, r.item); $("#dW").textContent = r.item.wears; $("#dC").textContent = money(r.item.cpw);
    reward(r.reward, ev); questDone(r.quest); if (r.tier_up) toast(`Tier up: ${r.item.rarity}`);
  };
  $("#dDel").onclick = async () => { if (!el.dataset.sure) { el.dataset.sure = 1; $("#dDel").textContent = "Tap again to remove"; return; } await api(`/api/items/${id}`, { method: "DELETE" }); closeSheet(); route(); };
}

// ---------- DO I OWN THIS ----------
VIEWS.check = async () => {
  const hist = (await api("/api/checks")).checks;
  view.innerHTML = `<div style="margin:10px 0"><div class="eyebrow">In the store</div><h1>Do I already own this?</h1>
    <p class="mute">Snap the piece you are about to buy. Vanity checks your closet for lookalikes and counts how many new outfits it would really unlock.</p></div>
    <button class="btn wide" id="ck">${AI("n_check")} Snap the piece</button>
    <div class="field"><label>Price tag (optional)</label><input class="txt" id="ckPrice" inputmode="decimal" placeholder="e.g. 89"></div>
    ${hist.length ? `<h2>Recent checks</h2><div class="cards">${hist.slice(0, 9).map(c => `<div class="card" style="--tier:${c.verdict === "buy" ? "#a7e3c5" : c.verdict === "pending" ? "#777" : "var(--blush)"}"><div class="flipper"><div class="face front"><span class="tier">${c.verdict === "pending" ? "undecided" : c.verdict}</span><div class="art"><img src="${thumb(c.photo)}" style="border-radius:10px"></div><div class="nm">${esc(c.data.item?.name || "Piece")}</div><div class="meta"><span>${c.data.similar_count} similar</span><span>+${c.data.unlocks} looks</span></div></div></div></div>`).join("")}</div>` : ""}`;
  $("#ck").onclick = () => photoChoice("What are you eyeing?", runCheck);
};
async function runCheck(dataUrl) {
  const price = $("#ckPrice")?.value;
  sheet(`<div class="loader"><div class="shimmer-orb"></div><h3>Searching your closet</h3><div class="mute small">Comparing colour, shape and style</div></div>`);
  let r;
  try { r = await api("/api/check", { body: { image: dataUrl, price } }); } catch (e) { sheet(`<div class="empty"><h3>Hmm</h3><p>${esc(e.message)}</p></div>`); return; }
  const word = { buy: "BUY", skip: "SKIP", own: "ALREADY OWN" }[r.verdict];
  const el = sheet(`<div class="verdict ${r.verdict}"><div class="eyebrow">The verdict</div><div class="stamp ${word.length > 4 ? "long" : ""}">${word}</div>
    <div class="after"><h3 style="margin-top:8px">${esc(r.headline)}</h3><p class="mute" style="margin:6px 0 0">${esc(r.reason)}</p></div></div>
    <div class="grid2"><div class="glass stat"><b>${r.similar_count}</b><span>You own like this</span></div><div class="glass stat"><b>+${r.unlocks}</b><span>New outfits</span></div></div>
    <div class="vs"><div class="card" style="--tier:var(--blush)"><div class="flipper"><div class="face front"><span class="tier">In store</span><div class="art"><img src="${media(r.photo)}" style="border-radius:12px"></div><div class="nm">${esc(r.item.name || "This piece")}</div><div class="meta"><span>${money(r.price)}</span></div></div></div></div>
    ${r.matches.map(m => card(m.item, `<span class="sim">${m.similarity}%</span>`)).join("") || `<div class="addcard"><div class="small">Nothing like it in your closet</div></div>`}</div>
    ${r.matches.length ? `<div class="small mute" style="margin-top:8px">${r.matches.map(m => `<div>${esc(m.item.name)}: ${esc(m.why)}</div>`).join("")}</div>` : ""}
    <div class="grid3" style="margin-top:16px"><button class="btn ghost" data-v="buy">Buy</button><button class="btn blush" data-v="skip">Skip</button><button class="btn" data-v="own">Own it</button></div>`);
  setTimeout(() => { SND.thud(); buzz([30, 20, 50]); }, 700);
  setTimeout(() => { reward(r.reward); questDone(r.quest); }, 1300);
  bindCards(el, () => { });
  el.querySelectorAll("[data-v]").forEach(b => b.onclick = async ev => {
    const d = await api(`/api/check/${r.id}/decide`, { body: { verdict: b.dataset.v } });
    if (d.reward) { reward(d.reward, ev); await coinsToWallet(ev, d.money_saved); toast(`Money saved: ${money(d.money_saved)}`); }
    closeSheet(); route();
  });
}

// coins fly from the tap into the wallet, then the wallet counts up
function coinsToWallet(ev, total) {
  const w = $("#wallet").getBoundingClientRect(), tx = w.left + 18, ty = w.top + 6;
  const sx = ev && ev.clientX ? ev.clientX : innerWidth / 2, sy = ev && ev.clientY ? ev.clientY : innerHeight / 2;
  S.coinFlying = true;
  for (let i = 0; i < 7; i++) {
    const c = document.createElement("div"); c.className = "coinfly"; document.body.append(c);
    const dx = (Math.random() - .5) * 120, dur = 750 + i * 70;
    c.animate([{ transform: `translate(${sx - 23}px,${sy - 23}px) scale(.6)`, opacity: 0 },
      { transform: `translate(${sx - 23 + dx}px,${sy - 140 - Math.random() * 60}px) scale(1.1) rotate(180deg)`, opacity: 1, offset: .35 },
      { transform: `translate(${tx - 23}px,${ty - 23}px) scale(.45) rotate(400deg)`, opacity: .9 }],
      { duration: dur, delay: i * 70, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" }).onfinish = () => { c.remove(); SND.coin(); buzz(8); $("#wallet").classList.remove("bump"); void $("#wallet").offsetWidth; $("#wallet").classList.add("bump"); };
  }
  return new Promise(res => setTimeout(() => {
    const el = $("#walletN"), from = parseFloat(el.textContent.replace(/[^\d.]/g, "")) || 0, t0 = performance.now();
    const step = t => { const k = Math.min(1, (t - t0) / 700); el.textContent = money(Math.round(from + (total - from) * k)); if (k < 1) requestAnimationFrame(step); else { S.coinFlying = false; res(); } };
    requestAnimationFrame(step);
  }, 1300));
}

// ---------- OUTFIT ENGINE ----------
VIEWS.looks = async (must) => {
  const d = await api("/api/outfits?n=12" + (must ? "&must=" + must : ""));
  const c = d.count;
  view.innerHTML = `<section class="bigcount glass satin"><div class="eyebrow">The Outfit Engine</div><div class="n" id="bigN">0</div>
    <div class="mute">outfits in your closet</div><div class="small mute" style="margin-top:6px">${c.bases} core looks  -  ${Object.entries(c.by_cat).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(", ")}</div>
    ${c.needs_shoes ? `<div class="small" style="color:var(--blush);margin-top:8px">Add shoes to complete every look</div>` : ""}</section>
    ${must ? `<p class="mute small" style="margin-top:12px">Looks built around one piece. <a href="#looks" style="color:var(--gold)">Show all</a></p>` : ""}
    <h2>The best of your closet</h2>
    <div id="looksList" class="hidden">${d.best.map((o, i) => lookCard(o, i)).join("") || `<div class="empty"><h3>Your runway is empty</h3><p>Add a top, a bottom (or a dress) and shoes.</p><a class="btn" href="#vault">Open my closet</a></div>`}</div>
    ${d.saved.length ? `<h2>Saved looks</h2>${d.saved.map(o => savedCard(o)).join("")}` : ""}`;
  S.looks = d.best;
  bindLooks();
  await slot($("#bigN"), c.total);
  $("#bigN").nextElementSibling.insertAdjacentHTML("afterend", `<div class="unlock">${d.best.length} looks unlocked</div>`);
  $("#looksList").classList.remove("hidden");
  view.querySelectorAll("#looksList .look").forEach((l, i) => setTimeout(() => { if (i < 3) { const b = l.getBoundingClientRect(); spk(b.left + b.width / 2, b.top + 40, 14); SND.tick(); } }, i * 140));
};
const lookCard = (o, i) => `<div class="look glass loot" style="animation-delay:${i * 140}ms" data-i="${i}">
  <div class="row between"><h3>${esc(lookName(o))} <span class="mute small" style="font-family:var(--sans)">No. ${i + 1}</span></h3><span class="score">Harmony ${Math.round(o.score * 100)}</span></div>
  <div class="pieces">${o.items.map(it => `<div title="${esc(it.name)}"><img src="${thumb(it.photo || it.img)}"></div>`).join("")}</div>
  <div class="small mute">${o.items.map(it => esc(it.name)).join("  +  ")}</div>
  <div class="rimg"></div>
  <div class="grid3" style="margin-top:12px"><button class="btn ghost" data-a="save">Save</button><button class="btn ghost" data-a="render">Flat-lay</button><button class="btn" data-a="tryon">On me</button></div></div>`;
const savedCard = o => `<div class="look glass"><div class="row between"><h3>${esc(o.title)}</h3><span class="score">${Math.round(o.score * 100)}</span></div>
  ${o.img ? `<img class="render" src="${media(o.img)}">` : `<div class="pieces">${o.items.map(it => `<div><img src="${thumb(it.photo || it.img)}"></div>`).join("")}</div>`}
  ${o.reason ? `<div class="small mute">${esc(o.reason)}</div>` : ""}</div>`;
function bindLooks() {
  view.querySelectorAll("#looksList .look").forEach(el => {
    const o = S.looks[+el.dataset.i], ids = o.items.map(i => i.id);
    el.querySelectorAll("[data-a]").forEach(b => b.onclick = async ev => {
      const a = b.dataset.a;
      if (a === "save") { const r = await api("/api/outfits", { body: { item_ids: ids, title: lookName(o) } }); b.textContent = "Saved"; b.disabled = true; reward(r.reward, ev); questDone(r.quest); }
      if (a === "render") renderJob(api("/api/render", { body: { item_ids: ids, style: "flatlay" } }), $(".rimg", el));
      if (a === "tryon") { location.hash = "tryon"; S.tryIds = ids; }
    });
  });
}
function lookName(o) { const v = o.items.map(i => i.vibe).filter(Boolean)[0] || "signature"; return v[0].toUpperCase() + v.slice(1) + " Edit"; }

// ---------- GPU jobs ----------
async function renderJob(promise, target, done) {
  let job;
  try { job = await promise; } catch (e) { toast(e.message); return; }
  if (target) target.innerHTML = `<div class="glass" style="padding:14px;margin-top:10px"><div class="row between small"><span>${esc(job.title)}</span><span class="pc">queued</span></div><div class="bar" style="margin-top:8px"><i style="width:2%"></i></div></div>`;
  const poll = async () => {
    const j = await api("/api/jobs/" + job.id);
    if (target) { $(".pc", target) && ($(".pc", target).textContent = j.status === "queued" ? `${j.ahead} ahead` : j.progress + "%"); const b = $(".bar i", target); if (b) b.style.width = Math.max(2, j.progress) + "%"; }
    if (j.status === "done") {
      if (target) target.innerHTML = `<img class="render runway" src="${media(j.result)}">${j.match ? `<div class="small mute" style="text-align:center;margin-top:6px">${esc(j.match)}</div>` : ""}`;
      spk(innerWidth / 2, innerHeight / 2, 30); refreshState(); done && done(j); return;
    }
    if (j.status === "error") { if (target) target.innerHTML = `<div class="small" style="color:var(--blush)">${esc(j.error)}</div>`; return; }
    setTimeout(poll, 1200);
  };
  poll();
}
function renderQueue(q) {
  const el = $("#queue");
  document.body.classList.toggle("hasq", !!(q && q.length));
  if (!q || !q.length) { el.classList.add("hidden"); return; }
  el.classList.remove("hidden");
  el.innerHTML = `<div class="row between"><span>${esc(q[0].title)}${q.length > 1 ? ` · ${q.length - 1} more in line` : ""}</span><span class="mute">${q[0].status === "running" ? q[0].progress + "%" : "queued"}</span></div>`;
  clearTimeout(renderQueue._t); renderQueue._t = setTimeout(async () => { try { renderQueue((await api("/api/state")).queue); } catch { } }, 2500);
}

// ---------- TRY IT ON ME ----------
VIEWS.tryon = async () => {
  const M = await api("/api/me"), me = M.model;
  const acc = (await api("/api/items")).items.filter(i => ["shoes", "jewelry"].includes(i.category));
  S.accIds = S.accIds || [];
  const looks = (await api("/api/outfits?n=6")).best;
  const ids = S.tryIds || (looks[0] ? looks[0].items.map(i => i.id) : []);
  view.innerHTML = `<div style="margin:10px 0"><div class="eyebrow">Private and local</div><h1>Try it on me</h1>
    <p class="mute">${M.own ? "Every look is shown on your photo, the same way every time." : "Every look is shown on this model, the same way every time. Add your own full-body photo to use you instead."}</p></div>
    ${me ? `<img class="me-photo" src="${media(me)}">` : `<div class="addcard" id="meAdd" style="min-height:240px"><div>${IC.camera}<div style="font-family:var(--serif);font-size:20px;margin-top:8px">Add a full-body photo</div><div class="small mute">once, stays on this PC</div></div></div>`}
    <button class="btn ghost wide" id="meAdd" style="margin-top:10px">${M.own ? "Change my photo" : "Use my own photo"}</button>
    <h2>Shoes and jewelry</h2><div class="small mute">Tap pieces, then Add accessories</div>
    <div class="grid3" id="accPick" style="margin-top:8px">${acc.map(i => `<button class="glass" data-acc="${i.id}" style="padding:4px;border-radius:14px;${S.accIds.includes(i.id) ? "border-color:var(--gold);box-shadow:0 0 0 2px var(--gold)" : ""}"><img src="${media(i.photo || i.img)}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px" alt=""><div class="small">${esc(i.name).slice(0, 20)}</div></button>`).join("")}</div>
    <button class="btn ghost wide" id="goAcc" style="margin-top:10px" ${me ? "" : "disabled"}>Add accessories</button>
    <h2>Pick a look</h2>
    <div id="tryLooks">${looks.map((o, i) => `<div class="look glass ${sameIds(o.items.map(x => x.id), ids) ? "satin" : ""}" data-i="${i}" style="${sameIds(o.items.map(x => x.id), ids) ? "border-color:var(--gold)" : ""}"><div class="pieces">${o.items.map(it => `<div><img src="${media(it.photo || it.img)}"></div>`).join("")}</div></div>`).join("")}</div>
    <div class="grid2 trybar"><button class="btn" id="goTry" ${me ? "" : "disabled"}>${AI("wand")} Dress me</button><button class="btn blush" id="goMakeup" ${me ? "" : "disabled"}>Makeup look</button></div>
    <div id="tryOut"></div>`;
  $("#meAdd") && ($("#meAdd").onclick = () => photoChoice("Your photo", async d => { closeSheet(); await api("/api/me", { body: { image: d } }); toast("Photo saved privately"); route(); }));
  view.querySelectorAll("#tryLooks .look").forEach(el => el.onclick = () => { S.tryIds = looks[+el.dataset.i].items.map(i => i.id); VIEWS.tryon(); });
  view.querySelectorAll("[data-acc]").forEach(b => b.onclick = () => { const id = +b.dataset.acc; S.accIds = S.accIds.includes(id) ? S.accIds.filter(x => x !== id) : [...S.accIds, id]; VIEWS.tryon(); });
  const go = body => { renderJob(api("/api/tryon", { body }), $("#tryOut")); setTimeout(() => $("#tryOut").scrollIntoView({ behavior: "smooth", block: "center" }), 300); };
  $("#goTry").onclick = () => go({ item_ids: S.tryIds || ids, mode: "outfit" });
  $("#goAcc").onclick = () => S.accIds.length ? go({ item_ids: S.accIds, mode: "accessory" }) : toast("Pick shoes or jewelry first");
  $("#goMakeup").onclick = () => go({ mode: "makeup" });
};
const sameIds = (a, b) => a.length === b.length && a.every(x => b.includes(x));

// ---------- BIJOU ----------
VIEWS.bijou = async () => {
  const msgs = (await api("/api/bijou")).messages;
  view.innerHTML = `<div class="bjhead"><div class="bjav" id="bjAv"><img src="${ART("bijou_face")}" alt="Bijou"></div>
    <div style="flex:1"><div class="eyebrow">Your stylist</div><h1>Bijou</h1></div>
    <div style="display:flex;flex-direction:column;gap:6px"><button class="chip ${S.voice ? "on" : ""}" id="bjVoice">Voice ${S.voice ? "on" : "off"}</button><button class="chip" id="bjNew">New chat</button></div></div>
    <div class="chat" id="chat"></div>
    <div class="composer"><div class="chips" id="bjChips"></div><div class="row"><input class="txt" id="bjIn" placeholder="What do I wear to..."><button class="mic" id="bjMic">${IC.mic}</button></div></div>`;
  const chat = $("#chat");
  if (!msgs.length) {
    addBj({ say: "Where are you going? I will pick outfits from your closet.", chips: ["Rooftop party tonight", "Date night", "Big work meeting", "Brunch with the girls", "Wedding guest"] });
  } else msgs.forEach(m => m.role === "user" ? addMe(m.content.text) : addBj(m.content, true));
  const lastBj = [...msgs].reverse().find(m => m.role !== "user");
  if (lastBj) setChips(lastBj.content.chips);
  $("#bjVoice").onclick = () => { S.voice = !S.voice; try { localStorage.setItem("vanity_voice", S.voice ? "1" : ""); } catch { } if (!S.voice) speechSynthesis?.cancel(); VIEWS.bijou(); };
  $("#bjNew").onclick = async () => { await api("/api/bijou", { body: { reset: true } }); VIEWS.bijou(); };
  const send = async text => {
    if (!text.trim()) return; addMe(text); $("#bjIn").value = ""; $("#bjChips").innerHTML = "";
    const typing = document.createElement("div"); typing.className = "msg bj"; typing.innerHTML = `<img class="mini" src="${ART("bijou_face")}" alt=""><div class="bjname">Bijou</div><span class="dots"><i></i><i></i><i></i></span>`; $("#bjAv").classList.add("talk"); chat.append(typing); typing.scrollIntoView({ behavior: "smooth" });
    try { const r = await api("/api/bijou", { body: { text } }); typing.remove(); addBj(r.reply); speak(r.reply.say); questDone(r.quest); }
    catch (e) { typing.remove(); addBj({ say: e.message, chips: [text] }); }
    $("#bjAv").classList.remove("talk");
  };
  S.bjSend = send;
  $("#bjIn").onkeydown = e => { if (e.key === "Enter") send(e.target.value); };
  setupMic($("#bjMic"), t => send(t));
  function setChips(list) { $("#bjChips").innerHTML = (list || []).map(x => `<button class="chip">${esc(x)}</button>`).join(""); $("#bjChips").querySelectorAll(".chip").forEach(b => b.onclick = () => send(b.textContent)); }
  function addMe(t) { const d = document.createElement("div"); d.className = "msg me"; d.textContent = t; chat.append(d); d.scrollIntoView({ behavior: "smooth" }); }
  function addBj(c, old) {
    const d = document.createElement("div"); d.className = "msg bj" + (old ? "" : " runway");
    d.innerHTML = `<img class="mini" src="${ART("bijou_face")}" alt=""><div class="bjname">Bijou</div>${esc(c.say)}
      ${(c.outfits || []).map(o => `<div class="look glass" style="margin:10px 0 0;padding:10px"><b style="font-family:var(--serif);font-size:17px">${esc(o.title)}</b>
        <div class="pieces">${(o.items || []).map(it => `<div><img src="${thumb(it.photo || it.img)}"></div>`).join("")}</div><div class="small mute">${esc(o.why)}</div>
        <div class="grid2" style="margin-top:8px"><button class="btn ghost" data-try="${(o.item_ids || []).join(",")}">Try on</button><button class="btn ghost" data-wear="${(o.item_ids || []).join(",")}">Wear it</button></div></div>`).join("")}
      ${c.makeup ? `<div class="small" style="margin-top:8px"><span class="eyebrow">Makeup</span><br>${esc(c.makeup)}</div>` : ""}
      ${c.jewelry ? `<div class="small" style="margin-top:6px"><span class="eyebrow">Jewelry</span><br>${esc(c.jewelry)}</div>` : ""}`;
    chat.append(d);
    d.querySelectorAll("[data-try]").forEach(b => b.onclick = () => { S.tryIds = b.dataset.try.split(",").map(Number); location.hash = "tryon"; });
    d.querySelectorAll("[data-wear]").forEach(b => b.onclick = async ev => { const r = await api("/api/outfits/wear", { body: { item_ids: b.dataset.wear.split(",").map(Number) } }); reward(r.reward, ev); b.textContent = "Logged"; });
    if (!old) { setChips(c.chips); d.scrollIntoView({ behavior: "smooth" }); }
  }
};
// Bijou's voice (opt-in): a warm system voice reads her reply
function speak(text) {
  if (!S.voice || !text || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text), vs = speechSynthesis.getVoices();
  u.voice = vs.find(v => /Samantha|Ava|Allison|Serena|Karen|Moira|Google UK English Female|Zira/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang)) || null;
  u.rate = 1.02; u.pitch = 1.08;
  const av = $("#bjAv"); if (av) { av.classList.add("talk"); u.onend = () => av.classList.remove("talk"); }
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}
function setupMic(btn, onText) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { btn.onclick = () => toast("Voice needs Chrome or Safari over https; type instead"); return; }
  let rec = null;
  btn.onclick = () => {
    if (rec) { rec.stop(); return; }
    rec = new SR(); rec.lang = "en-US"; rec.interimResults = true; rec.continuous = false;
    let final = ""; btn.classList.add("rec");
    rec.onresult = e => { final = [...e.results].map(r => r[0].transcript).join(""); $("#bjIn").value = final; };
    rec.onend = () => { btn.classList.remove("rec"); rec = null; if (final.trim()) onText(final); };
    rec.onerror = () => { btn.classList.remove("rec"); rec = null; };
    rec.start();
  };
}

// ---------- DISCOVER ----------
VIEWS.discover = async () => {
  view.innerHTML = `<div style="margin:10px 0"><div class="eyebrow">Beyond your closet</div><h1>Discover</h1><p class="mute">The editors are reading your closet...</p></div><div class="loader"><div class="shimmer-orb"></div></div>`;
  const d = await api("/api/discover");
  view.innerHTML = `<div style="margin:10px 0"><div class="eyebrow">Beyond your closet</div><h1>Discover</h1><p class="mute">Pieces that would unlock the most new looks, ranked by real outfit math. Links are store searches, never fake products.</p></div>
    <h2>Complete the look</h2>
    ${(d.complete || []).map(c => `<div class="look glass"><div class="unlockbig">${AI("coin", "")}<div><b>+${Number(c.unlocks).toLocaleString()}</b><span>new outfits</span></div></div><h3>${esc(c.name)}</h3>
      <div class="small mute" style="margin-top:4px">${(c.colors || []).map(x => `<i class="swatch" style="background:${hex(x)}"></i>`).join("")}${esc(c.why)}</div>
      <div class="linkrow">${c.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</div></div>`).join("")}
    <h2>Trend looks from your closet</h2>
    ${(d.trends || []).map((t, i) => `<div class="look glass" data-i="${i}"><h3>${esc(t.title)}</h3><div class="small mute">${esc(t.desc)}</div>
      ${t.items.length ? `<div class="pieces">${t.items.map(it => `<div><img src="${thumb(it.photo || it.img)}"></div>`).join("")}</div>` : ""}
      ${t.add ? `<div class="small" style="margin-top:6px"><span class="eyebrow">Add</span> ${esc(t.add)}</div>` : ""}
      <div class="rimg"></div>
      <div class="linkrow"><button class="chip" data-art="${i}">${"Visualize it"}</button>${t.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</div></div>`).join("")}`;
  view.querySelectorAll("[data-art]").forEach(b => b.onclick = () => { const t = d.trends[+b.dataset.art]; b.remove(); renderJob(api("/api/discover/art", { body: { prompt: t.art_prompt || t.desc } }), $(`.look[data-i="${b.dataset.art}"] .rimg`)); });
};

// ---------- SHOP: For you / Buy from women / Sell or trade (the Exchange lives here now) ----------
const SHOP_TABS = [["foryou", "For you"], ["buy", "Buy from women"], ["sell", "Sell or trade"]];
const crd = n => `${Number(n).toLocaleString()} credits`;
VIEWS.shop = async (arg) => {
  const tab = SHOP_TABS.some(t => t[0] === arg) ? arg : (S.shopTab || "foryou"); S.shopTab = tab;
  const x = await api("/api/exchange");
  view.innerHTML = `<div class="shop"><div class="sh-top"><h1>Shop</h1><span class="sh-wallet">${crd(x.credits)}</span></div>
    <div class="sh-tabs">${SHOP_TABS.map(([k, t]) => `<a href="#shop/${k}" class="${k === tab ? "on" : ""}">${t}${k === "sell" && x.incoming.length ? `<i>${x.incoming.length}</i>` : ""}</a>`).join("")}</div>
    <div id="shBody"></div></div>`;
  await ({ foryou: shopForYou, buy: shopBuy, sell: shopSell }[tab])(x);
};
VIEWS.exchange = () => { location.replace("#shop/buy"); };

async function shopForYou(x) {
  const d = await api("/api/foryou"), el = $("#shBody"); if (!el) return;
  const st = d.style, words = [...st.colors.slice(0, 3), ...st.vibes.slice(0, 1)];
  const card = p => `<div class="fy" data-k="${p.key}">
    <div class="fy-ph"><img src="${media(p.img)}" alt="" loading="lazy"></div>
    <div class="fy-txt"><b>${esc(p.name)}</b><span>${esc(p.store || "")}${p.price ? " · " + esc(p.price) : ""}</span>
      <p class="fy-why">${p.joins ? `Goes with ${p.joins.toLocaleString()} of your outfits` : "Fills a gap in your closet"}</p>
      ${p.with_names.length ? `<p class="fy-with">Shown with your ${esc(p.with_names.slice(0, 2).join(" and ").toLowerCase())}</p>` : ""}
      </div>
    <div class="fy-out"></div>
    <div class="fy-btns"><button class="sh-btn" data-on="${p.key}">See it on me</button><a class="sh-btn ghost" href="${esc(p.url)}" target="_blank" rel="noopener">View on ${esc(p.store || "store")}</a></div></div>`;
  el.innerHTML = `<p class="sh-line">Picked from what you wear most: ${esc(words.join(", "))}.</p>
    ${d.picks.length ? d.picks.map(card).join("") : `<div class="sh-wait"><div class="shimmer-orb"></div><p>Finding real pieces for you in real stores. This takes a few minutes the first time.</p></div>`}
    ${d.listings.length ? `<h2 class="sh-h">From women with your style</h2><div class="h-row">${d.listings.map(l => `<button class="h-piece" data-l="${l.id}"><img src="${thumb(l.img)}" alt="" loading="lazy"><span>${esc(l.name)}</span><em>${l.credits ? crd(l.credits) : "Trade"}</em></button>`).join("")}</div>` : ""}`;
  el.querySelectorAll("[data-l]").forEach(b => b.onclick = () => buySheet(d.listings.find(l => l.id == b.dataset.l), x.credits));
  el.querySelectorAll("[data-on]").forEach(b => b.onclick = () => {
    const p = d.picks.find(q => q.key === b.dataset.on), c = b.closest(".fy"), img = $(".fy-ph img", c);
    if (p.onme) {
      const on = img.src.includes(p.onme); img.src = media(on ? p.img : p.onme); b.textContent = on ? "See it on me" : "Show the product";
      $(".fy-tag", c)?.remove(); $(".fy-out", c).innerHTML = on ? "" : (p.match ? `<p class="fy-with">${esc(p.match)}</p>` : "");
      if (!on) $(".fy-ph", c).insertAdjacentHTML("beforeend", `<span class="fy-tag">On you</span>`); return;
    }
    b.disabled = true; b.textContent = "Dressing you...";
    renderJob(api(`/api/foryou/${p.key}/onme`, { method: "POST", body: {} }), $(".fy-out", c), j => {
      p.onme = j.result; p.match = j.match; $(".fy-out", c).innerHTML = j.match ? `<p class="fy-with">${esc(j.match)}</p>` : ""; img.src = media(j.result);
      b.disabled = false; b.textContent = "Show the product"; $(".fy-ph", c).insertAdjacentHTML("beforeend", `<span class="fy-tag">On you</span>`);
    });
  });
  if (!d.picks.length) setTimeout(() => S.shopTab === "foryou" && location.hash.startsWith("#shop") && $("#shBody") && shopForYou(x), 15000);
}

const XCATS = [["", "All"], ["top", "Tops"], ["bottom", "Bottoms"], ["dress", "Dresses"], ["outerwear", "Coats"], ["shoes", "Shoes"], ["bag", "Bags"], ["jewelry", "Jewelry"]];
async function shopBuy(x) {
  const el = $("#shBody"), ls = x.listings.filter(l => !S.xcat || l.category === S.xcat);
  el.innerHTML = `<p class="sh-line">Sell or trade clothes with other women. Credits, not cash.</p>
    <div class="chips">${XCATS.map(([c, t]) => `<button class="chip ${(S.xcat || "") === c ? "on" : ""}" data-c="${c}">${t}</button>`).join("")}</div>
    <div class="grid2 xs">${ls.map(l => `<div class="xc"><button class="xc-ph" data-v="${l.id}"><img src="${thumb(l.img)}" alt="" loading="lazy"></button>
      <b>${esc(l.name)}</b><span>Size ${esc(l.size)} · ${esc(l.seller)}</span><em>${l.credits ? crd(l.credits) : "Trade only"}</em>
      <div class="xc-btns">${l.credits ? `<button class="sh-btn sm" data-buy="${l.id}">Buy</button>` : ""}${l.trade ? `<button class="sh-btn sm ghost" data-tr="${l.id}">Trade</button>` : ""}</div></div>`).join("")}</div>
    <p class="sh-foot">The sellers here are demo profiles for now. Credits are pretend.</p>`;
  el.querySelectorAll(".chip").forEach(b => b.onclick = () => { S.xcat = b.dataset.c; shopBuy(x); });
  const find = id => x.listings.find(l => l.id == id);
  el.querySelectorAll("[data-v]").forEach(b => b.onclick = () => buySheet(find(b.dataset.v), x.credits));
  el.querySelectorAll("[data-buy]").forEach(b => b.onclick = () => buyNow(find(b.dataset.buy), x.credits));
  el.querySelectorAll("[data-tr]").forEach(b => b.onclick = () => tradeSheet(find(b.dataset.tr)));
}
function buyNow(l, credits) {
  if (credits < l.credits) { toast(`You need ${l.credits} credits. Sell a piece to earn more.`); return; }
  api(`/api/exchange/${l.id}/offer`, { body: { kind: "buy" } }).then(() => { closeSheet(); toast("Bought. It is in your Closet now"); VIEWS.shop("buy"); }).catch(e => toast(e.message));
}
function buySheet(l, credits) {
  sheet(`<img src="${media(l.img)}" class="sh-big" alt=""><h2 class="sh-sheet-h">${esc(l.name)}</h2>
    <p class="mute small">Size ${esc(l.size)} · ${esc(l.cond)} · sold by ${esc(l.seller)}</p>
    ${l.credits ? `<button class="sh-btn" id="sbBuy">Buy for ${crd(l.credits)}</button><p class="mute small" style="text-align:center">You have ${crd(credits)}</p>` : ""}
    ${l.trade ? `<button class="sh-btn ghost" id="sbTr">Offer a trade</button>` : ""}`);
  if ($("#sbBuy")) $("#sbBuy").onclick = () => buyNow(l, credits);
  if ($("#sbTr")) $("#sbTr").onclick = () => tradeSheet(l);
}
async function tradeSheet(l) {
  const items = (await api("/api/items")).items.filter(i => i.category !== "makeup");
  sheet(`<h2 class="sh-sheet-h">Trade for ${esc(l.name)}</h2><p class="mute small">Tap the piece you will give in return.</p>
    <div class="pickgrid">${items.map(i => `<button data-t="${i.id}"><img src="${thumb(i.photo || i.img)}" alt=""><span>${esc(i.name)}</span></button>`).join("")}</div>`);
  document.querySelectorAll("[data-t]").forEach(b => b.onclick = () => api(`/api/exchange/${l.id}/offer`, { body: { kind: "trade", my_item_id: +b.dataset.t } })
    .then(() => { closeSheet(); toast(`Traded. ${l.name} is in your Closet`); VIEWS.shop("buy"); }).catch(e => toast(e.message)));
}

async function shopSell(x) {
  const el = $("#shBody");
  const offer = o => `<div class="of"><div class="of-ph"><img src="${thumb(o.img)}" alt="">${o.their ? `<i>for</i><img src="${thumb(o.their.img)}" alt="">` : ""}</div>
    <p><b>${esc(o.buyer)}</b> ${o.kind === "buy" ? `wants to buy your ${esc(o.name)} for <b>${crd(o.credits)}</b>` : `wants to trade her ${esc(o.their ? o.their.name : "piece")} for your ${esc(o.name)}`}</p>
    <div class="xc-btns"><button class="sh-btn sm" data-acc="${o.id}">Accept</button><button class="sh-btn sm ghost" data-dec="${o.id}">Decline</button></div></div>`;
  const live = x.mine.filter(l => l.status === "open"), done = x.mine.filter(l => l.status !== "open");
  el.innerHTML = `<button class="sh-btn big" id="sellGo">Sell or trade a piece</button>
    <p class="sh-line" style="text-align:center">Pick a piece from your Closet, choose Sell or Trade, post. Done.</p>
    ${x.incoming.length ? `<h2 class="sh-h">Offers for you</h2>${x.incoming.map(offer).join("")}` : ""}
    <h2 class="sh-h">My listings</h2>
    ${live.length ? live.map(l => `<div class="ml"><img src="${thumb(l.img)}" alt=""><div><b>${esc(l.name)}</b><span>${l.credits ? crd(l.credits) : "Trade only"}${l.credits && l.trade ? " or trade" : ""}</span></div><button class="ml-x" data-rm="${l.id}">Remove</button></div>`).join("")
      : `<p class="sh-empty">Nothing posted yet.</p>`}
    ${done.length ? `<h2 class="sh-h">Sold and traded</h2>${done.map(l => `<div class="ml done"><img src="${thumb(l.img)}" alt=""><div><b>${esc(l.name)}</b><span>${l.status === "sold" ? "Sold" : "Traded"}</span></div></div>`).join("")}` : ""}`;
  $("#sellGo").onclick = () => sellFlow();
  const ans = (id, accept) => api(`/api/exchange/offers/${id}`, { body: { accept } }).then(r => { toast(r.msg || "Declined"); VIEWS.shop("sell"); }).catch(e => toast(e.message));
  el.querySelectorAll("[data-acc]").forEach(b => b.onclick = () => ans(b.dataset.acc, true));
  el.querySelectorAll("[data-dec]").forEach(b => b.onclick = () => ans(b.dataset.dec, false));
  el.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => api(`/api/exchange/${b.dataset.rm}/remove`, { method: "POST", body: {} }).then(() => VIEWS.shop("sell")));
}
// 3 taps: piece -> Sell or Trade -> Post
async function sellFlow(id) {
  const items = (await api("/api/items")).items.filter(i => i.category !== "makeup");
  if (!id) {
    sheet(`<div class="steps"><b>1 Pick a piece</b><i></i>2 Sell or trade<i></i>3 Post</div>
      <div class="pickgrid">${items.map(i => `<button data-p="${i.id}"><img src="${thumb(i.photo || i.img)}" alt=""><span>${esc(i.name)}</span></button>`).join("")}</div>`);
    document.querySelectorAll("[data-p]").forEach(b => b.onclick = () => sellFlow(+b.dataset.p));
    return;
  }
  const it = items.find(i => i.id === id), sg = await api("/api/exchange/suggest/" + id);
  let mode = "sell";
  sheet(`<div class="steps">1 Pick a piece<i></i><b>2 Sell or trade</b><i></i>3 Post</div>
    <div class="sf-piece"><img src="${thumb(it.photo || it.img)}" alt=""><b>${esc(it.name)}</b></div>
    <div class="sf-mode"><button data-m="sell" class="on">Sell<span>for credits</span></button><button data-m="trade">Trade<span>for another piece</span></button></div>
    <label class="sf-price" id="sfPrice"><span>Price in credits</span><input id="sfCr" type="number" inputmode="numeric" value="${sg.credits}"><em>We suggest ${sg.credits}</em></label>
    <button class="sh-btn" id="sfGo">Post</button>`);
  document.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { mode = b.dataset.m; document.querySelectorAll("[data-m]").forEach(y => y.classList.toggle("on", y === b)); $("#sfPrice").style.display = mode === "sell" ? "" : "none"; });
  $("#sfGo").onclick = () => api("/api/exchange/list", { body: { item_id: id, mode, credits: +$("#sfCr").value || sg.credits, trade: mode === "trade" } })
    .then(() => { closeSheet(); toast("Posted. Offers will show up here"); location.hash === "#shop/sell" ? VIEWS.shop("sell") : (location.hash = "shop/sell"); }).catch(e => toast(e.message));
}
const listSheet = id => sellFlow(id);

// ---------- FIND IT ONLINE ----------
VIEWS.find = async (arg) => {
  view.innerHTML = `<div style="margin:10px 0"><div class="eyebrow">Find it online</div><h1>Real pieces, real stores</h1><p class="mute small">Bijou searches the live web. Every product is a real page she opened - nothing invented.</p></div>
    <div class="glass satin" style="padding:14px;border-radius:18px"><input id="fq" class="txt" style="width:100%;margin:4px 0 8px" placeholder="e.g. camel wool coat under $400" value="${esc(decodeURIComponent(arg || S.fq || ""))}"><button class="btn" id="fgo" style="width:100%;margin-top:10px">Search the web</button></div>
    <div id="fout" style="margin-top:14px"></div>`;
  const run = async () => {
    const q = $("#fq").value.trim(); if (!q) return; S.fq = q;
    $("#fout").innerHTML = `<div class="glass" style="padding:16px;text-align:center"><div class="shimmer-orb" style="margin:0 auto"></div><p class="mute small">Opening real store pages. This takes a minute or two.</p></div>`;
    for (let i = 0; i < 90; i++) {
      const d = await api("/api/find", { body: { q } });
      if (!d.pending) {
        if (!$("#fout")) return;
        $("#fout").innerHTML = d.products.length ? `<div class="grid2">${d.products.map(p => `<a class="glass" href="${esc(p.url)}" target="_blank" rel="noopener" style="padding:10px;border-radius:18px;display:block;color:inherit;text-decoration:none">
          <div style="aspect-ratio:4/5;border-radius:14px;overflow:hidden;background:#fff1">${p.image ? `<img src="${esc(p.image)}" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover" onerror="this.remove()" alt="">` : `<div style="height:100%;display:grid;place-items:center;font-family:var(--serif);font-size:22px;color:var(--gold);padding:10px;text-align:center">${esc(p.store || "")}</div>`}</div>
          <div style="font-family:var(--serif);font-size:16px;margin-top:6px">${esc(p.name)}</div><div class="small mute">${esc(p.store || "")}</div>
          <div class="row between"><b style="color:var(--gold)">${esc(p.price || "See price")}</b></div>
          <div class="small" style="color:var(--gold)">Would unlock ${p.unlocks} outfits</div></a>`).join("")}</div>` : `<div class="empty"><p>${esc(d.error || "No verified products found. Try different words.")}</p></div>`;
        return;
      }
      await new Promise(r => setTimeout(r, 4000));
    }
  };
  $("#fgo").onclick = run;
  if (arg) run();
};

// ---------- ORGANIZER ----------
const PLAN_ART = { "Hangers": "n_vault", "Drawer space": "p_drawer", "Shoe shelf spots": "p_shoe", "Bag shelf spots": "wallet", "Jewelry tray cells": "n_check", "Vanity space": "n_bijou" };
VIEWS.organizer = async () => {
  const d = await api("/api/organizer");
  view.innerHTML = `<div style="margin:10px 0"><div class="eyebrow">Closet planner</div><h1>Organizer</h1></div>
    <div class="grid2">${d.plan.map(p => `<div class="glass stat plan" style="text-align:left;padding:14px">${AI(PLAN_ART[p.title] || "n_vault", "pa")}<b style="font-size:30px;color:var(--gold)">${p.n}</b><div style="font-family:var(--serif);font-size:17px">${esc(p.title)}</div><span style="text-transform:none;letter-spacing:0">${esc(p.desc)}${p.rail_cm ? `  -  ${Math.round(p.rail_cm)} cm of rail` : ""}</span></div>`).join("")}</div>
    <h2>Hang by colour</h2>
    <div class="glass" style="padding:14px;display:flex;height:46px;gap:2px;border-radius:14px;overflow:hidden">${d.by_colour.map(([c, n]) => `<div title="${esc(c)} ${n}" style="flex:${n};background:${hex(c)};border-radius:4px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)"></div>`).join("")}</div>
    <div class="small mute" style="margin-top:6px">${d.by_colour.map(([c, n]) => `${esc(c)} ${n}`).join("  -  ")}</div>
    <h2>Styling the space</h2>${d.tips.map(t => `<div class="glass" style="padding:12px 14px;margin-bottom:8px">${esc(t)}</div>`).join("")}
    <h2>Never worn</h2><p class="mute small">${d.never_worn.length} pieces you have not worn yet. Resale estimate ${money(d.resale_value)}. Wear them this month or let them go.</p>
    <div class="cards">${d.never_worn.map(i => card(i)).join("")}</div>`;
  await loadItems();
  bindCards(view);
};

// ---------- PROFILE ----------
VIEWS.profile = async () => {
  const s = await refreshState(), l = s.level;
  view.innerHTML = `<section class="hero glass satin" style="text-align:center"><div class="eyebrow">Closet Level</div><div class="big">${l.level}</div><h2 style="margin:4px 0">${esc(l.title)}</h2>
    <div class="bar" style="margin:12px 0 6px"><i style="width:${l.pct}%"></i></div><div class="small mute">${l.xp} / ${l.next} Style XP</div></section>
    <div class="field"><label>Your name</label><input class="txt" id="pName" value="${esc(s.profile.name)}" placeholder="What should Bijou call you?"></div>
    <h2>How to earn Style XP</h2><div class="glass xpgrid">${[["Add a piece", 25, "camera"], ["Wear a piece", 10, "n_vault"], ["Save a look", 15, "n_looks"], ["Store check", 20, "n_check"], ["Skip a duplicate", 40, "coin"], ["Try-on", 30, "wand"], ["Daily quest", 60, "seal"]]
      .map(([t, n, a]) => `<div>${AI(a, "")}<span>${t}</span><b>+${n}</b></div>`).join("")}</div>
    <h2>Show it off</h2>
    <button class="btn wide" id="pIntro">Replay the grand entrance</button>
    ${navigator.standalone || matchMedia("(display-mode: standalone)").matches ? "" : `<div class="glass" style="padding:16px;margin-top:12px"><div class="eyebrow">Put Vanity on your iPhone</div>
      <p class="small" style="margin:8px 0 0;line-height:1.6">In Safari tap <b>Share</b>, then <b>Add to Home Screen</b>. Vanity opens full screen like an app, with its own icon.</p></div>`}`;
  $("#pName").onchange = e => api("/api/profile", { body: { name: e.target.value } }).then(() => toast("Saved"));
  $("#pIntro").onclick = () => { try { sessionStorage.removeItem("vanity_in"); } catch { } location.hash = "home"; launch(S.state.profile.name); };
};

try { S.voice = localStorage.getItem("vanity_voice") === "1"; } catch { }
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => { });
// boot lives in static/boot.js (after the view files load)
