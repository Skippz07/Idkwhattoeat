// Global variables
let userLocation = null;
let restaurants = [];
let selectedFoodTypes = [];
let filteredRestaurants = [];
let selectedFoodTypeFromWheel = null; // New variable to store the selected food type from wheel

// Food types for the wheel
const foodTypes = [
    'Italian', 'Chinese', 'Mexican', 'Japanese', 'Indian', 'Thai',
    'American', 'Mediterranean', 'Greek', 'French', 'Korean', 'Vietnamese',
    'Pizza', 'Burgers', 'Sushi', 'BBQ', 'Seafood', 'Steakhouse',
    'Vegetarian', 'Vegan', 'Desserts', 'Coffee', 'Fast Food', 'Fine Dining'
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set up event listeners
    setupEventListeners();
    
    // Populate food types
    populateFoodTypes();
    
    // Check if location is already available
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
    
    // Add touch event listeners for mobile
    addTouchEventListeners();
}

function addTouchEventListeners() {
    // Add touch feedback for buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    });
    
    // Add touch feedback for food type items
    const foodTypeItems = document.querySelectorAll('.food-type-item');
    foodTypeItems.forEach(item => {
        item.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        item.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    });
}

function populateFoodTypes() {
    const foodTypesGrid = document.getElementById('foodTypesGrid');
    foodTypesGrid.innerHTML = '';
    
    foodTypes.forEach(type => {
        const foodTypeItem = document.createElement('div');
        foodTypeItem.className = 'food-type-item';
        foodTypeItem.textContent = type;
        foodTypeItem.addEventListener('click', () => toggleFoodType(type, foodTypeItem));
        foodTypesGrid.appendChild(foodTypeItem);
    });
}

function toggleFoodType(type, element) {
    if (selectedFoodTypes.includes(type)) {
        selectedFoodTypes = selectedFoodTypes.filter(t => t !== type);
        element.classList.remove('selected');
    } else {
        selectedFoodTypes.push(type);
        element.classList.add('selected');
    }
    
    // Add animation feedback
    element.style.animation = 'bounceIn 0.3s ease-out';
    setTimeout(() => {
        element.style.animation = '';
    }, 300);
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
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                userLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                
                displayLocation(userLocation);
                getAddressFromCoords(userLocation);
                
                // Show filters section with animation
                const filtersSection = document.getElementById('filtersSection');
                filtersSection.style.display = 'block';
                filtersSection.classList.add('fade-in-up');
                
                locationStatus.textContent = 'Location found!';
                getLocationBtn.disabled = false;
            },
            error => {
                console.error('Error getting location:', error);
                locationStatus.textContent = 'Error getting location. Please try again.';
                getLocationBtn.disabled = false;
                
                // For demo purposes, use a default location (New York City)
                userLocation = {
                    latitude: 40.7128,
                    longitude: -74.0060
                };
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
    } else {
        locationStatus.textContent = 'Geolocation is not supported by this browser';
    }
}

function displayLocation(location) {
    document.getElementById('latitude').textContent = location.latitude.toFixed(6);
    document.getElementById('longitude').textContent = location.longitude.toFixed(6);
    const locationDetails = document.getElementById('locationDetails');
    locationDetails.style.display = 'block';
    locationDetails.classList.add('fade-in');
}

async function getAddressFromCoords(location) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        
        if (data.display_name) {
            document.getElementById('address').textContent = data.display_name;
        }
    } catch (error) {
        console.error('Error getting address:', error);
        document.getElementById('address').textContent = 'Address not available';
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
        // Don't search for restaurants yet - wait for wheel spin
        // This makes the system more efficient by only searching for the specific food type
        console.log('✅ System ready - will search for restaurants when food type wheel is spun');
        
        // Initialize empty arrays - restaurants will be populated when wheel spins
        restaurants = [];
        filteredRestaurants = [];
        
    // Show food type wheel section and pre-populate with currently selected food types (or all by default)
    const foodTypeWheelSection = document.getElementById('foodTypeWheelSection');
    foodTypeWheelSection.style.display = 'block';
    foodTypeWheelSection.classList.add('fade-in-up');

    // If user hasn't selected any yet, show all options so the wheel isn't blank
    const itemsForWheel = selectedFoodTypes.length > 0 ? selectedFoodTypes : foodTypes;
    createWheelSegments('foodTypeWheel', itemsForWheel, 'food');
        
    } catch (error) {
        console.error('Error preparing system:', error);
        
        // Show user-friendly error message
        const errorMessage = getErrorMessage(error);
        alert(`Error: ${errorMessage}`);
        
        // Hide loading and show filters again
        loadingSection.style.display = 'none';
        filtersSection.style.display = 'block';
    } finally {
        loadingSection.style.display = 'none';
    }
}

