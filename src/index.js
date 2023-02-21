const { router, text, payload } = require('bottender/router');
const axios = require('axios');

const SERVICES = [
  {
    name: 'Stable Diffusion',
    version: 'f178fa7a1ae43a9a9af01b833b9d2ecf97b1bcb0acfd2dc5dd04895e042863f1',
  },
  {
    name: 'Open Journey',
    version: '9936c2001faa2194a261c01381f90e65261879985476014a0a37a334593a05eb',
  },
]

async function postPrediction(version, input) {
  const response = await axios({
    method: 'POST',
    url: 'https://api.replicate.com/v1/predictions',
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: {
      version,
      input,
    },
  });

  if (response.status !== 201) {
    console.error(response.data)
    return null;
  }

  return response.data;
}

async function getPrediction(id) {
  const response = await axios({
    method: 'GET',
    url: "https://api.replicate.com/v1/predictions/" + id,
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  if (response.status !== 200) {
    console.error(response.data)
    return null;
  }
  return response.data
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function Command(
  context,
  {
    match: {
      groups: { command, content },
    },
  },
) {
  // await context.sendText(`Executing command ${command} with content: ${content}`);
  switch (command) {
    case 'h':
    case 'help':
      await context.sendText('Here is the list of commands\n1.');
      break
    case 's':
    case 'service':
      await context.sendText('Select a service:', {
        quickReplies: SERVICES.map((service, i) => ({
            contentType: 'text',
            title: service.name,
            payload: `s_${i}`,
          })),
      });
      break
    default:
      await context.sendText('Sorry. Command not found.');
      break
  }
}

async function Others(context, props) {
  // await context.sendText('Sorry. I do not understand what you say.');
  return;
  let prediction = await postPrediction('f178fa7a1ae43a9a9af01b833b9d2ecf97b1bcb0acfd2dc5dd04895e042863f1', { prompt: context.event.text })
  if (!prediction) {
    await context.sendText('Error');
    return;
  }

  while (
      prediction && prediction.status !== 'succeeded' &&
      prediction.status !== 'failed'
  ) {
      await context.sendText(prediction.status);
      await sleep(3000);
      const response = await getPrediction(prediction.id);
      if (!response) {
        await context.sendText('Error getting prediction');
        return;
      }
      prediction = response;
  }
  for (const image of prediction.output) {
    await context.sendImage(image);
  }
}

async function Payload(context, props) {
  console.log(context.event.payload)
}

module.exports = async function App(context, props) {
  return router([
    payload('*', Payload),
    // return the `Command` action when receiving "/join", "/invite", or "/whatever" text messages
    text(/^\/(?<command>\w+)(?:\s(?<content>.+))?/i, Command),
    text('*', Others),
  ]);
}
