/* global self */

const offlinePage = `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Нет подключения · Flow Planning</title>
<style>
  body { background: #f9fafc; color: #172337; font: 16px system-ui, sans-serif; margin: 0; padding: 24px; }
  main { margin: 12vh auto; max-width: 28rem; }
  h1 { font-size: 1.5rem; }
  a { color: #194eaa; }
</style>
<main>
  <h1>Нет подключения к интернету</h1>
  <p>Подключитесь к сети, чтобы открыть Flow Planning.</p>
  <a href="">Попробовать снова</a>
</main>
</html>`;

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate" || new URL(event.request.url).origin !== self.location.origin) return;

  // Keep authenticated content and deployed assets out of the service worker cache.
  event.respondWith(fetch(event.request).catch(() => new Response(offlinePage, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  })));
});