// Helper function to get user-friendly error messages
function getErrorMessage(error) {
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('REQUEST_DENIED')) {
        return 'Access to Google Places API was denied. Please check your API key and billing setup.';
    } else if (errorMessage.includes('OVER_QUERY_LIMIT')) {
        return 'Google Places API quota exceeded. Please try again later.';
    } else if (errorMessage.includes('INVALID_REQUEST')) {
        return 'Invalid request to Google Places API. Please check your location and filters.';
    } else if (errorMessage.includes('NOT_FOUND')) {
        return 'No restaurants found in your area. Try increasing the search radius.';
    } else if (errorMessage.includes('ZERO_RESULTS')) {
        return 'No restaurants found for this food type in your area. Try a different food type or increase the search radius.';
    } else if (errorMessage.includes('Property radius is invalid')) {
        return 'Search configuration error. Please try refreshing the page.';
    } else if (errorMessage.includes('No restaurants found matching your criteria')) {
        return 'No restaurants found matching your criteria. Try adjusting your filters.';
    } else if (errorMessage.includes('No restaurants found in your area')) {
        return 'No restaurants found in your area. Try increasing the search radius.';
    } else if (errorMessage.includes('Google Maps API not loaded')) {
        return 'Google Maps API failed to load. Please check your internet connection and API key.';
    } else {
        return 'Unable to fetch restaurant data. Please try again later.';
    }
}

// Helper function to get detailed place information
async function getPlaceDetails(service, placeId) {
    return new Promise((resolve, reject) => {
        const request = {
            placeId: placeId,
            fields: ['formatted_address', 'formatted_phone_number', 'types', 'website', 'opening_hours']
        };
        
        service.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                resolve(place);
            } else {
                resolve(null);
            }
        });
    });
}

