const API_BASE = "https://api.ewgf.gg";
const API_TOKEN = "ewgf_e146ff104fd149409abc02db98e24202";

// Helper function to handle the API request and parse custom error codes
async function fetchFromEwgf(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`, // Added 'Bearer ' prefix
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  // Handle specific error codes based on your documentation
  if (!response.ok) {
    if (response.status === 400) throw new Error("Invalid Tekken ID format.");
    if (response.status === 401) throw new Error("Unauthorized access. Check your API token.");
    if (response.status === 404) throw new Error("Player not found in the database.");
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 'some';
      throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds.`);
    }
    throw new Error(`API Error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get Recent Battles for "Latest Matches"
 * Maps to: GET https://api.ewgf.gg/external/battles/{tekkenId}
 */
async function getLatestMatches(tekkenId) {
  const result = await fetchFromEwgf(`/external/battles/${tekkenId}`);
  // Log your subscription/rate limit tracking data
  console.log(`Rate limit remaining: ${result._metadata.rate_limit_remaining}`);
  return result.data; 
}

/**
 * Get Single Profile Metadata
 * Maps to: GET https://api.ewgf.gg/external/profile/{tekkenId}
 */
async function getPlayerProfile(tekkenId) {
  const result = await fetchFromEwgf(`/external/profile/${tekkenId}`);
  return result.data;
}

/**
 * Post Bulk Profiles (Useful if tracking multiple users)
 * Maps to: POST https://api.ewgf.gg/external/profile
 */
async function getBulkProfiles(tekkenIdsArray) {
  const result = await fetchFromEwgf('/external/profile', {
    method: 'POST',
    body: JSON.stringify(tekkenIdsArray)
  });
  return result.data;
}
