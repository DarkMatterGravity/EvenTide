// Surf Forecast JavaScript

// ============================================
// COASTLINE ORIENTATION DETECTION (POC)
// ============================================

/**
 * Detect beach orientation from OSM coastline data
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<{orientation: number, confidence: string, debug: object}>}
 * - orientation: degrees (0-360) indicating which way the beach FACES (toward water)
 * - confidence: 'high', 'medium', 'low'
 * - debug: raw data for troubleshooting
 */
async function detectBeachOrientation(lat, lng) {
  const SEARCH_RADIUS = 1000; // meters

  // Query Overpass API for coastline geometry
  const query = `
    [out:json][timeout:25];
    (
      way["natural"="coastline"](around:${SEARCH_RADIUS},${lat},${lng});
    );
    out geom;
  `;

  const url = 'https://overpass-api.de/api/interpreter';

  try {
    console.log('Fetching coastline data from Overpass API...');
    const response = await fetch(url, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Overpass response:', data);

    if (!data.elements || data.elements.length === 0) {
      return {
        orientation: null,
        confidence: 'none',
        error: 'No coastline found within 1km',
        debug: { lat, lng, searchRadius: SEARCH_RADIUS }
      };
    }

    // Find the closest point on any coastline segment
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
          closestResult = {
            ...result,
            p1,
            p2,
            wayId: way.id
          };
        }
      }
    }

    if (!closestResult) {
      return {
        orientation: null,
        confidence: 'none',
        error: 'Could not find valid coastline segment',
        debug: { lat, lng, ways: data.elements.length }
      };
    }

    // Calculate orientation (perpendicular to coastline segment)
    // OSM convention: coastlines are drawn with water on the RIGHT side
    // So we rotate the segment direction 90° clockwise to face the water
    const segmentBearing = calculateBearing(
      closestResult.p1.lat, closestResult.p1.lon,
      closestResult.p2.lat, closestResult.p2.lon
    );

    // Rotate 90° clockwise (add 90°) to face the water
    const orientation = (segmentBearing + 90) % 360;

    // Confidence based on distance to coastline
    let confidence;
    if (minDistance < 100) confidence = 'high';
    else if (minDistance < 500) confidence = 'medium';
    else confidence = 'low';

    return {
      orientation: Math.round(orientation),
      confidence,
      distanceToCoast: Math.round(minDistance),
      debug: {
        lat,
        lng,
        segmentBearing: Math.round(segmentBearing),
        closestPoint: closestResult.closest,
        wayId: closestResult.wayId
      }
    };

  } catch (error) {
    console.error('Beach orientation detection failed:', error);
    return {
      orientation: null,
      confidence: 'none',
      error: error.message,
      debug: { lat, lng }
    };
  }
}

/**
 * Find closest point on a line segment to a given point
 * Returns distance in meters
 */
function closestPointOnSegment(lat, lng, lat1, lon1, lat2, lon2) {
  // Convert to simple planar coordinates (good enough for small distances)
  const x = lng, y = lat;
  const x1 = lon1, y1 = lat1;
  const x2 = lon2, y2 = lat2;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    // Segment is a point
    return {
      closest: { lat: lat1, lng: lon1 },
      distance: haversineDistance(lat, lng, lat1, lon1)
    };
  }

  // Project point onto line segment
  let t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t)); // Clamp to segment

  const closestLng = x1 + t * dx;
  const closestLat = y1 + t * dy;

  return {
    closest: { lat: closestLat, lng: closestLng },
    distance: haversineDistance(lat, lng, closestLat, closestLng),
    t
  };
}

/**
 * Calculate bearing from point 1 to point 2 (in degrees)
 */
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

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = deg => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate optimal swell and wind directions from beach orientation
 * @param {number} orientation - Beach facing direction in degrees
 * @returns {object} - { swellDirs: number[], windDirs: number[] }
 */
function calculateOptimalDirections(orientation) {
  // Optimal swell comes FROM the direction the beach faces (± 22.5°)
  const swellDirs = [
    orientation,
    (orientation + 22.5) % 360,
    (orientation - 22.5 + 360) % 360
  ];

  // Optimal wind is OFFSHORE - blowing from land toward water
  // That's the opposite direction (± 45°)
  const offshore = (orientation + 180) % 360;
  const windDirs = [
    offshore,
    (offshore + 45) % 360,
    (offshore - 45 + 360) % 360
  ];

  return { swellDirs, windDirs };
}

