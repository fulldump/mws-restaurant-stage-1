/**
 * Common database helper functions.
 */
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
			DBHelper.prototype.restaurants_promise = fetch(DBHelper.BASE_URL + '/restaurants')
				.then(response => response.json())
				.catch(function(error) {
					console.error(error);
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
		return fetch(DBHelper.BASE_URL + '/restaurants/' + id)
			.then(response => response.json());
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
