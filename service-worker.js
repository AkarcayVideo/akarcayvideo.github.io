
self.addEventListener('install', e => {
	e.waitUntil(
	  caches.open(cacheName).then(cache => {
		return cache.addAll([
			`/`,
			`/index.html`,
			`/dugun.html`,
			`/klipler.html`,
			`/nostalji.html`,
			`/fotograflar.html`,
			`/canli-yayin.html`,
			`/css/style.css`,
			`/js/ContentLoader.js`,
			`/img/banner.jpg`,
			`/img/facebook.png`,
			`/img/youtube.png`,
			`/img/favicon.png`,
		]).then(() => self.skipWaiting());
	  })
	);
  });
  
  self.addEventListener('activate', event => {
	event.waitUntil(self.clients.claim());
  });
  
  self.addEventListener('fetch', event => {
	event.respondWith(
	  caches.open(cacheName)
		.then(cache => cache.match(event.request, {ignoreSearch: true}))
		.then(response => {
		return response || fetch(event.request);
	  })
	);
  });