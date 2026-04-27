const DETAILS_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'location',
  'rating',
  'userRatingCount',
  'priceLevel',
  'currentOpeningHours',
  'regularOpeningHours',
  'websiteUri',
  'googleMapsUri',
  'types',
  'primaryType',
  'primaryTypeDisplayName',
  'photos',
  'servesBreakfast',
  'servesLunch',
  'servesDinner',
  'servesBeer',
  'servesWine',
  'servesVegetarianFood',
  'takeout',
  'delivery',
  'dineIn',
  'reservable',
  'editorialSummary',
  'reviews'
].join(',');

function sendCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function photoUrl(place) {
  const name = place.photos?.[0]?.name;
  return name ? `/api/photo?name=${encodeURIComponent(name)}&maxWidth=900&maxHeight=520` : null;
}

function normalize(place) {
  return {
    id: place.id,
    name: place.displayName?.text || 'Restaurant',
    rating: typeof place.rating === 'number' ? place.rating : null,
    reviews: Number.isInteger(place.userRatingCount) ? place.userRatingCount : 0,
    priceLevel: place.priceLevel || null,
    address: place.formattedAddress || null,
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
    reviewsList: (place.reviews || []).slice(0, 3).map((review) => ({
      author: review.authorAttribution?.displayName || 'Google reviewer',
      rating: review.rating,
      text: review.text?.text || '',
      relativePublishTimeDescription: review.relativePublishTimeDescription || ''
    }))
  };
}

module.exports = async function handler(req, res) {
  sendCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Google Places API key is not configured on the server.' });

  const id = String(req.query.id || '').trim();
  if (!id) return res.status(400).json({ error: 'Place id is required.' });

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': DETAILS_FIELDS
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({ error: payload.error?.message || 'Unable to load place details.' });
    }
    res.status(200).json({ place: normalize(payload) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to load place details.' });
  }
};
