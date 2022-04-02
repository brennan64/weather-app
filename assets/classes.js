class WeatherUI {
  constructor() {
    // show history buttons on load
    this.showNewHistory();

    // add click button event handler
    $("button.clear-btn").click(() => {
      window.localStorage.removeItem(LS_KEY);
      this.showNewHistory();
      $('input[name="search-query"]').val("");
      $('input[name="search-query"]').focus();
    });
  }

  getUviSeverity = (uvi) => {
    if (uvi >= 8) return "severe";
    else if (uvi >= 3) return "moderate";
    return "mild";
  };

  getHistory() {
    const stringFromStorage = window.localStorage.getItem(LS_KEY) || "[]";
    return JSON.parse(stringFromStorage);
  }

  showNewHistory(history = this.getHistory()) {
    const newInnerHTML = history
      .map(
        (query) => `<button class="history-btn" type="button">${query}</button>`
      )
      .join("");
    $(".search > .history").html(newInnerHTML);
  }

  updateHistory(newItem) {
    // save last 10 unique user searches
    let history = this.getHistory();
    if (!history.includes(newItem)) history.unshift(newItem);
    if (history.length > 10) history = history.slice(0, 10);
    localStorage.setItem(LS_KEY, JSON.stringify(history));
    this.showNewHistory(history);
  }

  updateTodaysForecast({ icon, temp, wind, humidity, uvi }) {
    $(".summary img").attr("src", icon);
    $(".current > .temp").text(`Temp: ${temp.toString()} °F`);
    $(".current > .wind").text(`Wind: ${wind.toString()} MPH`);
    $(".current > .humidity").text(`Humidity: ${humidity.toString()} %`);
    $(".current > .uvi").html(
      `UV Index: <div class="uvi"><p class="${this.getUviSeverity(
        uvi
      )}">${uvi.toString()}</div>`
    );
  }

  updateFiveDayForecast(fiveDay) {
    const newInnerHTML = fiveDay
      .map(
        ({ icon, date, temp, wind, humidity }, idx) =>
          `<div class="card">
                          <h3>${
                            date.getMonth() + 1
                          }/${date.getDate()}/${date.getFullYear()}</h3>
                          <img src="${icon}" alt="Weather icon for day ${
            idx + 1
          } in five-day forecast" />
                          <p class="temp">Temp: ${temp} °F</p>
                          <p class="wind">Wind: ${wind} MPH</p>
                          <p class="humidity">Humidity: ${humidity} %</p>
                      </div>`
      )
      .join("");

    $(".forecast > .cards").html(newInnerHTML);
    $(".forecast > h3").text("5-Day Forecast");
  }

  updateForecasts(locationData, forecastData) {
    // update title
    const { date } = forecastData.today;
    $(".summary > h2").text(
      `${locationData.name} ${
        date.getMonth() + 1
      }/${date.getDate()}/${date.getFullYear()}`
    );

    // update rest of ui
    this.updateHistory(locationData.name);
    this.updateTodaysForecast(forecastData.today);
    this.updateFiveDayForecast(forecastData.fiveDay);
  }
}

class WeatherClient {
  constructor() {
    this.ui = new WeatherUI();
    this.api = "https://api.openweathermap.org/data/2.5";
  }

  async fetchForecastData(lon, lat) {
    const url = new URL(`${this.api}/onecall`);
    url.search = new URLSearchParams({
      lat,
      lon,
      exclude: "minutely,hourly,alerts",
      units: "imperial",
      appId: API_KEY,
    });

    const res = await fetch(url);
    const { current, daily } = await res.json();

    return {
      today: {
        icon: `http://openweathermap.org/img/w/${current.weather[0].icon}.png`,
        date: new Date(current.dt * 1000),
        temp: current.temp,
        wind: current.wind_speed,
        humidity: current.humidity,
        uvi: current.uvi,
      },
      fiveDay: daily.slice(1, 6).map((day) => ({
        icon: `http://openweathermap.org/img/w/${day.weather[0].icon}.png`,
        date: new Date(day.dt * 1000),
        temp: day.temp.day,
        wind: day.wind_speed,
        humidity: day.humidity,
        uvi: day.uvi,
      })),
    };
  }

  async fetchLocationData(query) {
    const url = new URL(`${this.api}/weather`);
    url.search = new URLSearchParams({ q: query, appId: API_KEY });

    const res = await fetch(url);
    const json = await res.json();

    if (json?.cod === 200) {
      return {
        name: json.name,
        lon: json.coord.lon,
        lat: json.coord.lat,
      };
    }

    return {
      name: null,
      lon: null,
      lat: null,
    };
  }

  async search(query) {
    if (query) {
      const locationData = await this.fetchLocationData(query);

      if (locationData?.lon && locationData?.lat && locationData?.name) {
        const forecastData = await this.fetchForecastData(
          locationData.lon,
          locationData.lat
        );
        return this.ui.updateForecasts(locationData, forecastData);
      }

      return alert(`No weather results found for "${query}"`);
    }

    return alert("Please enter a city to search for.");
  }
}
