// ============================================
// SHARED LOCATION MODULE
// Used by menu, surf, and tide pages
// ============================================

// LocationIQ API Key (free tier: 5000 req/day)
// Sign up at: https://locationiq.com/ and replace this key
const LOCATIONIQ_API_KEY = 'pk.98266edf545f5e19b300d0c28ee027ab';

// NOAA Tide Stations (US only)
// Format: { id, name, lat, lng }
const NOAA_STATIONS = [
  // Northeast
  { id: '8531680', name: 'Sandy Hook, NJ', lat: 40.4667, lng: -74.0167 },
  { id: '8518750', name: 'The Battery, NY', lat: 40.7, lng: -74.0142 },
  { id: '8510560', name: 'Montauk, NY', lat: 41.0483, lng: -71.96 },
  { id: '8447930', name: 'Woods Hole, MA', lat: 41.5233, lng: -70.6717 },
  { id: '8443970', name: 'Boston, MA', lat: 42.355, lng: -71.0517 },
  { id: '8452660', name: 'Newport, RI', lat: 41.505, lng: -71.3267 },
  { id: '8461490', name: 'New London, CT', lat: 41.355, lng: -72.09 },

  // Mid-Atlantic
  { id: '8534720', name: 'Atlantic City, NJ', lat: 39.355, lng: -74.4183 },
  { id: '8545240', name: 'Philadelphia, PA', lat: 39.9333, lng: -75.1417 },
  { id: '8557380', name: 'Lewes, DE', lat: 38.7817, lng: -75.12 },
  { id: '8574680', name: 'Baltimore, MD', lat: 39.2667, lng: -76.5783 },
  { id: '8638610', name: 'Sewells Point, VA', lat: 36.9467, lng: -76.33 },
  { id: '8651370', name: 'Duck, NC', lat: 36.1833, lng: -75.7467 },

  // Southeast
  { id: '8656483', name: 'Beaufort, NC', lat: 34.72, lng: -76.67 },
  { id: '8661070', name: 'Myrtle Beach, SC', lat: 33.655, lng: -78.9183 },
  { id: '8670870', name: 'Fort Pulaski, GA', lat: 32.0333, lng: -80.9017 },
  { id: '8720218', name: 'Mayport, FL', lat: 30.3967, lng: -81.43 },
  { id: '8721604', name: 'Trident Pier, FL', lat: 28.4158, lng: -80.5931 },
  { id: '8723214', name: 'Virginia Key, FL', lat: 25.7317, lng: -80.1617 },
  { id: '8724580', name: 'Key West, FL', lat: 24.5508, lng: -81.8081 },

  // Gulf Coast
  { id: '8726520', name: 'St. Petersburg, FL', lat: 27.7606, lng: -82.6269 },
  { id: '8729108', name: 'Panama City, FL', lat: 30.1522, lng: -85.6672 },
  { id: '8735180', name: 'Dauphin Island, AL', lat: 30.25, lng: -88.075 },
  { id: '8761724', name: 'Grand Isle, LA', lat: 29.2633, lng: -89.9567 },
  { id: '8770570', name: 'Sabine Pass, TX', lat: 29.7283, lng: -93.87 },
  { id: '8771450', name: 'Galveston, TX', lat: 29.31, lng: -94.7933 },
  { id: '8775870', name: 'Corpus Christi, TX', lat: 27.58, lng: -97.2167 },
  { id: '8779770', name: 'Port Isabel, TX', lat: 26.06, lng: -97.215 },

  // West Coast
  { id: '9410170', name: 'San Diego, CA', lat: 32.7142, lng: -117.1736 },
  { id: '9410660', name: 'Los Angeles, CA', lat: 33.72, lng: -118.2717 },
  { id: '9410840', name: 'Santa Monica, CA', lat: 34.0083, lng: -118.5 },
  { id: '9411340', name: 'Santa Barbara, CA', lat: 34.4033, lng: -119.685 },
  { id: '9412110', name: 'Port San Luis, CA', lat: 35.1767, lng: -120.76 },
  { id: '9413450', name: 'Monterey, CA', lat: 36.605, lng: -121.8883 },
  { id: '9414290', name: 'San Francisco, CA', lat: 37.8067, lng: -122.465 },
  { id: '9414750', name: 'Alameda, CA', lat: 37.7717, lng: -122.3 },
  { id: '9415020', name: 'Point Reyes, CA', lat: 37.9961, lng: -122.9767 },
  { id: '9418767', name: 'North Spit, CA', lat: 40.7667, lng: -124.2167 },
  { id: '9419750', name: 'Crescent City, CA', lat: 41.745, lng: -124.1833 },
  { id: '9431647', name: 'Port Orford, OR', lat: 42.7392, lng: -124.4983 },
  { id: '9432780', name: 'Charleston, OR', lat: 43.345, lng: -124.3217 },
  { id: '9435380', name: 'South Beach, OR', lat: 44.625, lng: -124.045 },
  { id: '9437540', name: 'Garibaldi, OR', lat: 45.555, lng: -123.9183 },
  { id: '9439040', name: 'Astoria, OR', lat: 46.2073, lng: -123.7683 },
  { id: '9440910', name: 'Toke Point, WA', lat: 46.7075, lng: -123.9669 },
  { id: '9441102', name: 'Westport, WA', lat: 46.9043, lng: -124.1051 },
  { id: '9443090', name: 'Neah Bay, WA', lat: 48.3683, lng: -124.6117 },
  { id: '9444900', name: 'Port Townsend, WA', lat: 48.1128, lng: -122.7594 },
  { id: '9447130', name: 'Seattle, WA', lat: 47.6026, lng: -122.3393 },

  // Hawaii
  { id: '1612340', name: 'Honolulu, HI', lat: 21.3067, lng: -157.8667 },
  { id: '1615680', name: 'Kahului, HI', lat: 20.895, lng: -156.4767 },
  { id: '1617433', name: 'Kawaihae, HI', lat: 20.0367, lng: -155.8283 },

  // Alaska (select few)
  { id: '9450460', name: 'Ketchikan, AK', lat: 55.3317, lng: -131.6261 },
  { id: '9451600', name: 'Sitka, AK', lat: 57.0517, lng: -135.3417 },
  { id: '9452210', name: 'Juneau, AK', lat: 58.2988, lng: -134.4119 },
  { id: '9455920', name: 'Anchorage, AK', lat: 61.2381, lng: -149.8903 },
];

