// (c) 2026 Mathew. All rights reserved.
// Vanity online: answers every /api call on the phone itself. Closet and photos live in this phone's storage only.
"use strict";
const ON = (() => {
  const CATS = ["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "jewelry", "accessories", "makeup"];
  const TIERS = ["Everyday", "Signature", "Statement", "Couture", "Icon"];
  const XP = { add_item: 25, wear: 10, outfit: 15, check: 20, skip: 40, quest: 60 };
  const TITLES = ["Ingenue", "Muse", "Tastemaker", "It Girl", "Style Editor", "Creative Director", "Couturiere", "Fashion Icon", "Legend of the Atelier"];
  const VIBES = ["classic", "casual", "chic", "minimal", "romantic", "boho", "edgy", "sporty", "glam", "office", "evening", "lounge"];
  const SOON = "New pictures of you in outfits are coming soon.";
  const now = () => Date.now() / 1000, clone = x => structuredClone(x), round = (n, d = 0) => +(+n).toFixed(d);
  const today = () => { const d = new Date(); return [d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-"); };
  const fail = m => { throw new Error(m); };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  let idb, SEED, DB, ver = 0; const urls = {}, drafts = {};

  // ---------- storage ----------
  const req = r => new Promise((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
  const openDb = () => new Promise((ok, no) => {
    const bad = () => no(new Error("This browser is blocking storage, so your closet can't be saved. Turn off private browsing and try again."));
    let r; try { r = indexedDB.open("vanity", 1); } catch { return bad(); }
    r.onupgradeneeded = () => { r.result.createObjectStore("kv"); r.result.createObjectStore("pics"); }; r.onsuccess = () => ok(r.result); r.onerror = bad;
  });
  const st = (n, m = "readwrite") => idb.transaction(n, m).objectStore(n);
  const write = (n, v, k) => new Promise((ok, no) => { const t = idb.transaction(n, "readwrite"); t.objectStore(n).put(v, k); t.oncomplete = ok; t.onerror = t.onabort = () => no(new Error("This phone is out of storage space. Free some up and try again.")); });
  const save = async () => { ver++; await write("kv", DB, "db"); };
  const blank = name => ({ name, kv: { credits: 500 }, items: [], outfits: [], xp: [], checks: [], chat: [], offers: [], listings: clone(SEED.listings), next: 1000 });
  const P = () => DB.profiles[DB.active] || fail("Create your profile first");
  const ready = (async () => {
    SEED = await (await fetch("seed.json")).json();
    idb = await openDb();
    DB = await req(st("kv", "readonly").get("db")) || { active: null, profiles: {} };
    const keys = await req(st("pics", "readonly").getAllKeys()), blobs = await req(st("pics", "readonly").getAll());
    keys.forEach((k, i) => urls[k] = URL.createObjectURL(blobs[i]));
  })();
  ready.catch(() => { });
  const media = rel => !rel ? "" : urls[rel] || (/^https?:|^data:|^blob:/.test(rel) ? rel : "media/" + rel);

  // ---------- pictures ----------
  const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error("That photo could not be read")); i.src = src; });
  async function savePic(dataUrl) {
    const i = await load(dataUrl), s = Math.min(1, 900 / Math.max(i.width, i.height)), c = document.createElement("canvas");
    c.width = Math.round(i.width * s); c.height = Math.round(i.height * s); c.getContext("2d").drawImage(i, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, "image/jpeg", .84)), key = "my/" + uid();
    await write("pics", blob, key); urls[key] = URL.createObjectURL(blob); return key;
  }
  const inUse = k => Object.values(DB.profiles).some(p => p.kv.selfie === k || p.items.some(i => i.photo === k) || p.checks.some(c => c.photo === k) || p.listings.some(l => l.img === k));
  const dropPic = async k => { if (k && urls[k] && !inUse(k)) { URL.revokeObjectURL(urls[k]); delete urls[k]; await req(st("pics").delete(k)); } };
  const rgb = h => { h = h.slice(1); if (h.length === 3) h = [...h].map(c => c + c).join(""); return [0, 2, 4].map(k => parseInt(h.slice(k, k + 2), 16)); };
  const lab = ([r, g, b]) => {
    const f = v => { v /= 255; return v > .04045 ? ((v + .055) / 1.055) ** 2.4 : v / 12.92; }; r = f(r); g = f(g); b = f(b);
    const t = v => v > .008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116, x = t((r * .4124 + g * .3576 + b * .1805) / .95047), y = t(r * .2126 + g * .7152 + b * .0722), z = t((r * .0193 + g * .1192 + b * .9505) / 1.08883);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  };
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  // main colours of the middle of a photo; pixels that look like the edges (the background) are ignored
  async function colorsOf(src) {
    const i = await load(src), n = 48, c = document.createElement("canvas"); c.width = c.height = n;
    const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(i, 0, 0, n, n); const d = x.getImageData(0, 0, n, n).data;
    const px = (a, b) => { const o = (b * n + a) * 4; return [d[o], d[o + 1], d[o + 2]]; }, edge = [];
    for (let k = 0; k < n; k += 3) edge.push(lab(px(k, 0)), lab(px(0, k)), lab(px(n - 1, k)));
    const names = Object.entries(COLOR_HEX).map(([k, h]) => [k, lab(rgb(h))]);
    const count = skip => {
      const t = {};
      for (let b = 8; b < 40; b++) for (let a = 10; a < 38; a++) {
        const l = lab(px(a, b)); if (skip && edge.filter(e => dist(e, l) < 12).length > 6) continue;
        let best = null, bd = 1e9; for (const [k, v] of names) { const q = dist(v, l); if (q < bd) { bd = q; best = k; } }
        t[best] = (t[best] || 0) + 1;
      }
      return t;
    };
    const sum = t => Object.values(t).reduce((a, b) => a + b, 0);
    let t = count(true); if (sum(t) < 80) t = count(false);
    const s = Object.entries(t).sort((a, b) => b[1] - a[1]), tot = sum(t);
    return s.filter(([, v], k) => k === 0 || (k === 1 && v / tot > .25)).map(e => e[0]);
  }

  // ---------- game ----------
  const rarity = i => { const p = +i.price || 0; let t = p < 40 ? 0 : p < 120 ? 1 : p < 300 ? 2 : p < 900 ? 3 : 4; if ((i.wears || 0) >= 30) t = Math.min(t + 1, 4); return TIERS[t]; };
  const cpw = i => +i.price ? round(i.price / Math.max(i.wears || 0, 1), 2) : null;
  const deco = i => ({ ...clone(i), rarity: rarity(i), cpw: cpw(i) });
  const items = () => [...P().items].sort((a, b) => b.created - a.created);
  const get = id => P().items.find(i => i.id === +id);
  const pick = ids => (ids || []).map(get).filter(Boolean);
  const level = () => {
    const xp = P().xp.reduce((a, x) => a + x.n, 0), l = Math.floor(Math.sqrt(xp / 60)) + 1, lo = 60 * (l - 1) ** 2, hi = 60 * l ** 2;
    return { level: l, xp, floor: lo, next: hi, pct: Math.round((xp - lo) / (hi - lo) * 100), title: TITLES[Math.min(l - 1, 8)] };
  };
  const grant = (k, why) => { const b = level(); P().xp.push({ n: XP[k], why: why || k, day: today() }); const a = level(); return { xp: XP[k], level_up: a.level > b.level, level: a }; };
  const QUESTS = [["wear_unworn", "Wear something you have never worn"], ["add_two", "Add two pieces to the closet"], ["make_outfit", "Style a new outfit"], ["check_buy", "Run a store check"], ["ask_bijou", "Ask Bijou for a look"]];
  const quest = () => { const d = new Date(), q = QUESTS[Math.floor((Date.now() - d.getTimezoneOffset() * 6e4) / 864e5) % 5]; return { key: q[0], title: q[1], desc: "", done: P().kv.quest === today(), xp: XP.quest }; };
  const questDone = k => {
    const q = quest(); if (q.done || q.key !== k) return null;
    if (k === "add_two" && P().xp.filter(x => x.day === today() && x.why.startsWith("add_item")).length < 2) return null;
    P().kv.quest = today(); return grant("quest");
  };

  const NEUTRAL = new Set("black white ivory cream beige grey gray charcoal navy denim camel tan brown chocolate nude taupe gold silver champagne khaki off-white blush clear transparent multi pearl".split(" "));
  const HUES = { burgundy: 350, wine: 345, maroon: 350, coral: 15, orange: 30, rust: 20, mustard: 45, yellow: 55, lime: 90, olive: 80, emerald: 140, sage: 110, mint: 150, green: 120, teal: 175, turquoise: 180, cobalt: 225, sky: 200, blue: 220, lavender: 270, lilac: 275, purple: 280, plum: 300, magenta: 310, fuchsia: 315, "hot pink": 325, pink: 330, rose: 340, peach: 25, red: 0 };
  const HC = {};
  const hue = c => {
    c = (c || "").toLowerCase().trim(); if (c in HC) return HC[c]; let r = null;
    if (c && !NEUTRAL.has(c) && !NEUTRAL.has(c.split(/\s+/).pop())) for (const k in HUES) if (c.includes(k)) { r = HUES[k]; break; }
    return HC[c] = r;
  };
  function harmony(cs) {
    const h = [...new Set(cs.map(hue).filter(x => x !== null))]; if (h.length <= 1) return 1;
    let w = 0; for (let a = 0; a < h.length; a++) for (let b = a + 1; b < h.length; b++) { const d = Math.abs(h[a] - h[b]); w = Math.max(w, Math.min(d, 360 - d)); }
    return h.length === 2 ? (w <= 45 ? .95 : w >= 150 ? .85 : .6) : w <= 60 ? .75 : .4;
  }
  const CLASH = [["sporty", "evening"], ["sporty", "glam"], ["lounge", "office"], ["lounge", "evening"]];
  function score(its) {
    const cs = [], se = new Set(), vs = new Set();
    for (const i of its) {
      for (const c of (i.colors || []).slice(0, 2)) cs.push(c);
      const s = (i.season || "all").toLowerCase(); if (!s.startsWith("all")) se.add(s === "autumn" ? "fall" : s);
      if (i.vibe) vs.add(i.vibe.toLowerCase());
    }
    const only = (...a) => [...se].every(s => a.includes(s));
    const season = se.size <= 1 ? 1 : only("spring", "summer") || only("fall", "winter") ? .95 : se.has("summer") && se.has("winter") ? .5 : .8;
    const clash = CLASH.some(([a, b]) => vs.has(a) && vs.has(b));
    return round(harmony(cs) * season * (clash ? .5 : vs.size <= 2 ? 1 : .85), 3);
  }
  const OPT = ["outerwear", "bags", "jewelry"];
  const byCat = its => { const o = {}; CATS.forEach(c => o[c] = []); its.forEach(i => (o[i.category] || o.accessories).push(i)); return o; };
  function* bases(c) { for (const s of c.shoes.length ? c.shoes : [null]) { for (const t of c.tops) for (const b of c.bottoms) yield s ? [t, b, s] : [t, b]; for (const d of c.dresses) yield s ? [d, s] : [d]; } }
  // counts every valid outfit, and how many each piece is part of, in one pass
  function tally(its) {
    const c = byCat(its), per = {}; let total = 0, n = 0;
    for (const b of bases(c)) {
      if (score(b) < .55) continue; n++;
      const f = OPT.map(o => c[o].filter(i => score([...b, i]) >= .55)), m = f.map(x => 1 + x.length), all = m[0] * m[1] * m[2];
      total += all; b.forEach(i => per[i.id] = (per[i.id] || 0) + all); f.forEach((x, k) => x.forEach(i => per[i.id] = (per[i.id] || 0) + all / m[k]));
    }
    return { count: { total, bases: n, needs_shoes: !c.shoes.length, by_cat: Object.fromEntries(CATS.map(k => [k, c[k].length])) }, per };
  }
  const memo = {};
  const keep = (k, f) => { const id = DB.active + "|" + k; if (!memo[id] || memo[id].v !== ver) memo[id] = { v: ver, d: f() }; return memo[id].d; };
  const T = () => keep("tally", () => tally(items()));
  const unlocks = cand => Math.max(0, tally([...items(), { ...cand, id: -1 }]).count.total - T().count.total);
  function best(n, must, occ) {
    const c = byCat(items()), out = [], seen = new Set(), list = [];
    for (const b of bases(c)) {
      const s = score(b); if (s < .55) continue; const look = [...b];
      for (const o of OPT) {
        let top = null, tk = null;
        for (const i of c[o]) { const k = [score([...look, i]), -(i.wears || 0), i.id]; if (!tk || k[0] > tk[0] || (k[0] === tk[0] && (k[1] > tk[1] || (k[1] === tk[1] && k[2] > tk[2])))) { tk = k; top = i; } }
        if (top && tk[0] >= s * .97) look.push(top);
      }
      if (must && !look.some(i => i.id === must)) continue;
      const fit = occ ? look.filter(i => occ.includes((i.vibe || "").toLowerCase())).length * .06 : 0;
      list.push([score(look) + look.filter(i => (i.wears || 0) < 3).length * .02 + fit, look]);
    }
    list.sort((a, b) => b[0] - a[0]);
    for (const [s, look] of list) {
      const k = look.slice(0, 2).map(i => i.id).sort().join(); if (seen.has(k)) continue;
      seen.add(k); out.push({ score: round(Math.min(s, 1), 3), items: look.map(deco) }); if (out.length >= n) break;
    }
    return out;
  }
  const idKey = ids => [...ids].map(Number).sort((a, b) => a - b).join();
  const picOf = ids => (!P().kv.selfie && P().kv.sample && SEED.lookimg[idKey(ids)]) || null;
  const withPic = o => ({ ...o, ...(picOf(o.items.map(i => i.id)) || {}) });
  // lead with looks that already have a picture
  const looks = n => {
    const made = [];
    if (P().kv.sample && !P().kv.selfie) for (const k in SEED.lookimg) { const ids = k.split(","), p = pick(ids); if (p.length === ids.length) made.push({ score: score(p), items: p.map(deco) }); }
    const ks = new Set(made.map(o => idKey(o.items.map(i => i.id))));
    return [...made, ...keep("looks", () => best(12)).filter(o => !ks.has(idKey(o.items.map(i => i.id))))].slice(0, n).map(withPic);
  };
  const model = () => P().kv.selfie || SEED.model;
  const saved = () => [...P().outfits].reverse().map(o => ({ ...clone(o), items: pick(o.item_ids).map(deco) }));
  const moneySaved = () => round(P().checks.reduce((a, c) => a + (["skip", "own"].includes(c.verdict) ? +c.price || 0 : 0), 0), 2);
  const stores = q => { const e = encodeURIComponent(q); return [{ label: "Google Shopping", url: "https://www.google.com/search?tbm=shop&q=" + e }, { label: "Nordstrom", url: "https://www.nordstrom.com/sr?keyword=" + e }, { label: "Amazon", url: "https://www.amazon.com/s?k=" + e }]; };
  const GAPS = [["Black tailored trousers", "bottoms", "black"], ["White button-down shirt", "tops", "white"], ["Camel wool coat", "outerwear", "camel"], ["Black slip dress", "dresses", "black"], ["Nude heels", "shoes", "nude"], ["White leather sneakers", "shoes", "white"], ["Black shoulder bag", "bags", "black"], ["Gold hoop earrings", "jewelry", "gold"], ["Straight leg jeans", "bottoms", "denim"], ["Navy blazer", "outerwear", "navy"], ["Cream knit sweater", "tops", "cream"], ["Brown ankle boots", "shoes", "brown"]];
  const gaps = () => keep("gaps", () => GAPS.filter(([, c, col]) => !P().items.some(i => i.category === c && (i.colors || []).some(x => x.includes(col) || (col === "denim" && /blue|navy|denim/.test(x) && /jean|denim/i.test(i.name)))))
    .map(([name, category, col]) => ({ name, colors: [col], unlocks: unlocks({ category, colors: [col], season: "all", vibe: "classic" }), links: stores("women's " + name) })).sort((a, b) => b.unlocks - a.unlocks).slice(0, 6));

  // Bijou without a chat service: reads the occasion and picks from her closet
  const OCC = [[/work|meeting|office|interview|boss/i, ["office", "classic", "minimal"], "Polished and in charge."], [/wedding|gala|formal|fancy/i, ["evening", "glam", "romantic", "chic"], "Dressed up, without upstaging the bride."], [/party|rooftop|club|night out|birthday|drinks/i, ["glam", "evening", "edgy", "chic"], "Made for a night out."], [/date|dinner|romantic|anniversary/i, ["romantic", "chic", "evening", "glam"], "A little romance, easy to wear."], [/brunch|lunch|coffee|girls|shopping/i, ["casual", "chic", "classic"], "Relaxed but put together."], [/gym|walk|sport|hike|run\b/i, ["sporty", "casual"], "Comfortable and ready to move."], [/travel|airport|flight|home|lazy|cozy/i, ["lounge", "casual", "minimal"], "Soft, easy and comfortable."], [/church|mosque|prayer|funeral|modest/i, ["classic", "minimal"], "Simple and respectful."]];
  const CHIPS = ["Date night", "Big work meeting", "Brunch with the girls", "Rooftop party tonight", "Wedding guest"];
  function bijou(text) {
    const o = OCC.find(x => x[0].test(text)), avoid = /cold|snow|winter|freez/i.test(text) ? "summer" : /\bhot\b|beach|summer|heat/i.test(text) ? "winter" : "";
    let list = best(80, null, o ? o[1] : null); if (avoid) list = list.filter(l => !l.items.some(i => i.season === avoid));
    const out = [], used = new Set();
    for (const l of list) { const main = l.items.slice(0, 2); if (main.some(i => used.has(i.id))) continue; main.forEach(i => used.add(i.id)); out.push(l); if (out.length === 3) break; }
    if (!out.length) return { say: "I need a top and a bottom, or a dress, before I can dress you. Add a few pieces first.", chips: CHIPS, outfits: [] };
    return {
      say: o ? `${o[2]} Here ${out.length === 1 ? "is one look" : `are ${out.length} looks`} from your closet.` : "Here are my favourites from your closet. Tell me where you're going and I can narrow it down.", chips: CHIPS,
      outfits: out.map(l => ({ title: "The " + (l.items.map(i => i.vibe).find(v => v && (!o || o[1].includes(v))) || l.items[0].vibe || "easy").replace(/^./, c => c.toUpperCase()) + " look", why: l.items.slice(0, 2).map(i => i.name).join(" with "), item_ids: l.items.map(i => i.id) })),
    };
  }
  const full = m => ({ ...clone(m), outfits: (m.outfits || []).map(o => ({ ...o, items: pick(o.item_ids).map(deco) })) });
  const SELL = ["Margaux (demo)", "Ines (demo)", "Celeste (demo)", "Noor (demo)", "Aurelie (demo)"];
  const SING = { top: "tops", bottom: "bottoms", dress: "dresses", bag: "bags" };
  const addItem = d => { const i = { wears: 0, last_worn: null, colors: [], season: "all", vibe: "classic", pattern: "solid", notes: "", ...d, id: P().next++, created: now() }; i.category = SING[i.category] || i.category; P().items.push(i); return i; };
  const listing = id => P().listings.find(l => l.id === +id);
  const suggest = i => +i.price ? Math.max(20, Math.round(i.price * .04) * 10) : 60;
  const rmItem = id => { const p = P(); p.items = p.items.filter(i => i.id !== +id); };
  const colourOf = n => Object.keys(COLOR_HEX).filter(c => n.toLowerCase().includes(c)).slice(0, 1);
  const fromListing = l => addItem({ name: l.name, category: l.category, colors: colourOf(l.name), price: 0, img: l.img, photo: l.img });

  const R = [
    ["GET", "/api/state", () => ({ level: level(), quest: quest(), count: P().items.length, outfits: T().count, badges: [], money_saved: moneySaved(), profile: { name: P().name, cover: null, has_selfie: !!P().kv.selfie }, queue: [], profile_id: DB.active, need_profile: false })],
    ["POST", "/api/profile", b => { P().name = String(b.name || "").slice(0, 40); return { ok: true }; }],
    ["GET", "/api/items", () => ({ items: items().map(i => ({ ...deco(i), in_outfits: Math.round(T().per[i.id] || 0) })) })],
    ["POST", "/api/items/analyze", async b => {
      const key = await savePic(b.image), colors = await colorsOf(urls[key]); drafts[key] = 1;
      return { draft: key, img: key, photo: key, tags: { category: "tops", colors, _error: "Give it a name and tap its category. The colours are a guess from the photo." }, options: { categories: CATS, seasons: ["all", "spring", "summer", "fall", "winter"], vibes: VIBES } };
    }],
    ["POST", "/api/items", b => {
      if (!drafts[b.draft]) fail("That photo expired, snap it again"); delete drafts[b.draft];
      const g = k => b[k] || "", i = addItem({ name: g("name"), category: g("category"), subtype: g("subtype"), colors: b.colors || [], pattern: g("pattern"), season: g("season") || "all", vibe: g("vibe"), brand: g("brand"), price: parseFloat(b.price) || 0, img: b.draft, photo: b.draft });
      const reward = grant("add_item"); return { item: deco(i), reward, quest: questDone("add_two") };
    }],
    ["DELETE", "/api/items/(\\d+)", async (b, m) => { const i = get(m[1]); if (i) { rmItem(i.id); P().listings = P().listings.filter(l => l.item_id !== i.id || l.status !== "open"); await dropPic(i.photo); } return { ok: true }; }],
    ["POST", "/api/items/(\\d+)/wear", (b, m) => { const i = get(m[1]) || fail("No such piece"), first = !i.wears, was = rarity(i); i.wears = (i.wears || 0) + 1; i.last_worn = now(); return { item: deco(i), reward: grant("wear"), quest: first ? questDone("wear_unworn") : null, tier_up: rarity(i) !== was }; }],
    ["POST", "/api/check", async b => {
      const key = await savePic(b.image), cs = await colorsOf(urls[key]), L = c => lab(rgb(hex(c))), cat = b.category;
      const matches = items().filter(i => i.category === cat && (i.colors || []).length)
        .map(i => ({ item: deco(i), similarity: Math.round(Math.max(0, 96 - Math.min(...i.colors.slice(0, 2).map(c => dist(L(c), L(cs[0])))) * 1.6)), why: "Same kind of piece, " + i.colors[0] }))
        .filter(m => m.similarity >= 55).sort((a, b) => b.similarity - a.similarity);
      const n = matches.filter(m => m.similarity >= 80).length, price = parseFloat(b.price) || 0;
      const r = {
        photo: key, item: { name: cs[0][0].toUpperCase() + cs[0].slice(1) + " " + cat, category: cat }, matches: matches.slice(0, 4), similar_count: n, unlocks: unlocks({ category: cat, colors: cs, season: "all", vibe: "classic" }), verdict: n ? "skip" : "buy", price,
        headline: n ? `You own ${n} in a similar colour. Take a look before you buy.` : matches.length ? "Nothing in quite this colour." : "Nothing like it in your closet.", reason: "Compared by type and colour.",
      };
      r.id = P().next++; P().checks.unshift({ id: r.id, photo: key, verdict: "pending", data: { item: r.item, similar_count: n, unlocks: r.unlocks }, price, at: now() });
      r.reward = grant("check"); r.quest = questDone("check_buy"); return r;
    }],
    ["POST", "/api/check/(\\d+)/decide", (b, m) => { const c = P().checks.find(x => x.id === +m[1]) || fail("That check is gone"); c.verdict = b.verdict; return { ok: true, reward: b.verdict === "buy" ? null : grant("skip"), money_saved: moneySaved() }; }],
    ["GET", "/api/checks", () => ({ checks: P().checks.slice(0, 30) })],
    ["GET", "/api/outfits", (b, m, q) => { const must = +q.get("must") || null, n = +q.get("n") || 12; return { count: T().count, best: must ? best(n, must).map(withPic) : looks(n), saved: saved() }; }],
    ["POST", "/api/outfits", b => {
      const its = pick(b.item_ids); if (!its.length) fail("Pick some pieces"); const id = P().next++;
      P().outfits.push({ id, item_ids: its.map(i => i.id), title: b.title || "Signature Look", score: score(its), reason: b.reason || "", img: (picOf(b.item_ids) || {}).img || null, created: now() });
      return { id, reward: grant("outfit"), quest: questDone("make_outfit") };
    }],
    ["POST", "/api/outfits/wear", b => { pick(b.item_ids).forEach(i => { i.wears = (i.wears || 0) + 1; i.last_worn = now(); }); return { reward: grant("wear") }; }],
    ["GET", "/api/looks", () => ({ count: T().count, best: looks(12), model: model(), saved: saved() })],
    ["POST", "/api/looks/render", b => picOf(b.item_ids || []) || {}],
    ["POST", "/api/(render|tryon|discover/art|foryou/\\w+/onme)", () => fail(SOON)],
    ["GET", "/api/jobs/\\w+", () => fail("No such job")],
    ["GET", "/api/me", () => ({ selfie: P().kv.selfie || null, model: model(), own: !!P().kv.selfie })],
    ["GET", "/api/profiles", () => ({ active: DB.active, need: !DB.profiles[DB.active], profiles: Object.entries(DB.profiles).map(([id, p]) => ({ id, name: p.name, model: p.kv.selfie || SEED.model, own: !!p.kv.selfie, done: !!p.kv.done })) })],
    ["POST", "/api/profiles", b => { const n = String(b.name || "").trim().slice(0, 30) || fail("What's your name?"), id = uid(); DB.profiles[id] = blank(n); DB.active = id; try { navigator.storage.persist(); } catch { } return { id }; }],
    ["POST", "/api/profiles/switch", b => { if (!DB.profiles[b.id]) fail("No such profile"); DB.active = b.id; return { id: b.id }; }],
    ["POST", "/api/profiles/setup", b => { const p = P(); p.kv.quiz = b.quiz || {}; if (b.closet === "sample" && !p.items.length) { p.items = clone(SEED.items); p.kv.sample = true; } p.kv.done = true; return { ok: true, count: p.items.length }; }],
    ["GET", "/api/bijou", () => ({ messages: P().chat.slice(-30).map(m => ({ role: m.role, content: m.role === "user" ? m.content : full(m.content) })) })],
    ["POST", "/api/bijou", b => {
      if (b.reset) { P().chat = []; return { messages: [] }; }
      const t = (b.text || "").trim() || fail("Say something"), r = bijou(t);
      P().chat.push({ role: "user", content: { text: t } }, { role: "bijou", content: clone(r) }); P().chat = P().chat.slice(-60);
      return { reply: full(r), quest: r.outfits.length ? questDone("ask_bijou") : null };
    }],
    ["GET", "/api/discover", () => ({ complete: gaps(), trends: [] })],
    ["GET", "/api/foryou", () => ({ picks: gaps(), listings: [] })],
    ["POST", "/api/find", b => ({ links: stores(b.q || fail("Tell me what to look for")) })],
    ["GET", "/api/organizer", () => {
      const c = byCat(items()), soft = i => ["t-shirt", "tee", "tank", "sweater", "knit"].includes((i.subtype || "").toLowerCase());
      const sk = c.bottoms.filter(i => /skirt/i.test(i.subtype || "")).length, ht = c.tops.filter(i => !soft(i)).length, hang = c.dresses.length + c.outerwear.length + ht + sk, fold = c.tops.length - ht + c.bottoms.length - sk, by = {};
      items().forEach(i => { const k = (i.colors || [])[0] || "other"; by[k] = (by[k] || 0) + 1; });
      const nw = items().filter(i => !i.wears).sort((a, b) => (b.price || 0) - (a.price || 0));
      return {
        plan: [{ title: "Hangers", n: hang, desc: "Dresses, outerwear, blouses and skirts", rail_cm: hang * 2.5 }, { title: "Drawer space", n: Math.ceil(fold / 8), desc: fold + " folded pieces at about 8 per drawer" }, { title: "Shoe shelf spots", n: c.shoes.length, desc: "One pair per spot" }, { title: "Bag shelf spots", n: c.bags.length, desc: "Upright with dividers" }, { title: "Jewelry tray cells", n: c.jewelry.length, desc: "One cell per piece or pair" }, { title: "Vanity space", n: c.makeup.length, desc: "Products for the makeup tower" }],
        by_colour: Object.entries(by).sort((a, b) => b[1] - a[1]), tips: ["Hang by colour, light to dark, within each category.", "Keep this season at eye level and rotate the rest up high.", "Group evening pieces together so a night-out look takes one reach."],
        never_worn: nw.slice(0, 20).map(deco), resale_value: round(nw.reduce((a, i) => a + (+i.price || 0) * .4, 0), 2),
      };
    }],
    ["GET", "/api/exchange", () => {
      const p = P(), of = [...p.offers].reverse().map(o => ({ ...o, name: (listing(o.listing_id) || {}).name, img: (listing(o.listing_id) || {}).img, their: o.their_listing ? listing(o.their_listing) : null }));
      return { credits: p.kv.credits, listings: p.listings.filter(l => l.status === "open" && l.seller !== "me").map(l => ({ ...l, mine: false })), mine: p.listings.filter(l => l.seller === "me" && l.status !== "removed").reverse(), incoming: of.filter(o => o.incoming && o.status === "pending"), offers: of.filter(o => !o.incoming), trades: p.kv.trades || 0, note: "" };
    }],
    ["POST", "/api/exchange/list", b => {
      const i = get(b.item_id) || fail("Piece not found"), p = P();
      if (p.listings.some(l => l.seller === "me" && l.item_id === i.id && l.status === "open")) fail("That piece is already posted");
      const tr = b.mode === "trade", id = p.next++;
      p.listings.push({ id, seller: "me", demo: 0, item_id: i.id, name: i.name, category: i.category, size: b.size || "One size", cond: b.cond || "Like new", credits: tr ? 0 : +b.credits || suggest(i), trade: tr || b.trade ? 1 : 0, img: i.photo, status: "open", created: now() });
      const demo = p.listings.filter(l => l.demo && l.status === "open"), d = demo[id % (demo.length || 1)];
      if (!tr) p.offers.push({ id: p.next++, listing_id: id, kind: "buy", credits: listing(id).credits, incoming: 1, buyer: SELL[id % 5], status: "pending" });
      else if (d) p.offers.push({ id: p.next++, listing_id: id, kind: "trade", incoming: 1, buyer: d.seller, their_listing: d.id, status: "pending" });
      return { id };
    }],
    ["POST", "/api/exchange/offers/(\\d+)", (b, m) => {
      const p = P(), o = p.offers.find(x => x.id === +m[1] && x.status === "pending") || fail("That offer is gone");
      if (!b.accept) { o.status = "declined"; return { ok: true }; }
      const l = listing(o.listing_id), t = o.their_listing && listing(o.their_listing);
      if (t && t.status !== "open") { o.status = "declined"; fail("That piece is already gone"); }
      o.status = "accepted"; rmItem(l.item_id);
      if (!t) { p.kv.credits += o.credits; l.status = "sold"; return { ok: true, credits: p.kv.credits, msg: `Sold. +${o.credits} credits` }; }
      l.status = t.status = "traded"; fromListing(t); p.kv.trades = (p.kv.trades || 0) + 1;
      return { ok: true, credits: p.kv.credits, msg: `Traded. ${t.name} is in your Closet` };
    }],
    ["POST", "/api/exchange/(\\d+)/offer", (b, m) => {
      const p = P(), l = listing(m[1]); if (!l || l.status !== "open") fail("That listing is gone");
      if (b.kind === "buy") { if (p.kv.credits < l.credits) fail("Not enough credits"); p.kv.credits -= l.credits; l.status = "sold"; }
      else { get(b.my_item_id) || fail("Piece not found"); rmItem(b.my_item_id); l.status = "traded"; p.kv.trades = (p.kv.trades || 0) + 1; }
      const i = fromListing(l); p.offers.push({ id: p.next++, listing_id: l.id, kind: b.kind, credits: l.credits, status: "accepted" });
      return { ok: true, item_id: i.id, credits: p.kv.credits };
    }],
    ["POST", "/api/exchange/(\\d+)/remove", (b, m) => { const l = listing(m[1]); if (l && l.seller === "me") l.status = "removed"; P().offers.forEach(o => { if (o.listing_id === +m[1] && o.status === "pending") o.status = "declined"; }); return { ok: true }; }],
    ["GET", "/api/exchange/suggest/(\\d+)", (b, m) => ({ credits: suggest(get(m[1]) || fail("Piece not found")) })],
  ].map(([a, p, f]) => [a, new RegExp("^" + p + "$"), f]);

  let chain = Promise.resolve();
  function call(path, opts = {}) {
    const m = opts.method || (opts.body ? "POST" : "GET"), u = new URL(path, "https://x");
    const run = async () => {
      await ready;
      for (const [a, rx, f] of R) {
        const k = a === m && rx.exec(u.pathname); if (!k) continue;
        const out = clone(await f(opts.body || {}, k, u.searchParams));
        if (m !== "GET") await save();
        return out;
      }
      fail("Not available online yet");
    };
    const p = chain.then(run, run); chain = p.catch(() => { }); return p;
  }
  // ---------- backup: one file with everything ----------
  const toData = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
  async function backup() {
    await ready; const k = await req(st("pics", "readonly").getAllKeys()), v = await req(st("pics", "readonly").getAll()), pics = {};
    for (let i = 0; i < k.length; i++) pics[k[i]] = await toData(v[i]);
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify({ vanity: 1, db: DB, pics })], { type: "application/json" })); a.download = `vanity-backup-${today()}.json`; document.body.append(a); a.click(); a.remove();
  }
  async function restore(file) {
    await ready; let d; try { d = JSON.parse(await file.text()); } catch { fail("That isn't a Vanity backup"); }
    if (!d || d.vanity !== 1 || !d.db || !d.db.profiles) fail("That isn't a Vanity backup");
    for (const k in d.pics) { if (!k.startsWith("my/") || !/^data:image\//.test(d.pics[k])) continue; await write("pics", await (await fetch(d.pics[k])).blob(), k); }
    DB = d.db; await save();
  }
  return { call, media, backup, restore };
})();
