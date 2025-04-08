// utils/mapboxService.js - Simulator-Friendly Version

// Define Mapbox access token
const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoibXV6emllMjIiLCJhIjoiY204bjRvcHA2MG5jaDJqcGw5eWJzOTcxbyJ9.d7PVM68c3Fv734NMJaMuRg";

// San Francisco coordinates for detecting simulator
const SF_LAT = 37.7749;
const SF_LON = -122.4194;

/**
 * Fetches points of interest from Mapbox API based on location and type
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @param {string} type - The type of place to search for (restaurant, park, etc.)
 * @returns {Array} Array of POI features or empty array if none found
 */
export const fetchPOIsFromMapbox = async (latitude, longitude, type = "restaurant") => {
    console.log(`Fetching POIs for lat: ${latitude}, lon: ${longitude}, type: ${type}`);
    
    // Validate coordinates
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        console.error("Invalid coordinates provided to fetchPOIsFromMapbox");
        return [];
    }
    
    // Check if we're in a simulator (San Francisco area)
    const inSimulator = isSimulatorLocation(latitude, longitude);
    
    // If we're in a simulator and this is a food search, use mock data for reliable testing
    if (inSimulator && (type === "restaurant" || type === "food")) {
        console.log("Detected simulator location - using reliable mock food data");
        return getMockFoodPlaces(latitude, longitude);
    }
    
    // Different search approach based on type
    if (type === "restaurant" || type === "food") {
        return await fetchFoodPlaces(latitude, longitude);
    } else {
        return await fetchPlacesByType(latitude, longitude, type);
    }
};

/**
 * Checks if a location is likely a simulator location (San Francisco area)
 */
function isSimulatorLocation(latitude, longitude) {
    // Check if coordinates are in San Francisco area (common for simulators)
    const distanceToSF = calculateDistance(latitude, longitude, SF_LAT, SF_LON);
    return distanceToSF < 20; // Within 20km of San Francisco
}

/**
 * Returns mock food data for simulator testing
 */
function getMockFoodPlaces(latitude, longitude) {
    // Create some mock restaurants around the provided location
    const mockPlaces = [
        {
            id: "mock-restaurant-1",
            text: "Golden Gate Grill",
            place_name: "Golden Gate Grill, Union Square, San Francisco, CA",
            center: [longitude - 0.005, latitude - 0.003],
            distance: 0.6,
            place_type: ["poi"],
            properties: { category: "restaurant" }
        },
        {
            id: "mock-restaurant-2",
            text: "Bay Bridge Bakery",
            place_name: "Bay Bridge Bakery, Financial District, San Francisco, CA",
            center: [longitude + 0.003, latitude + 0.002],
            distance: 0.4,
            place_type: ["poi"],
            properties: { category: "bakery" }
        },
        {
            id: "mock-restaurant-3",
            text: "Fisherman's Wharf Seafood",
            place_name: "Fisherman's Wharf Seafood, Pier 39, San Francisco, CA",
            center: [longitude - 0.008, latitude - 0.005],
            distance: 1.2,
            place_type: ["poi"],
            properties: { category: "restaurant" }
        },
        {
            id: "mock-restaurant-4",
            text: "Mission District Tacos",
            place_name: "Mission District Tacos, Mission St, San Francisco, CA",
            center: [longitude + 0.006, latitude - 0.004],
            distance: 0.9,
            place_type: ["poi"],
            properties: { category: "restaurant" }
        },
        {
            id: "mock-restaurant-5",
            text: "Chinatown Express",
            place_name: "Chinatown Express, Grant Avenue, San Francisco, CA",
            center: [longitude - 0.002, latitude + 0.007],
            distance: 1.5,
            place_type: ["poi"],
            properties: { category: "restaurant" }
        },
        {
            id: "mock-restaurant-6",
            text: "Castro Coffee House",
            place_name: "Castro Coffee House, Castro St, San Francisco, CA",
            center: [longitude + 0.009, latitude - 0.001],
            distance: 1.7,
            place_type: ["poi"],
            properties: { category: "cafe" }
        }
    ];
    
    // Sort by distance
    mockPlaces.sort((a, b) => a.distance - b.distance);
    
    return mockPlaces;
}

/**
 * Fetches food-specific places
 */
