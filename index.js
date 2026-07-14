require("dotenv").config();

const { App } = require("@slack/bolt");
const { evaluate, corr } = require('mathjs');
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
\`/chefcurry-calculate (expression):\` Perform inputted mathematical operation.
\`/chefcurry-trivia:\` Starts a trivia game.
\`/chefcurry-trivia-reset:\` Resets the trivia game. Voids the current game.`
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

const questions = [
  { q: "What is the closest planet to the Sun?", a: "mercury" },
  { q: "Which galaxy is home to our Solar System?", a: "milky way" }, 
  { q: "What is the largest planet in our solar system?", a: "jupiter" },
  { q: "What is the hottest planet in our solar system?", a: "venus" },
  { q: "What force keeps the planets in orbit around the sun?", a: "gravity" },
  { q: "What is the name of the first human-made satellite launched into space?", a: "sputnik" },
  { q: "Which planet is known as the Red Planet?", a: "mars" },
  { q: "What is the approximate age of the universe in billions of years? (Just the number)", a: "14" },
  { q: "What color is a newborn star usually?", a: "blue" },
  { q: "What is the name of the largest moon of Saturn?", a: "titan" },
  { q: "Which element makes up about 75% of the universe's elemental mass?", a: "hydrogen" },
  { q: "What is the boundary surrounding a black hole from which nothing can escape?", a: "event horizon" },
  { q: "What is the name of our closest neighboring spiral galaxy?", a: "andromeda" },
  { q: "Which planet has supersonic winds that blow backward?", a: "neptune" },
  { q: "What is the name of NASA's famous space telescope launched in 1990?", a: "hubble" },
  { q: "What type of star is our Sun?", a: "yellow dwarf" },
  { q: "What is the term for a meteor that survives its passage through the atmosphere and hits the ground?", a: "meteorite" },
  { q: "Which planet has a giant storm called the Great Red Spot?", a: "jupiter" },
  { q: "Who was the first person to step onto the moon?", a: "neil armstrong" },
  { q: "What is the name of the constellation that looks like a winged horse?", a: "pegasus" },
  {q: "Who's the greatest basketball player of all time?", a: "stephen curry"}
];

const trivia = {
    active: false,
    played: [],
    current: -1,
    question: '',
    answer: ''
}

app.command('/chefcurry-trivia', async({ack, respond}) => {
    await ack();
    if (trivia.active) {
        await respond({
            text:
            `A trivia game has already started. Please answer the question. Alternatively, you may use \`/chefcurry-trivia-reset\` to restart the game.`
        });
        return;
    }
    
    trivia.active = true;
    if (trivia.played.length === questions.length) {
        trivia.played = [];
    }

    do {
        trivia.current = Math.floor(Math.random() * questions.length);
    } while (trivia.played.includes(trivia.current));

    trivia.played.push(trivia.current);
    trivia.answer = questions[trivia.current].a;
    trivia.question = questions[trivia.current].q;

    await respond({
        response_type: 'in_channel',
        text: `*Trivia question:* ${trivia.question}`
    });
});

app.message(async({message, say})=> {
    if (!trivia.active || message.bot_id || !message.text) return;

    const userAnswer = message.text.trim().toLowerCase();

    if (userAnswer === trivia.answer.toLowerCase()) {
        const winner = `<@${message.user}>`;
        trivia.active = false;
        await say(`🎊Correct! ${winner} got it right. The answer was \`${trivia.answer}\`!`);
    } else {
        await say(`❌Incorrect! \`${userAnswer}\` is not correct. Please try again.`);
    }
});

app.command('/chefcurry-trivia-reset', async({ack, respond}) => {
    await ack();

    trivia.active = false;
    trivia.played = [];
    trivia.current = -1;
    trivia.question = '';
    trivia.answer = '';

    await respond({text: `Trivia game has been reset. Current game has been voided.`});

});



(async() => {
    await app.start();
    trivia.active = false;
    trivia.played = [];
    trivia.current = -1;
    trivia.question = '';
    trivia.answer = '';
    console.log(`bot is running`);
})();