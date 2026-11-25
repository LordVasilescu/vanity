// (c) 2026 Mathew. All rights reserved.
// Bijou, organized: her face and one line on top, answers as tidy cards (outfit on the model + pieces + one line why),
// one row of tap chips and the input at the bottom.
"use strict";
document.head.insertAdjacentHTML("beforeend", `<style>
.bj2-top{display:flex;align-items:center;gap:12px;margin:8px 0 14px}
.bj2-top .bjav{width:52px;height:52px;flex:none}
.bj2-top .bjav img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.bj2-top .ln{flex:1;min-width:0}.bj2-top .ln b{font-family:var(--serif);font-size:22px;display:block;line-height:1.1}
.bj2-top .ln span{font-size:13px;color:var(--mute,#a59a94)}
.bj2-top .tg{display:flex;gap:6px}.bj2-top .chip{padding:7px 11px;font-size:12px}
.bj2-chat{display:flex;flex-direction:column;gap:12px;padding-bottom:240px}
.bj2-me{align-self:flex-end;max-width:80%;padding:10px 14px;border-radius:18px 18px 6px 18px;background:linear-gradient(135deg,#ffe7e4,var(--blush));color:#2a1513;line-height:1.4}
.bj2-ans{align-self:stretch}
.bj2-say{padding:12px 14px;border-radius:18px 18px 18px 6px;background:var(--glass2);border:1px solid var(--line);line-height:1.45}
.bj2-clamp{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.bj2-more{background:none;border:0;color:var(--gold);font-size:13px;padding:4px 0 0;cursor:pointer}
.bj2-fits{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;margin-top:10px;padding-bottom:4px;scrollbar-width:none}
.bj2-fits::-webkit-scrollbar{display:none}
.bj2-fit{flex:0 0 78%;scroll-snap-align:start;padding:8px;border-radius:18px}
.bj2-fits.one .bj2-fit{flex-basis:100%}
.bj2-fit .lk-img{aspect-ratio:3/4}
.bj2-fit h4{font-family:var(--serif);font-size:18px;margin:8px 2px 2px;font-weight:600}
.bj2-why{font-size:13px;color:var(--mute,#a59a94);margin:0 2px 8px;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
.bj2-fit .lk-pcs img{width:40px;height:40px}
.bj2-fit .grid2 .btn{min-height:44px}
.bj2-note{font-size:13px;margin-top:8px;padding:10px 12px;border-radius:14px;background:var(--glass);border:1px solid var(--line)}
.bj2-comp .chips{flex-wrap:nowrap}
</style>`);