// Default location
const DEFAULT_LOCATION = {
  id: 'sandy-hook',
  name: 'Sandy Hook, NJ',
  lat: 40.4667,
  lng: -74.01,
  timezone: 'America/New_York',
  orientation: 90,
  noaaStation: '8531680',
  optimal: {
    swellDirs: [90, 112.5, 67.5],
    windDirs: [270, 315, 225],
  }
};

// Current location (shared state)
let currentLocation = null;

// Map instance for location picker
let locationMap = null;
let mapMarker = null;
let pendingLocation = null;

// Callback for when location changes
let onLocationChangeCallback = null;

// ============================================
// LOCATION STATE MANAGEMENT
// ============================================

function loadFavorites() {
  try {
    const saved = localStorage.getItem('surfFavorites');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Failed to load favorites:', e);
    return [];
  }
}

function saveFavorites(favorites) {
  try {
    localStorage.setItem('surfFavorites', JSON.stringify(favorites));
  } catch (e) {
    console.error('Failed to save favorites:', e);
  }
}

function getCurrentLocation() {
  if (currentLocation) return currentLocation;

  const favorites = loadFavorites();
  if (favorites.length > 0) {
    currentLocation = favorites[0];
    // Ensure NOAA station is set for US locations (fixes locations saved before this feature)
    ensureNoaaStation(currentLocation);
  } else {
    currentLocation = DEFAULT_LOCATION;
  }
  return currentLocation;
}

// Ensures a location has a NOAA station if it's in the US
function ensureNoaaStation(location) {
  if (!location) return;

  // Already has a station
  if (location.noaaStation) return;

  // Check if it's a US location and find nearest station
  if (isUSLocation(location.lat, location.lng)) {
    const stationResult = findNearestStation(location.lat, location.lng);
    if (stationResult.isNearby) {
      location.noaaStation = stationResult.station.id;
      console.log(`Auto-assigned NOAA station ${stationResult.station.name} (${stationResult.station.id}) to ${location.name}`);

      // Update in favorites if this location is saved there
      const favorites = loadFavorites();
      const index = favorites.findIndex(f => f.id === location.id);
      if (index >= 0) {
        favorites[index].noaaStation = location.noaaStation;
        saveFavorites(favorites);
      }
    }
  }
}

