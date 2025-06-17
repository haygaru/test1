const apiKey = '3bc6b358a6c850df8f2f4c82f9bf4187'; // Replace with your OpenWeatherMap API key

function getWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            fetchWeatherData(lat, lon);
        }, showError);
    } else {
        // We'll handle this more gracefully in the UI later (Error Handling step)
        alert("Geolocation is not supported by this browser. Please search for a city.");
    }
}

function formatUnixTime(unixTimestamp, timezoneOffset) {
    // Create a date object from the unix timestamp (in milliseconds)
    // Adjust for the specific location's timezone offset from UTC (provided by OpenWeatherMap in seconds)
    const date = new Date((unixTimestamp + timezoneOffset) * 1000);
    // Get UTC hours and minutes
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    // Format hours to 12-hour format and determine AM/PM
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert 0 or 24 to 12
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

async function fetchWeatherData(lat, lon) {
    // Clear any existing searched city weather
    const searchedWeatherContainer = document.getElementById('searched-weather-container');
    if (searchedWeatherContainer) {
        searchedWeatherContainer.innerHTML = '';
        searchedWeatherContainer.style.display = 'none'; // Hide it
    }

    // Ensure geolocation section is visible
    const geolocationWeatherSection = document.getElementById('geolocation-weather-section');
    if (geolocationWeatherSection) geolocationWeatherSection.style.display = 'block'; // Or 'flex' etc. depending on its CSS

    // Clear the shared forecast display area before populating
    const forecastDisplayArea = document.getElementById('forecast-display-area');
    if (forecastDisplayArea) forecastDisplayArea.innerHTML = '';

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorData = await response.json();
            alert(`Error fetching current weather: ${errorData.message || response.statusText}`);
            return;
        }
        const currentWeatherData = await response.json();
        displayCurrentLocationWeather(currentWeatherData); // This will display in the restored .weather-info div

        // Fetch and display forecast for this geolocated weather
        const forecastApiData = await fetchForecastData(lat, lon); // fetchForecastData already exists
        if (forecastApiData && forecastDisplayArea) { // Ensure forecastDisplayArea exists
             processAndDisplayForecast(forecastApiData, forecastDisplayArea); // processAndDisplayForecast will render into this shared area
        } else if (forecastApiData && !forecastDisplayArea) {
            console.error("Forecast display area not found for geolocation forecast.");
        }

    } catch (error) {
        console.error('Error fetching current weather data:', error);
        alert('Failed to fetch current weather data. Please try again.');
    }
}

function displayCurrentLocationWeather(data) {
    // Ensure the .weather-info div (or its new equivalent) is targeted correctly.
    // This requires the HTML to be restored first.
    const tempEl = document.getElementById('temperature');
    const windEl = document.getElementById('wind-speed');
    const humidityEl = document.getElementById('humidity');
    const descriptionEl = document.getElementById('current-weather-description');
    const iconEl = document.getElementById('current-weather-icon');
    const feelsLikeEl = document.getElementById('current-feels-like');
    const sunriseEl = document.getElementById('current-sunrise');
    const sunsetEl = document.getElementById('current-sunset');

    if (tempEl) tempEl.textContent = data.main.temp.toFixed(1);
    if (windEl) windEl.textContent = data.wind.speed;
    if (humidityEl) humidityEl.textContent = data.main.humidity;
    if (descriptionEl) descriptionEl.textContent = `Condition: ${data.weather[0].description}`;
    if (iconEl) {
        iconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        iconEl.alt = data.weather[0].description;
        iconEl.style.display = 'block';
    }
    if (feelsLikeEl) feelsLikeEl.textContent = data.main.feels_like.toFixed(1);
    if (sunriseEl) sunriseEl.textContent = formatUnixTime(data.sys.sunrise, data.timezone);
    if (sunsetEl) sunsetEl.textContent = formatUnixTime(data.sys.sunset, data.timezone);
}

