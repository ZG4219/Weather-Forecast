const key = '96342a0cd031f214e5d9cb089eb89977';
var city = "Sacramento"; // currently selected city from localStorage
var date = new moment(); // current date
var cities = []; // list of city buttons from localStorage

var currentEl = $('#today');
var citiesContainerEl = $('#saved-cities');
var forecastContainerEl = $('#forecast');
var formEl = $('form');

/** Initialize the variables from localStorage (or browser location) */
function init() {
    city = localStorage.getItem('city') || 'Sacramento';

    // Geolocation example: navigator.geolocation.getCurrentPosition(result => console.log(result))
    // reverse geocoding: https://api.openweathermap.org/geo/1.0/reverse?lat=51.5098&lon=-0.1180&limit=5&appid={API key}
    
    cities = JSON.parse(localStorage.getItem('cities')) || [];
}

/** Search Function to get a latitude and longitude from a city string */
function searchForLocation(input, isInit) {
    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${input}&limit=5&appid=${key}`)
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        // Handle error response
        if (data.cod >= 400) {
            throw data.message;
        }

        // TODO: allow user to select from results
        
        // short circuit setting localStorage if it's page initialization
        if (isInit) {
            return weatherByLocation(data[0].lat, data[0].lon);
        }

        // otherwise set the city as the last searched, and into the cities array
        city = [
            data[0].name,
            data[0].state,
            data[0].country
        ].join(', ');

        localStorage.setItem('city', city);

        if ( !cities.includes(city) ) {
            cities.unshift(city);
        }
        localStorage.setItem('cities', JSON.stringify(cities));
        displayCityButtons(cities);

        return weatherByLocation(data[0].lat, data[0].lon);
    })
    .catch(function(error) {
        // Handle error response
        console.error('Error:', error);
        window.alert(error);
    })
}

/** Gets the weather from the onecall api for a latitude and longitude */
function weatherByLocation(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=Imperial&appid=${key}`)
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        // Handle error response
        if (data.cod >= 400) {
            throw data.message;
        }

        // Update the page with the response data
        displayWeather(data);
    })
    .catch(function(error) {
        // Handle error response
        console.error('Error:', error);
        window.alert(error);
    })
}

/** Converts dt to a moment */
function dtToMoment(dt) {
    return moment(parseInt(dt + "000")); // need to add milliseconds to dt propert
}

/** Displays the city buttons */
function displayCityButtons(citiesArray) {
    // TODO: Allow user to remove a city button
    // TODO: Limit number of cities in the array list
    citiesContainerEl.empty();
    for (var i = 0; i < citiesArray.length; i++) {
        citiesContainerEl.append($(`<button type="button" class="button expanded secondary">${citiesArray[i]}</button>`));
    }
}

/** Displays the weather on the page */
function displayWeather(data) {
    // clear elements

    currentEl.empty();
    forecastContainerEl.empty();

    // Set Current
    currentEl.append(buildMainWeatherCard(data.current));

    // Set 5-day forecast
    for (var i = 1; i < 6; i++) {
        let card = buildForecastWeatherCard(data.daily[i]);
        forecastContainerEl.append(card);
    }
    
}

/** Build main weather card */
function buildMainWeatherCard(data) {
    let date = dtToMoment(data.dt);
    let iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    let description = data.weather[0].description;
    let temp = Math.round(data.temp);
    let wind = Math.round(data.wind_speed);
    return $(`
    <h3>
        <span>${city}</span>
        <span>(${date.format('L')})</span>
        <img src="${iconUrl}" alt="${description}"></img>
    </h3>
    <div>Temp: ${temp}˚</div>
    <div>Wind: ${wind} MPH</div>
    <div>Humidity: ${data.humidity}%</div>
    <div>UV Index: ${buildUVIndexEl(data.uvi)}</div>
    `);
}

/** Builds each separate forecast weather card */
function buildForecastWeatherCard(data) {
    let date = dtToMoment(data.dt);
    let iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    let description = data.weather[0].description;
    let temp = Math.round(data.temp.day);
    let wind = Math.round(data.wind_speed);
    return $(`
    <div class="cell card small-12 medium-auto">
        <div>${date.format("L")}</div>
        <div>
            <img src="${iconUrl}" alt="${description}"></img>
        </div>    
        <div>Temp: ${temp}˚</div>
        <div>Wind: ${wind} MPH</div>
        <div>Humidity: ${data.humidity}%</div>
    </div>
    `);
}

/** Build UV Index element based on value */
function buildUVIndexEl(value) {
    let level = 'none';
    if (value <= 2) {
        // 0-2 is low
        level = 'low';
    }
    else if (value <= 5) {
        // 3-5 is moderate
        level = 'moderate';
    }
    else if (value <= 7) {
        // 6-7 is high
        level = 'high';
    }
    else if (value <= 10) {
        // 8-10 is very high
        level = 'very-high';
    }
    else {
        // 11+ is extreme
        level = 'extreme';
    }

    return `<span class="uv-index ${level}">${value}</span>`;
}

/** Input Handler */
function searchHandler(event) {
    event.preventDefault();
    var searchValue = $('#search-input').val();
    searchForLocation(searchValue);
}

/** City Button Click Handler */
function cityClickHandler(event) {
    let searchTerm = $(event.target).text();
    searchForLocation(searchTerm);
}

/** Add submit handler to search box */
formEl.submit(searchHandler);

/** Add click handler for city buttons */
citiesContainerEl.click(cityClickHandler);

/** On page load, get city saved from localStorage, city buttons saved from localStorage, call API and display the currently selected city. */
init()
displayCityButtons(cities);
searchForLocation(city, true);