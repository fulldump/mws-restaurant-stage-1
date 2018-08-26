// 'strict'; // TODO: uncomment this and check

/**
 * Register service worker
 */
(function() {
	// All inside this function scope will be forced to be in strict mode
	'strict';

	if (!navigator.serviceWorker) return;

	navigator.serviceWorker.register('sw.js', {scope:'/'}).then(function(r){

		//console.log('waiting:', r.waiting);
		//console.log('installing', r.installing);

		r.addEventListener('updatefound', function(){
			// TODO: show toast to allow the user update
			//console.log('update found');
		});

	}).catch(function() {
		console.log('problem :_(');
	});

})();
