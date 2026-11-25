// (c) 2026 Mathew. All rights reserved.
// The Closet, organised like a real one: hanging, folded, shoe rack, bags, jewelry tray, beauty.
"use strict";
document.head.insertAdjacentHTML("beforeend", `<style>
.cz-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin:10px 0 12px}
.cz-head h1{margin:0}
.cz-filters{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 0 6px;padding:0 0 4px}
.cz-filters::-webkit-scrollbar{display:none}
.cz-f{flex:none;border:1px solid var(--line);background:var(--glass);color:var(--ink);border-radius:999px;padding:7px 10px;font:500 12.5px var(--sans);white-space:nowrap}
.cz-f.on{background:var(--gold);color:#1a1410;border-color:var(--gold)}
.cz-sec{margin:20px 0 4px}
.cz-sh{display:flex;align-items:baseline;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:6px;margin-bottom:10px}
.cz-sh h2{margin:0;font-family:var(--serif);font-size:22px;font-weight:500}
.cz-sh span{color:var(--mute);font-size:13px}
.cz-row{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;margin:0;padding:0 0 6px;scroll-snap-type:x proximity}
.cz-row::-webkit-scrollbar{display:none}
.cz-hang{position:relative;padding-top:10px}
.cz-hang:before{content:"";position:absolute;left:0;right:0;top:3px;height:2px;background:linear-gradient(90deg,transparent,var(--gold3),var(--gold2),var(--gold3),transparent);border-radius:2px}
.cz-t{flex:none;width:104px;background:none;border:0;padding:0;color:var(--ink);text-align:left;scroll-snap-align:start}
.cz-t .ph{width:104px;height:134px;border-radius:12px;background:#f3eee8;overflow:hidden;display:block}
.cz-t img{width:100%;height:100%;object-fit:contain;display:block}
.cz-t .nm{display:block;font-size:11.5px;line-height:1.25;margin-top:5px;color:var(--ink);opacity:.85;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.cz-fold{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.cz-fold .cz-t,.cz-fold .cz-t .ph{width:100%}
.cz-fold .cz-t .ph{height:auto;aspect-ratio:1}
.cz-shoe .cz-t .ph{height:84px}
.cz-shoe{border-bottom:3px solid var(--gold3);padding-bottom:8px}
.cz-tray{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;background:rgba(232,205,160,.06);border:1px solid var(--line);border-radius:14px;padding:8px}
.cz-tray .cz-t,.cz-tray .cz-t .ph{width:100%}
.cz-tray .cz-t .ph{height:auto;aspect-ratio:1;border-radius:8px}
.cz-tray .cz-t .nm{font-size:10px;-webkit-line-clamp:1}
.cz-empty{text-align:center;padding:50px 20px}
.cz-empty p{color:var(--mute)}
</style>`);