async function fetchWeatherByCity(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) { // Check if response is not OK (e.g., 404 city not found)
            const errorData = await response.json();
            alert(`Error: ${errorData.message || response.statusText}`);
            return;
        }
        // Clear geolocation weather display
        const geolocationWeatherSection = document.getElementById('geolocation-weather-section');
        // if (geolocationWeatherSection) geolocationWeatherSection.innerHTML = ''; // Or hide it: .style.display = 'none';
        // Decided to hide, and also clear its specific forecast from the shared area
        if (geolocationWeatherSection) geolocationWeatherSection.style.display = 'none';


        // Clear previous searched city's current weather (if any, from #searched-weather-container)
        const searchedWeatherContainer = document.getElementById('searched-weather-container');
        if (searchedWeatherContainer) searchedWeatherContainer.innerHTML = '';

        // Clear the shared forecast display area
        const forecastDisplayArea = document.getElementById('forecast-display-area');
        if (forecastDisplayArea) forecastDisplayArea.innerHTML = '';

        const currentWeatherData = await response.json();

        // displaySearchedCityWeather now just displays current weather for the searched city
        // into #searched-weather-container. It no longer returns a forecast element.
        displaySearchedCityWeather(currentWeatherData);

        // Fetch and display forecast for this searched city into the shared #forecast-display-area
        const forecastAPIData = await fetchForecastData(currentWeatherData.coord.lat, currentWeatherData.coord.lon, city);
        if (forecastAPIData && forecastDisplayArea) {
            processAndDisplayForecast(forecastAPIData, forecastDisplayArea);
        } else if (forecastAPIData && !forecastDisplayArea) {
            console.error("Forecast display area not found for searched city forecast.");
        }
    } catch (error) {
        console.error('Error fetching weather data for city:', error);
        alert('Failed to fetch weather data for the specified city. Please try again.');
    }
}

// Color cycling variables (cityBlockColorIndex, colorClasses) are removed as they are no longer used.

function displaySearchedCityWeather(data) { // No longer returns a value
    const searchedWeatherContainer = document.getElementById('searched-weather-container');
    if (!searchedWeatherContainer) {
        console.error("Searched weather container not found.");
        return;
    }
    searchedWeatherContainer.innerHTML = '';
    searchedWeatherContainer.style.display = 'block'; // Make sure it's visible

    // Hide geolocation section when displaying searched city
    const geolocationWeatherSection = document.getElementById('geolocation-weather-section');
    if (geolocationWeatherSection) geolocationWeatherSection.style.display = 'none';


    const weatherCard = document.createElement('div');
    weatherCard.className = 'weather-info-card';

    const cityName = data.name;
    const temp = data.main.temp.toFixed(1);
    const feelsLike = data.main.feels_like.toFixed(1);
    const windSpeed = data.wind.speed;
    const humidity = data.main.humidity;
    const description = data.weather[0].description;
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    const sunriseTime = formatUnixTime(data.sys.sunrise, data.timezone);
    const sunsetTime = formatUnixTime(data.sys.sunset, data.timezone);

    weatherCard.innerHTML = `
        <h3>Current Weather in ${cityName}</h3>
        <img src="${iconUrl}" alt="${description}" class="weather-icon">
        <p>Temperature: ${temp}°C (Feels like: ${feelsLike}°C)</p>
        <p>Condition: ${description}</p>
        <p>Wind Speed: ${windSpeed} m/s</p>
        <p>Humidity: ${humidity}%</p>
        <p>Sunrise: ${sunriseTime}</p>
        <p>Sunset: ${sunsetTime}</p>
    `;
    searchedWeatherContainer.appendChild(weatherCard);
}

async function fetchForecastData(lat, lon, cityName = null) {
    let forecastApiUrl;
    if (cityName) {
        forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}&units=metric`;
    } else if (lat !== null && lon !== null) {
        forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else {
        console.error("fetchForecastData: Insufficient location information provided.");
        return null;
    }

    try {
        const response = await fetch(forecastApiUrl);
        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Error fetching forecast data: ${errorData.message || response.statusText}`);
            // Optionally, display this error to the user in a non-alert way later
            return null;
        }
        const data = await response.json();
        // console.log('Raw 5-day forecast data:', data); // For debugging
        return data;
    } catch (error) {
        console.error('Error fetching 5-day forecast data:', error);
        return null;
    }
}

