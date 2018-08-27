/**
 * Common database helper functions.
 */

const COLLECTION_RESTAURANTS = 'restaurants';

function openDb(callback) {
	let db;
	let DatabaseName = 'RestaurantReviews';
	let DatabaseVersion = 13;

	let dbOpenRequest = indexedDB.open(DatabaseName, DatabaseVersion);
	dbOpenRequest.onerror = function() {
		console.log(this.error.name + ':', this.error.message);
	};
	dbOpenRequest.onsuccess = function(e) {
		db = this.result;

		// TODO: interesting arguments:
		//  - this.result (IDBDatabase )
		//  - e (the event) // Event

		callback(db);
	};
	dbOpenRequest.onupgradeneeded = function(e) {
		console.log('dbOpenRequest UPGRADE', e); // IDBVersionChangeEvent
		console.log(this.result); // IDBDatabase 

		// TODO: interesting values:
		//  - this.result // IDBDatabase
		//  - e // IDBVersionChangeEvent

		let db = this.result;

		// Create collection
		let restaurantsStore = db.createObjectStore(COLLECTION_RESTAURANTS, { keyPath: 'id' });

		// TODO: interesting values:
		//  - restaurantsStore // IDBObjectStore
	};
}

/**
 * Put a restaurant with key 'id'. If repeated it will be overwritten.
 * Callback is a function with two parameters (err, event)
 * If err === null -> all is ok.
 */
function putRestaurant(restaurant, callback) {
	openDb(db => {
		let tx = db.transaction([COLLECTION_RESTAURANTS], 'readwrite');
		tx.oncomplete = function(e) {
			callback && callback(null, e);
		};
		tx.onerror = function(e) {
			console.log('transaction error', e);
			callback && callback(e, null);
		};

		tx.objectStore(COLLECTION_RESTAURANTS).put(restaurant);
	});
}

/**
 * Retrieve a restaurant by id
 * Callback is a function with two parameters (err, restaurant)
 * if err !== null -> Some error happend
 * else if restaurant -> data is ok
 * else -> restaurant do not exist
 */
function getRestaurant(id, callback) {
	openDb(db => {
		let tx = db.transaction([COLLECTION_RESTAURANTS], 'readonly');
		tx.oncomplete = function(e) {
			//console.log('read transaction complete', e);
		}
		tx.onerror = function(e) {
			console.log('read transaction error', e);
		}

		let restaurantsStore = tx.objectStore(COLLECTION_RESTAURANTS);
		let request = restaurantsStore.get(7);

		request.onerror = function(event) {
			callback && callback(e, null);
		};
		request.onsuccess = function(event) {
			callback && callback(null, this.result);
		};
	});
}

function listRestaurants(callback) {
	openDb(db => {
		let restaurants = [];

		let tx = db.transaction([COLLECTION_RESTAURANTS], 'readonly');
		tx.oncomplete = function(e) {
			callback && callback(null, restaurants);
		}
		tx.onerror = function(e) {
			console.log('read transaction error', e);
			callback && callback(e, null);
		}

		tx.objectStore(COLLECTION_RESTAURANTS).openCursor().onsuccess = function(event) {
			let cursor = this.result;
			if (cursor) {
				restaurants.push(cursor.value);
				cursor.continue();
			}
		};
	});
}

class DBHelper {

	/**
	 * Database URL.
	 * Change this to restaurants.json file location on your server.
	 */
	static get BASE_URL() {
		return `http://localhost:1337`;
	}

	/**
	 * Fetch all restaurants.
	 */
	static fetchRestaurants() {
		if (!DBHelper.prototype.restaurants_promise) {
			DBHelper.prototype.restaurants_promise = new Promise(function(resolve, reject) { // TODO: creating a promise is not necessary
				// First, try to fetch from network
				fetch(DBHelper.BASE_URL + '/restaurants')
					.then(response => response.json())
					.then(function(restaurants) {
						restaurants.map(restaurant => putRestaurant(restaurant));
						resolve(restaurants);
					})
					.catch(function(error) {
						// If network is not working, fallback to local database
						listRestaurants(function(error, restaurants) {
							if (error) {
								reject(error);
								return;
							}
							resolve(restaurants);
						});
					});
			});
		}

		// TODO: Using prototype attribute to save status of static methods
		// is a workaround, but DBHelper is being used as a global variable...
		return DBHelper.prototype.restaurants_promise;
	}