// Helper function to extract food types from Google Place data
function extractFoodTypesFromGooglePlace(place, details) {
    const foodTypes = [];
    
    // Extract from place types (Google's categorization)
    if (place.types) {
        place.types.forEach(type => {
            // Map Google place types to our food types
            switch (type) {
                case 'restaurant':
                    foodTypes.push('Restaurant');
                    break;
                case 'food':
                    foodTypes.push('Food');
                    break;
                case 'establishment':
                    foodTypes.push('Establishment');
                    break;
                case 'point_of_interest':
                    foodTypes.push('Point of Interest');
                    break;
                case 'meal_takeaway':
                case 'meal_delivery':
                    foodTypes.push('Fast Food');
                    break;
                case 'cafe':
                    foodTypes.push('Coffee');
                    break;
                case 'bar':
                    foodTypes.push('Bar');
                    break;
                case 'bakery':
                    foodTypes.push('Desserts');
                    break;
            }
        });
    }
    
    // Extract from place name using enhanced approach
    const name = place.name?.toLowerCase() || '';
    
    // Enhanced food type detection based on common words and restaurant names
    const commonFoodWords = {
        // Burger-related keywords
        'burger': 'Burgers',
        'burgers': 'Burgers',
        'hamburger': 'Burgers',
        'hamburgers': 'Burgers',
        'cheeseburger': 'Burgers',
        'cheeseburgers': 'Burgers',
        'in-n-out': 'Burgers',
        'in n out': 'Burgers',
        'innout': 'Burgers',
        'habit': 'Burgers',
        'habit burger': 'Burgers',
        'five guys': 'Burgers',
        'fiveguys': 'Burgers',
        'wendy': 'Burgers',
        'wendys': 'Burgers',
        'mcdonald': 'Burgers',
        'mcdonalds': 'Burgers',
        'burger king': 'Burgers',
        'burgerking': 'Burgers',
        'shake shack': 'Burgers',
        'shakeshack': 'Burgers',
        'whataburger': 'Burgers',
        'carls jr': 'Burgers',
        'carlsjr': 'Burgers',
        'jack in the box': 'Burgers',
        'jackinthebox': 'Burgers',
        'sonic': 'Burgers',
        'a&w': 'Burgers',
        'aw': 'Burgers',
        
        // Pizza-related keywords
        'pizza': 'Pizza',
        'pizzeria': 'Pizza',
        'domino': 'Pizza',
        'dominos': 'Pizza',
        'pizza hut': 'Pizza',
        'pizzahut': 'Pizza',
        'papa john': 'Pizza',
        'papajohn': 'Pizza',
        'little caesar': 'Pizza',
        'littlecaesar': 'Pizza',
        
        // Chinese-related keywords
        'chinese': 'Chinese',
        'china': 'Chinese',
        'mandarin': 'Chinese',
        'szechuan': 'Chinese',
        'sichuan': 'Chinese',
        'dim sum': 'Chinese',
        'dimsum': 'Chinese',
        
        // Mexican-related keywords
        'mexican': 'Mexican',
        'taco': 'Mexican',
        'tacos': 'Mexican',
        'burrito': 'Mexican',
        'burritos': 'Mexican',
        'enchilada': 'Mexican',
        'enchiladas': 'Mexican',
        'quesadilla': 'Mexican',
        'quesadillas': 'Mexican',
        'chipotle': 'Mexican',
        'taco bell': 'Mexican',
        'tacobell': 'Mexican',
        'del taco': 'Mexican',
        'deltaco': 'Mexican',
        
        // Italian-related keywords
        'italian': 'Italian',
        'pasta': 'Italian',
        'spaghetti': 'Italian',
        'lasagna': 'Italian',
        'ravioli': 'Italian',
        'olive garden': 'Italian',
        'olivegarden': 'Italian',
        
        // Japanese-related keywords
        'japanese': 'Japanese',
        'sushi': 'Sushi',
        'sashimi': 'Sushi',
        'ramen': 'Japanese',
        'teriyaki': 'Japanese',
        'tempura': 'Japanese',
        'bento': 'Japanese',
        
        // Thai-related keywords
        'thai': 'Thai',
        'pad thai': 'Thai',
        'padthai': 'Thai',
        'curry': 'Thai',
        'tom yum': 'Thai',
        'tomyum': 'Thai',
        
        // Indian-related keywords
        'indian': 'Indian',
        'curry': 'Indian',
        'tandoori': 'Indian',
        'naan': 'Indian',
        'biryani': 'Indian',
        
        // Seafood-related keywords
        'seafood': 'Seafood',
        'fish': 'Seafood',
        'shrimp': 'Seafood',
        'crab': 'Seafood',
        'lobster': 'Seafood',
        'oyster': 'Seafood',
        
        // BBQ-related keywords
        'bbq': 'BBQ',
        'barbecue': 'BBQ',
        'barbecue': 'BBQ',
        'smoke': 'BBQ',
        'smoked': 'BBQ',
        
        // Coffee-related keywords
        'coffee': 'Coffee',
        'starbucks': 'Coffee',
        'dunkin': 'Coffee',
        'dunkin donuts': 'Coffee',
        'dunkindonuts': 'Coffee',
        'peet': 'Coffee',
        'peets': 'Coffee',
        
        // Steakhouse-related keywords
        'steak': 'Steakhouse',
        'steakhouse': 'Steakhouse',
        'outback': 'Steakhouse',
        'longhorn': 'Steakhouse',
        'texas roadhouse': 'Steakhouse',
        'texasroadhouse': 'Steakhouse',
        
        // Other cuisines
        'greek': 'Greek',
        'french': 'French',
        'korean': 'Korean',
        'vietnamese': 'Vietnamese',
        'mediterranean': 'Mediterranean',
        'american': 'American',
        'vegetarian': 'Vegetarian',
        'vegan': 'Vegan',
        'dessert': 'Desserts',
        'bakery': 'Desserts',
        'ice cream': 'Desserts',
        'icecream': 'Desserts'
    };
    
    // Check for common food words in the restaurant name
    for (const [word, foodType] of Object.entries(commonFoodWords)) {
        if (name.includes(word)) {
            foodTypes.push(foodType);
        }
    }
    
    // Remove duplicates
    const uniqueFoodTypes = [...new Set(foodTypes)];
    
    // Default fallback if no specific types found
    if (uniqueFoodTypes.length === 0) {
        uniqueFoodTypes.push('Restaurant');
    }
    
    return uniqueFoodTypes;
}

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function displayRestaurants(restaurants, isFiltered = false, filterType = null) {
    const resultsSection = document.getElementById('resultsSection');
    const restaurantsGrid = document.getElementById('restaurantsGrid');
    const restaurantCount = document.getElementById('restaurantCount');
    
    // Update the count with filter indicator if applicable
    if (isFiltered && filterType) {
        restaurantCount.textContent = `${restaurants.length} (filtered for ${filterType})`;
    } else {
        restaurantCount.textContent = restaurants.length;
    }
    
    restaurantsGrid.innerHTML = '';
    
    if (restaurants.length === 0) {
        restaurantsGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #666;">No restaurants found matching your criteria.</p>';
    } else {
        // Add a note about pagination if we have a good number of results
        if (restaurants.length >= 15) {
            const paginationNote = document.createElement('p');
            paginationNote.style.textAlign = 'center';
            paginationNote.style.gridColumn = '1/-1';
            paginationNote.style.color = '#666';
            paginationNote.style.fontSize = '0.9em';
            paginationNote.style.marginBottom = '1rem';
            paginationNote.innerHTML = `🔍 Found ${restaurants.length} restaurants using enhanced search with pagination`;
            restaurantsGrid.appendChild(paginationNote);
        }
        
        restaurants.forEach((restaurant, index) => {
            const restaurantCard = createRestaurantCard(restaurant);
            restaurantCard.style.animationDelay = `${index * 0.1}s`;
            restaurantsGrid.appendChild(restaurantCard);
        });
    }
    
    resultsSection.style.display = 'block';
    resultsSection.classList.add('fade-in-up');
}

