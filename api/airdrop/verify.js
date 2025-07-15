const axios = require('axios');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Validate Solana wallet address
function isValidSolanaAddress(address) {
  const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return solanaAddressRegex.test(address);
}

// Generate random IP and User Agent for anti-rate limiting
function generateRandomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { walletAddress } = req.body;

    // Validate input
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Solana wallet address format'
      });
    }

    // Create axios instance with anti-rate limiting headers
    const axiosInstance = axios.create({
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'User-Agent': getRandomUserAgent(),
        'X-Forwarded-For': generateRandomIP(),
        'X-Real-IP': generateRandomIP(),
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'Origin': 'https://trade.fun',
        'Referer': 'https://trade.fun/'
      }
    });

    // Make request to Trade.fun API
    const response = await axiosInstance.post('https://api.trade.fun/api/airdrop/verify', {
      walletAddress: walletAddress
    });

    // Set CORS headers
    Object.keys(corsHeaders).forEach(key => {
      res.setHeader(key, corsHeaders[key]);
    });

    // Return the response
    return res.status(200).json(response.data);

  } catch (error) {
    console.error('API Error:', error.message);

    // Set CORS headers
    Object.keys(corsHeaders).forEach(key => {
      res.setHeader(key, corsHeaders[key]);
    });

    if (error.response) {
      // API responded with error
      const status = error.response.status;
      let errorMessage = 'API request failed';

      if (status === 429) {
        errorMessage = 'Rate limited. Please try again later.';
      } else if (status === 404) {
        errorMessage = 'API endpoint not found.';
      } else if (status === 500) {
        errorMessage = 'Internal server error. Please try again later.';
      }

      return res.status(status).json({
        success: false,
        error: errorMessage,
        details: error.response.data?.message || 'Unknown error'
      });
    } else if (error.request) {
      // Network error
      return res.status(503).json({
        success: false,
        error: 'Unable to reach Trade.fun API. Please try again later.',
        details: 'Network error'
      });
    } else {
      // Other error
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }
}
