const apiKey = "4f4594dc83e0d37f3e776909ea173433";

$(document).ready(

  $('#search-button').on('click', function(event){
    event.preventDefault();
    const searchInput = $('#search-input');
    const city = searchInput.val();

    let queryUrl = "http://api.openweathermap.org/geo/1.0/direct?q=" + city + "&limit=5&appid=" + apiKey;

    $.ajax({
      url: queryUrl,
      method: "GET",
    }).then(function(response){
      const lat = response[0].lat;
      const lon = response[0].lon;
      
      queryUrl = "https://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&units=metric&appid=" + apiKey;

      $.ajax({
        url: queryUrl,
        method: "GET",
      }).then(function(response){
        const currentWeather = getCurrentWeather(response);
        displayCurrentWeather(response.name, currentWeather);
      })
      
      queryUrl = "https://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon + "&units=metric&appid=" + apiKey;

      $.ajax({
        url: queryUrl,
        method: "GET",
      }).then(function(response){
        console.log(response);
        const weatherPerDay = getWeatherPerDay(response.list);
        console.log(weatherPerDay);
      })
    })
  })
)
/**
 * A function that takes a /weather API response from openweathermap.org and returns an object
 * containing the current weather
 * @param {Response} response 
 * @returns 
 */
function getCurrentWeather(response){
  const currentWeather = {
    'currentDate': moment.unix(response.dt),
    'currentTemp': response.main.temp,
    'currentWind': response.wind.speed,
    'currentHumidity': response.main.humidity,
    'currentWeatherType': response.weather[0].icon,
    'currentWeatherDescription': response.weather[0].description,
  }
  return currentWeather;
}

/**
 * A function to display the current city and weather for that city on the webpage
 * @param {Text} city 
 * @param {Object} currentWeather 
 */
function displayCurrentWeather(city, currentWeather){
  $('#today').empty();
  const currentDate = currentWeather.currentDate.format('DD/MM/YYYY');
  const currentTemp = currentWeather.currentTemp;
  const currentWind = currentWeather.currentWind;
  const currentHumidity = currentWeather.currentHumidity;
  const weatherIconURL = "http://openweathermap.org/img/wn/" + currentWeather.currentWeatherType + "@2x.png";
  const weatherDescription = currentWeather.currentWeatherDescription;
  const titleRow = $('<div>');
  const cityh2 = $('<h2>').text(city + ' (' + currentDate + ') ');
  const weatherIcon = $('<img>');
  weatherIcon.attr('src', weatherIconURL);
  weatherIcon.attr('alt', "An icon showing the weather is " + weatherDescription);
  titleRow.append(cityh2, weatherIcon);
  const tempP = $('<p>').text('Temp: ' + currentTemp + '°C');
  const windP = $('<p>').text('Wind: ' + currentWind + ' KPH');
  const humidityP = $('<p>').text('Humidity: ' + currentHumidity + '%');
  
  // append elements to the page
  $('#today').append(titleRow, tempP, windP, humidityP);
}

/**
 * A function that takes an array of weather with multiple elements across the day
 * and returns the data as one element per day with max temp, humidity and wind speed along
 * with an array of weather Types for the icon
 * @param {Array} weatherArray 
 * @returns 
 */
function getWeatherPerDay(weatherArray){
  const weatherPerDay = {}
  weatherArray.forEach(function(weatherEntry){
    const date = moment.unix(weatherEntry.dt).format("DD/MM/YYYY");
    if(date in weatherPerDay){
      weatherPerDay[date].temp = Math.max(weatherPerDay[date].temp, weatherEntry.main.temp);
      weatherPerDay[date].wind = Math.max(weatherPerDay[date].wind, weatherEntry.wind.speed);
      weatherPerDay[date].humidity = Math.max(weatherPerDay[date].humidity, weatherEntry.main.humidity);
      if(parseInt(weatherEntry.weather[0].icon, 24) > parseInt(weatherPerDay[date].weatherIcon, 24)){
        weatherPerDay[date].weatherIcon = weatherEntry.weather[0].icon;
      }
    } else {
      weatherPerDay[date] = {
        'temp': null,
        'wind': null,
        'humidity': null,
        'weatherIcon': null,
      }
      weatherPerDay[date].temp = weatherEntry.main.temp;
      weatherPerDay[date].wind = weatherEntry.wind.speed;
      weatherPerDay[date].humidity = weatherEntry.main.humidity;
      weatherPerDay[date].weatherIcon = weatherEntry.weather[0].icon;
    }
  });
  return weatherPerDay
}