function createRestaurantCard(restaurant) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    
    const stars = '★'.repeat(Math.floor(restaurant.rating)) + '☆'.repeat(5 - Math.floor(restaurant.rating));
    
    card.innerHTML = `
        <h3>${restaurant.name}</h3>
        <div class="rating">${stars} ${restaurant.rating}</div>
        <div class="reviews">${restaurant.reviews} reviews</div>
        <div class="distance">${restaurant.distance} miles away</div>
        <div class="food-types">
            ${restaurant.foodTypes.map(type => `<span class="food-type-tag">${type}</span>`).join('')}
        </div>
    `;
    
    return card;
}

function spinFoodTypeWheel() {
    const wheel = document.getElementById('foodTypeWheel');
    const result = document.getElementById('foodTypeResult');
    const selectedFoodTypeSpan = document.getElementById('selectedFoodType');
    
    // Hide previous result
    result.style.display = 'none';
    
    // Check if user has selected any food types
    if (selectedFoodTypes.length === 0) {
        alert('Please select at least one food type before spinning the wheel.');
        return;
    }
    
    // Create wheel segments with selected food types
    createWheelSegments('foodTypeWheel', selectedFoodTypes, 'food');
    
    // Spin the wheel
    wheel.classList.add('spinning');
    
    // Calculate the final rotation angle (multiple full rotations plus a random segment)
    const segmentAngle = 360 / selectedFoodTypes.length;
    const randomSegment = Math.floor(Math.random() * selectedFoodTypes.length);
    const finalRotation = 3600 + (randomSegment * segmentAngle) + (segmentAngle / 2);
    
    // Apply the final rotation to the wheel segments after a small delay to allow transition
    const wheelSegments = document.getElementById('foodTypeWheelSegments');
    setTimeout(() => {
        wheelSegments.style.transform = `rotate(${finalRotation}deg)`;
    }, 50);
    
    // Determine which segment the needle is pointing to
    // The needle points to the top (0 degrees), so we need to calculate which segment is at the top
    const normalizedRotation = finalRotation % 360;
    // Since the wheel rotates clockwise, the segments move in the opposite direction relative to the needle
    // So we need to reverse the calculation
    const segmentIndex = Math.floor(((360 - normalizedRotation) / segmentAngle)) % selectedFoodTypes.length;
    const selectedType = selectedFoodTypes[segmentIndex];
    
    // Create spinning effect that shows all available options
    let currentIndex = 0;
    const spinDuration = 4000; // 4 seconds
    const intervalTime = 150; // Change every 150ms for smooth effect
    const totalIntervals = Math.floor(spinDuration / intervalTime);
    let intervalCount = 0;
    
    // Start the spinning animation
    const spinInterval = setInterval(() => {
        // Cycle through all selected food types
        const currentType = selectedFoodTypes[currentIndex % selectedFoodTypes.length];
        selectedFoodTypeSpan.textContent = currentType;
        
        // Add a subtle animation effect
        selectedFoodTypeSpan.style.transform = 'scale(1.1)';
        selectedFoodTypeSpan.style.color = '#ff6b6b';
        
        setTimeout(() => {
            selectedFoodTypeSpan.style.transform = 'scale(1)';
            selectedFoodTypeSpan.style.color = '';
        }, 50);
        
        currentIndex++;
        intervalCount++;
        
        // Stop spinning and show final result
        if (intervalCount >= totalIntervals) {
            clearInterval(spinInterval);
            
            // Final result based on where the needle actually points
            selectedFoodTypeSpan.textContent = selectedType;
            selectedFoodTypeSpan.style.transform = 'scale(1.2)';
            selectedFoodTypeSpan.style.color = '#4ecdc4';
            selectedFoodTypeSpan.style.fontWeight = 'bold';
            
            // Remove spinning class
            wheel.classList.remove('spinning');
            
            // Show result
            result.style.display = 'block';
            result.classList.add('fade-in-up');
            
            // Store the selected food type from wheel
            selectedFoodTypeFromWheel = selectedType;
            
            // Filter restaurants based on the selected food type from wheel
            filterRestaurantsByWheelSelection(selectedType);
            
            // Show restaurant wheel section
            const restaurantWheelSection = document.getElementById('restaurantWheelSection');
            restaurantWheelSection.style.display = 'block';
            restaurantWheelSection.classList.add('fade-in-up');
            
            // Reset styles after a moment
            setTimeout(() => {
                selectedFoodTypeSpan.style.transform = '';
                selectedFoodTypeSpan.style.color = '';
                selectedFoodTypeSpan.style.fontWeight = '';
            }, 1000);
        }
    }, intervalTime);
}

