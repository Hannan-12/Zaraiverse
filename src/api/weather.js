// src/api/weather.js
import axios from 'axios';

// VITAL: This MUST be your real key from the OpenWeatherMap website.
const API_KEY = '184a7f039448bddc28de88fb8281d123';

export async function fetchWeatherByCoords(lat, lon) {
  try {
    // Fetch current weather (this part is fine)
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    const currentRes = await axios.get(currentUrl);

    // Fetch 5-day / 3-hour forecast (guaranteed on free plan)
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    const forecastRes = await axios.get(forecastUrl);

    return {
      current: currentRes.data,
      forecast: forecastRes.data.list, // The data structure is a list of 3-hour forecasts
    };
  } catch (error) {
    console.error("Failed to fetch weather data:", error);
    throw error;
  }
}