function setCurrentLocation(location) {
  currentLocation = location;
  if (onLocationChangeCallback) {
    onLocationChangeCallback(location);
  }
}

function onLocationChange(callback) {
  onLocationChangeCallback = callback;
}

function isFirstLaunch() {
  return loadFavorites().length === 0;
}

// ============================================
// NOAA STATION LOOKUP
// ============================================

function findNearestStation(lat, lng) {
  let nearest = null;
  let minDistance = Infinity;

  for (const station of NOAA_STATIONS) {
    const distance = haversineDistance(lat, lng, station.lat, station.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = station;
    }
  }

  // Return station info with distance
  return {
    station: nearest,
    distance: minDistance,
    isNearby: minDistance < 100000 // Within 100km
  };
}

function isUSLocation(lat, lng) {
  // Rough bounding box for US (continental + Hawaii + Alaska)
  // Continental US
  if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66) return true;
  // Hawaii
  if (lat >= 18 && lat <= 23 && lng >= -161 && lng <= -154) return true;
  // Alaska
  if (lat >= 51 && lat <= 72 && lng >= -180 && lng <= -129) return true;

  return false;
}

// ============================================
// COASTLINE ORIENTATION DETECTION
// ============================================

// Cache key for coastline data (rounds to ~100m grid)
function getCoastlineCacheKey(lat, lng) {
  return `coastline_${lat.toFixed(3)}_${lng.toFixed(3)}`;
}

function getCachedCoastline(lat, lng) {
  try {
    const key = getCoastlineCacheKey(lat, lng);
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Failed to read coastline cache:', e);
  }
  return null;
}

function cacheCoastline(lat, lng, data) {
  try {
    const key = getCoastlineCacheKey(lat, lng);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to cache coastline:', e);
  }
}

async function detectBeachOrientation(lat, lng) {
  // Check cache first
  const cached = getCachedCoastline(lat, lng);
  if (cached) {
    console.log('Using cached coastline data');
    return cached;
  }

  const SEARCH_RADIUS = 1000;

  const query = `
    [out:json][timeout:25];
    (
      way["natural"="coastline"](around:${SEARCH_RADIUS},${lat},${lng});
    );
    out geom;
  `;

  const url = 'https://overpass-api.de/api/interpreter';

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.elements || data.elements.length === 0) {
      return {
        orientation: null,
        confidence: 'none',
        error: 'No coastline found within 1km'
      };
    }

    let closestResult = null;
    let minDistance = Infinity;

    for (const way of data.elements) {
      if (!way.geometry || way.geometry.length < 2) continue;

      for (let i = 0; i < way.geometry.length - 1; i++) {
        const p1 = way.geometry[i];
        const p2 = way.geometry[i + 1];

        const result = closestPointOnSegment(lat, lng, p1.lat, p1.lon, p2.lat, p2.lon);

        if (result.distance < minDistance) {
          minDistance = result.distance;
          closestResult = { ...result, p1, p2 };
        }
      }
    }

    if (!closestResult) {
      return {
        orientation: null,
        confidence: 'none',
        error: 'Could not find valid coastline segment'
      };
    }

    const segmentBearing = calculateBearing(
      closestResult.p1.lat, closestResult.p1.lon,
      closestResult.p2.lat, closestResult.p2.lon
    );

    const orientation = (segmentBearing + 90) % 360;

    let confidence;
    if (minDistance < 100) confidence = 'high';
    else if (minDistance < 500) confidence = 'medium';
    else confidence = 'low';

    const result = {
      orientation: Math.round(orientation),
      confidence,
      distanceToCoast: Math.round(minDistance)
    };

    // Cache the result for future use
    cacheCoastline(lat, lng, result);

    return result;

  } catch (error) {
    console.error('Beach orientation detection failed:', error);
    return {
      orientation: null,
      confidence: 'none',
      error: error.message
    };
  }
}

