self.addEventListener('install', e => {
	e.waitUntil(
	  caches.open("defaultCache").then(cache => {
		return cache.addAll([
			`/`,
			`/index.html`,
			`/bundle.css`,
			`/bundle.js`
		]).then(() => self.skipWaiting());
	  })
	);
  });
  
  self.addEventListener('activate', event => {
	event.waitUntil(self.clients.claim());
  });
  
  self.addEventListener('fetch', event => {
	event.respondWith(
	  caches.open("defaultCache")
		.then(cache => cache.match(event.request, {ignoreSearch: true}))
		.then(response => {
		return response || fetch(event.request);
	  })
	);
  });