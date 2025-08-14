// Global variables
let userLocation = null;
let restaurants = [];
let selectedFoodTypes = [];
let filteredRestaurants = [];
let selectedFoodTypeFromWheel = null; // Selected food type from the wheel

// Food types for the wheel
const foodTypes = [
  'Italian','Chinese','Mexican','Japanese','Indian','Thai',
  'American','Mediterranean','Greek','French','Korean','Vietnamese',
  'Pizza','Burgers','Sushi','BBQ','Seafood','Steakhouse',
  'Vegetarian','Vegan','Desserts','Coffee','Fast Food','Fine Dining'
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
  initializeApp();
});

function initializeApp() {
  setupEventListeners();
  populateFoodTypes();

  // Geolocation availability indicator
  if (navigator.geolocation) {
    document.getElementById('locationStatus').textContent = 'Click the button to get your location';
  } else {
    document.getElementById('locationStatus').textContent = 'Geolocation is not supported by this browser';
    document.getElementById('getLocationBtn').disabled = true;
  }
}

function setupEventListeners() {
  // Location button
  document.getElementById('getLocationBtn').addEventListener('click', getLocation);

  // Distance range slider
  document.getElementById('distanceRange').addEventListener('input', updateDistanceValue);

  // Find restaurants button
  document.getElementById('findRestaurantsBtn').addEventListener('click', findRestaurants);

  // Spin buttons
  document.getElementById('spinFoodTypeBtn').addEventListener('click', spinFoodTypeWheel);
  document.getElementById('spinRestaurantBtn').addEventListener('click', spinRestaurantWheel);

  // Touch feedback
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

  // Animation feedback
  element.style.animation = 'bounceIn 0.3s ease-out';
  setTimeout(() => { element.style.animation = ''; }, 300);

  console.log('[Filter] Selected food types:', selectedFoodTypes);
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
      userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      console.log('✅ Location acquired:', userLocation);

      displayLocation(userLocation);
      getAddressFromCoords(userLocation);

      const filtersSection = document.getElementById('filtersSection');
      filtersSection.style.display = 'block';
      filtersSection.classList.add('fade-in-up');

      locationStatus.textContent = 'Location found!';
      getLocationBtn.disabled = false;
    },
    (error) => {
      console.error('Error getting location:', error);
      locationStatus.textContent = 'Error getting location. Using demo coords (NYC).';
      getLocationBtn.disabled = false;

      // Fallback demo location (NYC)
      userLocation = { latitude: 40.7128, longitude: -74.0060 };
      displayLocation(userLocation);
      const filtersSection = document.getElementById('filtersSection');
      filtersSection.style.display = 'block';
      filtersSection.classList.add('fade-in-up');
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1`,
      { signal: controller.signal, headers: { 'Accept-Language': 'en-US' } }
    );
    const data = await res.json();
    if (data.display_name) {
      document.getElementById('address').textContent = data.display_name;
    } else {
      document.getElementById('address').textContent = 'Address not available';
    }
  } catch (e) {
    console.warn('Nominatim failed, using coords only', e);
    document.getElementById('address').textContent = `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
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
    console.log('✅ System ready - will search for restaurants when food type wheel is spun');

    restaurants = [];
    filteredRestaurants = [];

    // Show food type wheel section
    const foodTypeWheelSection = document.getElementById('foodTypeWheelSection');
    foodTypeWheelSection.style.display = 'block';
    foodTypeWheelSection.classList.add('fade-in-up');

    const itemsForWheel = selectedFoodTypes.length > 0 ? selectedFoodTypes : foodTypes;
    createWheelSegments('foodTypeWheel', itemsForWheel, 'food');
  } catch (error) {
    console.error('Error preparing system:', error);
    const errorMessage = getErrorMessage(error);
    alert(`Error: ${errorMessage}`);
    loadingSection.style.display = 'none';
    filtersSection.style.display = 'block';
  } finally {
    loadingSection.style.display = 'none';
  }
}

// Friendly error mapping
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

// Get detailed place information
async function getPlaceDetails(service, placeId) {
  return new Promise((resolve) => {
    const request = {
      placeId,
      fields: ['formatted_address','formatted_phone_number','types','website','opening_hours']
    };
    service.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) resolve(place);
      else resolve(null);
    });
  });
}

