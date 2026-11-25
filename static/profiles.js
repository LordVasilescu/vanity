// (c) 2026 Mathew. All rights reserved.
// Profiles: each person on her own phone gets her own model photo, closet, looks, wallet and Bijou chat.
// First launch on a new phone: name -> model photo (checked) -> quick style quiz -> sample or empty closet.
document.head.insertAdjacentHTML("beforeend", `<style>
.ob{min-height:calc(100vh - 40px);display:flex;flex-direction:column;padding:8px 0 30px}
.ob .steps{display:flex;gap:6px;margin:6px 0 18px}.ob .steps i{flex:1;height:4px;border-radius:4px;background:rgba(255,255,255,.12)}.ob .steps i.on{background:var(--gold)}
.ob h1{margin:0 0 6px}.ob p.lead{margin:0 0 16px;color:var(--mute,#a59a94);line-height:1.5}
.ob .tips{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:4px 0 16px}
.ob .tips div{display:flex;gap:8px;align-items:center;font-size:13px;line-height:1.3;padding:9px 10px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
.ob .tips svg{width:22px;height:22px;flex:none;stroke:var(--gold);fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.ob .model{display:block;width:62%;max-width:260px;margin:4px auto 14px;border-radius:16px;aspect-ratio:2/3;object-fit:cover;border:1px solid rgba(232,200,140,.4)}
.ob .why{padding:12px 14px;border-radius:14px;background:rgba(242,184,198,.12);border:1px solid rgba(242,184,198,.35);margin-bottom:12px;line-height:1.45}
.ob .qs h3{margin:16px 0 8px;font-size:15px}.ob .qs .chips{flex-wrap:wrap;overflow:visible}
.ob .pick{display:block;width:100%;text-align:left;padding:16px;border-radius:16px;margin-bottom:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:inherit;font:inherit}
.ob .pick b{display:block;font-size:17px;margin-bottom:4px}.ob .pick.on{border-color:var(--gold);box-shadow:0 0 0 2px var(--gold)}
.ob .bottom{margin-top:auto;padding-top:18px;display:flex;flex-direction:column;gap:10px}
.ob .who{display:flex;align-items:center;gap:12px;width:100%;padding:12px;border-radius:16px;margin-bottom:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:inherit;font:inherit;text-align:left}
.ob .who img,.pf .who img{width:46px;height:46px;border-radius:50%;object-fit:cover;object-position:top}
.pf .who{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;margin-bottom:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);width:100%;color:inherit;font:inherit;text-align:left}
.pf .who.on{border-color:var(--gold)}
.waitbox{padding:14px;margin-top:10px}.waitbox .msg{font-size:14px;line-height:1.45;margin-bottom:8px}
body.onboarding #nav,body.onboarding #top .row,body.onboarding #queue{display:none}
</style>`);

const TIP_ICON = {
  body: '<path d="M12 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM9 9h6l-1 6h-4zM10 15l-1 6M14 15l1 6"/>',
  stand: '<path d="M12 3v18M8 21h8M9 8h6"/>',
  arms: '<path d="M12 4a2 2 0 1 1 0 .1M8 9h8M8 9v7M16 9v7M12 9v12"/>',
  wall: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M4 15h16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  flash: '<path d="M13 2 5 14h6l-1 8 8-12h-6z"/><path d="M3 3l18 18"/>',
  shirt: '<path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3c0 2-2 3-4 3s-4-1-4-3z"/>',
  hair: '<circle cx="12" cy="8" r="4"/><path d="M6 21c0-4 3-6 6-6s6 2 6 6"/>',
  face: '<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M9 15c1.5 1 4.5 1 6 0"/>',
  one: '<circle cx="12" cy="7" r="3"/><path d="M7 21v-5a5 5 0 0 1 10 0v5"/>',
  cam: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l2-3h4l2 3"/>',
  friend: '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 21v-3a5 5 0 0 1 10 0v3M14 21v-2a3.5 3.5 0 0 1 7 0v2"/>',
};
const TIPS = [["body", "Whole body, head to toe"], ["stand", "Stand straight, face the camera"], ["arms", "Arms down by your sides"],
  ["wall", "Plain light wall behind you"], ["sun", "Daylight from a window"], ["flash", "No flash"], ["shirt", "Fitted, simple clothes"],
  ["hair", "Hair off your shoulders"], ["face", "Nothing on your face"], ["one", "Just you in the photo"],
  ["cam", "Phone held straight, at waist height"], ["friend", "Ask someone to take it"]];