function filterRestaurantsByWheelSelection(selectedFoodType) {
    console.log(`=== SEARCHING FOR ${selectedFoodType} RESTAURANTS ===`);
    console.log(`🎯 Efficient search: Only searching for ${selectedFoodType} restaurants`);
    
    // Search for restaurants based on the selected food type from wheel
    searchRestaurantsByFoodType(selectedFoodType);
}

// Helper function to perform paginated text search
async function performPaginatedTextSearch(service, request, maxPages = 3) {
    let allResults = [];
    let currentPage = 0;
    let hasNextPage = true;
    
    while (hasNextPage && currentPage < maxPages) {
        try {
            console.log(`📍 TextSearch page ${currentPage + 1}/${maxPages}`);
            
            const results = await new Promise((resolve, reject) => {
                service.textSearch(request, (results, status, pagination) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                        resolve({ results, pagination });
                    } else {
                        resolve({ results: [], pagination: null });
                    }
                });
            });
            
            if (results.results && results.results.length > 0) {
                allResults = allResults.concat(results.results);
                console.log(`✅ Page ${currentPage + 1}: Found ${results.results.length} results`);
                
                // Check if there are more pages
                if (results.pagination && results.pagination.hasNextPage) {
                    hasNextPage = true;
                    currentPage++;
                    // Wait a bit before making the next request to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 200));
                } else {
                    hasNextPage = false;
                }
            } else {
                hasNextPage = false;
            }
        } catch (error) {
            console.log(`⚠️ TextSearch page ${currentPage + 1} failed: ${error.message}`);
            hasNextPage = false;
        }
    }
    
    return allResults;
}

// Helper function to perform paginated nearby search
async function performPaginatedNearbySearch(service, request, maxPages = 3) {
    let allResults = [];
    let currentPage = 0;
    let hasNextPage = true;
    
    while (hasNextPage && currentPage < maxPages) {
        try {
            console.log(`📍 NearbySearch page ${currentPage + 1}/${maxPages}`);
            
            const results = await new Promise((resolve, reject) => {
                service.nearbySearch(request, (results, status, pagination) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                        resolve({ results, pagination });
                    } else {
                        resolve({ results: [], pagination: null });
                    }
                });
            });
            
            if (results.results && results.results.length > 0) {
                allResults = allResults.concat(results.results);
                console.log(`✅ Page ${currentPage + 1}: Found ${results.results.length} results`);
                
                // Check if there are more pages
                if (results.pagination && results.pagination.hasNextPage) {
                    hasNextPage = true;
                    currentPage++;
                    // Wait a bit before making the next request to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 200));
                } else {
                    hasNextPage = false;
                }
            } else {
                hasNextPage = false;
            }
        } catch (error) {
            console.log(`⚠️ NearbySearch page ${currentPage + 1} failed: ${error.message}`);
            hasNextPage = false;
        }
    }
    
    return allResults;
}