// Extract food types from Google Place data
function extractFoodTypesFromGooglePlace(place, details) {
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
    // Burgers
    'burger':'Burgers','burgers':'Burgers','hamburger':'Burgers','cheeseburger':'Burgers',
    'in-n-out':'Burgers','in n out':'Burgers','habit':'Burgers','five guys':'Burgers',
    'wendy':'Burgers','mcdonald':'Burgers','burger king':'Burgers','shake shack':'Burgers',
    // Pizza
    'pizza':'Pizza','pizzeria':'Pizza','domino':'Pizza','pizza hut':'Pizza','papa john':'Pizza','little caesar':'Pizza',
    // Chinese
    'chinese':'Chinese','mandarin':'Chinese','szechuan':'Chinese','sichuan':'Chinese','dim sum':'Chinese',
    // Mexican
    'mexican':'Mexican','taco':'Mexican','burrito':'Mexican','enchilada':'Mexican','quesadilla':'Mexican','chipotle':'Mexican',
    // Italian
    'italian':'Italian','pasta':'Italian','spaghetti':'Italian','lasagna':'Italian','ravioli':'Italian','olive garden':'Italian',
    // Japanese
    'japanese':'Japanese','sushi':'Sushi','sashimi':'Sushi','ramen':'Japanese','teriyaki':'Japanese','tempura':'Japanese',
    // Thai
    'thai':'Thai','pad thai':'Thai','curry':'Thai','tom yum':'Thai',
    // Indian
    'indian':'Indian','tandoori':'Indian','naan':'Indian','biryani':'Indian',
    // Seafood
    'seafood':'Seafood','fish':'Seafood','shrimp':'Seafood','crab':'Seafood','lobster':'Seafood','oyster':'Seafood',
    // BBQ
    'bbq':'BBQ','barbecue':'BBQ','smoke':'BBQ','smoked':'BBQ',
    // Coffee
    'coffee':'Coffee','starbucks':'Coffee','dunkin':'Coffee','peet':'Coffee',
    // Steakhouse
    'steak':'Steakhouse','steakhouse':'Steakhouse','outback':'Steakhouse','longhorn':'Steakhouse','texas roadhouse':'Steakhouse',
    // Other cuisines
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

// Distance between two coords (miles)
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

    list.forEach((r, idx) => {
      const card = createRestaurantCard(r);
      card.style.animationDelay = `${idx * 0.1}s`;
      restaurantsGrid.appendChild(card);
    });
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

  // Build wheel from selected types
  createWheelSegments('foodTypeWheel', selectedFoodTypes, 'food');

  // Spin animation
  wheel.classList.add('spinning');

  const segmentAngle = 360 / selectedFoodTypes.length;
  const randomSegment = Math.floor(Math.random() * selectedFoodTypes.length);
  const finalRotation = 3600 + (randomSegment * segmentAngle) + (segmentAngle / 2);

  const wheelSegments = document.getElementById('foodTypeWheelSegments');
  setTimeout(() => { wheelSegments.style.transform = `rotate(${finalRotation}deg)`; }, 50);

  const normalizedRotation = finalRotation % 360;
  const segmentIndex = Math.floor(((360 - normalizedRotation) / segmentAngle)) % selectedFoodTypes.length;
  const selectedType = selectedFoodTypes[segmentIndex];

  // Fancy text cycling during spin
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
      console.log(`[Wheel] Food type chosen: ${selectedType}`);

      filterRestaurantsByWheelSelection(selectedType);

      const restaurantWheelSection = document.getElementById('restaurantWheelSection');
      restaurantWheelSection.style.display = 'block';
      restaurantWheelSection.classList.add('fade-in-up');

      setTimeout(() => selectedFoodTypeSpan.classList.remove('final-result'), 1000);
    }
  }, intervalTime);
}

function filterRestaurantsByWheelSelection(selectedFoodType) {
  console.log(`=== SEARCHING FOR ${selectedFoodType} RESTAURANTS ===`);
  console.log(`🎯 Efficient search: Only searching for ${selectedFoodType} restaurants`);
  searchRestaurantsByFoodType(selectedFoodType);
}

// --------- Pagination Helpers (Fixed) ---------

