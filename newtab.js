function updateCurrentTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  document.getElementById('current-time').textContent = timeString;
}

function showSetup() {
  document.getElementById('status').style.display = 'none';
  document.getElementById('sunset-display').style.display = 'none';
  document.getElementById('setup').style.display = 'block';
}

function showSunset() {
  document.getElementById('status').style.display = 'none';
  document.getElementById('setup').style.display = 'none';
  document.getElementById('sunset-display').style.display = 'block';
}

function showStatus(message, isError = false) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = isError ? 'error' : '';
  status.style.display = 'block';
  document.getElementById('sunset-display').style.display = 'none';
  document.getElementById('setup').style.display = 'none';
}

function getSunsetByCoords(lat, lon, locationName) {
  showStatus('Fetching sunset time...');

  fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`)
    .then(response => response.json())
    .then(data => {
      if (data.status === 'OK') {
        const sunsetUTC = new Date(data.results.sunset);
        const sunsetLocal = sunsetUTC.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        document.getElementById('sunset-time').textContent = sunsetLocal;
        document.getElementById('location').textContent = locationName;
        
        // Save to storage
        chrome.storage.local.set({ 
          lat: lat, 
          lon: lon, 
          locationName: locationName,
          lastFetch: new Date().toDateString()
        });
        
        showSunset();
      } else {
        throw new Error('Unable to fetch sunset data');
      }
    })
    .catch(error => {
      showStatus('Error fetching sunset time. Please try again.', true);
      setTimeout(showSetup, 2000);
    });
}

function getSunsetByCity(cityName) {
  showStatus('Looking up location...');
  
  // Use Nominatim to geocode the city
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`)
    .then(response => response.json())
    .then(data => {
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const displayName = data[0].display_name.split(',').slice(0, 2).join(',');
        getSunsetByCoords(lat, lon, displayName);
      } else {
        showStatus('City not found. Please try again.', true);
        setTimeout(showSetup, 2000);
      }
    })
    .catch(error => {
      showStatus('Error looking up city. Please try again.', true);
      setTimeout(showSetup, 2000);
    });
}

function useAutoLocation() {
  if (!navigator.geolocation) {
    showStatus('Geolocation is not supported. Please enter your city manually.', true);
    setTimeout(showSetup, 2000);
    return;
  }

  showStatus('Getting your location...');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      
      // Get city name
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(response => response.json())
        .then(geoData => {
          const city = geoData.address.city || geoData.address.town || geoData.address.village || 'Your location';
          const state = geoData.address.state || '';
          const locationName = `${city}${state ? ', ' + state : ''}`;
          getSunsetByCoords(lat, lon, locationName);
        })
        .catch(() => {
          getSunsetByCoords(lat, lon, `Lat: ${lat.toFixed(2)}°, Lon: ${lon.toFixed(2)}°`);
        });
    },
    (error) => {
      showStatus('Could not get location. Please enter your city manually.', true);
      setTimeout(showSetup, 2000);
    }
  );
}

function loadSavedLocation() {
  chrome.storage.local.get(['lat', 'lon', 'locationName', 'lastFetch'], (result) => {
    const today = new Date().toDateString();
    
    if (result.lat && result.lon && result.lastFetch === today) {
      // Use cached data from today
      getSunsetByCoords(result.lat, result.lon, result.locationName);
    } else if (result.lat && result.lon) {
      // Refresh with saved location
      getSunsetByCoords(result.lat, result.lon, result.locationName);
    } else {
      // No saved location, show setup
      showSetup();
    }
  });
}

// Event listeners
document.getElementById('auto-location').addEventListener('click', useAutoLocation);
document.getElementById('manual-location').addEventListener('click', () => {
  const city = document.getElementById('city-input').value.trim();
  if (city) {
    getSunsetByCity(city);
  } else {
    showStatus('Please enter a city name', true);
    setTimeout(showSetup, 1500);
  }
});
document.getElementById('city-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('manual-location').click();
  }
});
document.getElementById('refresh').addEventListener('click', () => {
  chrome.storage.local.get(['lat', 'lon', 'locationName'], (result) => {
    if (result.lat && result.lon) {
      getSunsetByCoords(result.lat, result.lon, result.locationName);
    }
  });
});
document.getElementById('change-location').addEventListener('click', showSetup);

// Initialize
updateCurrentTime();
setInterval(updateCurrentTime, 1000);
loadSavedLocation();
