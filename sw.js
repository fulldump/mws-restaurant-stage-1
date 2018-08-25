
self.addEventListener('install', function(e) {
	console.log('service-worker-install!!!');
});

self.addEventListener('activate', function(e) {
	console.log('service-worker-activate!!!');
});

self.addEventListener('fetch', function(e) {
	console.log('request:', e.request.url);

	e.respondWith(fetch(e.request));
});

self.addEventListener('message', function(e) {
	console.log('message', m);
});
