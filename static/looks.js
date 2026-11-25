// (c) 2026 Mathew. All rights reserved.
// Looks on the model: each best outfit shown on the fixed model, ready to "Wear this today".
"use strict";
document.head.insertAdjacentHTML("beforeend", `<style>
.lk-head{display:flex;align-items:baseline;justify-content:space-between;margin:10px 0 4px}
.lk-head h1{margin:0}.lk-n{font-family:var(--serif);font-size:22px;color:var(--gold)}
.lk{margin:14px 0;padding:10px;border-radius:22px}
.lk-img{position:relative;aspect-ratio:2/3;border-radius:16px;overflow:hidden;background:#15121a}
.lk-img>img{width:100%;height:100%;object-fit:cover;display:block}
.lk-wait>img{filter:blur(14px) brightness(.55) saturate(.7);transform:scale(1.1)}
.lk-ov{position:absolute;inset:auto 0 0 0;padding:18px 16px;text-align:center;background:linear-gradient(transparent,rgba(10,8,12,.85))}
.lk-ov b{font-family:var(--serif);font-size:20px;font-weight:600;display:block}
.lk-ov .small{margin:4px 0 10px}
.lk-match{position:absolute;top:10px;left:10px;font-size:11px;padding:4px 9px;border-radius:20px;background:rgba(10,8,12,.6);backdrop-filter:blur(6px)}
.lk-pcs{display:flex;gap:6px;margin:10px 0 2px;overflow-x:auto}
.lk-pcs img{width:52px;height:52px;flex:none;object-fit:cover;border-radius:10px;background:#fff1}
.lk-nm{display:flex;justify-content:space-between;align-items:baseline;margin:8px 2px}
.lk-nm h3{margin:0;font-size:20px}
.lk-act{display:grid;grid-template-columns:1fr auto;gap:8px}
.lk-act .btn{min-height:50px}.lk-wear{font-size:16px}
</style>`);

const lookImgSlot = (o, model) => o.img
  ? `<div class="lk-img"><img src="${media(o.img)}" alt="" loading="lazy">${o.match ? `<span class="lk-match">${esc(o.match)}</span>` : ""}</div>`
  : `<div class="lk-img lk-wait" ${o.job ? `data-job="${o.job}"` : ""}><img src="${media(model)}" alt="">
      <div class="lk-ov"><b>${o.error ? "The studio is resting" : o.job ? "Dressing the model…" : "See it on the model"}</b>
      <div class="small mute lk-st">${o.error ? "We will try again in a few minutes" : o.job ? "about 1-2 min" : "Tap to dress her, about 1-2 min"}</div>
      ${o.error || !o.job ? "" : `<div class="bar"><i style="width:2%"></i></div>`}</div></div>`;

// poll every pending image slot under root; swap in the picture when done
function pollLookSlots(root, model) {
  root.querySelectorAll(".lk-wait[data-job]").forEach(slot => {
    if (slot._polling) return; slot._polling = 1;
    const id = slot.dataset.job;
    const tick = async () => {
      if (!slot.isConnected) return;
      let j; try { j = await api("/api/jobs/" + id); } catch { return; }
      const st = $(".lk-st", slot), bar = $(".bar i", slot);
      if (j.status === "done") { slot.outerHTML = lookImgSlot({ img: j.result, match: j.match }, model); return; }
      if (j.status === "error") { slot.outerHTML = lookImgSlot({ error: j.error }, model); return; }
      if (st) st.textContent = j.status === "queued" ? (j.ahead ? `${j.ahead} ahead of you · busy studio, thanks for waiting` : "Up next · about 1-2 min") : `${j.note || "about 1-2 min"} · ${j.progress || 0}%`;
      if (bar) bar.style.width = Math.max(2, j.status === "queued" ? 2 : j.progress || 0) + "%";
      setTimeout(tick, 2000);
    };
    tick();
  });
}

const lookCard2 = (o, i, model) => `<div class="lk look glass" data-i="${i}" data-ids="${o.items.map(x => x.id).join(",")}">
  ${lookImgSlot(o, model)}
  <div class="lk-pcs">${o.items.map(it => `<img src="${thumb(it.photo || it.img)}" alt="${esc(it.name)}" title="${esc(it.name)}" loading="lazy">`).join("")}</div>
  <div class="lk-nm"><h3>${esc(lookName(o))}</h3><span class="small mute">No. ${i + 1}</span></div>
  <div class="lk-act"><button class="btn lk-wear" data-a="wear">Wear this today</button><button class="btn ghost" data-a="save">Save</button></div></div>`;

VIEWS.looks = async (must) => {
  const d = must ? await api("/api/outfits?n=12&must=" + must) : await api("/api/looks");
  const model = d.model || (await api("/api/me")).model;
  let best = d.best;
  if (must) best = await Promise.all(best.map(async (o, i) => i >= 4 ? o : ({ ...o, ...(await api("/api/looks/render", { body: { item_ids: o.items.map(i => i.id) } }).catch(() => ({}))) })));
  // the must= list queues on demand; only the first few, so the studio is not flooded
  view.innerHTML = `<div class="lk-head"><h1>Looks</h1><span class="lk-n">${Number(d.count.total).toLocaleString()} <span class="small mute" style="font-family:var(--sans)">outfits</span></span></div>
    <p class="mute small" style="margin:0 0 6px">${must ? `Built around one piece. <a href="#looks" style="color:var(--gold)">Show all</a>` : "Your best outfits. Pick one and wear it."}</p>
    ${d.count.needs_shoes ? `<div class="small" style="color:var(--blush)">Add shoes to complete every look</div>` : ""}
    <div id="lkList">${best.map((o, i) => lookCard2(o, i, model)).join("") || `<div class="empty"><h3>Your runway is empty</h3><p>Add a top, a bottom (or a dress) and shoes.</p><a class="btn" href="#vault">Open my closet</a></div>`}</div>
    ${d.saved.length ? `<h2>Saved looks</h2>${d.saved.map(o => savedCard(o)).join("")}` : ""}`;
  S.looks = best;
  view.querySelectorAll("#lkList .lk").forEach(el => {
    const o = best[+el.dataset.i], ids = o.items.map(i => i.id);
    el.querySelectorAll("[data-a]").forEach(b => b.onclick = async ev => {
      b.disabled = true;
      try {
        if (b.dataset.a === "wear") { const r = await api("/api/outfits/wear", { body: { item_ids: ids } }); b.textContent = "Worn today"; reward(r.reward, ev); buzz && buzz(12); }
        else { const r = await api("/api/outfits", { body: { item_ids: ids, title: lookName(o) } }); b.textContent = "Saved"; reward(r.reward, ev); questDone(r.quest); }
      } catch (e) { b.disabled = false; toast(e.message); }
    });
  });
  bindLookTaps(view, model);
  pollLookSlots(view, model);
};
// a slot with no job yet: tap to queue it
function bindLookTaps(root, model) {
  root.querySelectorAll(".lk-wait:not([data-job])").forEach(slot => slot.onclick = async () => {
    const el = slot.closest("[data-ids]") || slot.closest(".lk");
    const ids = (el.dataset.ids || "").split(",").map(Number).filter(Boolean);
    if (!ids.length) return;
    try { const r = await api("/api/looks/render", { body: { item_ids: ids } }); slot.outerHTML = lookImgSlot(r, model); pollLookSlots(root, model); } catch (e) { toast(e.message); }
  });
}
