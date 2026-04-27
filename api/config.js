// Health/config endpoint. Never returns private API keys to the browser.
module.exports = function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    res.status(200).json({
        googlePlacesConfigured: Boolean(process.env.GOOGLE_MAPS_API_KEY),
        mode: 'server-proxy'
    });
}
