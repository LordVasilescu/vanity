// (c) 2026 Mathew. All rights reserved.
// Boot: a new phone with no profile goes through profile creation first; everyone else lands in their own profile.
(async () => {
  try { const p = await api("/api/profiles"); S.profiles = p; const me = p.profiles.find(x => x.id === p.active);
    if (p.need || (me && !me.done)) { onboard(p); return; } } catch { }
  route();
  prefetchTabs();
  setInterval(prefetchTabs, 60000);
})();
