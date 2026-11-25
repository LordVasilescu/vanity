// (c) 2026 Mathew. All rights reserved.
// Vanity online: screens that differ from the home version.
"use strict";
document.head.insertAdjacentHTML("beforeend", `<style>#shootCover,.h-list a[href="#tryon"],[data-try],#pfPhoto{display:none!important}.xpgrid>div:nth-child(6){display:none}.bj2-fit .grid2{grid-template-columns:1fr!important}
.lk-mos{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:3px;position:absolute;inset:0}.lk-mos img{width:100%;height:100%;min-height:0;object-fit:cover}.lk-img.mos{aspect-ratio:1!important}</style>`);
// a look with no picture yet shows its pieces
new MutationObserver(() => document.querySelectorAll(".lk-wait").forEach(s => {
  const f = s.parentElement && s.parentElement.querySelectorAll(".lk-pcs img"); if (!f || !f.length) return;
  s.classList.remove("lk-wait"); s.classList.add("mos"); s.onclick = null;
  s.innerHTML = `<div class="lk-mos">${[...f].slice(0, 4).map(i => `<img src="${i.src}" alt="">`).join("")}</div>`;
})).observe(document.body, { childList: true, subtree: true });
const gapCard = p => `<div class="look glass"><h3>${esc(p.name)}</h3><p class="small mute">${(p.colors || []).map(x => `<i class="swatch" style="background:${hex(x)}"></i>`).join("")} ${p.unlocks ? `Adds ${p.unlocks.toLocaleString()} outfits` : "Fills a gap in your closet"}</p><div class="linkrow">${p.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</div></div>`;
const gapNone = `<div class="empty"><h3>You have all the basics</h3></div>`;
shopForYou = async function () {
  const d = await api("/api/foryou"), el = $("#shBody"); if (!el) return;
  el.innerHTML = `<p class="sh-line">Basics missing from your closet. Tap a store to search it.</p>${d.picks.map(gapCard).join("") || gapNone}`;
};
VIEWS.discover = async () => { const d = await api("/api/discover"); view.innerHTML = `<div style="margin:10px 0"><div class="eyebrow">Beyond your closet</div><h1>Discover</h1><p class="mute">Pieces that would add the most new outfits.</p></div>${d.complete.map(gapCard).join("") || gapNone}`; };
VIEWS.find = async () => {
  view.innerHTML = `<div style="margin:10px 0"><div class="eyebrow">Find it online</div><h1>Search the stores</h1></div><div class="glass" style="padding:14px;border-radius:18px"><input id="fq" class="txt" placeholder="e.g. camel wool coat"><button class="btn wide" id="fgo" style="margin-top:10px">Search</button></div><div id="fout" class="linkrow" style="margin-top:14px"></div>`;
  $("#fgo").onclick = async () => { const q = $("#fq").value.trim(); if (!q) return; const d = await api("/api/find", { body: { q } }); $("#fout").innerHTML = d.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(""); };
};
VIEWS.tryon = async () => { view.innerHTML = `<div class="empty"><h3>Try it on me</h3><p>Coming soon.</p><a class="btn" href="#looks">See looks</a></div>`; };
const _pfOnline = VIEWS.profile;
VIEWS.profile = async () => {
  await _pfOnline();
  view.insertAdjacentHTML("beforeend", `<h2>Keep your closet safe</h2><p class="mute small">Your closet and photos are saved only on this phone. Save a backup now and then.</p><div class="grid2"><button class="btn" id="bkSave">Save a backup</button><button class="btn ghost" id="bkLoad">Restore</button></div><input type="file" id="bkFile" accept=".json,application/json" hidden>`);
  $("#bkSave").onclick = () => ON.backup().catch(e => toast(e.message));
  $("#bkLoad").onclick = () => $("#bkFile").click();
  $("#bkFile").onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    sheet(`<h3>Restore this backup?</h3><p class="mute">It replaces the closet on this phone now.</p><button class="btn wide" id="bkYes">Replace it</button>`);
    $("#bkYes").onclick = () => ON.restore(f).then(() => { location.hash = "home"; location.reload(); }).catch(x => { closeSheet(); toast(x.message); });
  };
};
