
/**
 * This service worker is intercepting and caching all requests. There are two
 * different caches:
 *  - Static assets like images, videos, fonts... are considered immutable, so
 *    if are cached will be served.
 *  - Data resources like JSON, HTML... are considered dynamic information that
 *    is updated frequently, so request is always sent and cached information is
 *    only used as a fallback.
 */

'strict';

const
	staticsCache = 'statics-cache', // Things that never changes (fonts, imgs)
	dataCache = 'data-cache', // Thigs that could change (html, json, etc)
	staticDestinations = ['image', 'font', 'video'];

self.addEventListener('install', function(e) {
	console.log('service-worker-install!!!');

	// TODO: initialize caches with static assets and an initial version of data
	e.waitUntil(caches.open(dataCache).then(cache => {
		cache.addAll([
			'/',
			'/js/main.js',
			'/restaurant.html',
			'/js/restaurant_info.js',
		]);
	}));
});

self.addEventListener('activate', function(e) {
	console.log('service-worker-activate!!!');
});

self.addEventListener('fetch', function(e) {

	if (staticDestinations.includes(e.request.destination)) {
		e.respondWith(fetchCachedPreferred(e.request));
		return;
	}

	let response = fetchNetworkPreferred(e.request);
	if (response) {
		e.respondWith(response);
	}

});

function fetchCachedPreferred(request) {
	return caches.match(request, {ignoreSearch: true}).then(function(cachedResponse){
		// If cachedResponse is cached, it is returned
		if (cachedResponse) {
			return cachedResponse;
		}

		// If not cached, request is fetched, cached and returned, so
		// that next time could be available offline.
		return fetch(request).then(function(response) {
			const responseCloned = response.clone();
			caches.open(staticsCache).then(function(cache) {
				cache.put(request, responseCloned);
			}).catch(function() {
				// TODO: handle exception
			});
			return response;
		});

	}).catch(function(a) {

		// Something went wrong...
		// TODO: say something to the user? fallback?

	});
}

function fetchNetworkPreferred(request) {

	let u = new URL(request.url);
	if (u.origin == 'http://localhost:1337') {
		return;
	}


	// Always tries to fetch the resource
	return fetch(request).then(function(response) {
		const responseCloned = response.clone();
		caches.open(dataCache).then(function(cache) {
			cache.put(request, responseCloned);
		}).catch(function(xxx) {
			// TODO: handle exception
		});
		return response;
	}).catch(function() {
		// If network is not available, try to get resource from cache
		return caches.match(request, {ignoreSearch: true});
	});
}

self.addEventListener('message', function(e) {
	console.log('message', m);
});