/**
 * Test function - run from browser console to verify detection works
 * Usage: testBeachOrientation()
 */
async function testBeachOrientation() {
  const testCases = [
    { name: 'Sandy Hook, NJ', lat: 40.4667, lng: -74.01, expected: 'E-facing (~90°)' },
    { name: 'Uluwatu, Bali', lat: -8.83, lng: 115.08, expected: 'S/SW-facing (~180-225°)' },
    { name: 'Pipeline, Oahu', lat: 21.665, lng: -158.053, expected: 'N-facing (~0°)' },
    { name: 'Nazaré, Portugal', lat: 39.6021, lng: -9.0698, expected: 'W-facing (~270°)' }
  ];

  console.log('=== Beach Orientation Detection Test ===\n');

  for (const test of testCases) {
    console.log(`Testing ${test.name}...`);
    const result = await detectBeachOrientation(test.lat, test.lng);
    console.log(`  Expected: ${test.expected}`);
    console.log(`  Detected: ${result.orientation}° (${degreesToCardinal(result.orientation || 0)}-facing)`);
    console.log(`  Confidence: ${result.confidence}`);
    console.log(`  Distance to coast: ${result.distanceToCoast}m`);
    if (result.orientation) {
      const optimal = calculateOptimalDirections(result.orientation);
      console.log(`  Optimal swell from: ${optimal.swellDirs.map(d => degreesToCardinal(d)).join(', ')}`);
      console.log(`  Optimal wind from: ${optimal.windDirs.map(d => degreesToCardinal(d)).join(', ')}`);
    }
    if (result.error) console.log(`  Error: ${result.error}`);
    console.log('');

    // Rate limit: wait 1 second between requests (Overpass API courtesy)
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('=== Test Complete ===');
}

// ============================================
// END COASTLINE ORIENTATION DETECTION
// ============================================

// ============================================
// LOCATION MANAGEMENT
// ============================================

// Default locations (fallback if no favorites)
const DEFAULT_LOCATIONS = {
  'sandy-hook': {
    id: 'sandy-hook',
    name: 'Sandy Hook, NJ',
    lat: 40.4667,
    lng: -74.01,
    timezone: 'America/New_York',
    orientation: 90,
    optimal: {
      swellDirs: [90, 112.5, 67.5],
      windDirs: [270, 315, 225],
    }
  }
};

// Current active location
let currentLocation = null;

// Map instance
let locationMap = null;
let mapMarker = null;
let pendingLocation = null; // Location being selected but not yet confirmed

// Load favorites from localStorage
function loadFavorites() {
  try {
    const saved = localStorage.getItem('surfFavorites');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Failed to load favorites:', e);
    return [];
  }
}

// Save favorites to localStorage
function saveFavorites(favorites) {
  try {
    localStorage.setItem('surfFavorites', JSON.stringify(favorites));
  } catch (e) {
    console.error('Failed to save favorites:', e);
  }
}

// Get timezone for coordinates (using browser's guess based on offset)
async function getTimezone(lat, lng) {
  // Simple approach: use a timezone API or default to browser timezone
  // For now, we'll use a free API
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
// LOCATION PICKER UI
// ============================================

function openLocationPicker() {
  const modal = document.getElementById('locationModal');
  modal.classList.add('open');

  // Initialize map if not already done
  if (!locationMap) {
    initLocationMap();
  }

  // Render favorites
  renderFavorites();

  // Clear any pending selection
  pendingLocation = null;
  document.getElementById('orientationPreview').classList.add('hidden');
  document.getElementById('searchResults').innerHTML = '';
  document.getElementById('locationSearch').value = '';
}

function closeLocationPicker() {
  const modal = document.getElementById('locationModal');
  modal.classList.remove('open');
}

function initLocationMap() {
  // Initialize Leaflet map
  locationMap = L.map('locationMap', {
    zoomControl: true,
    attributionControl: false
  }).setView([20, 0], 2);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(locationMap);

  // Handle map clicks
  locationMap.on('click', onMapClick);
}

async function onMapClick(e) {
  const { lat, lng } = e.latlng;

  // Place or move marker
  if (mapMarker) {
    mapMarker.setLatLng([lat, lng]);
  } else {
    mapMarker = L.marker([lat, lng]).addTo(locationMap);
  }

  // Update instructions
  document.getElementById('mapInstructions').textContent = 'Detecting beach orientation...';

  // Detect orientation
  const result = await detectBeachOrientation(lat, lng);

  if (result.orientation !== null) {
    // Get optimal directions
    const optimal = calculateOptimalDirections(result.orientation);

    // Reverse geocode for location name
    let locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        // Build a nice name from the response
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

    // Store pending location
    pendingLocation = {
      id: `custom-${Date.now()}`,
      name: locationName,
      lat: lat,
      lng: lng,
      orientation: result.orientation,
      confidence: result.confidence,
      optimal: optimal
    };

    // Show preview
    showOrientationPreview(pendingLocation);
    document.getElementById('mapInstructions').textContent = 'Tap elsewhere to try a different spot';
  } else {
    // No coastline found
    document.getElementById('mapInstructions').textContent = result.error || 'No coastline found nearby. Try tapping closer to the water.';
    document.getElementById('orientationPreview').classList.add('hidden');
    pendingLocation = null;
  }
}

function showOrientationPreview(location) {
  const preview = document.getElementById('orientationPreview');

  document.getElementById('previewName').textContent = location.name;
  document.getElementById('previewOrientation').textContent =
    `${degreesToCardinal(location.orientation)} (${location.orientation}°)`;
  document.getElementById('previewSwell').textContent =
    location.optimal.swellDirs.slice(0, 3).map(d => degreesToCardinal(d)).join(', ');
  document.getElementById('previewWind').textContent =
    location.optimal.windDirs.slice(0, 3).map(d => degreesToCardinal(d)).join(', ');

  preview.classList.remove('hidden');
}

async function confirmLocation() {
  if (!pendingLocation) return;

  // Get timezone
  const timezone = await getTimezone(pendingLocation.lat, pendingLocation.lng);
  pendingLocation.timezone = timezone;

  // Add to favorites
  const favorites = loadFavorites();

  // Check if we already have this location (by coordinates proximity)
  const existingIndex = favorites.findIndex(f =>
    Math.abs(f.lat - pendingLocation.lat) < 0.001 &&
    Math.abs(f.lng - pendingLocation.lng) < 0.001
  );

  if (existingIndex >= 0) {
    // Update existing
    favorites[existingIndex] = pendingLocation;
  } else {
    // Add new (max 5)
    if (favorites.length >= 5) {
      alert('Maximum 5 favorites. Please remove one first.');
      return;
    }
    favorites.unshift(pendingLocation);
  }

  saveFavorites(favorites);

  // Set as current location and load forecast
  currentLocation = pendingLocation;
  updateLocationName();
  closeLocationPicker();

  await Promise.all([
    loadForecast(),
    loadSunTimes()
  ]);
}

// ============================================
// LOCATION SEARCH
// ============================================

async function searchLocation() {
  const query = document.getElementById('locationSearch').value.trim();
  if (!query) return;

  const resultsDiv = document.getElementById('searchResults');
  resultsDiv.innerHTML = '<div class="detecting-loader">Searching...</div>';

  try {
    // Use Nominatim for geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
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
  // Clear search results
  document.getElementById('searchResults').innerHTML = '';

  // Pan map to location
  locationMap.setView([lat, lng], 14);

  // Update instructions
  document.getElementById('mapInstructions').textContent = 'Now tap the exact spot on the beach where you surf';
}

// Add enter key support for search
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

// ============================================
// FAVORITES MANAGEMENT
// ============================================

function renderFavorites() {
  const favorites = loadFavorites();
  const container = document.getElementById('favoritesList');

  if (favorites.length === 0) {
    container.innerHTML = '<div class="no-favorites">No saved locations yet</div>';
    return;
  }

  container.innerHTML = favorites.map((fav, index) => `
    <div class="favorite-item ${currentLocation?.id === fav.id ? 'active' : ''}"
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

async function selectFavorite(index) {
  const favorites = loadFavorites();
  if (index < 0 || index >= favorites.length) return;

  currentLocation = favorites[index];
  updateLocationName();
  closeLocationPicker();

  await Promise.all([
    loadForecast(),
    loadSunTimes()
  ]);
}

function deleteFavorite(index) {
  const favorites = loadFavorites();
  if (index < 0 || index >= favorites.length) return;

  // Check if this is the current location
  const isCurrentLocation = currentLocation?.id === favorites[index].id;

  favorites.splice(index, 1);
  saveFavorites(favorites);
  renderFavorites();

  // If we deleted the current location, switch to first favorite or default
  if (isCurrentLocation) {
    if (favorites.length > 0) {
      currentLocation = favorites[0];
    } else {
      currentLocation = DEFAULT_LOCATIONS['sandy-hook'];
    }
    updateLocationName();
    loadForecast();
    loadSunTimes();
  }
}

// Toggle hourly section expand/collapse
function toggleHourlyExpand(event) {
  // Don't toggle if clicking on the close button (it handles itself)
  if (event && event.target.closest('.close-btn')) return;

  const section = document.getElementById('hourlySection');

  // If already expanded and clicking inside list, don't collapse
  if (section.classList.contains('expanded') && event && event.target.closest('.hourly-list')) {
    return;
  }

  section.classList.toggle('expanded');
}

// Close button handler
function closeHourlyExpand(event) {
  event.stopPropagation();
  const section = document.getElementById('hourlySection');
  section.classList.remove('expanded');
}

// Get optimal conditions for current location
function getOptimal() {
  const loc = LOCATIONS[currentLocation];
  return {
    swellDirs: loc.optimal.swellDirs,
    windDirs: loc.optimal.windDirs,
    minHeight: 3,
    maxHeight: 6,
    minPeriod: 8
  };
}

let forecastChart = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Set up location dropdown
  const dropdown = document.getElementById('locationSelect');
  if (dropdown) {
    dropdown.addEventListener('change', (e) => {
      switchLocation(e.target.value);
    });
  }

  updateLocationName();
  await Promise.all([
    loadForecast(),
    loadSunTimes()
  ]);
}

function updateLocationName() {
  const loc = LOCATIONS[currentLocation];
  const nameEl = document.getElementById('locationName');
  if (nameEl) nameEl.textContent = loc.name;
}

async function switchLocation(locationId) {
  if (!LOCATIONS[locationId]) return;
  currentLocation = locationId;

  // Show loading state
  document.getElementById('currentWaveHeight').textContent = '--';
  document.getElementById('currentPeriod').textContent = '--';
  document.getElementById('currentSwellDir').textContent = '--';
  document.getElementById('currentWind').textContent = '--';

  await Promise.all([
    loadForecast(),
    loadSunTimes()
  ]);
}

async function loadSunTimes() {
  const loc = LOCATIONS[currentLocation];
  try {
    const url = `https://api.sunrise-sunset.org/json?lat=${loc.lat}&lng=${loc.lng}&formatted=0`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      const sunrise = new Date(data.results.sunrise);
      const sunset = new Date(data.results.sunset);

      document.getElementById('sunriseTime').textContent = sunrise.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      document.getElementById('sunsetTime').textContent = sunset.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  } catch (error) {
    console.error('Failed to load sun times:', error);
  }
}

async function loadForecast() {
  const loc = LOCATIONS[currentLocation];
  const tz = encodeURIComponent(loc.timezone);
  try {
    // Fetch from Open-Meteo Marine API (free, no key needed)
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${loc.lat}&longitude=${loc.lng}&hourly=wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height,swell_wave_direction,swell_wave_period&timezone=${tz}&forecast_days=3`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch forecast');

    const data = await response.json();

    // Also get wind data from Open-Meteo Weather API
    const windUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&hourly=wind_speed_10m,wind_direction_10m&timezone=${tz}&forecast_days=3&wind_speed_unit=mph`;

    const windResponse = await fetch(windUrl);
    const windData = await windResponse.json();

    // Process and display
    const forecast = processForecast(data, windData);
    displayCurrentConditions(forecast[0]);
    displayHourlyForecast(forecast);
    createChart(forecast);

  } catch (error) {
    console.error('Failed to load forecast:', error);
    document.getElementById('hourlyList').innerHTML = '<div class="loading">Failed to load forecast. Please try again.</div>';
  }
}

function processForecast(marineData, windData) {
  const forecast = [];
  const hours = marineData.hourly.time;
  const now = new Date();

  // Find the index of the current hour (or nearest future hour)
  let startIndex = 0;
  for (let i = 0; i < hours.length; i++) {
    const hourTime = new Date(hours[i]);
    if (hourTime >= now) {
      startIndex = i;
      break;
    }
  }

  for (let i = startIndex; i < Math.min(hours.length, startIndex + 48); i++) {
    const time = new Date(hours[i]);

    // Use swell height if available, otherwise total wave height
    const swellHeight = marineData.hourly.swell_wave_height?.[i];
    const totalHeight = marineData.hourly.wave_height?.[i];
    const waveHeightM = swellHeight || totalHeight || 0;
    const waveHeightFt = waveHeightM * 3.28084;

    const swellDir = marineData.hourly.swell_wave_direction?.[i] || marineData.hourly.wave_direction?.[i] || 0;
    const swellPeriod = marineData.hourly.swell_wave_period?.[i] || marineData.hourly.wave_period?.[i] || 0;

    const windSpeed = windData.hourly?.wind_speed_10m?.[i] || 0;
    const windDir = windData.hourly?.wind_direction_10m?.[i] || 0;

    const rating = calculateRating(waveHeightFt, swellPeriod, swellDir, windSpeed, windDir);

    forecast.push({
      time,
      waveHeight: waveHeightFt,
      period: swellPeriod,
      swellDir,
      swellDirText: degreesToCardinal(swellDir),
      windSpeed,
      windDir,
      windDirText: degreesToCardinal(windDir),
      rating,
      score: rating.score
    });
  }

  return forecast;
}

function calculateRating(height, period, swellDir, windSpeed, windDir) {
  const OPTIMAL = getOptimal();
  let score = 50; // Start at fair

  // Wave height scoring (0-30 points)
  if (height < 1) {
    score -= 40; // Flat
  } else if (height >= OPTIMAL.minHeight && height <= OPTIMAL.maxHeight) {
    score += 25; // Ideal height
  } else if (height > OPTIMAL.maxHeight && height <= 8) {
    score += 15; // Good but big
  } else if (height > 8) {
    score += 5; // Too big for most
  } else if (height >= 2) {
    score += 10; // Rideable
  }

  // Period scoring (0-25 points)
  if (period >= 12) {
    score += 25; // Long period ground swell
  } else if (period >= OPTIMAL.minPeriod) {
    score += 20; // Good period
  } else if (period >= 6) {
    score += 10; // Short period
  } else {
    score -= 10; // Wind chop
  }

  // Swell direction scoring (0-20 points)
  const swellDirDiff = Math.min(
    ...OPTIMAL.swellDirs.map(d => Math.abs(angleDiff(swellDir, d)))
  );
  if (swellDirDiff <= 15) {
    score += 20; // Perfect direction
  } else if (swellDirDiff <= 30) {
    score += 15; // Good direction
  } else if (swellDirDiff <= 45) {
    score += 10; // OK direction
  } else if (swellDirDiff <= 60) {
    score += 5; // Marginal
  }

  // Wind scoring (0-25 points)
  const windDirDiff = Math.min(
    ...OPTIMAL.windDirs.map(d => Math.abs(angleDiff(windDir, d)))
  );

  if (windSpeed < 5) {
    score += 20; // Glass
  } else if (windSpeed < 10 && windDirDiff <= 45) {
    score += 25; // Light offshore
  } else if (windSpeed < 15 && windDirDiff <= 45) {
    score += 15; // Offshore but breezy
  } else if (windSpeed < 10) {
    score += 10; // Light onshore
  } else if (windSpeed >= 20) {
    score -= 15; // Too windy
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine rating label
  let label, className;
  if (height < 1) {
    label = 'FLAT';
    className = 'flat';
  } else if (score >= 85) {
    label = 'EPIC';
    className = 'epic';
  } else if (score >= 70) {
    label = 'GOOD';
    className = 'good';
  } else if (score >= 50) {
    label = 'FAIR';
    className = 'fair';
  } else {
    label = 'POOR';
    className = 'poor';
  }

  return { score, label, className };
}

function angleDiff(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function degreesToCardinal(degrees) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(degrees / 22.5) % 16];
}

function displayCurrentConditions(current) {
  document.getElementById('currentWaveHeight').textContent = current.waveHeight.toFixed(1);
  document.getElementById('currentPeriod').textContent = current.period.toFixed(0);
  document.getElementById('currentSwellDir').textContent = current.swellDirText;
  document.getElementById('currentWind').textContent = Math.round(current.windSpeed);

  const windDirEl = document.getElementById('currentWindDir');
  if (windDirEl) {
    windDirEl.textContent = current.windDirText;
  }

  const ratingEl = document.getElementById('currentRating');
  ratingEl.textContent = current.rating.label;
  ratingEl.className = `rating rating-${current.rating.className}`;

  // Scale wave image based on wave height (6ft surfer = reference)
  updateWaveScale(current.waveHeight);
}

function updateWaveScale(waveHeightFt) {
  const waveLine = document.getElementById('waveLine');
  const surferImg = document.getElementById('surferImg');
  if (!waveLine || !surferImg) return;

  // Surfer is 6ft reference
  const SURFER_HEIGHT_FT = 6;
  const SURFER_BASE_PX = 150; // matches CSS base height
  const MAX_WAVE_LINE_PX = 140; // max line position (just above surfer head)

  let waveLinePx;
  let surferHeightPx = SURFER_BASE_PX;

  if (waveHeightFt <= 10) {
    // Normal waves: line scales with wave height
    waveLinePx = (waveHeightFt / SURFER_HEIGHT_FT) * SURFER_BASE_PX;
    waveLinePx = Math.max(5, Math.min(MAX_WAVE_LINE_PX, waveLinePx));
  } else {
    // Giant waves (>10ft): line at max, surfer shrinks to show scale
    waveLinePx = MAX_WAVE_LINE_PX;
    // Shrink surfer so the ratio still makes sense
    // e.g., 20ft wave = surfer at 50% (6ft person looks half the wave height)
    surferHeightPx = SURFER_BASE_PX * (10 / waveHeightFt);
    surferHeightPx = Math.max(30, surferHeightPx); // don't go below 30px
  }

  // Apply position - bottom offset positions the dotted line
  waveLine.style.bottom = `${waveLinePx}px`;
  surferImg.style.height = `${surferHeightPx}px`;
}

function displayHourlyForecast(forecast) {
  const container = document.getElementById('hourlyList');

  const html = forecast.map(hour => {
    const timeStr = hour.time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true
    });
    const dayStr = hour.time.toLocaleDateString('en-US', { weekday: 'short' });
    const isNewDay = hour.time.getHours() === 0;

    return `
      <div class="hourly-item">
        <div class="hourly-time">${isNewDay ? dayStr : ''} ${timeStr}</div>
        <div class="hourly-bar-container">
          <div class="hourly-bar ${hour.rating.className}" style="width: ${hour.score}%"></div>
        </div>
        <div class="hourly-height">${hour.waveHeight.toFixed(1)} ft</div>
        <div class="hourly-period">${hour.period.toFixed(0)}s ${hour.swellDirText}</div>
        <div class="hourly-wind">${Math.round(hour.windSpeed)} ${hour.windDirText}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function createChart(forecast) {
  const ctx = document.getElementById('forecastChart').getContext('2d');

  if (forecastChart) forecastChart.destroy();

  // Create gradient based on ratings
  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, 'rgba(66, 153, 225, 0.3)');
  gradient.addColorStop(1, 'rgba(66, 153, 225, 0.05)');

  forecastChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Wave Height',
          data: forecast.map(f => ({ x: f.time, y: f.waveHeight })),
          borderColor: '#4299e1',
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4
        },
        {
          label: 'Period',
          data: forecast.map(f => ({ x: f.time, y: f.period })),
          borderColor: '#48bb78',
          borderWidth: 1.5,
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          yAxisID: 'y2'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        annotation: {
          annotations: {
            nowLine: {
              type: 'line',
              xMin: new Date(),
              xMax: new Date(),
              borderColor: '#fc8181',
              borderWidth: 2,
              label: {
                display: true,
                content: 'Now',
                position: 'start',
                backgroundColor: '#fc8181',
                color: '#fff',
                font: { size: 10, weight: 'bold' },
                padding: 3
              }
            }
          }
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#718096',
            font: { size: 10 },
            boxWidth: 20,
            padding: 10
          }
        },
        tooltip: {
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          titleColor: '#edf2f7',
          bodyColor: '#a0aec0',
          callbacks: {
            title: items => {
              const d = new Date(items[0].parsed.x);
              return d.toLocaleString('en-US', {
                weekday: 'short', hour: 'numeric', hour12: true
              });
            },
            label: item => {
              if (item.datasetIndex === 0) {
                return `Waves: ${item.parsed.y.toFixed(1)} ft`;
              }
              return `Period: ${item.parsed.y.toFixed(0)}s`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: { unit: 'hour', displayFormats: { hour: 'ha' }, stepSize: 6 },
          grid: { color: 'rgba(45, 55, 72, 0.5)' },
          ticks: { color: '#718096', font: { size: 10 }, maxRotation: 0 }
        },
        y: {
          title: { display: true, text: 'Height (ft)', color: '#718096', font: { size: 10 } },
          grid: { color: 'rgba(45, 55, 72, 0.5)' },
          ticks: { color: '#718096', font: { size: 10 } },
          min: 0
        },
        y2: {
          position: 'right',
          title: { display: true, text: 'Period (s)', color: '#718096', font: { size: 10 } },
          grid: { display: false },
          ticks: { color: '#718096', font: { size: 10 } },
          min: 0
        }
      }
    }
  });
}