const CZ = { season: "", vibe: "", sort: "" };
const CZ_SEASONS = ["spring", "summer", "fall", "winter"];
// rough hue so a section reads light-to-dark by colour family; neutrals first
function czHue(it) {
  const h = hex((it.colors || [])[0]); let r, g, b;
  if (h.length === 4) [r, g, b] = [1, 2, 3].map(i => parseInt(h[i] + h[i], 16)); else [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
  if (d < .12) return -2 + (1 - l);            // neutrals: white .. black
  let hue = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return ((hue * 60) + 360) % 360;
}
function czSection(it) {
  const c = it.category, s = (it.subtype || "").toLowerCase();
  if (c === "dresses" || c === "outerwear") return "hang";
  if (c === "tops") return /blouse|shirt|button|bodysuit/.test(s) && !/t-shirt|tee|sweat/.test(s) ? "hang" : "fold";
  if (c === "bottoms") return "fold";
  if (c === "shoes") return "shoes";
  if (c === "bags") return "bags";
  if (c === "jewelry" || c === "accessories") return "tray";
  if (c === "makeup") return "beauty";
  return "fold";
}
const CZ_SECS = [["hang", "Hanging", "cz-row cz-hang"], ["fold", "Folded", "cz-fold"], ["shoes", "Shoes", "cz-row cz-shoe"],
  ["bags", "Bags", "cz-row"], ["tray", "Jewelry & accessories", "cz-tray"], ["beauty", "Beauty", "cz-tray"]];
const czTile = it => `<button class="cz-t" data-id="${it.id}"><span class="ph"><img src="${thumb(it.photo || it.img)}" alt="" loading="lazy"></span><span class="nm">${esc(it.name || it.subtype || "Piece")}</span></button>`;

VIEWS.vault = async () => {
  await loadItems();
  const all = S.items;
  if (!all.length) {
    view.innerHTML = `<div class="cz-empty"><h1>Your closet is empty</h1><p>Snap your first piece. Vanity puts it away for you.</p><button class="btn" id="czAdd">${AI("camera")} Add a piece</button></div>`;
    $("#czAdd").onclick = () => photoChoice("Add to the Closet", addFlow); return;
  }
  let list = all.filter(i => (!CZ.season || i.season === CZ.season || i.season === "all") && (!CZ.vibe || i.vibe === CZ.vibe));
  if (CZ.sort === "never") list = list.filter(i => !i.wears);
  const sortFn = CZ.sort === "most" ? (a, b) => (b.wears || 0) - (a.wears || 0) : (a, b) => czHue(a) - czHue(b);
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  const f = (k, label, on) => `<button class="cz-f ${on ? "on" : ""}" data-k="${k}">${esc(label)}</button>`;
  const secs = CZ_SECS.map(([k, t, cls]) => {
    const its = list.filter(i => czSection(i) === k).sort(sortFn);
    return its.length ? `<section class="cz-sec"><div class="cz-sh"><h2>${t}</h2><span>${its.length}</span></div><div class="${cls}">${its.map(czTile).join("")}</div></section>` : "";
  }).join("");
  view.innerHTML = `<div class="cz-head"><div><div class="eyebrow">The Closet</div><h1>${all.length} pieces</h1></div><button class="btn" id="czAdd">${AI("camera")} Add</button></div>
    <div class="cz-filters">${f("all", "All", !CZ.season && !CZ.vibe && !CZ.sort)}${f("season", CZ.season ? cap(CZ.season) : "Season", CZ.season)}${f("vibe", CZ.vibe ? cap(CZ.vibe) : "Vibe", CZ.vibe)}${f("most", "Most worn", CZ.sort === "most")}${f("never", "Never worn", CZ.sort === "never")}</div>
    ${secs || `<div class="cz-empty"><p>Nothing matches. Try another filter.</p></div>`}`;
  $("#czAdd").onclick = () => photoChoice("Add to the Closet", addFlow);
  view.querySelectorAll(".cz-t").forEach(b => b.onclick = () => itemSheet(+b.dataset.id));
  const pick = (title, key, opts) => {
    const el = sheet(`<h3>${title}</h3><div class="chips" style="flex-wrap:wrap">${["Any", ...opts].map(o => `<button class="chip ${(CZ[key] || "Any") === o ? "on" : ""}" data-v="${esc(o)}">${esc(cap(o))}</button>`).join("")}</div>`);
    el.querySelectorAll("[data-v]").forEach(b => b.onclick = () => { CZ[key] = b.dataset.v === "Any" ? "" : b.dataset.v; closeSheet(); VIEWS.vault(); });
  };
  view.querySelectorAll(".cz-f").forEach(b => b.onclick = () => {
    const k = b.dataset.k;
    if (k === "all") { CZ.season = CZ.vibe = CZ.sort = ""; return VIEWS.vault(); }
    if (k === "season") return pick("Season", "season", CZ_SEASONS);
    if (k === "vibe") return pick("Vibe", "vibe", [...new Set(all.map(i => i.vibe).filter(Boolean))].sort());
    CZ.sort = CZ.sort === k ? "" : k; VIEWS.vault();
  });
};
