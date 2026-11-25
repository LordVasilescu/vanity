// (c) 2026 Mathew. All rights reserved. Keeps Vanity working with no signal. Pages and code: newest first; pictures: from the phone.
const CACHE = "vanity-online-1", SHELL = ["./", "seed.json", "manifest.webmanifest", "static/style.css?v=6b070c7e", "static/wow.css?v=6b070c7e", "static/local.js?v=6b070c7e", "static/app.js?v=6b070c7e", "static/closet.js?v=6b070c7e", "static/ownit.js?v=6b070c7e", "static/looks.js?v=6b070c7e", "static/bijou.js?v=6b070c7e", "static/profiles.js?v=6b070c7e", "static/ui.js?v=6b070c7e", "static/boot.js?v=6b070c7e"];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); });
self.addEventListener("activate", e => e.waitUntil((async () => { for (const k of await caches.keys()) if (k.startsWith("vanity-") && k !== CACHE) await caches.delete(k); await self.clients.claim(); })()));
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE), pic = /\/(media|art|icons)\//.test(u.pathname);
    if (pic) { const h = await c.match(r); if (h) return h; }
    try { const x = await fetch(r); if (x.status === 200) c.put(r, x.clone()).catch(() => { }); return x; }
    catch (err) { return (await c.match(r, { ignoreSearch: true })) || Response.error(); }
  })());
});
