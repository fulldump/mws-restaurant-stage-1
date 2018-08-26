let restaurants,
	neighborhoods,
	cuisines,
	markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
	initMap(); // added
	fetchNeighborhoods();
	fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
	DBHelper.fetchNeighborhoods((error, neighborhoods) => {
		if (error) { // Got an error
			console.error(error);
		} else {
			self.neighborhoods = neighborhoods;
			fillNeighborhoodsHTML();
		}
	});
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
	const select = document.getElementById('neighborhoods-select');
	neighborhoods.forEach(neighborhood => {
		const option = document.createElement('option');
		option.textContent = neighborhood; // textContent instead of innerHTML
		option.value = neighborhood;
		select.append(option);
	});
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
	DBHelper.fetchCuisines((error, cuisines) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.cuisines = cuisines;
			fillCuisinesHTML();
		}
	});
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
	const select = document.getElementById('cuisines-select');

	cuisines.forEach(cuisine => {
		const option = document.createElement('option');
		option.textContent = cuisine; // textContent instead of innerHTML
		option.value = cuisine;
		select.append(option);
	});
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
	self.newMap = L.map('map', {
				center: [40.722216, -73.987501],
				zoom: 12,
				scrollWheelZoom: false
			});
	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
		mapboxToken: PRIVATE_MAPBOX_APIKEY,
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
			'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		id: 'mapbox.streets'
	}).addTo(newMap);

	updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
	const cSelect = document.getElementById('cuisines-select');
	const nSelect = document.getElementById('neighborhoods-select');

	const cIndex = cSelect.selectedIndex;
	const nIndex = nSelect.selectedIndex;

	const cuisine = cSelect[cIndex].value;
	const neighborhood = nSelect[nIndex].value;

	DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			resetRestaurants(restaurants);
			fillRestaurantsHTML();
		}
	})
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
	// Remove all restaurants
	self.restaurants = [];
	const ul = document.getElementById('restaurants-list');
	ul.innerHTML = '';

	// Remove all map markers
	if (self.markers) {
		self.markers.forEach(marker => marker.remove());
	}
	self.markers = [];
	self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
	const div = document.getElementById('restaurants-list');
	restaurants.forEach(restaurant => {
		div.append(createRestaurantHTML(restaurant));
	});
	addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
	const article = document.createElement('article');

	article.classList.add('restaurant');

	const header = document.createElement('header');
	header.className = 'restaurant__header';
	article.append(header);

	{
		// TODO: Layout is depending on image aspect ratio!
		const image = document.createElement('img');
		image.className = 'restaurant__image';
		image.src = DBHelper.imageUrlForRestaurant(restaurant);
		image.alt = restaurant.photograph_description;
		header.append(image);

		const name = document.createElement('h1');
		name.classList.add('restaurant__name');
		name.textContent = restaurant.name; // textContent instead of innerHTML
		header.append(name);
	}

	const main = document.createElement('main');
	main.className = 'restaurant__main';
	article.append(main);

	{
		const neighborhood = document.createElement('p');
		neighborhood.textContent = restaurant.neighborhood; // textContent instead of innerHTML
		main.append(neighborhood);

		const address = document.createElement('p');
		address.textContent = restaurant.address; // textContent instead of innerHTML
		main.append(address);
	}

	const footer = document.createElement('footer');
	footer.className = 'restaurant__footer';
	article.append(footer);

	{
		const more = document.createElement('a');
		more.className = 'restaurant__more';
		more.textContent = 'View Details'; // textContent instead of innerHTML
		more.href = DBHelper.urlForRestaurant(restaurant);
		footer.append(more);
	}

	return article;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
	restaurants.forEach(restaurant => {
		// Add marker to the map
		const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
		marker.on('click', onClick);
		function onClick() {
			window.location.href = marker.options.url;
		}
		self.markers.push(marker);
	});

}