async function fetchFoodPlaces(latitude, longitude) {
    // For food places, we'll use specific search terms
    const foodTerms = [
        "restaurant",
        "cafe",
        "bakery",
        "food",
        "dining"
    ];
    
    let allResults = [];
    
    // Try each food-specific term
    for (const term of foodTerms) {
        try {
            // Use forward geocoding with specific food term
            const encodedTerm = encodeURIComponent(term);
            
            // Query with proximity to force local results
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedTerm}.json?proximity=${longitude},${latitude}&types=poi&limit=5&access_token=${MAPBOX_ACCESS_TOKEN}`;
            
            console.log(`Searching for '${term}' places`);
            
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`API error for '${term}': ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                console.log(`Found ${data.features.length} results for '${term}'`);
                
                // Filter for only local places with food keywords (max 10km)
                const nearbyResults = data.features.filter(feature => {
                    // Calculate distance
                    const distance = calculateDistance(
                        latitude, longitude,
                        feature.center[1], feature.center[0]
                    );
                    
                    // Check if it's likely a food place
                    const isFood = isFoodPlace(feature);
                    
                    // Keep only nearby food places
                    return isFood && distance <= 10;
                });
                
                allResults = [...allResults, ...nearbyResults];
            }
        } catch (e) {
            console.warn(`Error fetching '${term}':`, e);
        }
    }
    
    // If we got no results from the API, try local search
    if (allResults.length === 0) {
        try {
            const localityName = await getLocalityName(latitude, longitude);
            if (localityName) {
                const localResults = await searchLocalFoodPlaces(latitude, longitude, localityName);
                allResults = [...allResults, ...localResults];
            }
        } catch (error) {
            console.warn("Error in local area search:", error);
        }
    }
    
    // Remove duplicates
    const uniqueResults = removeDuplicates(allResults);
    
    // Add distance property and sort by distance
    const enhancedResults = uniqueResults.map(result => ({
        ...result,
        distance: calculateDistance(
            latitude, longitude,
            result.center[1], result.center[0]
        )
    }));
    
    enhancedResults.sort((a, b) => a.distance - b.distance);
    
    console.log(`Final result: ${enhancedResults.length} food places found`);
    return enhancedResults;
}

/**
 * Search specifically for food in a named locality
 */
async function searchLocalFoodPlaces(latitude, longitude, localityName) {
    const searchTerms = [
        `restaurants in ${localityName}`,
        `cafes in ${localityName}`,
        `food in ${localityName}`,
        `eating in ${localityName}`
    ];
    
    let results = [];
    
    for (const term of searchTerms) {
        try {
            const encodedTerm = encodeURIComponent(term);
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedTerm}.json?proximity=${longitude},${latitude}&limit=3&access_token=${MAPBOX_ACCESS_TOKEN}`;
            
            const response = await fetch(url);
            if (!response.ok) continue;
            
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                // Filter for nearby results
                const nearbyResults = data.features.filter(feature => {
                    const distance = calculateDistance(
                        latitude, longitude,
                        feature.center[1], feature.center[0]
                    );
                    return distance <= 15; // Slightly wider radius
                });
                
                results = [...results, ...nearbyResults];
            }
        } catch (e) {
            console.warn(`Error in local search for '${term}':`, e);
        }
    }
    
    return results;
}

/**
 * Fetches places by a specific type (for non-food searches)
 */
async function fetchPlacesByType(latitude, longitude, type) {
    // Get search terms based on the type
    const searchTerms = getSearchTermsForType(type);
    
    let allResults = [];
    
    // Try each search term
    for (const term of searchTerms) {
        try {
            const encodedTerm = encodeURIComponent(term);
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedTerm}.json?proximity=${longitude},${latitude}&limit=5&access_token=${MAPBOX_ACCESS_TOKEN}`;
            
            console.log(`Searching for '${term}' places`);
            
            const response = await fetch(url);
            if (!response.ok) continue;
            
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                console.log(`Found ${data.features.length} results for '${term}'`);
                
                // Filter for only nearby places
                const nearbyResults = data.features.filter(feature => {
                    const distance = calculateDistance(
                        latitude, longitude,
                        feature.center[1], feature.center[0]
                    );
                    return distance <= 15; // Slightly wider radius for activities
                });
                
                allResults = [...allResults, ...nearbyResults];
            }
        } catch (e) {
            console.warn(`Error fetching '${term}':`, e);
        }
    }
    
    // If we have very few results, try the locality name approach
    if (allResults.length < 3) {
        try {
            const localityName = await getLocalityName(latitude, longitude);
            if (localityName) {
                const localResults = await searchLocalArea(latitude, longitude, type, localityName);
                allResults = [...allResults, ...localResults];
            }
        } catch (error) {
            console.warn("Error in local area search:", error);
        }
    }
    
    // Remove duplicates
    const uniqueResults = removeDuplicates(allResults);
    
    // Add distance property
    const enhancedResults = uniqueResults.map(result => ({
        ...result,
        distance: calculateDistance(
            latitude, longitude,
            result.center[1], result.center[0]
        )
    }));
    
    // Sort by distance
    enhancedResults.sort((a, b) => a.distance - b.distance);
    
    console.log(`Final result: ${enhancedResults.length} ${type} places found`);
    return enhancedResults;
}

