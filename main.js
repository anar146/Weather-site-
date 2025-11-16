// ==================== API KEYS ====================
const OPENWEATHER_KEY = '';
const GNEWS_KEY = '';

// ==================== DOM ELEMENTS ====================
// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');

// Mobile Menu
const burgerMenu = document.getElementById('burger-menu');
const navLinks = document.querySelector('.nav-links');

// Search
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');

// Weather Panel
const weatherPanel = document.getElementById('weather-panel');
const locationName = document.getElementById('location-name');
const tempDisplay = document.getElementById('temp-display');
const conditionDisplay = document.getElementById('condition-display');
const feelsLikeDisplay = document.getElementById('feels-like-display');
const humidityData = document.getElementById('humidity-data');
const windData = document.getElementById('wind-data');
const pressureData = document.getElementById('pressure-data');
const visibilityData = document.getElementById('visibility-data');
const sunriseData = document.getElementById('sunrise-data');
const sunsetData = document.getElementById('sunset-data');

// News Panel
const newsPanel = document.getElementById('news-panel');
const newsContainer = document.getElementById('news-container');

// Globe
const globeContainer = document.getElementById('globe-container');
const globeLoading = document.getElementById('globe-loading');

// Notification
const notificationContainer = document.getElementById('notification-container');

// ==================== GLOBE INITIALIZATION ====================
let globe = null;
let markers = [];

function initGlobe() {
  try {
    if (typeof Globe === 'undefined' || typeof THREE === 'undefined') {
      console.error('Globe.gl or Three.js not loaded');
      setTimeout(() => {
        if (globeLoading) globeLoading.classList.add('hidden');
      }, 2000);
      return;
    }

    globe = Globe()(globeContainer)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .pointsData([])
      .pointAltitude('size')
      .pointColor(() => '#ff4757')
      .pointRadius(0.25)
      .pointsMerge(false)
      .ringsData([])
      .ringColor(() => t => `rgba(255, 71, 87, ${1 - t})`)
      .ringMaxRadius(4)
      .ringPropagationSpeed(3)
      .ringRepeatPeriod(1200)
      .labelsData([])
      .labelText('city')
      .labelSize(1.2)
      .labelColor(() => '#ffffff')
      .labelDotRadius(0.3)
      .labelAltitude(0.02)
      .atmosphereColor('#1e90ff')
      .atmosphereAltitude(0.15);

    // Camera controls
    const controls = globe.controls();
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
    controls.enableZoom = true;
    controls.minDistance = 180;
    controls.maxDistance = 500;

    // Lighting
    const scene = globe.scene();
    scene.add(new THREE.AmbientLight(0xbbbbbb, 0.3));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(-1, 0.5, 1);
    scene.add(directionalLight);

    // Resize handler
    function handleResize() {
      if (globe && globeContainer) {
        globe.width(globeContainer.offsetWidth);
        globe.height(globeContainer.offsetHeight);
      }
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    // Globe click handler
    globe.onGlobeClick(({ lat, lng }) => {
      console.log(`Clicked at: ${lat}, ${lng}`);
      globe.pointOfView({ lat, lng, altitude: 1.5 }, 1000);
    });

    // Hide loading
    setTimeout(() => {
      if (globeLoading) globeLoading.classList.add('hidden');
    }, 1000);

  } catch (error) {
    console.error('Error initializing globe:', error);
    if (globeLoading) globeLoading.classList.add('hidden');
  }
}

// ==================== THEME MANAGEMENT ====================
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  // Update globe theme
  if (globe) {
    try {
      if (theme === 'light') {
        globe.backgroundImageUrl(null);
        globe.atmosphereColor('#4d91ff');
      } else {
        globe.backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png');
        globe.atmosphereColor('#1e90ff');
      }
    } catch (error) {
      console.error('Error updating globe theme:', error);
    }
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  setTheme(theme);
}

// ==================== MOBILE MENU ====================
function toggleMobileMenu() {
  const isExpanded = burgerMenu.getAttribute('aria-expanded') === 'true';
  burgerMenu.setAttribute('aria-expanded', !isExpanded);
  navLinks.classList.toggle('active');
}

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  notificationContainer.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// ==================== WEATHER FUNCTIONS ====================
async function fetchWeather(city) {
  if (!city.trim()) return;

  weatherPanel.classList.add('loading');
  locationName.textContent = 'Loading...';

  const encoded = encodeURIComponent(city);
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encoded}&appid=${OPENWEATHER_KEY}&units=metric`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 404) throw new Error('City not found');
      if (response.status === 401) throw new Error('Invalid API key');
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    // Update UI
    updateWeatherUI(data);

    // Save to localStorage
    localStorage.setItem('lastCity', city);

    // Update globe
    updateGlobe(data);

    showNotification('✓ Weather data loaded', 'success');

  } catch (error) {
    console.error('Weather fetch error:', error);
    
    let errorMessage = 'City not found';
    if (error.name === 'AbortError') errorMessage = 'Request timed out';
    else if (error.message.includes('Invalid API')) errorMessage = 'Invalid API key';
    else errorMessage = error.message;

    locationName.textContent = errorMessage;
    resetWeatherUI();
    
    if (globe) {
      globe.pointsData([]);
      globe.ringsData([]);
      globe.labelsData([]);
    }

    showNotification(`⚠️ ${errorMessage}`, 'error');
  } finally {
    weatherPanel.classList.remove('loading');
  }
}

function updateWeatherUI(data) {
  // Location name
  locationName.textContent = `${data.name}${data.sys?.country ? ', ' + data.sys.country : ''}`;

  // Temperature
  const temp = data.main?.temp;
  tempDisplay.textContent = typeof temp === 'number' ? `${Math.round(temp)}°` : '--°';

  // Condition
  conditionDisplay.textContent = data.weather?.[0]?.main || data.weather?.[0]?.description || '--';

  // Feels like
  const feelsLike = data.main?.feels_like;
  if (feelsLike) {
    feelsLikeDisplay.textContent = `Feels like ${Math.round(feelsLike)}°C`;
  } else {
    feelsLikeDisplay.textContent = '';
  }

  // Humidity
  const humidity = data.main?.humidity;
  humidityData.textContent = typeof humidity === 'number' ? `${humidity}%` : '--%';

  // Wind
  const wind = data.wind?.speed;
  windData.textContent = typeof wind === 'number' ? `${wind} m/s` : '-- m/s';

  // Pressure
  const pressure = data.main?.pressure;
  pressureData.textContent = typeof pressure === 'number' ? `${pressure} hPa` : '-- hPa';

  // Visibility
  const visibility = data.visibility;
  visibilityData.textContent = typeof visibility === 'number' ? `${(visibility / 1000).toFixed(1)} km` : '-- km';

  // Sunrise
  const sunrise = data.sys?.sunrise;
  sunriseData.textContent = sunrise ? formatTime(sunrise) : '--:--';

  // Sunset
  const sunset = data.sys?.sunset;
  sunsetData.textContent = sunset ? formatTime(sunset) : '--:--';
}

function resetWeatherUI() {
  tempDisplay.textContent = '--°';
  conditionDisplay.textContent = '--';
  feelsLikeDisplay.textContent = '';
  humidityData.textContent = '--%';
  windData.textContent = '-- m/s';
  pressureData.textContent = '-- hPa';
  visibilityData.textContent = '-- km';
  sunriseData.textContent = '--:--';
  sunsetData.textContent = '--:--';
}

function formatTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function updateGlobe(data) {
  if (!globe) return;

  try {
    const lat = Number(data.coord?.lat);
    const lng = Number(data.coord?.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error('Invalid coordinates');
    }

    // Update markers
    markers = [{ lat, lng, size: 0.8, color: '#ff4757' }];
    globe.pointsData(markers);
    globe.ringsData([{ lat, lng }]);
    globe.labelsData([{ lat, lng, city: data.name }]);

    // Smooth camera animation
    const controls = globe.controls();
    controls.autoRotate = false;

    globe.pointOfView({ lat, lng, altitude: 3.5 }, 1000);
    setTimeout(() => globe.pointOfView({ lat, lng, altitude: 2.0 }, 1200), 1000);
    setTimeout(() => globe.pointOfView({ lat, lng, altitude: 1.5 }, 800), 2200);
    setTimeout(() => (controls.autoRotate = true), 3500);

  } catch (error) {
    console.error('Error updating globe:', error);
  }
}

// ==================== NEWS FUNCTIONS ====================
async function fetchNews() {
  newsPanel.classList.add('loading');
  const url = `https://gnews.io/api/v4/top-headlines?topic=weather&lang=en&max=5&apikey=${GNEWS_KEY}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`News API error: ${response.status}`);

    const data = await response.json();

    if (!data.articles || data.articles.length === 0) {
      newsContainer.innerHTML = '<div class="news-loading">No weather news found.</div>';
      return;
    }

    // Create news items
    newsContainer.innerHTML = '';
    data.articles.forEach((article, index) => {
      const newsItem = createNewsItem(article, index);
      newsContainer.appendChild(newsItem);
    });

  } catch (error) {
    console.error('News fetch error:', error);
    newsContainer.innerHTML = '<div class="news-loading">Could not load news.</div>';
  } finally {
    newsPanel.classList.remove('loading');
  }
}

