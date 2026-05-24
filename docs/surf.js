// Surf Forecast JavaScript
// Uses shared location.js for location management

let forecastChart = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Get current location from shared module
  const location = getCurrentLocation();

  // Update UI
  updateLocationName();
  updateGuideSection();

  // Load data
  await Promise.all([
    loadForecast(),
    loadSunTimes()
  ]);

  // Listen for location changes
  onLocationChange(async (newLocation) => {
    updateLocationName();
    updateGuideSection();
    showLoadingState();
    await Promise.all([
      loadForecast(),
      loadSunTimes()
    ]);
  });
}

function updateLocationName() {
  const location = getCurrentLocation();
  const nameEl = document.getElementById('locationName');
  if (nameEl && location) {
    nameEl.textContent = location.name;
  }
}

function updateGuideSection() {
  const location = getCurrentLocation();
  if (!location) return;

  // Update guide title
  const titleEl = document.getElementById('guideTitle');
  if (titleEl) {
    const shortName = location.name.split(',')[0];
    titleEl.textContent = `${shortName} Surf Guide`;
  }

  // Update optimal swell directions
  const swellEl = document.getElementById('guideSwell');
  if (swellEl && location.optimal) {
    swellEl.textContent = location.optimal.swellDirs
      .slice(0, 3)
      .map(d => degreesToCardinal(d))
      .join(', ');
  }

  // Update optimal wind directions
  const windEl = document.getElementById('guideWind');
  if (windEl && location.optimal) {
    windEl.textContent = location.optimal.windDirs
      .slice(0, 3)
      .map(d => degreesToCardinal(d))
      .join(', ') + ' (offshore)';
  }
}

function showLoadingState() {
  document.getElementById('currentWaveHeight').textContent = '--';
  document.getElementById('currentPeriod').textContent = '--';
  document.getElementById('currentSwellDir').textContent = '--';
  document.getElementById('currentWind').textContent = '--';
}

// Get optimal conditions for current location
function getOptimal() {
  const location = getCurrentLocation();
  if (!location || !location.optimal) {
    return {
      swellDirs: [90, 112.5, 67.5],
      windDirs: [270, 315, 225],
      minHeight: 3,
      maxHeight: 6,
      minPeriod: 8
    };
  }
  return {
    swellDirs: location.optimal.swellDirs,
    windDirs: location.optimal.windDirs,
    minHeight: 3,
    maxHeight: 6,
    minPeriod: 8
  };
}

async function loadSunTimes() {
  const location = getCurrentLocation();
  if (!location) return;

  try {
    // Use suncalc library (client-side calculation, no API needed)
    const times = SunCalc.getTimes(new Date(), location.lat, location.lng);

    document.getElementById('sunriseTime').textContent = times.sunrise.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    document.getElementById('sunsetTime').textContent = times.sunset.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Failed to load sun times:', error);
  }
}

async function loadForecast() {
  const location = getCurrentLocation();
  if (!location) return;

  const tz = encodeURIComponent(location.timezone || 'America/New_York');
  try {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${location.lat}&longitude=${location.lng}&hourly=wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height,swell_wave_direction,swell_wave_period&timezone=${tz}&forecast_days=3`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch forecast');

    const data = await response.json();

    const windUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&hourly=wind_speed_10m,wind_direction_10m&timezone=${tz}&forecast_days=3&wind_speed_unit=mph`;

    const windResponse = await fetch(windUrl);
    const windData = await windResponse.json();

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
  let score = 50;

  if (height < 1) {
    score -= 40;
  } else if (height >= OPTIMAL.minHeight && height <= OPTIMAL.maxHeight) {
    score += 25;
  } else if (height > OPTIMAL.maxHeight && height <= 8) {
    score += 15;
  } else if (height > 8) {
    score += 5;
  } else if (height >= 2) {
    score += 10;
  }

  if (period >= 12) {
    score += 25;
  } else if (period >= OPTIMAL.minPeriod) {
    score += 20;
  } else if (period >= 6) {
    score += 10;
  } else {
    score -= 10;
  }

  const swellDirDiff = Math.min(
    ...OPTIMAL.swellDirs.map(d => Math.abs(angleDiff(swellDir, d)))
  );
  if (swellDirDiff <= 15) {
    score += 20;
  } else if (swellDirDiff <= 30) {
    score += 15;
  } else if (swellDirDiff <= 45) {
    score += 10;
  } else if (swellDirDiff <= 60) {
    score += 5;
  }

  const windDirDiff = Math.min(
    ...OPTIMAL.windDirs.map(d => Math.abs(angleDiff(windDir, d)))
  );

  if (windSpeed < 5) {
    score += 20;
  } else if (windSpeed < 10 && windDirDiff <= 45) {
    score += 25;
  } else if (windSpeed < 15 && windDirDiff <= 45) {
    score += 15;
  } else if (windSpeed < 10) {
    score += 10;
  } else if (windSpeed >= 20) {
    score -= 15;
  }

  score = Math.max(0, Math.min(100, score));

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

  updateWaveScale(current.waveHeight);
}

function updateWaveScale(waveHeightFt) {
  const waveLine = document.getElementById('waveLine');
  const surferImg = document.getElementById('surferImg');
  if (!waveLine || !surferImg) return;

  const SURFER_HEIGHT_FT = 6;
  const SURFER_BASE_PX = 150;
  const MAX_WAVE_LINE_PX = 140;

  let waveLinePx;
  let surferHeightPx = SURFER_BASE_PX;

  if (waveHeightFt <= 10) {
    waveLinePx = (waveHeightFt / SURFER_HEIGHT_FT) * SURFER_BASE_PX;
    waveLinePx = Math.max(5, Math.min(MAX_WAVE_LINE_PX, waveLinePx));
  } else {
    waveLinePx = MAX_WAVE_LINE_PX;
    surferHeightPx = SURFER_BASE_PX * (10 / waveHeightFt);
    surferHeightPx = Math.max(30, surferHeightPx);
  }

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

// Toggle hourly section expand/collapse
function toggleHourlyExpand(event) {
  if (event && event.target.closest('.close-btn')) return;

  const section = document.getElementById('hourlySection');

  if (section.classList.contains('expanded') && event && event.target.closest('.hourly-list')) {
    return;
  }

  section.classList.toggle('expanded');
}

function closeHourlyExpand(event) {
  event.stopPropagation();
  const section = document.getElementById('hourlySection');
  section.classList.remove('expanded');
}
