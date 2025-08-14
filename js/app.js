let userLocation = null;
let restaurants = [];
let selectedFoodTypes = [];
let filteredRestaurants = [];
let selectedFoodTypeFromWheel = null;

const foodTypes = [
  'Italian','Chinese','Mexican','Japanese','Indian','Thai',
  'American','Mediterranean','Greek','French','Korean','Vietnamese',
  'Pizza','Burgers','Sushi','BBQ','Seafood','Steakhouse',
  'Vegetarian','Vegan','Desserts','Coffee','Fast Food','Fine Dining'
];

let __placesService = null;
function getPlacesService() {
  if (__placesService) return __placesService;
  const tempMap = new google.maps.Map(document.createElement('div'), { center: { lat: 0, lng: 0 }, zoom: 1 });
  __placesService = new google.maps.places.PlacesService(tempMap);
  return __placesService;
}

let activeSearchAbort = null;

const resultsCache = new Map();
function makeCacheKey(foodType, distance, minRating, minReviews) {
  return `${foodType}::${distance}::${minRating}::${minReviews}::${userLocation?.latitude?.toFixed(3)},${userLocation?.longitude?.toFixed(3)}`;
}

const reverseCache = new Map();

function debounce(fn, delay = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
const renderFoodWheel = debounce((items) => createWheelSegments('foodTypeWheel', items, 'food'), 120);

document.addEventListener('DOMContentLoaded', function () {
  initializeApp();
});

function initializeApp() {
  setupEventListeners();
  populateFoodTypes();
  if (navigator.geolocation) {
    document.getElementById('locationStatus').textContent = 'Click the button to get your location';
  } else {
    document.getElementById('locationStatus').textContent = 'Geolocation is not supported by this browser';
    document.getElementById('getLocationBtn').disabled = true;
  }
}

function setupEventListeners() {
  document.getElementById('getLocationBtn').addEventListener('click', getLocation);
  document.getElementById('distanceRange').addEventListener('input', updateDistanceValue);
  document.getElementById('findRestaurantsBtn').addEventListener('click', findRestaurants);
  document.getElementById('spinFoodTypeBtn').addEventListener('click', spinFoodTypeWheel);
  document.getElementById('spinRestaurantBtn').addEventListener('click', spinRestaurantWheel);
  addTouchEventListeners();
}

function addTouchEventListeners() {
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach((button) => {
    button.addEventListener('touchstart', function () { this.style.transform = 'scale(0.95)'; });
    button.addEventListener('touchend', function () { this.style.transform = ''; });
  });
  const foodTypeItems = document.querySelectorAll('.food-type-item');
  foodTypeItems.forEach((item) => {
    item.addEventListener('touchstart', function () { this.style.transform = 'scale(0.95)'; });
    item.addEventListener('touchend', function () { this.style.transform = ''; });
  });
}

function populateFoodTypes() {
  const foodTypesGrid = document.getElementById('foodTypesGrid');
  foodTypesGrid.innerHTML = '';
  foodTypes.forEach((type) => {
    const foodTypeItem = document.createElement('div');
    foodTypeItem.className = 'food-type-item';
    foodTypeItem.textContent = type;
    foodTypeItem.addEventListener('click', () => toggleFoodType(type, foodTypeItem));
    foodTypesGrid.appendChild(foodTypeItem);
  });
}

function toggleFoodType(type, element) {
  if (selectedFoodTypes.includes(type)) {
    selectedFoodTypes = selectedFoodTypes.filter((t) => t !== type);
    element.classList.remove('selected');
  } else {
    selectedFoodTypes.push(type);
    element.classList.add('selected');
  }
  element.style.animation = 'bounceIn 0.3s ease-out';
  setTimeout(() => { element.style.animation = ''; }, 300);
}

function updateDistanceValue() {
  const distanceRange = document.getElementById('distanceRange');
  const distanceValue = document.getElementById('distanceValue');
  distanceValue.textContent = `${distanceRange.value} miles`;
}

function getLocation() {
  const locationStatus = document.getElementById('locationStatus');
  const getLocationBtn = document.getElementById('getLocationBtn');

  locationStatus.textContent = 'Getting your location...';
  getLocationBtn.disabled = true;

  if (!navigator.geolocation) {
    locationStatus.textContent = 'Geolocation is not supported by this browser';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      displayLocation(userLocation);
      getAddressFromCoords(userLocation);
      const filtersSection = document.getElementById('filtersSection');
      filtersSection.style.display = 'block';
      filtersSection.classList.add('fade-in-up');
      locationStatus.textContent = 'Location found!';
      getLocationBtn.disabled = false;
    },
    (error) => {
      locationStatus.textContent = 'Error getting location. Using demo coords (NYC).';
      getLocationBtn.disabled = false;
      userLocation = { latitude: 40.7128, longitude: -74.0060 };
      displayLocation(userLocation);
      const filtersSection = document.getElementById('filtersSection');
      filtersSection.style.display = 'block';
      filtersSection.classList.add('fade-in-up');
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

function displayLocation(location) {
  document.getElementById('latitude').textContent = location.latitude.toFixed(6);
  document.getElementById('longitude').textContent = location.longitude.toFixed(6);
  const locationDetails = document.getElementById('locationDetails');
  locationDetails.style.display = 'block';
  locationDetails.classList.add('fade-in');
}

async function getAddressFromCoords(location) {
  const key = `${location.latitude.toFixed(5)},${location.longitude.toFixed(5)}`;
  if (reverseCache.has(key)) {
    document.getElementById('address').textContent = reverseCache.get(key);
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1`,
      { signal: controller.signal, headers: { 'Accept-Language': 'en-US' } }
    );
    const data = await res.json();
    const display = data.display_name ? data.display_name : 'Address not available';
    document.getElementById('address').textContent = display;
    reverseCache.set(key, display);
  } catch {
    const fallback = `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
    document.getElementById('address').textContent = fallback;
    reverseCache.set(key, fallback);
  } finally {
    clearTimeout(timer);
  }
}

async function findRestaurants() {
  if (!userLocation) {
    alert('Please get your location first');
    return;
  }

  const loadingSection = document.getElementById('loadingSection');
  const filtersSection = document.getElementById('filtersSection');

  loadingSection.style.display = 'block';
  loadingSection.classList.add('fade-in');
  filtersSection.style.display = 'none';

  try {
    restaurants = [];
    filteredRestaurants = [];
    const foodTypeWheelSection = document.getElementById('foodTypeWheelSection');
    foodTypeWheelSection.style.display = 'block';
    foodTypeWheelSection.classList.add('fade-in-up');
    const itemsForWheel = selectedFoodTypes.length > 0 ? selectedFoodTypes : foodTypes;
    renderFoodWheel(itemsForWheel);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    alert(`Error: ${errorMessage}`);
    loadingSection.style.display = 'none';
    filtersSection.style.display = 'block';
  } finally {
    loadingSection.style.display = 'none';
  }
}

function setRestaurantLoading(isLoading) {
  const loader = document.getElementById('restaurantLoading');
  const spinBtn = document.getElementById('spinRestaurantBtn');
  const wheelSegments = document.getElementById('restaurantWheelSegments');
  if (loader) loader.style.display = isLoading ? 'flex' : 'none';
  if (spinBtn) spinBtn.disabled = isLoading;
  if (isLoading && wheelSegments) {
    wheelSegments.innerHTML = '';
    wheelSegments.style.transform = 'rotate(0deg)';
  }
}

function getErrorMessage(error) {
  const errorMessage = error.message || error.toString();
  if (errorMessage.includes('REQUEST_DENIED')) return 'Access to Google Places API was denied. Please check your API key and billing setup.';
  if (errorMessage.includes('OVER_QUERY_LIMIT')) return 'Google Places API quota exceeded. Please try again later.';
  if (errorMessage.includes('INVALID_REQUEST')) return 'Invalid request to Google Places API. Please check your location and filters.';
  if (errorMessage.includes('NOT_FOUND')) return 'No restaurants found in your area. Try increasing the search radius.';
  if (errorMessage.includes('ZERO_RESULTS')) return 'No restaurants found for this food type in your area. Try a different food type or increase the search radius.';
  if (errorMessage.includes('Property radius is invalid')) return 'Search configuration error. Please try refreshing the page.';
  if (errorMessage.includes('No restaurants found matching your criteria')) return 'No restaurants found matching your criteria. Try adjusting your filters.';
  if (errorMessage.includes('No restaurants found in your area')) return 'No restaurants found in your area. Try increasing the search radius.';
  if (errorMessage.includes('Google Maps API not loaded')) return 'Google Maps API failed to load. Please check your internet connection and API key.';
  return 'Unable to fetch restaurant data. Please try again later.';
}

async function getPlaceDetails(service, placeId) {
  return new Promise((resolve) => {
    const request = { placeId, fields: ['formatted_address','formatted_phone_number','types','website','opening_hours'] };
    service.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) resolve(place);
      else resolve(null);
    });
  });
}