function createNewsItem(article, index) {
  const item = document.createElement('a');
  item.href = article.url;
  item.target = '_blank';
  item.rel = 'noopener noreferrer';
  item.className = 'news-item';
  item.style.animationDelay = `${index * 0.1}s`;

  item.innerHTML = `
    <div class="news-item-header">
      <div class="news-item-content">
        <div class="news-item-title">${article.title}</div>
        <div class="news-item-source">${article.source.name}</div>
      </div>
      <i class="fas fa-external-link-alt news-item-icon"></i>
    </div>
  `;

  return item;
}

// ==================== EVENT LISTENERS ====================

// Theme toggle
themeToggle.addEventListener('click', toggleTheme);

// Mobile menu
burgerMenu.addEventListener('click', toggleMobileMenu);

// Search
searchButton.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) fetchWeather(city);
});

cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const city = cityInput.value.trim();
    if (city) fetchWeather(city);
  }
});

// Keyboard shortcut for search focus
window.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== cityInput) {
    e.preventDefault();
    cityInput.focus();
  }
});

// Network status
window.addEventListener('offline', () => {
  showNotification('⚠️ You are offline', 'error');
});

window.addEventListener('online', () => {
  showNotification('✓ Back online', 'success');
});

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme
  initTheme();

  // Initialize globe
  initGlobe();

  // Fetch news
  fetchNews();

  // Load last searched city
  const lastCity = localStorage.getItem('lastCity');
  if (lastCity) {
    cityInput.value = lastCity;
    fetchWeather(lastCity);
  }
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && globe) {
    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = true;
    }
  }
});