// Proper Text Search pagination (calls pagination.nextPage())
async function performPaginatedTextSearch(service, request, maxPages = 3) {
  const all = [];
  let pagesSeen = 0;

  return new Promise((resolve) => {
    const handle = (results, status, pagination) => {
      pagesSeen++;
      if (status === google.maps.places.PlacesServiceStatus.OK && results?.length) {
        console.log(`✅ TextSearch page ${pagesSeen}: ${results.length} results`);
        all.push(...results);
      } else {
        console.log(`⚠️ TextSearch page ${pagesSeen}: no results (status=${status})`);
      }

      if (pagination?.hasNextPage && pagesSeen < maxPages) {
        setTimeout(() => {
          console.log(`➡️ Requesting TextSearch nextPage() (${pagesSeen + 1}/${maxPages})`);
          pagination.nextPage();
        }, 300);
      } else {
        resolve(all);
      }
    };

    console.log(`📍 TextSearch page 1/${maxPages}`, request);
    service.textSearch(request, handle);
  });
}

// Proper Nearby Search pagination (calls pagination.nextPage())
async function performPaginatedNearbySearch(service, request, maxPages = 3) {
  const all = [];
  let pagesSeen = 0;

  return new Promise((resolve) => {
    const handle = (results, status, pagination) => {
      pagesSeen++;
      if (status === google.maps.places.PlacesServiceStatus.OK && results?.length) {
        console.log(`✅ NearbySearch page ${pagesSeen}: ${results.length} results`);
        all.push(...results);
      } else {
        console.log(`⚠️ NearbySearch page ${pagesSeen}: no results (status=${status})`);
      }

      if (pagination?.hasNextPage && pagesSeen < maxPages) {
        setTimeout(() => {
          console.log(`➡️ Requesting NearbySearch nextPage() (${pagesSeen + 1}/${maxPages})`);
          pagination.nextPage();
        }, 300);
      } else {
        resolve(all);
      }
    };

    console.log(`📍 NearbySearch page 1/${maxPages}`, request);
    service.nearbySearch(request, handle);
  });
}