async function ensureGoogleMapsReady(timeoutMs = 5000) {
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
        console.log(`🔍 EFFICIENT SEARCH: Searching for "${foodType}" restaurants only...`);
        console.log(`📍 User location: ${userLocation.latitude}, ${userLocation.longitude}`);
        
        // Wait for Google Maps API to be ready
        const ready = await ensureGoogleMapsReady(8000);
        if (!ready || typeof google === 'undefined' || !google.maps || !google.maps.places) {
            throw new Error('Google Maps API not loaded');
        }
        
        // Create a temporary map for Places service (required by Google Places API)
        const tempMap = new google.maps.Map(document.createElement('div'), {
            center: { lat: userLocation.latitude, lng: userLocation.longitude },
            zoom: 15
        });
        
        const service = new google.maps.places.PlacesService(tempMap);
        
        // Get filter values for distance
        const distance = parseInt(document.getElementById('distanceRange').value);
        const minRating = parseFloat(document.getElementById('minRating').value);
        const minReviews = parseInt(document.getElementById('minReviews').value);
        
        console.log(`🎯 Search parameters: distance=${distance}mi, minRating=${minRating}, minReviews=${minReviews}`);
        
        let allResults = [];
        
        // Strategy 1: Search for "foodType restaurants" (e.g., "burgers restaurants") with pagination
        console.log(`🔍 Strategy 1: Searching for "${foodType} restaurants" with pagination`);
        try {
            const textSearchRequest1 = {
                query: `${foodType} restaurants`,
                location: { lat: userLocation.latitude, lng: userLocation.longitude }
                // Removed radius and type to be less restrictive
            };
            
            console.log(`📍 Strategy 1 request:`, textSearchRequest1);
            
            const textResults1 = await performPaginatedTextSearch(service, textSearchRequest1, 3);
            
            if (textResults1 && textResults1.length > 0) {
                allResults = allResults.concat(textResults1);
                console.log(`✅ Strategy 1: Found ${textResults1.length} results for "${foodType} restaurants" (with pagination)`);
            }
        } catch (error) {
            console.log(`⚠️ Strategy 1 failed: ${error.message}`);
        }
        
        // Strategy 2: Search for just the food type (e.g., "burgers") with pagination
        console.log(`🔍 Strategy 2: Searching for "${foodType}" with pagination`);
        try {
            const textSearchRequest2 = {
                query: foodType,
                location: { lat: userLocation.latitude, lng: userLocation.longitude }
                // Removed radius and type to be less restrictive
            };
            
            console.log(`📍 Strategy 2 request:`, textSearchRequest2);
            
            const textResults2 = await performPaginatedTextSearch(service, textSearchRequest2, 3);
            
            if (textResults2 && textResults2.length > 0) {
                allResults = allResults.concat(textResults2);
                console.log(`✅ Strategy 2: Found ${textResults2.length} results for "${foodType}" (with pagination)`);
            }
        } catch (error) {
            console.log(`⚠️ Strategy 2 failed: ${error.message}`);
        }
        
        // Strategy 3: Use nearbySearch as fallback for restaurants in the area with pagination
        if (allResults.length === 0) {
            console.log(`🔄 Strategy 3: Using nearbySearch fallback for restaurants in the area with pagination`);
            try {
                const nearbySearchRequest = {
                    location: { lat: userLocation.latitude, lng: userLocation.longitude },
                    radius: distance * 1609.34, // Convert miles to meters
                    type: 'restaurant'
                };
                
                const nearbyResults = await performPaginatedNearbySearch(service, nearbySearchRequest, 3);
                
                if (nearbyResults && nearbyResults.length > 0) {
                    allResults = allResults.concat(nearbyResults);
                    console.log(`✅ Strategy 3: Found ${nearbyResults.length} restaurants using nearbySearch (with pagination)`);
                }
            } catch (error) {
                console.log(`⚠️ Strategy 3 failed: ${error.message}`);
            }
        }
        
        // Strategy 4: For burgers, also search for specific burger chain names with pagination
        if (foodType.toLowerCase() === 'burgers' && allResults.length < 10) {
            console.log(`🔍 Strategy 4: Searching for specific burger chains with pagination`);
            const burgerChains = ['in-n-out', 'in n out', 'habit burger', 'five guys', 'wendys', 'mcdonalds', 'burger king', 'shake shack'];
            
            for (const chain of burgerChains) {
                try {
                    const chainSearchRequest = {
                        query: chain,
                        location: { lat: userLocation.latitude, lng: userLocation.longitude }
                    };
                    
                    console.log(`📍 Strategy 4: Searching for "${chain}" with pagination`);
                    
                    const chainResults = await performPaginatedTextSearch(service, chainSearchRequest, 2);
                    
                    if (chainResults && chainResults.length > 0) {
                        allResults = allResults.concat(chainResults);
                        console.log(`✅ Strategy 4: Found ${chainResults.length} results for "${chain}" (with pagination)`);
                    }
                } catch (error) {
                    console.log(`⚠️ Strategy 4 failed for ${chain}: ${error.message}`);
                }
            }
        }
        
        // Remove duplicates based on place_id
        const uniqueResults = allResults.filter((place, index, self) => 
            index === self.findIndex(p => p.place_id === place.place_id)
        );
        
        console.log(`📊 Total unique results found: ${uniqueResults.length} (from ${allResults.length} total results)`);
        
        if (uniqueResults && uniqueResults.length > 0) {
            console.log(`✅ Found ${uniqueResults.length} unique restaurants from Google Places search`);
            
            // Process each restaurant result
            const foodTypeRestaurants = await Promise.all(uniqueResults.map(async (place) => {
                // Get detailed information for each place
                const details = await getPlaceDetails(service, place.place_id);
                
                // Calculate distance from user location
                const restaurantDistance = calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    place.geometry.location.lat(),
                    place.geometry.location.lng()
                );
                
                return {
                    id: place.place_id,
                    name: place.name || 'Restaurant',
                    rating: place.rating || (Math.random() * 2 + 3).toFixed(1),
                    reviews: place.user_ratings_total || Math.floor(Math.random() * 500) + 10,
                    distance: restaurantDistance.toFixed(1),
                    foodTypes: extractFoodTypesFromGooglePlace(place, details),
                    address: details?.formatted_address || place.formatted_address || place.vicinity || 'Address not available',
                    phone: details?.formatted_phone_number || 'Phone not available'
                };
            }));
            
            console.log(`📊 Processed ${foodTypeRestaurants.length} restaurants with details`);
            
            // Apply filters (rating, reviews, distance)
            const filteredFoodTypeRestaurants = foodTypeRestaurants.filter(restaurant => {
                const restaurantDistance = parseFloat(restaurant.distance);
                return restaurant.rating >= minRating && 
                       restaurant.reviews >= minReviews && 
                       restaurantDistance <= distance;
            });
            
            console.log(`After applying filters (rating >= ${minRating}, reviews >= ${minReviews}, distance <= ${distance}): ${filteredFoodTypeRestaurants.length} restaurants`);
            
            if (filteredFoodTypeRestaurants.length > 0) {
                // Sort by distance
                const sortedRestaurants = filteredFoodTypeRestaurants.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
                
                // Update the filtered restaurants for the restaurant wheel
                filteredRestaurants = sortedRestaurants;
                
                // Display the filtered restaurants
                displayRestaurants(sortedRestaurants, true, foodType);
                
                // Show the results section (it was hidden until now)
                const resultsSection = document.getElementById('resultsSection');
                resultsSection.style.display = 'block';
                
                // Add a subtle animation to indicate the results have been updated
                resultsSection.classList.add('fade-in-up');
                setTimeout(() => {
                    resultsSection.classList.remove('fade-in-up');
                }, 500);
                
                console.log(`✅ Successfully found and displayed ${sortedRestaurants.length} ${foodType} restaurants`);
            } else {
                console.log(`❌ No ${foodType} restaurants found matching your criteria`);
                alert(`No ${foodType} restaurants found matching your criteria. Try adjusting your filters or spinning the wheel again.`);
            }
        } else {
            console.log(`❌ No ${foodType} restaurants found in your area`);
            alert(`No ${foodType} restaurants found in your area. Try increasing the search radius or spinning the wheel again.`);
        }
        
    } catch (error) {
        console.error('Error searching for restaurants by food type:', error);
        
        // Show user-friendly error message
        const errorMessage = getErrorMessage(error);
        alert(`Error searching for ${foodType} restaurants: ${errorMessage}`);
    }
}

