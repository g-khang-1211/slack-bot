require("dotenv").config();

const { App } = require("@slack/bolt");
const axios = require('axios'); 

const app = new App({ 
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
});

app.command('/chefcurry-help', async({ack,respond}) => {
    await ack();
    await respond({
        text:
        `Available Commands:
        /chefcurry-help: List out all the commands and their functionality.
        /chefcurry-ping: Check bot's latency.
        /chefcurry-catfact: Get a random cat fact`
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

(async() => {
    await app.start();
    console.log(`bot is running`);
})();