function extractFoodTypesFromGooglePlace(place) {
  const detected = [];
  if (place.types) {
    place.types.forEach((type) => {
      switch (type) {
        case 'restaurant': detected.push('Restaurant'); break;
        case 'food': detected.push('Food'); break;
        case 'meal_takeaway':
        case 'meal_delivery': detected.push('Fast Food'); break;
        case 'cafe': detected.push('Coffee'); break;
        case 'bar': detected.push('Bar'); break;
        case 'bakery': detected.push('Desserts'); break;
        default: break;
      }
    });
  }
  const name = place.name?.toLowerCase() || '';
  const commonFoodWords = {
    'burger':'Burgers','burgers':'Burgers','hamburger':'Burgers','cheeseburger':'Burgers',
    'in-n-out':'Burgers','in n out':'Burgers','habit':'Burgers','five guys':'Burgers',
    'wendy':'Burgers','mcdonald':'Burgers','burger king':'Burgers','shake shack':'Burgers',
    'pizza':'Pizza','pizzeria':'Pizza','domino':'Pizza','pizza hut':'Pizza','papa john':'Pizza','little caesar':'Pizza',
    'chinese':'Chinese','mandarin':'Chinese','szechuan':'Chinese','sichuan':'Chinese','dim sum':'Chinese',
    'mexican':'Mexican','taco':'Mexican','burrito':'Mexican','enchilada':'Mexican','quesadilla':'Mexican','chipotle':'Mexican',
    'italian':'Italian','pasta':'Italian','spaghetti':'Italian','lasagna':'Italian','ravioli':'Italian','olive garden':'Italian',
    'japanese':'Japanese','sushi':'Sushi','sashimi':'Sushi','ramen':'Japanese','teriyaki':'Japanese','tempura':'Japanese',
    'thai':'Thai','pad thai':'Thai','curry':'Thai','tom yum':'Thai',
    'indian':'Indian','tandoori':'Indian','naan':'Indian','biryani':'Indian',
    'seafood':'Seafood','fish':'Seafood','shrimp':'Seafood','crab':'Seafood','lobster':'Seafood','oyster':'Seafood',
    'bbq':'BBQ','barbecue':'BBQ','smoke':'BBQ','smoked':'BBQ',
    'coffee':'Coffee','starbucks':'Coffee','dunkin':'Coffee','peet':'Coffee',
    'steak':'Steakhouse','steakhouse':'Steakhouse','outback':'Steakhouse','longhorn':'Steakhouse','texas roadhouse':'Steakhouse',
    'greek':'Greek','french':'French','korean':'Korean','vietnamese':'Vietnamese',
    'mediterranean':'Mediterranean','american':'American','vegetarian':'Vegetarian',
    'vegan':'Vegan','dessert':'Desserts','bakery':'Desserts','ice cream':'Desserts'
  };
  for (const [word, mapType] of Object.entries(commonFoodWords)) {
    if (name.includes(word)) detected.push(mapType);
  }
  const unique = [...new Set(detected)];
  if (unique.length === 0) unique.push('Restaurant');
  return unique;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateDistanceFast(lat1, lon1, lat2, lon2, cosLat1) {
  const R = 3959;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    cosLat1 * Math.cos(lat2 * toRad) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function displayRestaurants(list, isFiltered = false, filterType = null) {
  const resultsSection = document.getElementById('resultsSection');
  const restaurantsGrid = document.getElementById('restaurantsGrid');
  const restaurantCount = document.getElementById('restaurantCount');

  if (isFiltered && filterType) {
    restaurantCount.textContent = `${list.length} (filtered for ${filterType})`;
  } else {
    restaurantCount.textContent = list.length;
  }

  restaurantsGrid.innerHTML = '';

  if (list.length === 0) {
    restaurantsGrid.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:#666;">No restaurants found matching your criteria.</p>';
  } else {
    if (list.length >= 15) {
      const paginationNote = document.createElement('p');
      paginationNote.style.textAlign = 'center';
      paginationNote.style.gridColumn = '1/-1';
      paginationNote.style.color = '#666';
      paginationNote.style.fontSize = '0.9em';
      paginationNote.style.marginBottom = '1rem';
      paginationNote.innerHTML = `🔍 Found ${list.length} restaurants using enhanced search with pagination`;
      restaurantsGrid.appendChild(paginationNote);
    }
    const frag = document.createDocumentFragment();
    list.forEach((r, idx) => {
      const card = createRestaurantCard(r);
      card.style.animationDelay = `${idx * 0.05}s`;
      frag.appendChild(card);
    });
    restaurantsGrid.appendChild(frag);
  }

  resultsSection.style.display = 'block';
  resultsSection.classList.add('fade-in-up');
}

function createRestaurantCard(restaurant) {
  const card = document.createElement('div');
  card.className = 'restaurant-card';
  const starsCount = typeof restaurant.rating === 'number' ? Math.floor(restaurant.rating) : 0;
  const stars = '★'.repeat(starsCount) + '☆'.repeat(5 - starsCount);
  const ratingText = typeof restaurant.rating === 'number' ? restaurant.rating.toFixed(1) : 'N/A';
  card.innerHTML = `
    <h3>${restaurant.name}</h3>
    <div class="rating">${stars} ${ratingText}</div>
    <div class="reviews">${restaurant.reviews} reviews</div>
    <div class="distance">${restaurant.distance} miles away</div>
    <div class="food-types">
      ${restaurant.foodTypes.map((t) => `<span class="food-type-tag">${t}</span>`).join('')}
    </div>
  `;
  return card;
}

function spinFoodTypeWheel() {
  const wheel = document.getElementById('foodTypeWheel');
  const result = document.getElementById('foodTypeResult');
  const selectedFoodTypeSpan = document.getElementById('selectedFoodType');

  result.style.display = 'none';

  if (selectedFoodTypes.length === 0) {
    alert('Please select at least one food type before spinning the wheel.');
    return;
  }

  createWheelSegments('foodTypeWheel', selectedFoodTypes, 'food');

  wheel.classList.add('spinning');

  const segmentAngle = 360 / selectedFoodTypes.length;
  const randomSegment = Math.floor(Math.random() * selectedFoodTypes.length);
  const finalRotation = 3600 + (randomSegment * segmentAngle) + (segmentAngle / 2);

  const wheelSegments = document.getElementById('foodTypeWheelSegments');
  setTimeout(() => { wheelSegments.style.transform = `rotate(${finalRotation}deg)`; }, 50);

  const normalizedRotation = finalRotation % 360;
  const segmentIndex = Math.floor(((360 - normalizedRotation) / segmentAngle)) % selectedFoodTypes.length;
  const selectedType = selectedFoodTypes[segmentIndex];

  let currentIndex = 0;
  const spinDuration = 4000;
  const intervalTime = 150;
  const totalIntervals = Math.floor(spinDuration / intervalTime);
  let intervalCount = 0;

  const spinInterval = setInterval(() => {
    const currentType = selectedFoodTypes[currentIndex % selectedFoodTypes.length];
    selectedFoodTypeSpan.textContent = currentType;
    selectedFoodTypeSpan.classList.add('wheel-spinning-text','scale-up');
    setTimeout(() => selectedFoodTypeSpan.classList.remove('scale-up'), 50);

    currentIndex++;
    intervalCount++;

    if (intervalCount >= totalIntervals) {
      clearInterval(spinInterval);
      selectedFoodTypeSpan.textContent = selectedType;
      selectedFoodTypeSpan.classList.add('final-result');
      wheel.classList.remove('spinning');
      result.style.display = 'block';
      result.classList.add('fade-in-up');
      selectedFoodTypeFromWheel = selectedType;

      const restaurantWheelSection = document.getElementById('restaurantWheelSection');
      restaurantWheelSection.style.display = 'block';
      restaurantWheelSection.classList.add('fade-in-up');

      filterRestaurantsByWheelSelection(selectedType);

      setTimeout(() => selectedFoodTypeSpan.classList.remove('final-result'), 1000);
    }
  }, intervalTime);
}

function filterRestaurantsByWheelSelection(selectedFoodType) {
  const restaurantWheelSection = document.getElementById('restaurantWheelSection');
  restaurantWheelSection.style.display = 'block';
  restaurantWheelSection.classList.add('fade-in-up');
  setRestaurantLoading(true);
  searchRestaurantsByFoodType(selectedFoodType);
}

async function performPaginatedTextSearch(service, request, maxPages = 3, signal) {
  const all = [];
  let pagesSeen = 0;
  return new Promise((resolve) => {
    const handle = (results, status, pagination) => {
      if (signal?.aborted) return resolve(all);
      pagesSeen++;
      if (status === google.maps.places.PlacesServiceStatus.OK && results?.length) {
        all.push(...results);
      }
      if (pagination?.hasNextPage && pagesSeen < maxPages) {
        setTimeout(() => {
          if (signal?.aborted) return resolve(all);
          pagination.nextPage();
        }, 300);
      } else {
        resolve(all);
      }
    };
    service.textSearch(request, handle);
  });
}

async function performPaginatedNearbySearch(service, request, maxPages = 3, signal) {
  const all = [];
  let pagesSeen = 0;
  return new Promise((resolve) => {
    const handle = (results, status, pagination) => {
      if (signal?.aborted) return resolve(all);
      pagesSeen++;
      if (status === google.maps.places.PlacesServiceStatus.OK && results?.length) {
        all.push(...results);
      }
      if (pagination?.hasNextPage && pagesSeen < maxPages) {
        setTimeout(() => {
          if (signal?.aborted) return resolve(all);
          pagination.nextPage();
        }, 300);
      } else {
        resolve(all);
      }
    };
    service.nearbySearch(request, handle);
  });
}

async function ensureGoogleMapsReady(timeoutMs = 8000) {
  if (typeof google !== 'undefined' && google.maps && google.maps.places) return true;
  if (window.GMAPS_READY) return true;
  return new Promise((resolve) => {
    let settled = false;
    const onReady = () => { if (!settled) { settled = true; resolve(true); } };
    const timer = setTimeout(() => { if (!settled) { settled = true; resolve(false); } }, timeoutMs);
    document.addEventListener('gmaps:ready', () => { clearTimeout(timer); onReady(); }, { once: true });
  });
}

async function searchRestaurantsByFoodType(foodType) {
  if (!userLocation) return;

  if (activeSearchAbort) {
    activeSearchAbort.abort();
  }
  activeSearchAbort = new AbortController();
  const { signal } = activeSearchAbort;

  try {
    const ready = await ensureGoogleMapsReady(8000);
    if (!ready || typeof google === 'undefined' || !google.maps || !google.maps.places) {
      throw new Error('Google Maps API not loaded');
    }

    const service = getPlacesService();

    const distance = parseInt(document.getElementById('distanceRange').value, 10);
    const minRating = parseFloat(document.getElementById('minRating').value);
    const minReviews = parseInt(document.getElementById('minReviews').value, 10);
    const meters = distance * 1609.34;
    const openNow = document.getElementById('openNowFilter')?.checked === true;

    

    const cacheKey = `${makeCacheKey(foodType, distance, minRating, minReviews)}::open=${openNow ? 1 : 0}`;

    if (resultsCache.has(cacheKey)) {
      filteredRestaurants = resultsCache.get(cacheKey);
      createWheelSegments('restaurantWheel', filteredRestaurants, 'restaurant');
      setRestaurantLoading(false);
      displayRestaurants(filteredRestaurants, true, foodType);
      return;
    }

    let allResults = [];

    const textSearchRequest1 = {
      query: `${foodType} restaurants`,
      location: { lat: userLocation.latitude, lng: userLocation.longitude },
      radius: meters,
      openNow
    };
    const textResults1 = await performPaginatedTextSearch(service, textSearchRequest1, 3, signal);
    if (signal.aborted) return;
    if (textResults1?.length) allResults = allResults.concat(textResults1);

    const textSearchRequest2 = {
      query: foodType,
      location: { lat: userLocation.latitude, lng: userLocation.longitude },
      radius: meters,
      openNow
    };
    const textResults2 = await performPaginatedTextSearch(service, textSearchRequest2, 3, signal);
    if (signal.aborted) return;
    if (textResults2?.length) allResults = allResults.concat(textResults2);

    if (allResults.length === 0) {
      const nearbySearchRequest = {
        location: { lat: userLocation.latitude, lng: userLocation.longitude },
        radius: meters,
        type: 'restaurant',
        openNow
      };
      const nearbyResults = await performPaginatedNearbySearch(service, nearbySearchRequest, 3, signal);
      if (signal.aborted) return;
      if (nearbyResults?.length) allResults = allResults.concat(nearbyResults);
    }

    if (foodType.toLowerCase() === 'burgers' && allResults.length < 10) {
      const burgerChains = ['in-n-out','in n out','habit burger','five guys','wendys','mcdonalds','burger king','shake shack'];
      for (const chain of burgerChains) {
        if (signal.aborted) return;
        const chainReq = {
          query: chain,
          location: { lat: userLocation.latitude, lng: userLocation.longitude },
          radius: meters,
          openNow
        };
        const chainResults = await performPaginatedTextSearch(service, chainReq, 2, signal);
        if (signal.aborted) return;
        if (chainResults?.length) allResults = allResults.concat(chainResults);
      }
    }

    let uniqueResults = allResults.filter((p, idx, arr) => idx === arr.findIndex((x) => x.place_id === p.place_id));
    if (openNow) {
      uniqueResults = uniqueResults.filter(p => p.opening_hours?.open_now !== false);
    }
    
    if (!uniqueResults.length) {
      setRestaurantLoading(false);
      alert(`No ${foodType} restaurants found in your area. Try increasing the search radius or spinning the wheel again.`);
      return;
    }

    const cosLat1 = Math.cos(userLocation.latitude * Math.PI / 180);
    const foodTypeRestaurants = uniqueResults.map((place) => {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const dist = calculateDistanceFast(userLocation.latitude, userLocation.longitude, lat, lng, cosLat1);
      return {
        id: place.place_id,
        name: place.name || 'Restaurant',
        rating: typeof place.rating === 'number' ? place.rating : null,
        reviews: Number.isInteger(place.user_ratings_total) ? place.user_ratings_total : 0,
        distance: dist.toFixed(1),
        foodTypes: extractFoodTypesFromGooglePlace(place),
        address: place.formatted_address || place.vicinity || 'Address not available',
        phone: 'Phone not available',
        _lat: lat,
        _lng: lng
      };
    });

    const filteredFoodTypeRestaurants = foodTypeRestaurants.filter((r) => {
      const withinDist = parseFloat(r.distance) <= distance;
      const meetsRating = r.rating === null ? true : r.rating >= minRating;
      const meetsReviews = r.reviews >= minReviews;
      return withinDist && meetsRating && meetsReviews;
    });

    if (!filteredFoodTypeRestaurants.length) {
      setRestaurantLoading(false);
      alert(`No ${foodType} restaurants found matching your criteria. Try adjusting your filters or spinning the wheel again.`);
      return;
    }

    const sorted = filteredFoodTypeRestaurants.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    filteredRestaurants = sorted;
    resultsCache.set(cacheKey, filteredRestaurants);

    createWheelSegments('restaurantWheel', filteredRestaurants, 'restaurant');
    setRestaurantLoading(false);

    displayRestaurants(sorted, true, foodType);

    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';
    resultsSection.classList.add('fade-in-up');
    setTimeout(() => resultsSection.classList.remove('fade-in-up'), 500);
  } catch (error) {
    if (error.name === 'AbortError') return;
    setRestaurantLoading(false);
    const errorMessage = getErrorMessage(error);
    alert(`Error searching for ${foodType} restaurants: ${errorMessage}`);
  }
}

function spinRestaurantWheel() {
  if (!filteredRestaurants.length) {
    alert(`No restaurants available for ${selectedFoodTypeFromWheel || 'the selected food type'}. Try spinning the food type wheel again or adjust your filters.`);
    return;
  }

  const wheel = document.getElementById('restaurantWheel');
  const result = document.getElementById('restaurantResult');
  const selectedRestaurantSpan = document.getElementById('selectedRestaurant');
  const restaurantDetails = document.getElementById('restaurantDetails');

  result.style.display = 'none';

  createWheelSegments('restaurantWheel', filteredRestaurants, 'restaurant');

  wheel.classList.add('spinning');

  const segmentAngle = 360 / filteredRestaurants.length;
  const randomSegment = Math.floor(Math.random() * filteredRestaurants.length);
  const finalRotation = 3600 + (randomSegment * segmentAngle) + (segmentAngle / 2);

  const wheelSegments = document.getElementById('restaurantWheelSegments');
  setTimeout(() => { wheelSegments.style.transform = `rotate(${finalRotation}deg)`; }, 50);

  const normalizedRotation = finalRotation % 360;
  const segmentIndex = Math.floor(((360 - normalizedRotation) / segmentAngle)) % filteredRestaurants.length;
  const selectedRestaurant = filteredRestaurants[segmentIndex];

  let currentIndex = 0;
  const spinDuration = 4000;
  const intervalTime = 200;
  const totalIntervals = Math.floor(spinDuration / intervalTime);
  let intervalCount = 0;

  const spinInterval = setInterval(() => {
    const currentRestaurant = filteredRestaurants[currentIndex % filteredRestaurants.length];
    selectedRestaurantSpan.textContent = currentRestaurant.name;
    selectedRestaurantSpan.classList.add('wheel-spinning-text','scale-up');
    setTimeout(() => selectedRestaurantSpan.classList.remove('scale-up'), 50);

    currentIndex++;
    intervalCount++;

    if (intervalCount >= totalIntervals) {
      clearInterval(spinInterval);

      selectedRestaurantSpan.textContent = selectedRestaurant.name;
      selectedRestaurantSpan.classList.add('final-result');

      wheel.classList.remove('spinning');

      restaurantDetails.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> Loading details…</p>`;

      const service = getPlacesService();
      getPlaceDetails(service, selectedRestaurant.id).then((details) => {
        const address = details?.formatted_address || selectedRestaurant.address || 'Address not available';
        const phone = details?.formatted_phone_number || 'Phone not available';
        const starsCount = typeof selectedRestaurant.rating === 'number' ? Math.floor(selectedRestaurant.rating) : 0;
        const stars = '★'.repeat(starsCount) + '☆'.repeat(5 - starsCount);
        const ratingText = typeof selectedRestaurant.rating === 'number' ? selectedRestaurant.rating.toFixed(1) : 'N/A';
        const googleMapsLink =
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ' ' + selectedRestaurant.name)}`;

        restaurantDetails.innerHTML = `
          <p><strong>Rating:</strong> ${stars} ${ratingText}</p>
          <p><strong>Reviews:</strong> ${selectedRestaurant.reviews}</p>
          <p><strong>Distance:</strong> ${selectedRestaurant.distance} miles</p>
          <p><strong>Address:</strong> <a href="${googleMapsLink}" target="_blank" rel="noopener noreferrer">${address} <i class="fas fa-external-link-alt"></i></a></p>
          <p><strong>Phone:</strong> ${
            phone && phone !== 'Phone not available'
              ? `<a href="tel:${phone.replace(/\D/g, '')}">${phone}</a>`
              : 'Phone not available'
          }</p>
          <p><strong>Food Types:</strong> ${selectedRestaurant.foodTypes.join(', ')}</p>
        `;
      });

      result.style.display = 'block';
      result.classList.add('fade-in-up');

      setTimeout(() => selectedRestaurantSpan.classList.remove('final-result'), 1000);
    }
  }, intervalTime);
}