VIEWS.bijou = async () => {
  const [msgs, me] = await Promise.all([api("/api/bijou").then(r => r.messages), api("/api/me").catch(() => ({}))]);
  const model = me.model;
  view.innerHTML = `<div class="bj2-top"><div class="bjav" id="bjAv"><img src="${ART("bijou_face")}" alt="Bijou"></div>
    <div class="ln"><b>Bijou</b><span>Tell me where you're going. I'll dress you from your closet.</span></div>
    <div class="tg"><button class="chip ${S.voice ? "on" : ""}" id="bjVoice">Voice ${S.voice ? "on" : "off"}</button><button class="chip" id="bjNew">New</button></div></div>
    <div class="bj2-chat" id="chat"></div>
    <div class="composer bj2-comp"><div class="chips" id="bjChips"></div><div class="row"><input class="txt" id="bjIn" placeholder="What do I wear to..."><button class="mic" id="bjMic">${IC.mic}</button></div></div>`;
  const chat = $("#chat");
  const DEF = ["Rooftop party tonight", "Date night", "Big work meeting", "Brunch with the girls", "Wedding guest"];
  msgs.forEach(m => m.role === "user" ? addMe(m.content.text) : addBj(m.content, true));
  const lastBj = [...msgs].reverse().find(m => m.role !== "user");
  setChips(lastBj && lastBj.content.chips && lastBj.content.chips.length ? lastBj.content.chips : DEF);
  if (!msgs.length) chat.innerHTML = `<div class="empty" style="padding:30px 10px"><p class="mute">Tap a plan below or ask me anything.</p></div>`;
  else setTimeout(() => chat.lastElementChild && chat.lastElementChild.scrollIntoView({ block: "end" }), 50);

  $("#bjVoice").onclick = () => { S.voice = !S.voice; try { localStorage.setItem("vanity_voice", S.voice ? "1" : ""); } catch { } if (!S.voice) speechSynthesis?.cancel(); $("#bjVoice").textContent = "Voice " + (S.voice ? "on" : "off"); $("#bjVoice").classList.toggle("on", S.voice); };
  $("#bjNew").onclick = async () => { await api("/api/bijou", { body: { reset: true } }); VIEWS.bijou(); };
  const send = async text => {
    if (!text.trim()) return;
    $(".empty", chat)?.remove();
    addMe(text); $("#bjIn").value = ""; $("#bjChips").innerHTML = "";
    const typing = document.createElement("div"); typing.className = "bj2-say"; typing.style.alignSelf = "flex-start";
    typing.innerHTML = `<span class="dots"><i></i><i></i><i></i></span>`; $("#bjAv").classList.add("talk"); chat.append(typing); typing.scrollIntoView({ behavior: "smooth" });
    try { const r = await api("/api/bijou", { body: { text } }); typing.remove(); addBj(r.reply); speak(r.reply.say); questDone(r.quest); }
    catch (e) { typing.remove(); addBj({ say: e.message, chips: [text] }); }
    $("#bjAv").classList.remove("talk");
  };
  S.bjSend = send;
  $("#bjIn").onkeydown = e => { if (e.key === "Enter") send(e.target.value); };
  setupMic($("#bjMic"), t => send(t));

  function setChips(list) { $("#bjChips").innerHTML = (list || []).map(x => `<button class="chip">${esc(x)}</button>`).join(""); $("#bjChips").querySelectorAll(".chip").forEach(b => b.onclick = () => send(b.textContent)); }
  function addMe(t) { const d = document.createElement("div"); d.className = "bj2-me"; d.textContent = t; chat.append(d); d.scrollIntoView({ behavior: "smooth" }); }
  function clampable(html) { return `<div class="bj2-clamp">${html}</div><button class="bj2-more hidden">more</button>`; }
  function addBj(c, old) {
    const fits = (c.outfits || []).filter(o => (o.item_ids || []).length);
    const d = document.createElement("div"); d.className = "bj2-ans" + (old ? "" : " runway");
    const notes = [c.makeup && ["Makeup", c.makeup], c.jewelry && ["Jewelry", c.jewelry]].filter(Boolean);
    d.innerHTML = `<div class="bj2-say">${clampable(esc(c.say))}</div>
      ${fits.length ? `<div class="bj2-fits ${fits.length === 1 ? "one" : ""}">${fits.map(o => `<div class="bj2-fit glass" data-ids="${o.item_ids.join(",")}">
        <div class="lk-img lk-wait bj2-slot"><img src="${media(model)}" alt=""><div class="lk-ov"><b>Dressing the model…</b><div class="small mute lk-st">one moment</div></div></div>
        <h4>${esc(o.title || "The look")}</h4><div class="bj2-why">${esc(o.why || "")}</div>
        <div class="lk-pcs">${(o.items || []).map(it => `<img src="${thumb(it.photo || it.img)}" alt="" title="${esc(it.name)}" loading="lazy">`).join("")}</div>
        <div class="grid2" style="margin-top:8px"><button class="btn" data-wear>Wear this</button><button class="btn ghost" data-try>Try on</button></div></div>`).join("")}</div>` : ""}
      ${notes.map(([k, v]) => `<div class="bj2-note"><span class="eyebrow">${k}</span>${clampable(esc(v))}</div>`).join("")}`;
    chat.append(d);
    d.querySelectorAll(".bj2-clamp").forEach(t => requestAnimationFrame(() => {
      const m = t.nextElementSibling;
      if (t.scrollHeight > t.clientHeight + 2) { m.classList.remove("hidden"); m.onclick = () => { const open = t.classList.toggle("bj2-clamp"); m.textContent = open ? "more" : "less"; }; }
    }));
    d.querySelectorAll(".bj2-fit").forEach(f => {
      const ids = f.dataset.ids.split(",").map(Number);
      $("[data-try]", f).onclick = () => { S.tryIds = ids; location.hash = "tryon"; };
      $("[data-wear]", f).onclick = async ev => { const b = ev.currentTarget; b.disabled = true; try { const r = await api("/api/outfits/wear", { body: { item_ids: ids } }); reward(r.reward, ev); b.textContent = "Worn today"; } catch (e) { b.disabled = false; toast(e.message); } };
      // new answers queue a picture; old ones only show a cached one (tap to dress)
      api("/api/looks/render", { body: { item_ids: ids, peek: !!old } }).then(r => {
        const slot = $(".bj2-slot", f); if (!slot) return;
        slot.outerHTML = lookImgSlot(r, model);
        bindLookTaps(f, model); pollLookSlots(f, model);
      }).catch(() => { });
    });
    if (!old) { setChips(c.chips); d.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }
};
