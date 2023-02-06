const apiKey = "4f4594dc83e0d37f3e776909ea173433";
let searchHistory = JSON.parse(localStorage.getItem('citySearch'));
if(searchHistory===null){
  searchHistory = [];
}

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
  const today = $('#today')
  today.empty();
  const currentDate = currentWeather.currentDate.format('DD/MM/YYYY');
  const currentTemp = currentWeather.currentTemp;
  const currentWind = currentWeather.currentWind;
  const currentHumidity = currentWeather.currentHumidity;
  const weatherIconURL = "https://openweathermap.org/img/wn/" + currentWeather.currentWeatherType + "@2x.png";
  const weatherDescription = currentWeather.currentWeatherDescription;
  const titleRow = $('<div>');
  const cityh2 = $('<h2>').text(city + ' (' + currentDate + ') ');
  const weatherIcon = $('<img>');
  weatherIcon.attr('src', weatherIconURL);
  weatherIcon.attr('alt', weatherDescription);
  titleRow.append(cityh2, weatherIcon);
  const tempP = $('<p>').text('Temp: ' + currentTemp + ' °C');
  const windP = $('<p>').text('Wind: ' + currentWind + ' KPH');
  const humidityP = $('<p>').text('Humidity: ' + currentHumidity + ' %');
  
  // append elements to the page
  today.append(titleRow, tempP, windP, humidityP);
  today.addClass('border');
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
      if(parseInt(weatherEntry.weather[0].icon.substring(0,2)) > parseInt(weatherPerDay[date].weatherIcon)){
        weatherPerDay[date].weatherIcon = weatherEntry.weather[0].icon.substring(0,2);
        weatherPerDay[date].weatherDescription = weatherEntry.weather[0].description;
      }
    } else {
      weatherPerDay[date] = {
        'temp': null,
        'wind': null,
        'humidity': null,
        'weatherIcon': null,
        'weatherDescription': null
      }
      weatherPerDay[date].temp = weatherEntry.main.temp;
      weatherPerDay[date].wind = weatherEntry.wind.speed;
      weatherPerDay[date].humidity = weatherEntry.main.humidity;
      weatherPerDay[date].weatherIcon = weatherEntry.weather[0].icon.substring(0,2);
      weatherPerDay[date].weatherDescription = weatherEntry.weather[0].description;
    }
  });
  return weatherPerDay
}
/**
 * A function that takes an object of objects that have the date they apply to as their key
 * and loops through those objects displaying them in the forecast area of the page.
 * @param {Object} weatherPerDay 
 */
function displayWeatherPerDay(weatherPerDay){
  // empty div of previous forecast details
  $('#forecast').empty();
  const forecastArea = $('#forecast');
  const forecastTitle = $('<h2>').text('5-Day Forecast:');
  forecastTitle.addClass('col-12');
  forecastArea.append(forecastTitle);
  // loop through each key in weatherPerDay object
  for(date in weatherPerDay){
    // depending on the time of day the current day can be contained in the 5 day forecast (but not
    // always) so only display on the webpage if the date key isn't equal to the current day
    if(date !== moment().format('DD/MM/YYYY')){
      const card = $('<div>');
      const cardHTML = `
      <div class="card-body">
        <h3 class="card-title">${date}</h3>
        <div class="card-text">
          <img src="https://openweathermap.org/img/wn/${weatherPerDay[date].weatherIcon}d@2x.png" alt="${weatherPerDay[date].weatherDescription}">
          <p>Temp: ${weatherPerDay[date].temp} °C</p>
          <p>Wind: ${weatherPerDay[date].wind} KPH</p>
          <p>Humidity: ${weatherPerDay[date].humidity} %</p>
        </div>
      </div>`
      card.append(cardHTML);
      card.addClass('card');
      forecastArea.append(card);
    }
  }
}

function displaySearchHistory(){
  $('#history').empty();
  searchHistory.forEach(function(city){
    const cityNameP = $('<button>').text(city);
    cityNameP.addClass('list-group-item')
    cityNameP.data('city', city);
    $('#history').append(cityNameP);
  })
}

function addCityToHistory(city){
  if(searchHistory.includes(city)){
    const cityPosition = searchHistory.findIndex(element => element===city);
    searchHistory.splice(cityPosition, 1);
  } else if(searchHistory.length===6){
    searchHistory.pop();
  }
  searchHistory.unshift(city);
  localStorage.setItem('citySearch', JSON.stringify(searchHistory));
}

function displayWeatherForCity(city){
  addCityToHistory(city);
  displaySearchHistory();

  let queryUrl = "https://api.openweathermap.org/geo/1.0/direct?q=" + city + "&limit=5&appid=" + apiKey;

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
      const weatherPerDay = getWeatherPerDay(response.list);
      displayWeatherPerDay(weatherPerDay);
    })
  })
}

$(document).ready(function(){
  displaySearchHistory();

  $('#search-button').on('click', function(event){
    event.preventDefault();
    const searchInput = $('#search-input');
    const city = searchInput.val();
    searchInput.val('');
    displayWeatherForCity(city);
  })

  $('#history').on('click', 'button', function(){
    const city = $(this).data('city');
    displayWeatherForCity(city);
  })
})