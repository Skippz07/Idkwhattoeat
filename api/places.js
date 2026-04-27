const GOOGLE_PLACES_TEXT_SEARCH = 'https://places.googleapis.com/v1/places:searchText';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.currentOpeningHours',
  'places.regularOpeningHours',
  'places.websiteUri',
  'places.googleMapsUri',
  'places.types',
  'places.primaryType',
  'places.primaryTypeDisplayName',
  'places.photos',
  'places.servesBreakfast',
  'places.servesLunch',
  'places.servesDinner',
  'places.servesBeer',
  'places.servesWine',
  'places.servesVegetarianFood',
  'places.takeout',
  'places.delivery',
  'places.dineIn',
  'places.reservable',
  'places.editorialSummary'
].join(',');

function sendCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function asNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function milesBetween(a, b) {
  const r = 3959;
  const toRad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * toRad;
  const dLng = (b.longitude - a.longitude) * toRad;
  const lat1 = a.latitude * toRad;
  const lat2 = b.latitude * toRad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function extractFoodTypes(place) {
  const detected = [];
  const types = [...(place.types || []), place.primaryType].filter(Boolean);
  const display = place.primaryTypeDisplayName?.text;
  if (display) detected.push(display);

  const typeMap = {
    restaurant: 'Restaurant',
    food: 'Food',
    meal_takeaway: 'Takeout',
    meal_delivery: 'Delivery',
    cafe: 'Coffee',
    bar: 'Bar',
    bakery: 'Desserts',
    pizza_restaurant: 'Pizza',
    hamburger_restaurant: 'Burgers',
    chinese_restaurant: 'Chinese',
    mexican_restaurant: 'Mexican',
    italian_restaurant: 'Italian',
    japanese_restaurant: 'Japanese',
    sushi_restaurant: 'Sushi',
    thai_restaurant: 'Thai',
    indian_restaurant: 'Indian',
    seafood_restaurant: 'Seafood',
    steak_house: 'Steakhouse',
    vegan_restaurant: 'Vegan',
    vegetarian_restaurant: 'Vegetarian'
  };
  types.forEach((type) => {
    if (typeMap[type]) detected.push(typeMap[type]);
  });

  const name = (place.displayName?.text || '').toLowerCase();
  const words = {
    burger: 'Burgers',
    pizza: 'Pizza',
    taco: 'Mexican',
    sushi: 'Sushi',
    ramen: 'Japanese',
    pho: 'Vietnamese',
    bbq: 'BBQ',
    barbecue: 'BBQ',
    coffee: 'Coffee',
    bakery: 'Desserts',
    vegan: 'Vegan'
  };
  Object.entries(words).forEach(([word, label]) => {
    if (name.includes(word)) detected.push(label);
  });

  const unique = [...new Set(detected)];
  return unique.length ? unique.slice(0, 5) : ['Restaurant'];
}

function photoUrl(place) {
  const name = place.photos?.[0]?.name;
  return name ? `/api/photo?name=${encodeURIComponent(name)}&maxWidth=640&maxHeight=420` : null;
}

function normalizePlace(place, origin) {
  const location = place.location;
  const distance = location ? milesBetween(origin, location) : null;
  return {
    id: place.id,
    name: place.displayName?.text || 'Restaurant',
    rating: typeof place.rating === 'number' ? place.rating : null,
    reviews: Number.isInteger(place.userRatingCount) ? place.userRatingCount : 0,
    priceLevel: place.priceLevel || null,
    distance: distance === null ? null : Number(distance.toFixed(1)),
    foodTypes: extractFoodTypes(place),
    address: place.formattedAddress || 'Address not available',
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
    website: place.websiteUri || null,
    googleMapsUri: place.googleMapsUri || null,
    openNow: place.currentOpeningHours?.openNow ?? null,
    weekdayDescriptions: place.currentOpeningHours?.weekdayDescriptions || place.regularOpeningHours?.weekdayDescriptions || [],
    summary: place.editorialSummary?.text || null,
    photoUrl: photoUrl(place),
    amenities: {
      dineIn: place.dineIn,
      takeout: place.takeout,
      delivery: place.delivery,
      reservable: place.reservable,
      breakfast: place.servesBreakfast,
      lunch: place.servesLunch,
      dinner: place.servesDinner,
      beer: place.servesBeer,
      wine: place.servesWine,
      vegetarian: place.servesVegetarianFood
    },
    _lat: location?.latitude,
    _lng: location?.longitude
  };
}

async function textSearch(apiKey, body) {
  const response = await fetch(GOOGLE_PLACES_TEXT_SEARCH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error?.message || `Google Places request failed (${response.status})`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }
  return payload.places || [];
}

module.exports = async function handler(req, res) {
  sendCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Google Places API key is not configured on the server.' });

  const lat = asNumber(req.query.lat, null);
  const lng = asNumber(req.query.lng, null);
  const foodType = String(req.query.foodType || '').trim();
  const distance = Math.min(Math.max(asNumber(req.query.distance, 5), 1), 25);
  const minRating = asNumber(req.query.minRating, 0);
  const minReviews = asNumber(req.query.minReviews, 0);
  const openNow = req.query.openNow === 'true';

  if (lat === null || lng === null || !foodType) {
    return res.status(400).json({ error: 'lat, lng, and foodType are required.' });
  }

  const radius = Math.round(distance * 1609.34);
  const origin = { latitude: lat, longitude: lng };
  const baseBody = {
    locationBias: {
      circle: {
        center: origin,
        radius
      }
    },
    pageSize: 20,
    openNow,
    minRating: minRating || undefined,
    rankPreference: 'RELEVANCE'
  };

  const queries = [`${foodType} restaurants`, foodType];
  if (foodType.toLowerCase() === 'burgers') {
    queries.push('burger restaurant', 'in-n-out OR five guys OR shake shack');
  }

  try {
    const raw = [];
    for (const textQuery of queries) {
      raw.push(...await textSearch(apiKey, { ...baseBody, textQuery }));
    }

    const byId = new Map();
    raw.forEach((place) => {
      if (place.id && !byId.has(place.id)) byId.set(place.id, place);
    });

    let restaurants = [...byId.values()]
      .map((place) => normalizePlace(place, origin))
      .filter((place) => place.distance === null || place.distance <= distance)
      .filter((place) => place.reviews >= minReviews)
      .sort((a, b) => {
        const aScore = (a.rating || 0) * 2 + Math.log10((a.reviews || 0) + 1) - (a.distance || 0) * 0.08;
        const bScore = (b.rating || 0) * 2 + Math.log10((b.reviews || 0) + 1) - (b.distance || 0) * 0.08;
        return bScore - aScore;
      });

    res.status(200).json({
      restaurants,
      meta: {
        source: 'google-places-server',
        foodType,
        distance,
        openNow,
        count: restaurants.length
      }
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Unable to search restaurants.' });
  }
};