function createWheelSegments(wheelId, items, segmentType = 'food') {
  const wheelSegments = document.getElementById(wheelId + 'Segments');
  if (!wheelSegments) return;

  wheelSegments.innerHTML = '';
  if (!items || items.length === 0) {
    return;
  }

  const colors = [
    '#ff6b6b','#4ecdc4','#45b7d1','#96ceb4','#feca57','#ff9ff3',
    '#54a0ff','#5f27cd','#00d2d3','#ff9f43','#10ac84','#ee5a24',
    '#ff7675','#74b9ff','#a29bfe','#fd79a8','#fdcb6e','#6c5ce7'
  ];

  const segmentAngle = 360 / items.length;
  let gradientStops = '';

  items.forEach((_, index) => {
    const startAngle = index * segmentAngle;
    const endAngle = (index + 1) * segmentAngle;
    const color = colors[index % colors.length];
    gradientStops += `${color} ${startAngle}deg, ${color} ${endAngle}deg`;
    if (index < items.length - 1) gradientStops += ', ';
  });

  wheelSegments.style.background = `conic-gradient(${gradientStops})`;
  wheelSegments.style.transform = 'rotate(0deg)';

  items.forEach((item, index) => {
    const textElement = document.createElement('div');
    textElement.className = 'wheel-segment-text';
    textElement.textContent = (segmentType === 'food') ? item : (item.name || item);

    const angle = (index * segmentAngle) + (segmentAngle / 2);
    const radius = 35;
    const x = 50 + radius * Math.cos((angle - 90) * Math.PI / 180);
    const y = 50 + radius * Math.sin((angle - 90) * Math.PI / 180);

    textElement.style.position = 'absolute';
    textElement.style.left = `${x}%`;
    textElement.style.top = `${y}%`;
    textElement.style.transform = `translate(-50%, -50%)`;
    textElement.style.transformOrigin = 'center';

    wheelSegments.appendChild(textElement);
  });
}

function showSection(sectionId) {
  document.querySelectorAll('section').forEach((s) => { s.style.display = 'none'; });
  document.getElementById(sectionId).style.display = 'block';
  document.getElementById(sectionId).classList.add('fade-in-up');
}
function hideSection(sectionId) {
  document.getElementById(sectionId).style.display = 'none';
}