/**
 * Search in the local area using locality name
 */
async function searchLocalArea(latitude, longitude, type, localityName) {
    const searchTerms = getSearchTermsForType(type).map(term => 
        `${term} ${localityName}`
    );
    
    let results = [];
    
    for (const term of searchTerms) {
        try {
            const encodedTerm = encodeURIComponent(term);
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedTerm}.json?proximity=${longitude},${latitude}&limit=3&access_token=${MAPBOX_ACCESS_TOKEN}`;
            
            const response = await fetch(url);
            if (!response.ok) continue;
            
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                // Filter for only nearby results
                const nearbyResults = data.features.filter(feature => {
                    const distance = calculateDistance(
                        latitude, longitude,
                        feature.center[1], feature.center[0]
                    );
                    return distance <= 20; // Wider radius for local area search
                });
                
                results = [...results, ...nearbyResults];
            }
        } catch (e) {
            console.warn(`Error in local search for '${term}':`, e);
        }
    }
    
    return results;
}

/**
 * Determines if a place is food-related based on its properties
 */
function isFoodPlace(feature) {
    if (!feature) return false;
    
    // Check text and place_name
    const text = (feature.text || '').toLowerCase();
    const placeName = (feature.place_name || '').toLowerCase();
    
    // List of food-related keywords
    const foodKeywords = [
        'restaurant', 'cafe', 'coffee', 'diner', 'bistro', 'eatery',
        'food', 'bakery', 'bar', 'pub', 'grill', 'pizza', 'burger',
        'kitchen', 'taco', 'sushi', 'thai', 'chinese', 'mexican',
        'italian', 'steak', 'seafood', 'breakfast', 'lunch', 'dinner'
    ];
    
    // Check if the text or place_name contains any food keywords
    for (const keyword of foodKeywords) {
        if (text.includes(keyword) || placeName.includes(keyword)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Get appropriate search terms based on the type
 */
function getSearchTermsForType(type) {
    const typeKey = type.toLowerCase();
    
    const typeMap = {
        'restaurant': ['restaurant', 'cafe', 'dining', 'food'],
        'food': ['restaurant', 'cafe', 'dining', 'food'],
        'park': ['park', 'garden', 'playground', 'nature'],
        'museum': ['museum', 'gallery', 'exhibition', 'art'],
        'entertainment': ['entertainment', 'cinema', 'theater', 'amusement'],
        'shopping': ['mall', 'shop', 'shopping', 'store'],
        'attraction': ['attraction', 'landmark', 'monument', 'tourism'],
        'sport': ['stadium', 'arena', 'sports', 'fitness'],
        'hotel': ['hotel', 'motel', 'lodging', 'inn'],
        'landmark': ['landmark', 'monument', 'historical', 'famous'],
        'theater': ['theater', 'cinema', 'performance', 'show'],
        'mall': ['mall', 'shopping center', 'shops']
    };
    
    return typeMap[typeKey] || [type]; // Default to the type itself if not found
}

/**
 * Get the name of the locality (city, neighborhood)
 */
async function getLocalityName(latitude, longitude) {
    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=place,locality,neighborhood&limit=1&access_token=${MAPBOX_ACCESS_TOKEN}`;
        
        const response = await fetch(url);
        if (!response.ok) return null;
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            const place = data.features[0];
            console.log(`Determined locality: ${place.text}`);
            return place.text;
        }
        
        return null;
    } catch (error) {
        console.error("Error getting locality name:", error);
        return null;
    }
}

/**
 * Remove duplicate results from the array
 */
function removeDuplicates(results) {
    const uniqueResults = [];
    const seenIds = new Set();
    
    for (const result of results) {
        if (!seenIds.has(result.id)) {
            seenIds.add(result.id);
            uniqueResults.push(result);
        }
    }
    
    return uniqueResults;
}

/**
 * Calculate distance between two points in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Export both ways for compatibility
export default {
    fetchPOIsFromMapbox
};