// Vercel serverless function to provide API key (CommonJS for broad compatibility)
module.exports = function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get API key from environment variable
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
        console.error('❌ Google Maps API key not found in environment variables');
        return res.status(500).json({ 
            error: 'Google Maps API key not configured',
            message: 'Please set GOOGLE_MAPS_API_KEY environment variable in Vercel'
        });
    }

    console.log('✅ API key found, returning to client');
    // Return the API key (this is safe as it's meant to be public for client-side use)
    res.status(200).json({ apiKey });
}
