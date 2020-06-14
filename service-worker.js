self.addEventListener('install', e => {
	e.waitUntil(
	  caches.open("defaultCache").then(cache => {
		return cache.addAll([
		  `/`,
		  `/index.html`
		]).then(() => self.skipWaiting());
	  })
	);
  });

self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys().then(async keys => {
			// delete old caches
			for (const key of keys) {
				if (key !== ASSETS) await caches.delete(key);
			}

			self.clients.claim();
		})
	);
});

self.addEventListener('fetch', event => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);

	if (!url.protocol.startsWith('http')) return;

	event.respondWith(
		caches.open(cacheName)
		  .then(cache => cache.match(event.request, {ignoreSearch: true}))
		  .then(response => (response || fetch(event.request)))
	);
});