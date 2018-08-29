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
	DBHelper.fetchNeighborhoods().then(function(neighborhoods) {
		self.neighborhoods = neighborhoods;
		fillNeighborhoodsHTML();
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
	DBHelper.fetchCuisines().then(function(cuisines) {
		self.cuisines = cuisines;
		fillCuisinesHTML();
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
				scrollWheelZoom: false,
				keyboard: false,
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

	DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
		.then(function(restaurants){
			resetRestaurants(restaurants);
			fillRestaurantsHTML();
		});
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
	header.classList.add('restaurant__header');
	article.append(header);

	{
		if (restaurant.is_favorite) {
			// Unicode hearts: ♥♡
			const heart = document.createElement('div');
			heart.classList.add('restaurant_favorite');
			heart.textContent = '♥';
			header.append(heart);
		}

		// TODO: Layout is depending on image aspect ratio!
		const image = document.createElement('img');
		image.classList.add('restaurant__image');
		DBHelper.imageSetRestaurant(image, restaurant);
		if (restaurant.photograph_description) {
			image.alt = restaurant.photograph_description;
		} else {
			// photograph description fallback:
			image.alt = restaurant.name + ' restaurant';
		}
		header.append(image);

		const name = document.createElement('h2');
		name.classList.add('restaurant__name');
		name.textContent = restaurant.name; // textContent instead of innerHTML
		header.append(name);
	}

	const main = document.createElement('main');
	main.classList.add('restaurant__main');
	article.append(main);

	{
		const neighborhood = document.createElement('p');
		neighborhood.textContent = restaurant.neighborhood; // textContent instead of innerHTML
		main.append(neighborhood);

		const address = document.createElement('address');
		address.textContent = restaurant.address; // textContent instead of innerHTML
		main.append(address);
	}

	const footer = document.createElement('footer');
	footer.classList.add('restaurant__footer');
	article.append(footer);

	{
		const more = document.createElement('a');
		more.classList.add('restaurant__more');
		more.textContent = 'View Details'; // textContent instead of innerHTML
		const fav = restaurant.is_favorite ? 'my favorite restaurant ' : '';
		more.setAttribute('aria-label', 'View details of ' + fav + restaurant.name);
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
	removeTabindex(document.getElementById('map'));
}
