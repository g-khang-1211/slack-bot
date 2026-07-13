require("dotenv").config();

const { App } = require("@slack/bolt");
const { evaluate } = require('mathjs');
const axios = require('axios'); 

const app = new App({ 
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
});

const WEATHER_CODES = {
    0: '☀️ Clear',
    1: '🌤️ Mostly Clear',
    2: '⛅ Partly Cloudy',
    3: '☁️ Overcast',
    45: '🌫️ Foggy',
    48: '🌫️ Foggy',
    51: '🌦️ Light Drizzle',
    53: '🌦️ Drizzle',
    55: '🌧️ Heavy Drizzle',
    56: '🌧️ Freezing Drizzle',
    57: '🌧️ Heavy Freezing Drizzle',
    61: '🌦️ Light Rain',
    63: '🌧️ Rain',
    65: '🌧️ Heavy Rain',
    66: '🌧️ Freezing Rain',
    67: '🌧️ Heavy Freezing Rain',
    71: '🌨️ Light Snow',
    73: '❄️ Snow',
    75: '❄️ Heavy Snow',
    77: '🌨️ Snow Grains',
    80: '🌦️ Rain Showers',
    81: '🌧️ Heavy Rain Showers',
    82: '⛈️ Violent Rain Showers',
    85: '🌨️ Snow Showers',
    86: '❄️ Heavy Snow Showers',
    95: '⛈️ Thunderstorm',
    96: '⛈️ Thunderstorm with Hail',
    99: '⛈️ Severe Thunderstorm'
};

async function obtainGeoCode(location) {
    const url = 'https://geocoding-api.open-meteo.com/v1/search';

    const response = await axios.get(url, {
        params: {
            name: location,
            count: 1
        }
    });

    if (!response.data.results) {
        throw new Error('Invalid Location.');
    }

    return response.data.results[0];
}

app.command('/chefcurry-help', async({ack,respond}) => {
    await ack();
    await respond({
        text:
        `Available Commands:
\`/chefcurry-help:\` List out all the commands and their functionality.
\`/chefcurry-ping:\` Check bot's latency.
\`/chefcurry-catfact:\` Get a random cat fact
\`/chefcurry-weather (location):\` Obtain the current weather data of selected location.
\`/chefcurry-calculate (expression):\` Perform inputted mathematical operation.`
    });
});

app.command("/chefcurry-ping", async({ack, respond}) => {
    const start = Date.now();
    await ack();
    const latency = Date.now() - start;
    await respond({text: `Pong!\nLatency ${latency}ms.`});
});

app.command('/chefcurry-catfact', async({ack,respond}) => {
    await ack();

    try {
        const response = await axios.get('https://catfact.ninja/fact');
        await respond({text: `Cat fact:\n${response.data.fact}`});
    } catch (err) {
        await respond({text: `Failed to fetch a cat fact.`});
    }
});

app.command("/chefcurry-joke", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
    await respond({
      text:
    `${response.data.setup}\n${response.data.punchline}`
    });
  } catch (err) {
    await respond({ text: "Failed to fetch a joke." });
  }
});

app.command('/chefcurry-weather', async({command, ack,respond}) => {
    await ack();    

    try {
        const place = await obtainGeoCode(command.text);
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude: place.latitude,
                longitude: place.longitude,
                current: 'temperature_2m,relative_humidity_2m,weather_code',
                daily: 'temperature_2m_max,temperature_2m_min',
                forecast_days: 1,
                timezone: 'auto'
            }
        });

        await respond({text:
            `*${place.name}, ${place.country}*
*Current:* ${response.data.current.temperature_2m}°C
*Today's High:* ${response.data.daily.temperature_2m_max[0]}°C
*Today's Low:* ${response.data.daily.temperature_2m_min[0]}°C
*Humidity:* ${response.data.current.relative_humidity_2m}%
*Condition:* ${WEATHER_CODES[response.data.current.weather_code] ?? 'Unknown'}`
        });
    } catch (err) {
        await respond({text: `Location is not valid. Please try again.`})
    }
});

app.command('/chefcurry-calculate', async({command, ack, respond}) => {
    await ack();
    
    try {
        const expression = command.text.trim();
        if (!expression) {
            await respond({text: `Enter a mathematical expression (e.g. 2+3, sin(45, sqrt(9), etc.)`});
            return;
        }

        const result = evaluate(expression);

        await respond({text: 
            `*Calculation*
*Expression:* \`${expression}\`
*Result:* ${result}`
        });
    } catch (err) {
        await respond({text: `Invalid mathematical equation. Please try again.`})
    } 
});

(async() => {
    await app.start();
    console.log(`bot is running`);
})();