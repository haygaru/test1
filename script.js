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

async function fetchWeatherData(lat, lon) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        displayCurrentLocationWeather(data);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Failed to fetch weather data. Please try again.');
    }
}

function displayCurrentLocationWeather(data) {
    document.getElementById('temperature').textContent = data.main.temp;
    document.getElementById('wind-speed').textContent = data.wind.speed;
    document.getElementById('humidity').textContent = data.main.humidity;
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
    weatherCard.className = 'weather-info-card'; // Add a class for styling

    const cityName = data.name;
    const temp = data.main.temp;
    const windSpeed = data.wind.speed;
    const humidity = data.main.humidity;
    const description = data.weather[0].description;

    weatherCard.innerHTML = `
        <h3>Weather in ${cityName}</h3>
        <p>Temperature: ${temp}°C</p>
        <p>Wind Speed: ${windSpeed} m/s</p>
        <p>Humidity: ${humidity}%</p>
        <p>Condition: ${description}</p>
    `;
    container.appendChild(weatherCard);
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
