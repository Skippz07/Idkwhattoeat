# IDK What To Eat

A responsive restaurant picker that uses your location, cuisine filters, Google Places data, a food-type wheel, and either a restaurant wheel or head-to-head battle mode to help you decide where to eat.

## What It Uses

- Browser Geolocation API for the user's location.
- OpenStreetMap Nominatim for reverse geocoding coordinates into an address.
- Google Places API through private serverless API routes.
- Google place photos, ratings, review counts, price level, open status, website, phone, maps links, amenities, hours, summaries, and recent reviews when available.

## API Key Security

The Google key is not sent to the browser. The client calls:

- `/api/places` for restaurant search.
- `/api/place` for rich place details.
- `/api/photo` for proxied place photos.
- `/api/config` for a safe health check only.

Set the key as an environment variable:

```bash
GOOGLE_MAPS_API_KEY=your_key_here
```

For Vercel, add `GOOGLE_MAPS_API_KEY` in Project Settings -> Environment Variables, then redeploy.

## Local Development

This project needs serverless API routes for restaurant data, so use Vercel dev or another local server that can run the `api/` functions.

```bash
npx vercel dev
```

Then open the local URL from Vercel. Opening `index.html` directly will show the UI, but restaurant search will not work because `/api/*` will be missing.

## Files

```text
Idkwhattoeat/
├── index.html
├── css/style.css
├── js/app.js
├── api/config.js
├── api/places.js
├── api/place.js
├── api/photo.js
├── favicon.svg
├── package.json
└── vercel.json
```

## Notes

- Restrict the Google key to the Places API in Google Cloud.
- Use HTTP referrer restrictions for production domains when possible.
- The app caches client-side search results by location, cuisine, distance, rating, reviews, and open-now filter to keep the UI fast.