// Ensure Maps Places is ready
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
  if (!userLocation) {
    console.error('No user location available');
    return;
  }

  try {
    console.log(`🔍 EFFICIENT SEARCH: "${foodType}"`);
    console.log(`📍 User location: ${userLocation.latitude}, ${userLocation.longitude}`);

    const ready = await ensureGoogleMapsReady(8000);
    if (!ready || typeof google === 'undefined' || !google.maps || !google.maps.places) {
      throw new Error('Google Maps API not loaded');
    }

    // Temporary map is required by Places Service
    const tempMap = new google.maps.Map(document.createElement('div'), {
      center: { lat: userLocation.latitude, lng: userLocation.longitude },
      zoom: 15
    });
    const service = new google.maps.places.PlacesService(tempMap);

    // Filters
    const distance = parseInt(document.getElementById('distanceRange').value, 10);
    const minRating = parseFloat(document.getElementById('minRating').value);
    const minReviews = parseInt(document.getElementById('minReviews').value, 10);
    const meters = distance * 1609.34;

    console.log(`🎯 Search parameters: distance=${distance}mi, minRating=${minRating}, minReviews=${minReviews}`);

    let allResults = [];

    // Strategy 1: "<foodType> restaurants" text search (radius-biased) with pagination
    console.log(`🔍 Strategy 1: "${foodType} restaurants" (paginated)`);
    try {
      const textSearchRequest1 = {
        query: `${foodType} restaurants`,
        location: { lat: userLocation.latitude, lng: userLocation.longitude },
        radius: meters
      };
      const textResults1 = await performPaginatedTextSearch(service, textSearchRequest1, 3);
      if (textResults1?.length) allResults = allResults.concat(textResults1);
    } catch (e) { console.log(`⚠️ Strategy 1 failed: ${e.message}`); }

    // Strategy 2: "<foodType>" text search (radius-biased) with pagination
    console.log(`🔍 Strategy 2: "${foodType}" (paginated)`);
    try {
      const textSearchRequest2 = {
        query: foodType,
        location: { lat: userLocation.latitude, lng: userLocation.longitude },
        radius: meters
      };
      const textResults2 = await performPaginatedTextSearch(service, textSearchRequest2, 3);
      if (textResults2?.length) allResults = allResults.concat(textResults2);
    } catch (e) { console.log(`⚠️ Strategy 2 failed: ${e.message}`); }

    // Strategy 3: Nearby restaurants fallback (paginated)
    if (allResults.length === 0) {
      console.log('🔄 Strategy 3: NearbySearch fallback (restaurants)');
      try {
        const nearbySearchRequest = {
          location: { lat: userLocation.latitude, lng: userLocation.longitude },
          radius: meters,
          type: 'restaurant'
        };
        const nearbyResults = await performPaginatedNearbySearch(service, nearbySearchRequest, 3);
        if (nearbyResults?.length) allResults = allResults.concat(nearbyResults);
      } catch (e) { console.log(`⚠️ Strategy 3 failed: ${e.message}`); }
    }

    // Strategy 4: Specific chain booster for Burgers
    if (foodType.toLowerCase() === 'burgers' && allResults.length < 10) {
      console.log('🔍 Strategy 4: Burger chains (paginated)');
      const burgerChains = ['in-n-out','in n out','habit burger','five guys','wendys','mcdonalds','burger king','shake shack'];
      for (const chain of burgerChains) {
        try {
          const chainReq = {
            query: chain,
            location: { lat: userLocation.latitude, lng: userLocation.longitude },
            radius: meters
          };
          const chainResults = await performPaginatedTextSearch(service, chainReq, 2);
          if (chainResults?.length) allResults = allResults.concat(chainResults);
        } catch (e) { console.log(`⚠️ Chain search failed (${chain}): ${e.message}`); }
      }
    }

    // Deduplicate by place_id
    const uniqueResults = allResults.filter((p, idx, arr) => idx === arr.findIndex((x) => x.place_id === p.place_id));
    console.log(`📊 Total unique results found: ${uniqueResults.length} (from ${allResults.length} total results)`);

    if (!uniqueResults.length) {
      console.log(`❌ No ${foodType} restaurants found in your area`);
      alert(`No ${foodType} restaurants found in your area. Try increasing the search radius or spinning the wheel again.`);
      return;
    }

    // Enrich each place
    const foodTypeRestaurants = await Promise.all(uniqueResults.map(async (place) => {
      const details = await getPlaceDetails(service, place.place_id);
      const restaurantDistance = calculateDistance(
        userLocation.latitude, userLocation.longitude,
        place.geometry.location.lat(), place.geometry.location.lng()
      );

      return {
        id: place.place_id,
        name: place.name || 'Restaurant',
        rating: typeof place.rating === 'number' ? place.rating : null,
        reviews: Number.isInteger(place.user_ratings_total) ? place.user_ratings_total : 0,
        distance: restaurantDistance.toFixed(1),
        foodTypes: extractFoodTypesFromGooglePlace(place, details),
        address: details?.formatted_address || place.formatted_address || place.vicinity || 'Address not available',
        phone: details?.formatted_phone_number || 'Phone not available'
      };
    }));

    console.log(`📊 Processed ${foodTypeRestaurants.length} restaurants with details`);

    // Apply filters
    const filteredFoodTypeRestaurants = foodTypeRestaurants.filter((r) => {
      const withinDist = parseFloat(r.distance) <= distance;
      const meetsRating = r.rating === null ? true : r.rating >= minRating;
      const meetsReviews = r.reviews >= minReviews;
      return withinDist && meetsRating && meetsReviews;
    });

    console.log(`[Results] After filters: ${filteredFoodTypeRestaurants.length} / ${foodTypeRestaurants.length} (${foodType})`);

    if (!filteredFoodTypeRestaurants.length) {
      alert(`No ${foodType} restaurants found matching your criteria. Try adjusting your filters or spinning the wheel again.`);
      return;
    }

    // Sort by distance and update wheels/results
    const sorted = filteredFoodTypeRestaurants.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    filteredRestaurants = sorted;

    displayRestaurants(sorted, true, foodType);

    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';
    resultsSection.classList.add('fade-in-up');
    setTimeout(() => resultsSection.classList.remove('fade-in-up'), 500);

    console.log(`✅ Successfully found and displayed ${sorted.length} ${foodType} restaurants`);
  } catch (error) {
    console.error('Error searching for restaurants by food type:', error);
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

  // Build wheel from filtered restaurants
  createWheelSegments('restaurantWheel', filteredRestaurants, 'restaurant');

  // Spin
  wheel.classList.add('spinning');

  const segmentAngle = 360 / filteredRestaurants.length;
  const randomSegment = Math.floor(Math.random() * filteredRestaurants.length);
  const finalRotation = 3600 + (randomSegment * segmentAngle) + (segmentAngle / 2);

  const wheelSegments = document.getElementById('restaurantWheelSegments');
  setTimeout(() => { wheelSegments.style.transform = `rotate(${finalRotation}deg)`; }, 50);

  const normalizedRotation = finalRotation % 360;
  const segmentIndex = Math.floor(((360 - normalizedRotation) / segmentAngle)) % filteredRestaurants.length;
  const selectedRestaurant = filteredRestaurants[segmentIndex];

  // Cycling text during spin
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

      const googleMapsLink =
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedRestaurant.address + ' ' + selectedRestaurant.name)}`;

      const starsCount = typeof selectedRestaurant.rating === 'number' ? Math.floor(selectedRestaurant.rating) : 0;
      const stars = '★'.repeat(starsCount) + '☆'.repeat(5 - starsCount);
      const ratingText = typeof selectedRestaurant.rating === 'number' ? selectedRestaurant.rating.toFixed(1) : 'N/A';

      restaurantDetails.innerHTML = `
        <p><strong>Rating:</strong> ${stars} ${ratingText}</p>
        <p><strong>Reviews:</strong> ${selectedRestaurant.reviews}</p>
        <p><strong>Distance:</strong> ${selectedRestaurant.distance} miles</p>
        <p><strong>Address:</strong> <a href="${googleMapsLink}" target="_blank" rel="noopener noreferrer">${selectedRestaurant.address} <i class="fas fa-external-link-alt"></i></a></p>
        <p><strong>Phone:</strong> ${
          selectedRestaurant.phone && selectedRestaurant.phone !== 'Phone not available'
            ? `<a href="tel:${selectedRestaurant.phone.replace(/\D/g, '')}">${selectedRestaurant.phone}</a>`
            : 'Phone not available'
        }</p>
        <p><strong>Food Types:</strong> ${selectedRestaurant.foodTypes.join(', ')}</p>
      `;

      result.style.display = 'block';
      result.classList.add('fade-in-up');

      setTimeout(() => selectedRestaurantSpan.classList.remove('final-result'), 1000);
    }
  }, intervalTime);
}

// Create wheel segments + labels (labels remain upright)
function createWheelSegments(wheelId, items, segmentType = 'food') {
  const wheelSegments = document.getElementById(wheelId + 'Segments');
  if (!wheelSegments) return;

  wheelSegments.innerHTML = '';
  if (!items || items.length === 0) {
    console.warn(`[Wheel] No items for ${wheelId}`);
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

  // Text overlays (keep upright: translate only)
  items.forEach((item, index) => {
    const textElement = document.createElement('div');
    textElement.className = 'wheel-segment-text';
    textElement.textContent = (segmentType === 'food') ? item : (item.name || item);

    const angle = (index * segmentAngle) + (segmentAngle / 2);
    const radius = 35; // percentage of wheel
    const x = 50 + radius * Math.cos((angle - 90) * Math.PI / 180);
    const y = 50 + radius * Math.sin((angle - 90) * Math.PI / 180);

    textElement.style.position = 'absolute';
    textElement.style.left = `${x}%`;
    textElement.style.top = `${y}%`;
    textElement.style.transform = `translate(-50%, -50%)`; // no rotate to keep upright
    textElement.style.transformOrigin = 'center';

    wheelSegments.appendChild(textElement);
  });
}

// Utility: show/hide sections (not heavily used but handy)
function showSection(sectionId) {
  document.querySelectorAll('section').forEach((s) => { s.style.display = 'none'; });
  document.getElementById(sectionId).style.display = 'block';
  document.getElementById(sectionId).classList.add('fade-in-up');
}
function hideSection(sectionId) {
  document.getElementById(sectionId).style.display = 'none';
}