function closestPointOnSegment(lat, lng, lat1, lon1, lat2, lon2) {
  const x = lng, y = lat;
  const x1 = lon1, y1 = lat1;
  const x2 = lon2, y2 = lat2;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return {
      closest: { lat: lat1, lng: lon1 },
      distance: haversineDistance(lat, lng, lat1, lon1)
    };
  }

  let t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));

  const closestLng = x1 + t * dx;
  const closestLat = y1 + t * dy;

  return {
    closest: { lat: closestLat, lng: closestLng },
    distance: haversineDistance(lat, lng, closestLat, closestLng)
  };
}

function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = deg => deg * Math.PI / 180;
  const toDeg = rad => rad * 180 / Math.PI;

  const dLon = toRad(lon2 - lon1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const y = Math.sin(dLon) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);

  let bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function calculateOptimalDirections(orientation) {
  const swellDirs = [
    orientation,
    (orientation + 22.5) % 360,
    (orientation - 22.5 + 360) % 360
  ];

  const offshore = (orientation + 180) % 360;
  const windDirs = [
    offshore,
    (offshore + 45) % 360,
    (offshore - 45 + 360) % 360
  ];

  return { swellDirs, windDirs };
}

function degreesToCardinal(degrees) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(degrees / 22.5) % 16];
}

// ============================================
// TIMEZONE LOOKUP
// ============================================

