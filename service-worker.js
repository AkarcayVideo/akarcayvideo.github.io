self.addEventListener('install', e => {
	e.waitUntil(
	  caches.open("defaultCache").then(cache => {
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
			`/fotograflar/1.jpg`,
			`/fotograflar/2.jpg`,
			`/fotograflar/3.jpg`,
			`/fotograflar/4.jpg`
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