function spinRestaurantWheel() {
    if (filteredRestaurants.length === 0) {
        alert(`No restaurants available for ${selectedFoodTypeFromWheel || 'the selected food type'}. Please try spinning the food type wheel again or adjust your filters.`);
        return;
    }
    
    const wheel = document.getElementById('restaurantWheel');
    const result = document.getElementById('restaurantResult');
    const selectedRestaurantSpan = document.getElementById('selectedRestaurant');
    const restaurantDetails = document.getElementById('restaurantDetails');
    
    // Hide previous result
    result.style.display = 'none';
    
    // Create wheel segments with available restaurants
    createWheelSegments('restaurantWheel', filteredRestaurants, 'restaurant');
    
    // Spin the wheel
    wheel.classList.add('spinning');
    
    // Calculate the final rotation angle (multiple full rotations plus a random segment)
    const segmentAngle = 360 / filteredRestaurants.length;
    const randomSegment = Math.floor(Math.random() * filteredRestaurants.length);
    const finalRotation = 3600 + (randomSegment * segmentAngle) + (segmentAngle / 2);
    
    // Apply the final rotation to the wheel segments after a small delay to allow transition
    const wheelSegments = document.getElementById('restaurantWheelSegments');
    setTimeout(() => {
        wheelSegments.style.transform = `rotate(${finalRotation}deg)`;
    }, 50);
    
    // Determine which segment the needle is pointing to
    // The needle points to the top (0 degrees), so we need to calculate which segment is at the top
    const normalizedRotation = finalRotation % 360;
    // Since the wheel rotates clockwise, the segments move in the opposite direction relative to the needle
    // So we need to reverse the calculation
    const segmentIndex = Math.floor(((360 - normalizedRotation) / segmentAngle)) % filteredRestaurants.length;
    const selectedRestaurant = filteredRestaurants[segmentIndex];
    
    // Create spinning effect that shows all available restaurants
    let currentIndex = 0;
    const spinDuration = 4000; // 4 seconds
    const intervalTime = 200; // Change every 200ms for smooth effect (slightly slower for restaurants)
    const totalIntervals = Math.floor(spinDuration / intervalTime);
    let intervalCount = 0;
    
    // Start the spinning animation
    const spinInterval = setInterval(() => {
        // Cycle through all available restaurants
        const currentRestaurant = filteredRestaurants[currentIndex % filteredRestaurants.length];
        selectedRestaurantSpan.textContent = currentRestaurant.name;
        
        // Add a subtle animation effect
        selectedRestaurantSpan.style.transform = 'scale(1.1)';
        selectedRestaurantSpan.style.color = '#ff6b6b';
        
        setTimeout(() => {
            selectedRestaurantSpan.style.transform = 'scale(1)';
            selectedRestaurantSpan.style.color = '';
        }, 50);
        
        currentIndex++;
        intervalCount++;
        
        // Stop spinning and show final result
        if (intervalCount >= totalIntervals) {
            clearInterval(spinInterval);
            
            // Final result based on where the needle actually points
            selectedRestaurantSpan.textContent = selectedRestaurant.name;
            selectedRestaurantSpan.style.transform = 'scale(1.2)';
            selectedRestaurantSpan.style.color = '#4ecdc4';
            selectedRestaurantSpan.style.fontWeight = 'bold';
            
            // Remove spinning class
            wheel.classList.remove('spinning');
            
            // Create Google Maps link
            const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedRestaurant.address + ' ' + selectedRestaurant.name)}`;
            
            // Display restaurant details with clickable address
            const stars = '★'.repeat(Math.floor(selectedRestaurant.rating)) + '☆'.repeat(5 - Math.floor(selectedRestaurant.rating));
            restaurantDetails.innerHTML = `
                <p><strong>Rating:</strong> ${stars} ${selectedRestaurant.rating}</p>
                <p><strong>Reviews:</strong> ${selectedRestaurant.reviews}</p>
                <p><strong>Distance:</strong> ${selectedRestaurant.distance} miles</p>
                <p><strong>Address:</strong> <a href="${googleMapsLink}" target="_blank" rel="noopener noreferrer">${selectedRestaurant.address} <i class="fas fa-external-link-alt"></i></a></p>
                <p><strong>Phone:</strong> <a href="tel:${selectedRestaurant.phone.replace(/\D/g, '')}">${selectedRestaurant.phone}</a></p>
                <p><strong>Food Types:</strong> ${selectedRestaurant.foodTypes.join(', ')}</p>
            `;
            
            // Show result
            result.style.display = 'block';
            result.classList.add('fade-in-up');
            
            // Reset styles after a moment
            setTimeout(() => {
                selectedRestaurantSpan.style.transform = '';
                selectedRestaurantSpan.style.color = '';
                selectedRestaurantSpan.style.fontWeight = '';
            }, 1000);
        }
    }, intervalTime);
}

// Function to create wheel segments
function createWheelSegments(wheelId, items, segmentType = 'food') {
    const wheelSegments = document.getElementById(wheelId + 'Segments');
    if (!wheelSegments) return;
    
    wheelSegments.innerHTML = '';
    
    if (items.length === 0) return;
    
    const colors = [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3',
        '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#10ac84', '#ee5a24',
        '#ff7675', '#74b9ff', '#a29bfe', '#fd79a8', '#fdcb6e', '#6c5ce7'
    ];
    
    // Create conic gradient for the wheel
    const segmentAngle = 360 / items.length;
    let gradientStops = '';
    
    items.forEach((item, index) => {
        const startAngle = index * segmentAngle;
        const endAngle = (index + 1) * segmentAngle;
        const color = colors[index % colors.length];
        
        gradientStops += `${color} ${startAngle}deg, ${color} ${endAngle}deg`;
        if (index < items.length - 1) gradientStops += ', ';
    });
    
    wheelSegments.style.background = `conic-gradient(${gradientStops})`;
    
    // Reset the wheel to starting position
    wheelSegments.style.transform = 'rotate(0deg)';
    
    // Add text overlays for each segment
    items.forEach((item, index) => {
        const textElement = document.createElement('div');
        textElement.className = 'wheel-segment-text';
        textElement.textContent = segmentType === 'food' ? item : (item.name || item);
        
        // Position text in the center of each segment
        // Start from the top (0 degrees) where the needle points
        const angle = (index * segmentAngle) + (segmentAngle / 2);
        const radius = 35; // Distance from center
        const x = 50 + radius * Math.cos((angle - 90) * Math.PI / 180);
        const y = 50 + radius * Math.sin((angle - 90) * Math.PI / 180);
        
        textElement.style.position = 'absolute';
        textElement.style.left = `${x}%`;
        textElement.style.top = `${y}%`;
        textElement.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        textElement.style.transformOrigin = 'center';
        
        wheelSegments.appendChild(textElement);
    });
}

// Function to update wheel segments during spinning
function updateWheelSegments(wheelId, items, segmentType = 'food') {
    const wheelSegments = document.getElementById(wheelId + 'Segments');
    if (!wheelSegments) return;
    
    const segments = wheelSegments.querySelectorAll('.wheel-segment');
    const segmentAngle = 360 / items.length;
    
    segments.forEach((segment, index) => {
        if (index < items.length) {
            const textElement = segment.querySelector('div');
            if (textElement) {
                textElement.textContent = segmentType === 'food' ? items[index] : items[index].name;
            }
        }
    });
}

// Utility functions
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
    document.getElementById(sectionId).classList.add('fade-in-up');
}

function hideSection(sectionId) {
    document.getElementById(sectionId).style.display = 'none';
}
