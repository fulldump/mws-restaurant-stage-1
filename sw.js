
'strict';

const assetsCache = 'assets-cache';

self.addEventListener('install', function(e) {
	console.log('service-worker-install!!!');

	e.waitUntil(caches.open(assetsCache));
});

self.addEventListener('activate', function(e) {
	console.log('service-worker-activate!!!');
});

self.addEventListener('fetch', function(e) {

	var url = e.request.url;

	e.respondWith(
		caches.open(assetsCache).then(function(cache) {
			return cache.match(e.request).then(function(response){

				// If response is cached, it is returned :D
				if (response) {
					return response;
				}

				// If not cached, request is fetched, cached and returned, so
				// that next time could be available offline.
				return fetch(e.request).then(function(response) {
					cache.put(e.request, response.clone());
					return response;
				});

			}).catch(function(a) {

				// Something went wrong...

			});
		}).catch(function() {

			// Something went wrong...

		}),
	);

});

self.addEventListener('message', function(e) {
	console.log('message', m);
});