const tipsHTML = () => `<div class="tips">${TIPS.map(([i, t]) => `<div><svg viewBox="0 0 24 24">${TIP_ICON[i]}</svg><span>${t}</span></div>`).join("")}</div>`;
const QUIZ = {
  colors: ["black", "white", "cream", "beige", "camel", "brown", "grey", "navy", "denim", "red", "pink", "blush", "green", "olive", "blue", "lavender", "yellow", "gold"],
  vibes: ["classic", "casual", "chic", "minimal", "romantic", "boho", "edgy", "sporty", "glam", "work"],
  sizes: ["XS", "S", "M", "L", "XL", "XXL", "Petite", "Tall", "Plus"],
};

// Check her photo with the brain. Calls done(rel) once a photo is accepted (or she keeps it anyway).
async function modelPhotoUpload(dataUrl, box, done) {
  box.innerHTML = `<div class="loader"><div class="shimmer-orb"></div><h3>Checking your photo</h3><div class="mute small">Making sure your whole body shows. About 20 seconds.</div></div>`;
  let r;
  try { r = await api("/api/me", { body: { image: dataUrl } }); }
  catch (e) { box.innerHTML = `<div class="why">${esc(e.message)}</div><button class="btn wide" data-retake>Try another photo</button>`; box.querySelector("[data-retake]").onclick = () => done(null); return; }
  if (r.ok) { done(r.selfie); return; }
  box.innerHTML = `<img class="model" src="${media(r.photo)}" alt=""><div class="why"><b>Almost!</b> ${esc(r.reason)}</div>
    <button class="btn wide" data-retake>${AI("camera")} Retake the photo</button>
    <button class="btn ghost wide" data-keep style="margin-top:10px">Use this one anyway</button>`;
  box.querySelector("[data-retake]").onclick = () => done(null);
  box.querySelector("[data-keep]").onclick = async () => { const k = await api("/api/me/keep", { body: { photo: r.photo } }); done(k.selfie); };
}