// Add targetElement as a parameter
function processAndDisplayForecast(forecastData, targetElement) {
    // const forecastDaysContainer = document.querySelector('.forecast-days'); // Old way
    if (!targetElement) {
        console.error("Target element for forecast display not provided.");
        return;
    }
    // targetElement is the specific cityForecastContainer div
    targetElement.innerHTML = ''; // Clear previous forecast *for this specific block* (if any, e.g. re-search)

    // Add a heading for this forecast section
    const forecastHeading = document.createElement('h4'); // Changed from H2 to H4 for better hierarchy
    forecastHeading.textContent = `5-Day Forecast for ${forecastData.city.name}`;
    targetElement.appendChild(forecastHeading);

    const forecastDaysWrapper = document.createElement('div'); // New wrapper for the flex layout
    forecastDaysWrapper.className = 'forecast-days'; // Use existing class for styling individual day cards
    targetElement.appendChild(forecastDaysWrapper);


    const dailyData = {};
    // ... (rest of the data processing logic for dailyData remains the same) ...
    forecastData.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        // Initialize if this date is not yet in dailyData
        if (!dailyData[date]) {
            dailyData[date] = {
                temps: [],
                weatherDescriptions: [],
                icons: [],
                dt: item.dt,
                pops: [], // For Probability of Precipitation
                windSpeeds: [], // For Wind Speeds
                // Wind directions are harder to average meaningfully; might show dominant or skip for now
            };
        }
        dailyData[date].temps.push(item.main.temp);
        dailyData[date].weatherDescriptions.push(item.weather[0].description);
        dailyData[date].icons.push(item.weather[0].icon);
        if (item.pop !== undefined) { // pop is probability of precipitation
            dailyData[date].pops.push(item.pop);
        }
        if (item.wind && item.wind.speed !== undefined) {
            dailyData[date].windSpeeds.push(item.wind.speed);
        }
    });

    const uniqueSortedDays = Object.keys(dailyData).sort().slice(0, 5);

    uniqueSortedDays.forEach(date => {
        const day = dailyData[date];
        const minTemp = Math.min(...day.temps);
        const maxTemp = Math.max(...day.temps);

        const descriptionCounts = {};
        day.weatherDescriptions.forEach(desc => {
            descriptionCounts[desc] = (descriptionCounts[desc] || 0) + 1;
        });
        const mostFrequentDescription = Object.keys(descriptionCounts).reduce((a, b) => descriptionCounts[a] > descriptionCounts[b] ? a : b);

        let representativeIcon = day.icons[Math.floor(day.icons.length / 2)];
        const middayEntry = forecastData.list.find(item =>
            item.dt_txt.startsWith(date) &&
            (item.dt_txt.includes("12:00:00") || item.dt_txt.includes("15:00:00"))
        );
        if (middayEntry) {
            representativeIcon = middayEntry.weather[0].icon;
        } else if (day.icons.length > 0) {
            const iconCounts = {};
            day.icons.forEach(icon => {
                iconCounts[icon] = (iconCounts[icon] || 0) + 1;
            });
            representativeIcon = Object.keys(iconCounts).reduce((a, b) => iconCounts[a] > iconCounts[b] ? a : b);
        }

        // Calculate max probability of precipitation for the day
        const maxPop = day.pops.length > 0 ? Math.max(...day.pops) : 0;
        const maxPopPercent = (maxPop * 100).toFixed(0);

        // Calculate average wind speed for the day
        let avgWindSpeed = 0;
        if (day.windSpeeds.length > 0) {
            avgWindSpeed = day.windSpeeds.reduce((acc, speed) => acc + speed, 0) / day.windSpeeds.length;
        }
        const avgWindSpeedFormatted = avgWindSpeed.toFixed(1);

        const dayElement = document.createElement('div');
        dayElement.classList.add('forecast-day');

        const dateObj = new Date(day.dt * 1000);
        const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
        const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        const iconUrl = `https://openweathermap.org/img/wn/${representativeIcon}@2x.png`;

        dayElement.innerHTML = `
            <p class="forecast-date">${dayName}, ${formattedDate}</p>
            <img src="${iconUrl}" alt="${mostFrequentDescription}" class="weather-icon forecast-icon">
            <p class="forecast-temp">Min: ${minTemp.toFixed(1)}°C / Max: ${maxTemp.toFixed(1)}°C</p>
            <p class="forecast-condition">${mostFrequentDescription}</p>
            <p class="forecast-pop">Precip: ${maxPopPercent}%</p> <!-- New -->
            <p class="forecast-wind">Wind: ${avgWindSpeedFormatted} m/s</p> <!-- New -->
        `;
        // Append to the new forecastDaysWrapper instead of forecastDaysContainer directly
        forecastDaysWrapper.appendChild(dayElement);
    });
}

function showError(error) {
    let message = "An unknown error occurred while trying to get your location.";
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = "You denied the request for Geolocation. Please search for a city or enable location services.";
            break;
        case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable. Please search for a city.";
            break;
        case error.TIMEOUT:
            message = "The request to get user location timed out. Please search for a city.";
            break;
    }
    // We'll replace alert with a UI message in a later step.
    alert(message);
}

window.onload = getWeather;

document.getElementById('search-button').addEventListener('click', () => {
    const city = document.getElementById('city-input').value;
    if (city) {
        fetchWeatherByCity(city);
    } else {
        alert("Please enter a city name.");
    }
});