async function getTimezone(lat, lng) {
  try {
    const response = await fetch(`https://timeapi.io/api/Time/current/coordinate?latitude=${lat}&longitude=${lng}`);
    if (response.ok) {
      const data = await response.json();
      return data.timeZone;
    }
  } catch (e) {
    console.warn('Timezone API failed, using browser timezone');
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// ============================================
// REVERSE GEOCODING
// ============================================

async function reverseGeocode(lat, lng) {
  let locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  try {
    const geoResponse = await fetch(`https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lng}&format=json`);
    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      const parts = [];
      if (geoData.address) {
        if (geoData.address.beach) parts.push(geoData.address.beach);
        else if (geoData.address.tourism) parts.push(geoData.address.tourism);
        else if (geoData.address.suburb) parts.push(geoData.address.suburb);
        else if (geoData.address.town) parts.push(geoData.address.town);
        else if (geoData.address.city) parts.push(geoData.address.city);
        else if (geoData.address.village) parts.push(geoData.address.village);

        if (geoData.address.state) parts.push(geoData.address.state);
        else if (geoData.address.country) parts.push(geoData.address.country);
      }
      if (parts.length > 0) {
        locationName = parts.join(', ');
      }
    }
  } catch (e) {
    console.warn('Reverse geocoding failed');
  }
  return locationName;
}

// ============================================
// LOCATION PICKER UI
// ============================================

function openLocationPicker() {
  const modal = document.getElementById('locationModal');
  if (!modal) return;

  modal.classList.add('open');

  if (!locationMap) {
    initLocationMap();
  }

  renderFavorites();

  pendingLocation = null;
  const preview = document.getElementById('orientationPreview');
  const compass = document.getElementById('compassFallback');
  const results = document.getElementById('searchResults');
  const search = document.getElementById('locationSearch');

  if (preview) preview.classList.add('hidden');
  if (compass) compass.classList.add('hidden');
  if (results) results.innerHTML = '';
  if (search) search.value = '';
}

function closeLocationPicker() {
  const modal = document.getElementById('locationModal');
  if (modal) modal.classList.remove('open');
}

function initLocationMap() {
  const mapEl = document.getElementById('locationMap');
  if (!mapEl || typeof L === 'undefined') return;

  locationMap = L.map('locationMap', {
    zoomControl: true,
    attributionControl: false
  }).setView([20, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(locationMap);

  locationMap.on('click', onMapClick);
}

async function onMapClick(e) {
  const { lat, lng } = e.latlng;

  if (mapMarker) {
    mapMarker.setLatLng([lat, lng]);
  } else {
    mapMarker = L.marker([lat, lng]).addTo(locationMap);
  }

  const instructions = document.getElementById('mapInstructions');
  if (instructions) instructions.textContent = 'Detecting beach orientation...';

  const result = await detectBeachOrientation(lat, lng);

  if (result.orientation !== null) {
    const optimal = calculateOptimalDirections(result.orientation);
    const locationName = await reverseGeocode(lat, lng);

    // Find nearest NOAA station for US locations
    let noaaStation = null;
    if (isUSLocation(lat, lng)) {
      const stationResult = findNearestStation(lat, lng);
      if (stationResult.isNearby) {
        noaaStation = stationResult.station.id;
      }
    }

    pendingLocation = {
      id: `custom-${Date.now()}`,
      name: locationName,
      lat: lat,
      lng: lng,
      orientation: result.orientation,
      confidence: result.confidence,
      optimal: optimal,
      noaaStation: noaaStation
    };

    showOrientationPreview(pendingLocation);
    const compass = document.getElementById('compassFallback');
    if (compass) compass.classList.add('hidden');
    if (instructions) instructions.textContent = 'Tap elsewhere to try a different spot';
  } else {
    const preview = document.getElementById('orientationPreview');
    const compass = document.getElementById('compassFallback');
    if (preview) preview.classList.add('hidden');
    if (compass) compass.classList.remove('hidden');
    if (instructions) instructions.textContent = 'Select beach direction below, or tap closer to the water';

    pendingLocation = {
      id: `custom-${Date.now()}`,
      name: null,
      lat: lat,
      lng: lng,
      orientation: null,
      confidence: 'manual',
      optimal: null,
      noaaStation: null
    };

    reverseGeocode(lat, lng).then(name => {
      if (pendingLocation && pendingLocation.lat === lat) {
        pendingLocation.name = name;
      }
    });

    // Check for NOAA station
    if (isUSLocation(lat, lng)) {
      const stationResult = findNearestStation(lat, lng);
      if (stationResult.isNearby) {
        pendingLocation.noaaStation = stationResult.station.id;
      }
    }

    document.querySelectorAll('.compass-dir').forEach(btn => btn.classList.remove('selected'));
  }
}

function selectCompassDir(degrees) {
  if (!pendingLocation) return;

  document.querySelectorAll('.compass-dir').forEach(btn => {
    btn.classList.toggle('selected', parseInt(btn.dataset.dir) === degrees);
  });

  pendingLocation.orientation = degrees;
  pendingLocation.optimal = calculateOptimalDirections(degrees);

  if (!pendingLocation.name) {
    pendingLocation.name = `${pendingLocation.lat.toFixed(4)}, ${pendingLocation.lng.toFixed(4)}`;
  }

  const compass = document.getElementById('compassFallback');
  if (compass) compass.classList.add('hidden');
  showOrientationPreview(pendingLocation);

  const instructions = document.getElementById('mapInstructions');
  if (instructions) instructions.textContent = 'Tap elsewhere to try a different spot';
}

function showOrientationPreview(location) {
  const preview = document.getElementById('orientationPreview');
  if (!preview) return;

  const nameEl = document.getElementById('previewName');
  const orientEl = document.getElementById('previewOrientation');
  const swellEl = document.getElementById('previewSwell');
  const windEl = document.getElementById('previewWind');

  if (nameEl) nameEl.textContent = location.name;
  if (orientEl) orientEl.textContent = `${degreesToCardinal(location.orientation)} (${location.orientation}°)`;
  if (swellEl) swellEl.textContent = location.optimal.swellDirs.slice(0, 3).map(d => degreesToCardinal(d)).join(', ');
  if (windEl) windEl.textContent = location.optimal.windDirs.slice(0, 3).map(d => degreesToCardinal(d)).join(', ');

  preview.classList.remove('hidden');
}

async function confirmLocation() {
  if (!pendingLocation) return;

  const timezone = await getTimezone(pendingLocation.lat, pendingLocation.lng);
  pendingLocation.timezone = timezone;

  const favorites = loadFavorites();

  const existingIndex = favorites.findIndex(f =>
    Math.abs(f.lat - pendingLocation.lat) < 0.001 &&
    Math.abs(f.lng - pendingLocation.lng) < 0.001
  );

  if (existingIndex >= 0) {
    favorites[existingIndex] = pendingLocation;
  } else {
    if (favorites.length >= 5) {
      alert('Maximum 5 favorites. Please remove one first.');
      return;
    }
    favorites.unshift(pendingLocation);
  }

  saveFavorites(favorites);
  setCurrentLocation(pendingLocation);
  closeLocationPicker();
}

// ============================================
// LOCATION SEARCH
// ============================================

async function searchLocation() {
  const searchInput = document.getElementById('locationSearch');
  const query = searchInput ? searchInput.value.trim() : '';
  if (!query) return;

  const resultsDiv = document.getElementById('searchResults');
  if (!resultsDiv) return;

  resultsDiv.innerHTML = '<div class="detecting-loader">Searching...</div>';

  try {
    const response = await fetch(
      `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(query)}&format=json&limit=5`
    );

    if (!response.ok) throw new Error('Search failed');

    const results = await response.json();

    if (results.length === 0) {
      resultsDiv.innerHTML = '<div class="no-favorites">No results found</div>';
      return;
    }

    resultsDiv.innerHTML = results.map(r => `
      <div class="search-result-item" onclick="selectSearchResult(${r.lat}, ${r.lon}, '${r.display_name.replace(/'/g, "\\'")}')">
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <div>
          <div class="search-result-name">${r.display_name.split(',').slice(0, 2).join(',')}</div>
          <div class="search-result-detail">${r.display_name.split(',').slice(2, 4).join(',')}</div>
        </div>
      </div>
    `).join('');

  } catch (e) {
    console.error('Search failed:', e);
    resultsDiv.innerHTML = '<div class="no-favorites">Search failed. Try again.</div>';
  }
}

function selectSearchResult(lat, lng, name) {
  const resultsDiv = document.getElementById('searchResults');
  if (resultsDiv) resultsDiv.innerHTML = '';

  if (locationMap) {
    locationMap.setView([lat, lng], 14);
  }

  const instructions = document.getElementById('mapInstructions');
  if (instructions) instructions.textContent = 'Now tap the exact spot on the beach';
}

// ============================================
// FAVORITES MANAGEMENT
// ============================================

function renderFavorites() {
  const favorites = loadFavorites();
  const container = document.getElementById('favoritesList');
  if (!container) return;

  if (favorites.length === 0) {
    container.innerHTML = '<div class="no-favorites">No saved locations yet</div>';
    return;
  }

  const current = getCurrentLocation();

  container.innerHTML = favorites.map((fav, index) => `
    <div class="favorite-item ${current?.id === fav.id ? 'active' : ''}"
         onclick="selectFavorite(${index})">
      <span class="favorite-star">★</span>
      <span class="favorite-name">${fav.name}</span>
      <span class="favorite-orientation">${degreesToCardinal(fav.orientation)}</span>
      <button class="favorite-delete" onclick="event.stopPropagation(); deleteFavorite(${index})">
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
        </svg>
      </button>
    </div>
  `).join('');
}

function selectFavorite(index) {
  const favorites = loadFavorites();
  if (index < 0 || index >= favorites.length) return;

  const location = favorites[index];
  ensureNoaaStation(location);

  // Move selected location to front so it persists across pages
  if (index > 0) {
    favorites.splice(index, 1);
    favorites.unshift(location);
    saveFavorites(favorites);
  }

  setCurrentLocation(location);
  closeLocationPicker();
}

function deleteFavorite(index) {
  const favorites = loadFavorites();
  if (index < 0 || index >= favorites.length) return;

  const current = getCurrentLocation();
  const isCurrentLocation = current?.id === favorites[index].id;

  favorites.splice(index, 1);
  saveFavorites(favorites);
  renderFavorites();

  if (isCurrentLocation) {
    if (favorites.length > 0) {
      setCurrentLocation(favorites[0]);
    } else {
      setCurrentLocation(DEFAULT_LOCATION);
    }
  }
}

// ============================================
// SIMPLE LOCATION DROPDOWN (for header)
// ============================================

function renderLocationDropdown(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const favorites = loadFavorites();
  const current = getCurrentLocation();

  if (favorites.length === 0) {
    // No favorites - show button to open picker
    container.innerHTML = `
      <button class="location-btn" onclick="openLocationPicker()">
        <span>Set Location</span>
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </button>
    `;
  } else {
    // Show dropdown with favorites
    container.innerHTML = `
      <button class="location-btn" onclick="openLocationPicker()">
        <span id="currentLocationName">${current?.name || 'Select Location'}</span>
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </button>
    `;
  }
}

function updateLocationDisplay() {
  const nameEl = document.getElementById('currentLocationName');
  const current = getCurrentLocation();
  if (nameEl && current) {
    nameEl.textContent = current.name;
  }
}

// Initialize search input enter key handler
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('locationSearch');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchLocation();
      }
    });
  }
});
