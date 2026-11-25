// (c) 2026 Mathew. All rights reserved.
// "Own it?" as one clear 3-step flow on the page: 1 Snap, 2 What is it?, 3 Result.
"use strict";
document.head.insertAdjacentHTML("beforeend", `<style>
.oi-steps{display:flex;gap:6px;margin:4px 0 14px}
.oi-steps div{flex:1;text-align:center;font-size:12px;color:var(--mute);padding-top:7px;border-top:3px solid rgba(255,255,255,.1)}
.oi-steps div.on{color:var(--ink);border-color:var(--gold)}
.oi-steps div.done{color:var(--gold2);border-color:var(--gold3)}
.oi-ex{color:var(--mute);margin:0 0 16px;font-size:14px}
.oi-big{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.oi-big .btn{height:96px;flex-direction:column;font-size:16px;display:flex;align-items:center;justify-content:center;gap:4px}
.oi-nav{display:flex;justify-content:space-between;align-items:center;margin:0 0 10px}
.oi-link{background:none;border:0;color:var(--gold);font:500 14px var(--sans);padding:6px 0}
.oi-photo{width:100%;height:200px;object-fit:contain;border-radius:14px;background:#f3eee8;display:block}
.oi-cats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}
.oi-cats button{border:1px solid var(--line);background:var(--glass);color:var(--ink);border-radius:12px;padding:14px 4px;font:500 14px var(--sans)}
.oi-load{text-align:center;padding:30px 0}
.oi-verdict{text-align:center;margin:6px 0 12px}
.oi-word{font-family:var(--serif);font-size:44px;font-weight:600;letter-spacing:.04em;line-height:1}
.oi-word.buy{color:#a7e3c5}.oi-word.skip{color:var(--blush)}.oi-word.own{color:var(--gold)}
.oi-vs{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:start}
.oi-vs figure{margin:0}
.oi-vs img{width:100%;aspect-ratio:3/4;object-fit:contain;border-radius:12px;background:#f3eee8;display:block}
.oi-vs figcaption{font-size:12px;color:var(--mute);margin-top:4px}
.oi-m{display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)}
.oi-m img{width:54px;height:54px;object-fit:contain;border-radius:8px;background:#f3eee8;flex:none}
.oi-m b{display:block;font-size:14px}.oi-m span{font-size:12px;color:var(--mute)}
.oi-m em{margin-left:auto;font-style:normal;color:var(--gold);font-weight:600}
.oi-nums{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}
.oi-nums div{border:1px solid var(--line);border-radius:12px;padding:10px;text-align:center}
.oi-nums b{display:block;font-size:22px}.oi-nums span{font-size:12px;color:var(--mute)}
.oi-dec{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.oi-hist{margin-top:26px}
.oi-h{display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)}
.oi-h img{width:44px;height:44px;object-fit:cover;border-radius:8px;flex:none}
.oi-h span{flex:1;font-size:14px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.oi-h em{font-style:normal;font-size:12px;color:var(--mute);text-transform:uppercase}
</style>`);

const OI = { step: 1, photo: null, price: "", cat: null, r: null, err: null };
const oiReset = () => Object.assign(OI, { step: 1, photo: null, price: "", cat: null, r: null, err: null });
const OI_WORD = { buy: "BUY", skip: "SKIP", own: "ALREADY OWN" };

function oiFrame(body) {
  const st = ["Snap", "What is it?", "Result"].map((t, i) => `<div class="${i + 1 === OI.step ? "on" : i + 1 < OI.step ? "done" : ""}">${i + 1} ${t}</div>`).join("");
  view.innerHTML = `<div style="margin:10px 0 6px"><div class="eyebrow">Own it?</div><h1>Do I already own this?</h1></div>
    <p class="oi-ex">Snap something in a store. We check if you already own something like it.</p>
    <div class="oi-steps">${st}</div>${body}`;
  const back = $("#oiBack"), over = $("#oiOver");
  if (back) back.onclick = () => { OI.step = Math.max(1, OI.step - 1); OI.r = null; OI.err = null; oiRender(); };
  if (over) over.onclick = () => { oiReset(); oiRender(); };
}
const oiNav = () => `<div class="oi-nav"><button class="oi-link" id="oiBack">‹ Back</button><button class="oi-link" id="oiOver">Start over</button></div>`;

