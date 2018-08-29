/**
 * Common database helper functions.
 */
class DBHelper {

	/**
	 * Collection restaurants name
	 */
	static get COLLECTION_RESTAURANTS() {
		return 'restaurants';
	}

	/**
	 * Collection restaurants reviews
	 */
	static get COLLECTION_REVIEWS() {
		return 'reviews';
	}

	/**
	 * Open database RestaurantReviews
	 */
	static openDb() {
		// TODO: improvement, store promise!
		return new Promise(function(resolve, reject) {
			let db;
			let DatabaseName = 'RestaurantReviews';
			let DatabaseVersion = 14;

			let dbOpenRequest = indexedDB.open(DatabaseName, DatabaseVersion);
			dbOpenRequest.onerror = function() {
				reject(this.error.name + ':', this.error.message);
			};
			dbOpenRequest.onsuccess = function(e) {
				db = this.result;

				// TODO: interesting arguments:
				//  - this.result (IDBDatabase )
				//  - e (the event) // Event

				resolve(db, e);
			};
			dbOpenRequest.onupgradeneeded = function(e) {
				console.log('dbOpenRequest UPGRADE', e); // IDBVersionChangeEvent
				console.log(this.result); // IDBDatabase 

				// TODO: interesting values:
				//  - this.result // IDBDatabase
				//  - e // IDBVersionChangeEvent

				let db = this.result;

				// Create collections
				let restaurantsStore = db.createObjectStore(DBHelper.COLLECTION_RESTAURANTS, { keyPath: 'id' });
				let reviewsStore = db.createObjectStore(DBHelper.COLLECTION_REVIEWS, { keyPath: 'id' });
				reviewsStore.createIndex('restaurant_id', 'restaurant_id', { unique: false });

				// TODO: interesting values:
				//  - restaurantsStore // IDBObjectStore
			};
		});
	}

	/**
	 * Put a restaurant with key 'id'. If repeated it will be overwritten.
	 * It returns a promise.
	 */
	static putRestaurant(restaurant) {
		return DBHelper.openDb().then(db => {
			return new Promise(function(resolve, reject) {
				let tx = db.transaction([DBHelper.COLLECTION_RESTAURANTS], 'readwrite');
				tx.oncomplete = resolve;
				tx.onerror = reject;
				tx.objectStore(DBHelper.COLLECTION_RESTAURANTS).put(restaurant);
			});
		});
	}

	/**
	 * Retrieve a restaurant by id
	 * Return a promise with the restaurant
	 */
	static getRestaurant(id) {
		return DBHelper.openDb().then(db => {
			return new Promise(function(resolve, reject) {
				id = parseInt(id);

				let tx = db.transaction([DBHelper.COLLECTION_RESTAURANTS], 'readonly');
				tx.onerror = reject;

				let restaurantsStore = tx.objectStore(DBHelper.COLLECTION_RESTAURANTS);
				let request = restaurantsStore.get(id);

				request.onerror = reject;
				request.onsuccess = function(event) {
					resolve(this.result);
				};
			});
		});
	}

	/**
	 * Retrieve all restaurants.
	 * Returns a promise with an array of restaurants.
	 */
	static listRestaurants() {
		return DBHelper.openDb().then(db => {
			return new Promise(function(resolve, reject) {
				let restaurants = [];

				let tx = db.transaction([DBHelper.COLLECTION_RESTAURANTS], 'readonly');
				tx.oncomplete = function(e) {
					resolve(restaurants);
				};
				tx.onerror = reject;

				tx.objectStore(DBHelper.COLLECTION_RESTAURANTS).openCursor().onsuccess = function(event) {
					let cursor = this.result;
					if (cursor) {
						restaurants.push(cursor.value);
						cursor.continue();
					}
				};
			});
		});
	}

	/**
	 * Put a review with key 'id'. If repeated it will be overwritten.
	 * Return a promise with the result of the operation.
	 */
	// TODO: refactor, duplicated/similar code
	static putReview(review) {
		return DBHelper.openDb().then(db => {
			return new Promise(function(resolve, reject) {
				let tx = db.transaction([DBHelper.COLLECTION_REVIEWS], 'readwrite');
				tx.oncomplete = resolve;
				tx.onerror = reject;
				tx.objectStore(DBHelper.COLLECTION_REVIEWS).put(review);
			});
		});
	}

	/**
	 * Retrieve all reviews from a restaurant
	 * Returns a promise with array of reviews.
	 */
	static listRestaurantReviews(restaurantId) {
		return DBHelper.openDb().then(db => {
			return new Promise(function(resolve, reject) {
				let reviews = [];

				let tx = db.transaction([DBHelper.COLLECTION_REVIEWS], 'readonly');
				tx.oncomplete = function(e) {
					resolve(reviews);
				};
				tx.onerror = reject;

				// index('restaurant_id').openKeyCursor(IDBKeyRange.only(restaurantId))
				tx.objectStore(DBHelper.COLLECTION_REVIEWS).openCursor().onsuccess = function(event) {
					let cursor = this.result;
					//console.log(cursor, this.result, cursor.value);
					if (cursor) {
						// Workaround until get openKeyCursor working...
						if (restaurantId == cursor.value.restaurant_id) {
							reviews.push(cursor.value);
						}
						cursor.continue();
					}
				};
			});
		});
	}

