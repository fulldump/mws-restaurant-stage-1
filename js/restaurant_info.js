let restaurant;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
	initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
	fetchRestaurantFromURL().then(function(restaurant){

		self.restaurant = restaurant;
		fillRestaurantHTML();

		self.newMap = L.map('map', {
			center: [restaurant.latlng.lat, restaurant.latlng.lng],
			zoom: 16,
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
		fillBreadcrumb();
		DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
		removeTabindex(document.getElementById('map'));
	});
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = () => {
	const id = getParameterByName('id');
	if (!id) { // no id found in URL
		return Promise.reject('No restaurant id in URL');
	};

	return DBHelper.fetchRestaurantById(id);
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.textContent = restaurant.name; // textContent instead of innerHTML

	const address = document.getElementById('restaurant-address');
	address.textContent = restaurant.address; // textContent instead of innerHTML

	const image = document.getElementById('restaurant-img');
	DBHelper.imageSetRestaurant(image, restaurant);
	if (restaurant.photograph_description) {
		image.alt = restaurant.photograph_description;
	} else {
		// photograph description fallback:
		image.alt = restaurant.name + ' restaurant';
	}

	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.textContent = restaurant.cuisine_type; // textContent instead of innerHTML

	const button_favorite = document.querySelector('.button-favorite');
	button_favorite.dataset.favorite = restaurant.is_favorite;
	button_favorite.addEventListener('click', function(e) {
		// Calculate new value
		restaurant.is_favorite = !restaurant.is_favorite;

		// Save value
		DBHelper.favoriteRestaurant(restaurant.id, restaurant.is_favorite);

		// Draw changes
		drawFavorite(restaurant.is_favorite);
	}, true);
	drawFavorite(restaurant.is_favorite);

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}

	// fill reviews
	fillReviewsHTML();
	buildReviewsForm();
}

function buildReviewsForm() {

	const form = document.getElementById('reviews-form');
	const name = document.getElementById('reviews-form-name');
	const rating = document.getElementById('reviews-form-rating');
	const comments = document.getElementById('reviews-form-comments');

	form.addEventListener('submit', function(e) {
		/*
			Capturing this event take advantage of HTML5 form validations and
			reduce submit interaction to a single point. (There are several
			ways to submit a form: button, enter key, ...)
		*/
		e.stopPropagation();
		e.preventDefault();

		const review = {
			restaurant_id: getParameterByName('id'),
			name: name.value,
			rating: rating.value,
			comments: comments.value,
			self: true,
			pending: true,
		};

		// Do things with data review
		DBHelper.writeReview(review);

		// Paint
		const ul = document.getElementById('reviews-list');
		ul.appendChild(createReviewHTML(review));

		// Auto hide form
		form.style.display = 'none';
	}, true);

}

function drawFavorite(is_favorite) {
	const button_favorite = document.querySelector('.button-favorite');
	button_favorite.dataset.favorite = is_favorite;

	var description = window.getComputedStyle(button_favorite, ':after').getPropertyValue('content');
	button_favorite.setAttribute('aria-label', description);
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	for (let key in operatingHours) {
		const row = document.createElement('tr');

		const day = document.createElement('td');
		day.textContent = key; // textContent instead of innerHTML
		row.appendChild(day);

		const time = document.createElement('td');
		time.textContent = operatingHours[key]; // textContent instead of innerHTML
		row.appendChild(time);

		hours.appendChild(row);
	}
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (restaurant = self.restaurant) => {

	DBHelper.fetchRestaurantReviews(restaurant.id).then(function(reviews) {
		if (!reviews) {
			const noReviews = document.createElement('p');
			noReviews.textContent = 'No reviews yet! Be the first one writing a review for this restaurant!'; // textContent instead of innerHTML
			container.appendChild(noReviews);
			return;
		}
		const ul = document.getElementById('reviews-list');
		reviews.forEach(review => {
			ul.appendChild(createReviewHTML(review));
		});
	});
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
	const li = document.createElement('li');
	li.classList.add('reviews__list__item');

	/* // TODO: experiment, put icon if the review is waiting to be sent...
	if (review.pending) {
		const offline = document.createElement('div');
		offline.className = 'reviews__list__item__offline';
		offline.textContent = '📶';
		li.appendChild(offline);
	}
	*/

	const name = document.createElement('p');
	name.textContent = review.name; // textContent instead of innerHTML
	li.appendChild(name);

	const date = document.createElement('p');
	date.textContent = review.date; // textContent instead of innerHTML
	li.appendChild(date);

	const rating = document.createElement('p');
	rating.textContent = `Rating: ${review.rating}`; // textContent instead of innerHTML
	li.appendChild(rating);

	const comments = document.createElement('p');
	comments.textContent = review.comments; // textContent instead of innerHTML
	li.appendChild(comments);

	return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	const li = document.createElement('li');
	li.textContent = restaurant.name; // textContent instead of innerHTML
	breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
	if (!url)
		url = window.location.href;
	name = name.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