async function oiRender() {
  window.scrollTo(0, 0);
  if (OI.step === 1) {
    oiFrame(`<div class="oi-big"><button class="btn" id="oiCam">${AI("camera")}Camera</button><button class="btn ghost" id="oiLib">Photos</button></div>
      <div class="field"><label>Price tag (optional)</label><input class="txt" id="oiPrice" inputmode="decimal" placeholder="e.g. 89" value="${esc(OI.price)}"></div>
      <div id="oiHist"></div>`);
    const go = cam => async () => { OI.price = $("#oiPrice").value; const d = await pickPhoto(cam); if (d) { OI.photo = d; OI.step = 2; oiRender(); } };
    $("#oiCam").onclick = go(true); $("#oiLib").onclick = go(false);
    const hist = (await api("/api/checks").catch(() => ({ checks: [] }))).checks;
    const h = $("#oiHist");
    if (h && hist.length) h.innerHTML = `<div class="oi-hist"><div class="eyebrow">Recent checks</div>${hist.slice(0, 6).map(c => `<div class="oi-h"><img src="${thumb(c.photo)}" alt=""><span>${esc(c.data?.item?.name || "Piece")}</span><em>${c.verdict === "pending" ? "undecided" : esc(c.verdict)}</em></div>`).join("")}</div>`;
    return;
  }
  if (OI.step === 2) {
    oiFrame(`${oiNav()}<img class="oi-photo" src="${OI.photo}" alt=""><h2 style="margin:12px 0 0">What is it?</h2>
      <div class="oi-cats">${Object.entries(CAT_LABEL).map(([k, v]) => `<button data-c="${k}">${v}</button>`).join("")}</div>`);
    view.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { OI.cat = b.dataset.c; OI.step = 3; OI.r = null; oiRender(); });
    return;
  }
  // step 3
  if (OI.err) { oiFrame(`${oiNav()}<div class="oi-load"><h3>Hmm</h3><p class="mute">${esc(OI.err)}</p><button class="btn" id="oiRetry">Try again</button></div>`); $("#oiRetry").onclick = () => { OI.err = null; oiRender(); }; return; }
  if (!OI.r) {
    oiFrame(`${oiNav()}<div class="oi-load"><div class="loader"><div class="shimmer-orb"></div></div><h3>Looking through your closet…</h3><p class="mute small">one moment</p></div>`);
    const mine = OI;
    try { const r = await api("/api/check", { body: { image: OI.photo, price: OI.price, category: OI.cat } }); if (mine.step !== 3 || OI.photo !== mine.photo) return; OI.r = r; setTimeout(() => { reward(r.reward); questDone(r.quest); }, 900); }
    catch (e) { OI.err = e.message; }
    if (location.hash.slice(1).split("/")[0] === "check" && OI.step === 3) oiRender();
    return;
  }
  const r = OI.r, top = r.matches[0];
  oiFrame(`${oiNav()}<div class="oi-verdict"><div class="oi-word ${r.verdict}">${OI_WORD[r.verdict] || "BUY"}</div>${r.headline ? `<h3 style="margin:10px 0 0">${esc(r.headline)}</h3>` : ""}</div>
    <div class="oi-vs"><figure><img src="${media(r.photo)}" alt=""><figcaption>In the store${r.price ? " · " + money(r.price) : ""}</figcaption></figure>
    <figure>${top ? `<img src="${media(top.item.photo || top.item.img)}" alt=""><figcaption>Yours · ${top.similarity}% alike</figcaption>` : `<div class="oi-load mute small" style="border:1px dashed var(--line);border-radius:12px;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;padding:10px">Nothing like it in your closet</div>`}</figure></div>
    <div class="oi-nums"><div><b>+${r.unlocks}</b><span>outfits it unlocks</span></div><div><b>${r.similar_count}</b><span>similar you own</span></div></div>
    ${r.matches.map(m => `<div class="oi-m"><img src="${thumb(m.item.photo || m.item.img)}" alt=""><div><b>${esc(m.item.name)}</b><span>${esc(m.why)}</span></div><em>${m.similarity}%</em></div>`).join("")}
    <div class="oi-dec" style="margin-top:16px"><button class="btn ghost" data-v="buy">Buy</button><button class="btn blush" data-v="skip">Skip</button><button class="btn" data-v="own">I own it</button></div>`);
  view.querySelectorAll("[data-v]").forEach(b => b.onclick = async ev => {
    view.querySelectorAll("[data-v]").forEach(x => x.disabled = true);
    try {
      const d = await api(`/api/check/${r.id}/decide`, { body: { verdict: b.dataset.v } });
      if (d.reward) { reward(d.reward, ev); await coinsToWallet(ev, d.money_saved); toast(`Money saved: ${money(d.money_saved)}`); } else toast("Saved");
      oiReset(); oiRender();
    } catch (e) { toast(e.message); view.querySelectorAll("[data-v]").forEach(x => x.disabled = false); }
  });
}

VIEWS.check = async () => { if (OI.step === 3 && !OI.r && !OI.err) OI.step = 2; await oiRender(); };