	/**
	 * Remove existing restaurant review from indexedDb by id
	 * Returns a promise with the result of the operation.
	 */
	static removeRestaurantReview(reviewId) {
		return DBHelper.openDb().then(db => {
			return new Promise(function(resolve, reject) {
				let tx = db.transaction([DBHelper.COLLECTION_REVIEWS], 'readwrite');
				tx.oncomplete = resolve;
				tx.onerror = reject;
				tx.objectStore(DBHelper.COLLECTION_REVIEWS).delete(reviewId);
			});
		});
	}

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
			// First, try to fetch from network
			DBHelper.prototype.restaurants_promise = fetch(DBHelper.BASE_URL + '/restaurants')
				.then(response => response.json())
				.then(function(restaurants) {
					// Sanitize restaurants
					restaurants.map(DBHelper.sanitizeRestaurant);
					// Save restaurants to make them available offline in the future
					restaurants.map(DBHelper.putRestaurant);
					return restaurants;
				})
				.catch(function() {
					//console.log('Network not working, fallback...')
					// If network is not working, fallback to local database
					return DBHelper.listRestaurants();
				});
		}

		// TODO: Using prototype attribute to save status of static methods
		// is a workaround, but DBHelper is being used as a global variable...
		return DBHelper.prototype.restaurants_promise;
	}

	/**
	 * Sanitize restaurant
	 */
	static sanitizeRestaurant(restaurant) {
		if (restaurant.is_favorite === true || restaurant.is_favorite === "true") {
			restaurant.is_favorite = true;
		} else {
			restaurant.is_favorite = false;
		}
		return restaurant;
	}

	/**
	 * Fetch a restaurant by its ID.
	 */
	static fetchRestaurantById(id) {

		// First, try to fetch from network
		return fetch(DBHelper.BASE_URL + '/restaurants/' + id) // TODO: encodeURIComponent
			.then(response => response.json())
			.then(function(restaurant) {

				// Sanitize restaurant
				DBHelper.sanitizeRestaurant(restaurant);

				// Save restaurant to make it available offline in the future
				DBHelper.putRestaurant(restaurant);

				return restaurant;
			})
			.catch(function() {
				console.log(`Network not working for restaurant ${id}, fallback...`);
				// When network is not working, fallback to local database
				return DBHelper.getRestaurant(id);
			});
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

	static favoriteRestaurant(id, favorite) {
		const url = DBHelper.BASE_URL + `/restaurants/${id}/?is_favorite=${favorite}`;

		DBHelper.fetchRestaurantById(id).then(function(restaurant) {
			restaurant.is_favorite = favorite;
			DBHelper.putRestaurant(restaurant);
		});

		// TODO: store this request to be processed when connection is back
		return fetch(url, {method:'POST'});
	}

	static fetchRestaurantReviews(id) {
		const url = DBHelper.BASE_URL + `/reviews/?restaurant_id=${id}`;

		return fetch(url)
			.then(response => response.json())
			.then(function(reviews) {
				// TODO: sanitize reviews?

				// Update local copy
				reviews.map(DBHelper.putReview);

				return reviews;
			})
			.catch(function() {
				// TODO: catch error
				console.log(`Network not working for restaurant ${id} reviews, fallback...`);
				return DBHelper.listRestaurantReviews(id);
			});
	}

	static sendReview(review) {
		// Send request
		const payload = {
			restaurant_id: review.restaurant_id,
			name: review.name,
			rating: review.rating,
			comments: review.comments,
		};
		const url = DBHelper.BASE_URL + `/reviews/`;
		return fetch(url, {method: 'POST', body: JSON.stringify(payload)})
			.then(response => response.json())
			.then(function(body) {
				// Remove review with old id
				DBHelper.removeRestaurantReview(review.id);
				// Insert review again with real generated id
				review.id = body.id;
				review.pending = false;
				DBHelper.putReview(review);
			});
	}

	static writeReview(review) {

		review.pending = true;

		// Add to local database
		review.id = (new Date()).getTime();
		DBHelper.putReview(review);

		// Send request
		DBHelper.retrySendReviews(review);
	}

	static retrySendReviews() {
		DBHelper.openDb().then(db => {
			let reviews = [];
			let tx = db.transaction([DBHelper.COLLECTION_REVIEWS], 'readonly');
			tx.objectStore(DBHelper.COLLECTION_REVIEWS).openCursor().onsuccess = function(event) {
				let cursor = this.result;
				if (cursor) {
					// Workaround until get openKeyCursor working...
					if (cursor.value.pending) {
						DBHelper.sendReview(cursor.value);
					}
					cursor.continue();
				}
			};
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

window.addEventListener('online',  function(e) {
	document.body.classList.remove('offline');
	// Try to resend info
	DBHelper.retrySendReviews();
});

window.addEventListener('offline', function(e) {
	document.body.classList.add('offline');
});

if (navigator.onLine) {
	DBHelper.retrySendReviews();
} else {
	document.body.classList.add('offline');
}
