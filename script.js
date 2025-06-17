const apiKey = '3bc6b358a6c850df8f2f4c82f9bf4187'; // Replace with your OpenWeatherMap API key

function getWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            fetchWeatherData(lat, lon);
        }, showError);
    } else {
        alert("Geolocation is not supported by this browser.");
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
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        displayCurrentLocationWeather(data);
        const forecastData = await fetchForecastData(lat, lon);
        if (forecastData) {
            processAndDisplayForecast(forecastData);
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Failed to fetch weather data. Please try again.');
    }
}

function displayCurrentLocationWeather(data) {
    // Update temperature, wind speed, humidity as before
    document.getElementById('temperature').textContent = data.main.temp.toFixed(1); // Add toFixed(1) for consistency
    document.getElementById('wind-speed').textContent = data.wind.speed;
    document.getElementById('humidity').textContent = data.main.humidity;

    // Update weather description
    const descriptionElement = document.getElementById('current-weather-description');
    if (descriptionElement) {
        descriptionElement.textContent = `Condition: ${data.weather[0].description}`;
    }

    // Update weather icon
    const iconElement = document.getElementById('current-weather-icon');
    if (iconElement) {
        const iconCode = data.weather[0].icon;
        iconElement.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        iconElement.alt = data.weather[0].description;
        iconElement.style.display = 'block';
    }

    // New detailed information
    document.getElementById('current-feels-like').textContent = data.main.feels_like.toFixed(1);
    // data.sys.sunrise and data.sys.sunset are UNIX timestamps in seconds, UTC.
    // data.timezone is the shift in seconds from UTC for the location.
    document.getElementById('current-sunrise').textContent = formatUnixTime(data.sys.sunrise, data.timezone);
    document.getElementById('current-sunset').textContent = formatUnixTime(data.sys.sunset, data.timezone);
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
        const data = await response.json();
        // For now, just log the data. Display logic will be added next.
        console.log('Weather data for ' + city + ':', data);
        // Later, we will call a function here to display this data in the 'searched-weather-container'
        displaySearchedCityWeather(data);
        // We can use city name directly, or lat/lon from the 'data' object (current weather of searched city)
        // Using lat/lon from 'data.coord' is often more reliable for forecast consistency
        const forecastData = await fetchForecastData(data.coord.lat, data.coord.lon, city);
        if (forecastData) {
            processAndDisplayForecast(forecastData);
        }
    } catch (error) {
        console.error('Error fetching weather data for city:', error);
        alert('Failed to fetch weather data for the specified city. Please try again.');
    }
}

function displaySearchedCityWeather(data) {
    // Placeholder: This function will be implemented to display data in the 'searched-weather-container'
    console.log("displaySearchedCityWeather called with:", data);

    const container = document.getElementById('searched-weather-container');
    // Clear previous results or decide on appending/managing multiple city displays
    container.innerHTML = ''; // Simple clear for now

    const weatherCard = document.createElement('div');
    weatherCard.className = 'weather-info-card';

    const cityName = data.name;
    const temp = data.main.temp.toFixed(1);
    const feelsLike = data.main.feels_like.toFixed(1); // New
    const windSpeed = data.wind.speed;
    const humidity = data.main.humidity;
    const description = data.weather[0].description;
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    // Sunrise/Sunset for searched city
    const sunriseTime = formatUnixTime(data.sys.sunrise, data.timezone); // New
    const sunsetTime = formatUnixTime(data.sys.sunset, data.timezone);   // New

    weatherCard.innerHTML = `
        <h3>Weather in ${cityName}</h3>
        <img src="${iconUrl}" alt="${description}" class="weather-icon">
        <p>Temperature: ${temp}°C (Feels like: ${feelsLike}°C)</p> <!-- Modified -->
        <p>Condition: ${description}</p>
        <p>Wind Speed: ${windSpeed} m/s</p>
        <p>Humidity: ${humidity}%</p>
        <p>Sunrise: ${sunriseTime}</p> <!-- New -->
        <p>Sunset: ${sunsetTime}</p> <!-- New -->
    `;
    container.appendChild(weatherCard);
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

function processAndDisplayForecast(forecastData) {
    const forecastDaysContainer = document.querySelector('.forecast-days');
    if (!forecastDaysContainer) {
        console.error("Forecast days container not found in HTML.");
        return;
    }
    forecastDaysContainer.innerHTML = ''; // Clear previous forecast

    const dailyData = {};

    forecastData.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        // Initialize if this date is not yet in dailyData
        if (!dailyData[date]) {
            dailyData[date] = {
                temps: [],
                weatherDescriptions: [],
                icons: [], // Will be used in the next step for icons
                dt: item.dt // Store timestamp for sorting/getting day name
            };
        }
        dailyData[date].temps.push(item.main.temp);
        dailyData[date].weatherDescriptions.push(item.weather[0].description);
        dailyData[date].icons.push(item.weather[0].icon);
    });

    // We want a 5-day forecast, so take up to 5 unique upcoming days
    // The API might return more than 5 days if we are at the beginning of a 3-hour block period
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

        // For icon: try to get one from midday (around 12:00) or default to most frequent
        let representativeIcon = day.icons[Math.floor(day.icons.length / 2)]; // Simple middle one
        // A more robust way for icon: find icon corresponding to most frequent description, or from midday entry
        // For now, let's find an entry around 12:00-15:00 for that day from the original list.
        const middayEntry = forecastData.list.find(item =>
            item.dt_txt.startsWith(date) &&
            (item.dt_txt.includes("12:00:00") || item.dt_txt.includes("15:00:00"))
        );
        if (middayEntry) {
            representativeIcon = middayEntry.weather[0].icon;
        } else if (day.icons.length > 0) {
            // Fallback to most frequent icon if midday not found
            const iconCounts = {};
            day.icons.forEach(icon => {
                iconCounts[icon] = (iconCounts[icon] || 0) + 1;
            });
            representativeIcon = Object.keys(iconCounts).reduce((a, b) => iconCounts[a] > iconCounts[b] ? a : b);
        }


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
        `;
        forecastDaysContainer.appendChild(dayElement);
    });
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
            break;
    }
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
