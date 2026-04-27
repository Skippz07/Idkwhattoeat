function sendCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  sendCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Google Places API key is not configured on the server.' });

  const name = String(req.query.name || '').trim();
  const maxWidth = Math.min(Math.max(Number(req.query.maxWidth) || 640, 120), 1200);
  const maxHeight = Math.min(Math.max(Number(req.query.maxHeight) || 420, 120), 1200);
  if (!name || !name.startsWith('places/')) return res.status(400).json({ error: 'Valid photo name is required.' });

  const params = new URLSearchParams({
    maxWidthPx: String(maxWidth),
    maxHeightPx: String(maxHeight),
    skipHttpRedirect: 'true',
    key: apiKey
  });

  try {
    const mediaResponse = await fetch(`https://places.googleapis.com/v1/${name}/media?${params.toString()}`);
    const mediaPayload = await mediaResponse.json().catch(() => ({}));
    const photoUri = mediaPayload.photoUri;
    if (!mediaResponse.ok || !photoUri) {
      return res.status(mediaResponse.status || 502).json({ error: mediaPayload.error?.message || 'Unable to load place photo.' });
    }

    const imageResponse = await fetch(photoUri);
    if (!imageResponse.ok) return res.status(imageResponse.status).json({ error: 'Unable to fetch place photo.' });

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.status(200).send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to load place photo.' });
  }
};