function onboard(p) {
  document.body.classList.add("onboarding");
  const st = { step: p && p.need && p.profiles.length ? 0 : (p && p.profiles.find(x => x.id === p.active && !x.done) ? 3 : 1), quiz: { colors: [], vibes: [], sizes: [] }, closet: "sample", model: null };
  const bar = n => `<div class="steps">${[1, 2, 3].map(i => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</div>`;
  const pick = () => new Promise(res => photoChoice("Your model photo", d => { closeSheet(); res(d); }));
  const draw = async () => {
    window.scrollTo(0, 0);
    if (st.step === 0) {
      view.innerHTML = `<div class="ob"><div class="eyebrow">Welcome to Vanity</div><h1>Who's using Vanity?</h1><p class="lead">Each person has her own closet.</p>
        ${p.profiles.map(x => `<button class="who" data-id="${x.id}"><img src="${thumb(x.model)}" alt=""><div><b>${esc(x.name || "Profile")}</b><div class="small mute">Tap to open</div></div></button>`).join("")}
        <div class="bottom"><button class="btn wide" id="obNew">Create my profile</button></div></div>`;
      view.querySelectorAll("[data-id]").forEach(b => b.onclick = async () => { await api("/api/profiles/switch", { body: { id: b.dataset.id } }); location.reload(); });
      $("#obNew").onclick = () => { st.step = 1; draw(); };
    } else if (st.step === 1) {
      view.innerHTML = `<div class="ob">${bar(1)}<div class="eyebrow">Step 1 of 3</div><h1>What's your name?</h1><p class="lead">Your closet is saved only on this phone.</p>
        <input class="txt" id="obName" autocomplete="given-name" placeholder="Your first name" maxlength="30">
        <div class="bottom"><button class="btn wide" id="obNext">Next</button></div></div>`;
      $("#obName").focus();
      $("#obNext").onclick = async ev => {
        const name = $("#obName").value.trim(); if (!name) { toast("Type your name first"); return; }
        ev.target.disabled = true;
        try { await api("/api/profiles", { body: { name } }); st.name = name; st.step = 3; draw(); } catch (e) { toast(e.message); ev.target.disabled = false; }
      };
    } else if (st.step === 2) {
      view.innerHTML = `<div class="ob">${bar(0)}<div class="eyebrow">Step 2 of 4</div><h1>Take your model photo</h1>
        <p class="lead">Every outfit will be shown on you, using this one photo. A good photo gives the best results.</p>
        <div id="obBox">${st.model ? `<img class="model" src="${media(st.model)}" alt=""><div style="text-align:center;margin-bottom:6px"><div class="eyebrow">Your model</div><div class="small mute">Looks great. This is how you'll see every outfit.</div></div>` : tipsHTML()}</div>
        <div class="bottom" id="obBtns">${st.model ? `<button class="btn wide" id="obNext">Next</button><button class="btn ghost wide" id="obAgain">Take a different photo</button>`
          : `<button class="btn wide" id="obCam">${AI("camera")} Take or choose a photo</button><button class="btn ghost wide" id="obSkip">Skip for now (use the sample model)</button>`}</div></div>`;
      const go = async () => {
        const d = await pick(); if (!d) return;
        $("#obBtns").classList.add("hidden");
        modelPhotoUpload(d, $("#obBox"), rel => { if (rel) st.model = rel; $("#obBtns").classList.remove("hidden"); if (rel) draw(); else go(); });
      };
      if (st.model) { $("#obNext").onclick = () => { st.step = 3; draw(); }; $("#obAgain").onclick = go; }
      else { $("#obCam").onclick = go; $("#obSkip").onclick = () => { st.step = 3; draw(); }; }
    } else if (st.step === 3) {
      const row = k => `<div class="chips" data-k="${k}">${QUIZ[k].map(v => `<button class="chip ${st.quiz[k].includes(v) ? "on" : ""}" data-v="${v}">${k === "colors" ? `<i class="swatch" style="background:${hex(v)}"></i>` : ""}${v[0].toUpperCase() + v.slice(1)}</button>`).join("")}</div>`;
      view.innerHTML = `<div class="ob">${bar(2)}<div class="eyebrow">Step 2 of 3</div><h1>Your style</h1><p class="lead">Tap all that fit.</p>
        <div class="qs"><h3>Colours you love</h3>${row("colors")}<h3>Your vibe</h3>${row("vibes")}<h3>Your sizes</h3>${row("sizes")}</div>
        <div class="bottom"><button class="btn wide" id="obNext">Next</button></div></div>`;
      view.querySelectorAll(".chips[data-k]").forEach(r => r.querySelectorAll(".chip").forEach(b => b.onclick = () => {
        const a = st.quiz[r.dataset.k], v = b.dataset.v; a.includes(v) ? a.splice(a.indexOf(v), 1) : a.push(v); b.classList.toggle("on");
      }));
      $("#obNext").onclick = () => { st.step = 4; draw(); };
      
    } else {
      view.innerHTML = `<div class="ob">${bar(3)}<div class="eyebrow">Step 3 of 3</div><h1>Your closet</h1><p class="lead">You can add your own pieces any time with the camera.</p>
        <button class="pick ${st.closet === "sample" ? "on" : ""}" data-c="sample"><b>Start with a sample closet</b><span class="small mute">60 pieces to play with right away. Remove any you like.</span></button>
        <button class="pick ${st.closet === "empty" ? "on" : ""}" data-c="empty"><b>Start empty</b><span class="small mute">Add your own clothes, one photo at a time.</span></button>
        <div class="bottom"><button class="btn wide" id="obDone">Open my closet</button><button class="btn ghost wide" id="obBack">Back</button></div></div>`;
      view.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { st.closet = b.dataset.c; draw(); });
      $("#obBack").onclick = () => { st.step = 3; draw(); };
      $("#obDone").onclick = async ev => {
        ev.target.disabled = true; ev.target.textContent = "Setting up...";
        try { await api("/api/profiles/setup", { body: { quiz: st.quiz, closet: st.closet } }); }
        catch (e) { toast(e.message); ev.target.disabled = false; ev.target.textContent = "Open my closet"; return; }
        document.body.classList.remove("onboarding"); location.hash = "home"; await refreshState().catch(() => { }); route();
      };
    }
  };
  draw();
}

// Profile page: who is using this phone, switch, add a profile, change the model photo.
const _profileView = VIEWS.profile;
VIEWS.profile = async () => {
  await _profileView();
  const p = await api("/api/profiles");
  const me = p.profiles.find(x => x.id === p.active) || {};
  view.insertAdjacentHTML("afterbegin", `<section class="pf" style="margin:10px 0 6px"><div class="eyebrow">Profile</div>
    <div class="row" style="gap:12px;margin:8px 0 12px"><img src="${thumb(me.model)}" style="width:72px;height:96px;border-radius:12px;object-fit:cover;object-position:top" alt="">
      <div><h2 style="margin:0">${esc(me.name || "You")}</h2><div class="small mute">${me.own ? "Your model is your own photo" : "Using the sample model"}</div>
      <button class="chip" id="pfPhoto" style="margin-top:8px">${me.own ? "Change my model photo" : "Use my photo"}</button></div></div>
    ${p.profiles.length > 1 ? `<h3 style="margin:14px 0 8px">Switch profile</h3>${p.profiles.map(x => `<button class="who ${x.id === p.active ? "on" : ""}" data-id="${x.id}"><img src="${thumb(x.model)}" alt=""><div><b>${esc(x.name)}</b><div class="small mute">${x.id === p.active ? "Using now" : "Tap to switch"}</div></div></button>`).join("")}` : ""}
    <button class="btn ghost wide" id="pfAdd" style="margin-top:6px">Add a profile</button></section>`);
  view.querySelectorAll(".pf [data-id]").forEach(b => b.onclick = async () => { if (b.dataset.id === p.active) return; await api("/api/profiles/switch", { body: { id: b.dataset.id } }); location.hash = "home"; location.reload(); });
  $("#pfAdd").onclick = () => onboard({ need: false, profiles: [] });
  $("#pfPhoto").onclick = () => myPhotoSheet(() => route());
};

// "Use my photo" anywhere: a 1-line tip, the full checklist, then the brain checks it.
function myPhotoSheet(after) {
  const el = sheet(`<h3>Use my photo</h3><p class="small" style="margin:4px 0 10px"><b>Full body, head to toe. Stand straight, arms down, plain wall, good light.</b></p>
    <div class="ob" style="min-height:0;padding:0"><div id="mpBox">${tipsHTML()}</div></div>
    <div class="grid2" id="mpBtns"><button class="btn" id="mpCam">${AI("camera")} Camera</button><button class="btn ghost" id="mpLib">Photos</button></div>`);
  const go = async cam => {
    const d = await pickPhoto(cam); if (!d) return;
    $("#mpBtns").classList.add("hidden");
    modelPhotoUpload(d, $("#mpBox"), rel => {
      if (!rel) { $("#mpBox").innerHTML = tipsHTML(); $("#mpBtns").classList.remove("hidden"); return; }
      $("#mpBox").innerHTML = `<img class="model" src="${media(rel)}" alt=""><div style="text-align:center"><div class="eyebrow">Your model</div><div class="small mute">Every try-on now uses this photo.</div></div>
        <button class="btn wide" style="margin-top:12px" id="mpOk">Done</button>`;
      $("#mpOk").onclick = () => { closeSheet(); toast("Your model is set"); after && after(rel); };
    });
  };
  $("#mpCam").onclick = () => go(true); $("#mpLib").onclick = () => go(false);
  return el;
}

// Try it on me: "Use my photo" goes through the same guidance and check.
const _tryView = VIEWS.tryon;
VIEWS.tryon = async a => {
  await _tryView(a);
  view.querySelectorAll("#meAdd").forEach(b => b.onclick = () => myPhotoSheet(() => route()));
};

// Clear progress while a picture renders (about 1-2 minutes), polite when others are ahead in line.
renderJob = async function (promise, target, done) {
  let job;
  try { job = await promise; } catch (e) { toast(e.message); return; }
  const say = j => j.status === "queued"
    ? (j.ahead ? `Someone else's look is being made first. You're next in ${j.ahead === 1 ? "line" : `line after ${j.ahead}`}, hang tight.` : "Starting the studio...")
    : (j.note ? `${j.note}: making sure every piece matches. Almost there.` : "Dressing your model. This takes about 1 to 2 minutes, you can keep browsing.");
  if (target) target.innerHTML = `<div class="glass waitbox"><div class="msg">${esc(say({ status: "queued", ahead: 0 }))}</div><div class="bar"><i style="width:2%"></i></div><div class="row between small mute" style="margin-top:6px"><span>${esc(job.title)}</span><span class="pc"></span></div></div>`;
  let fails = 0;
  const poll = async () => {
    let j;
    try { j = await api("/api/jobs/" + job.id); fails = 0; } catch (e) { if (++fails > 5) { if (target) target.innerHTML = `<div class="small" style="color:var(--blush)">Lost track of this picture. Try again in a minute.</div>`; return; } setTimeout(poll, 3000); return; }
    if (target) {
      const m = $(".msg", target); if (m) m.textContent = say(j);
      const pc = $(".pc", target); if (pc) pc.textContent = j.status === "running" ? j.progress + "%" : "";
      const b = $(".bar i", target); if (b) b.style.width = Math.max(2, j.progress) + "%";
    }
    if (j.status === "done") {
      if (target) target.innerHTML = `<img class="render runway" src="${media(j.result)}">${j.match ? `<div class="small mute" style="text-align:center;margin-top:6px">${esc(j.match)}</div>` : ""}`;
      spk(innerWidth / 2, innerHeight / 2, 30); refreshState(); done && done(j); return;
    }
    if (j.status === "error") { if (target) target.innerHTML = `<div class="small" style="color:var(--blush)">That picture didn't work (${esc(j.error)}). Please try again.</div>`; return; }
    setTimeout(poll, 1500);
  };
  poll();
};
