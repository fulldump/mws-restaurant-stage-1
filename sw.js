
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

const staticsCache = 'statics-cache'; // Things that never changes (fonts, imgs)
const dataCache = 'data-cache'; // Thigs that could change (html, json, etc)

const staticDestinations = ['image', 'font', 'video'];

self.addEventListener('install', function(e) {
	console.log('service-worker-install!!!');

	// TODO: initialize caches with static assets and an initial version of data
});

self.addEventListener('activate', function(e) {
	console.log('service-worker-activate!!!');
});

self.addEventListener('fetch', function(e) {

	if (staticDestinations.includes(e.request.destination)) {
		e.respondWith(fetchCachedPreferred(e.request));
		return;
	}

	e.respondWith(fetchNetworkPreferred(e.request));

});

function fetchCachedPreferred(request) {
	return caches.match(request).then(function(cachedResponse){
		// If cachedResponse is cached, it is returned
		if (cachedResponse) {
			return cachedResponse;
		}

		// If not cached, request is fetched, cached and returned, so
		// that next time could be available offline.
		return fetch(request).then(function(response) {
			cache.put(request, response.clone());
			return response;
		});

	}).catch(function(a) {

		// Something went wrong...
		// TODO: say something to the user? fallback?

	});
}

function fetchNetworkPreferred(request) {
	// Always tries to fetch the resource
	return fetch(request).then(function(response) {
		cache.put(request, response.clone());
		return response;
	}).catch(function() {
		// If network is not available, try to get resource from cache
		return caches.match(request);
	});
}

self.addEventListener('message', function(e) {
	console.log('message', m);
});