	/**
	 * Fetch a restaurant by its ID.
	 */
	static fetchRestaurantById(id) {
		return new Promise(function(resolve, reject) { // TODO: not necessary, catch can be captured later
			// First, try to fetch from network
			fetch(DBHelper.BASE_URL + '/restaurants/' + id)
				.then(response => response.json())
				.then(function(restaurant) {
					// Save restaurant to make it available offline in the future
					putRestaurant(restaurant, function() {
						// TODO: handle error on save
					});
					resolve(restaurant);
				})
				.catch(function() {
					// If network is not working, fallback to local database
					getRestaurant(id, function(error, restaurant) {
						if (error) {
							reject(error);
							return;
						}
						if (restaurant) {
							resolve(restaurant);
							return;
						}
						reject('NotFound');
					})
				});
		})
	}

	/**
	 * Fetch restaurants by a cuisine type with proper error handling.
	 */
	static fetchRestaurantByCuisine(cuisine) {
		return DBHelper.fetchRestaurants()
			.then(function(restaurants) {
				return restaurants.filter(r => r.cuisine_type == cuisine);
			});
	}

	/**
	 * Fetch restaurants by a neighborhood with proper error handling.
	 */
	static fetchRestaurantByNeighborhood(neighborhood) {
		return DBHelper.fetchRestaurants()
			.then(function(restaurants) {
				return restaurants.filter(r => r.neighborhood == neighborhood);
			});
	}

	/**
	 * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
	 */
	static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
		return DBHelper.fetchRestaurants()
			.then(function(restaurants) {

				let results = restaurants
				if (cuisine != 'all') { // filter by cuisine
					results = results.filter(r => r.cuisine_type == cuisine);
				}
				if (neighborhood != 'all') { // filter by neighborhood
					results = results.filter(r => r.neighborhood == neighborhood);
				}

				return results;
			});
	}

	/**
	 * Fetch all neighborhoods with proper error handling.
	 */
	static fetchNeighborhoods() {
		return DBHelper.fetchRestaurants()
			.then(function(restaurants) {
				// Get all neighborhoods from all restaurants
				const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
				// Remove duplicates from neighborhoods
				const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
				return uniqueNeighborhoods;
			});
	}

	/**
	 * Fetch all cuisines with proper error handling.
	 */
	static fetchCuisines() {
		return DBHelper.fetchRestaurants()
			.then(function(restaurants) {
				// Get all cuisines from all restaurants
				const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
				// Remove duplicates from cuisines
				const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
				return uniqueCuisines;
			})
			.catch(function(error) {
				console.log(error);
			});
	}

	/**
	 * Restaurant page URL.
	 */
	static urlForRestaurant(restaurant) {
		return (`./restaurant.html?id=${restaurant.id}`);
	}

	/**
	 * Restaurant image URL.
	 */
	static imageUrlForRestaurant(restaurant) {
		return (`/img/${restaurant.photograph}.jpg`);
	}

	/**
	 * Restaurant image source set
	 */
	static imageSetRestaurant(image, restaurant, sizes) {

		// Fallback
		image.src = DBHelper.imageUrlForRestaurant(restaurant);

		// Responsive images
		let s = sizes || ['200', '600', '900'];
		image.srcset = s
			.map(v => `/img/${v}w/${restaurant.photograph}.jpg ${v}w`)
			.join(',');
		image.sizes = '100vw';
	}

	/**
	 * Map marker for a restaurant.
	 */
	 static mapMarkerForRestaurant(restaurant, map) {
		// https://leafletjs.com/reference-1.3.0.html#marker
		const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
			{title: restaurant.name,
			alt: restaurant.name,
			url: DBHelper.urlForRestaurant(restaurant)
			})
			marker.addTo(newMap);
		return marker;
	}

}
