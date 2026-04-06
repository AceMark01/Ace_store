export default async function handler(req, res) {
  const API_URL = 'http://eksai12.ddns.net:8786/ek_api/googleAutomation/PriceList.ashx';
  
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    
    // Add CORS headers for your frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch data from API', details: error.message });
  }
}
