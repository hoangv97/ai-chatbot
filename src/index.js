const { router, text, payload, messenger } = require('bottender/router');
const axios = require('axios');

const SERVICES = [
  {
    name: 'Stable Diffusion',
    version: 'f178fa7a1ae43a9a9af01b833b9d2ecf97b1bcb0acfd2dc5dd04895e042863f1',
    output_type: 'image',
    params: [{ name: 'prompt', type: 'text' }],
  },
  {
    name: 'Open Journey',
    version: '9936c2001faa2194a261c01381f90e65261879985476014a0a37a334593a05eb',
    output_type: 'image',
    params: [{ name: 'prompt', type: 'text' }],
  },
  {
    name: 'Blip(Img2Txt)',
    version: '2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746',
    output_type: 'text',
    params: [{ name: 'image', type: 'image' }],
  },
];

async function postPrediction(context, version, input) {
  const response = await axios({
    method: 'POST',
    url: 'https://api.replicate.com/v1/predictions',
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    data: {
      version,
      input,
    },
  });

  if (response.status !== 201) {
    console.error(response.data);
    await context.sendText(response.data.data.detail);
    return null;
  }

  return response.data;
}

async function getPrediction(context, id) {
  const response = await axios({
    method: 'GET',
    url: 'https://api.replicate.com/v1/predictions/' + id,
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  if (response.status !== 200) {
    console.error(response.data);
    await context.sendText(response.data.data.detail);
    return null;
  }
  return response.data;
}

async function RunPrediction(context, props) {
  if (!(await checkActiveService(context))) {
    return;
  }
  const activeService = SERVICES[context.state.service];
  let prediction = await postPrediction(
    context,
    activeService.version,
    context.state.query
  );
  if (!prediction) {
    return;
  }

  while (
    prediction &&
    prediction.status !== 'succeeded' &&
    prediction.status !== 'failed'
  ) {
    await context.sendText(prediction.status);
    await sleep(3000);
    const response = await getPrediction(context, prediction.id);
    if (!response) {
      return;
    }
    prediction = response;
  }
  // console.log(prediction);
  switch (activeService.output_type) {
    case 'image':
      for (const image of prediction.output) {
        await context.sendImage(image);
      }
      break;
    case 'text':
      await context.sendText(prediction.output);
      break;
    default:
      break;
  }
}

// HELPER FUNCTIONS
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const getFieldNameByType = (service, type) => {
  const field = service.params.find((item) => item.type === type);
  if (!field) return null;
  return field.name;
};

const checkActiveService = async (context) => {
  if (context.state.service < 0) {
    await context.sendText('No active service');
    return false;
  }
  return true;
};

const setValueForQuery = async (context, type, value) => {
  if (!(await checkActiveService(context))) {
    return;
  }
  const activeService = SERVICES[context.state.service];
  const fieldName = getFieldNameByType(activeService, type);
  if (!fieldName) {
    await context.sendText(`Invalid query`);
    return;
  }
  // TODO: split event text to read field name
  context.setState({
    ...context.state,
    query: {
      ...context.state.query,
      [fieldName]: value,
    },
  });
  await context.sendText(`Set query value for ${fieldName}`);
};

async function Command(
  context,
  {
    match: {
      groups: { command, content },
    },
  }
) {
  // await context.sendText(`Executing command ${command} with content: ${content}`);
  switch (command) {
    case 'h':
    case 'help':
      await context.sendText(
        'Here is the list of commands\n1.s - service: Select a service\n2. a - active: Show service info'
      );
      break;
    case 's':
    case 'service':
      await context.sendText('Select a service:', {
        quickReplies: SERVICES.map((service, i) => ({
          contentType: 'text',
          title: service.name,
          payload: `s_${i}`,
        })),
      });
      break;
    case 'a':
    case 'active':
      if (context.state.service < 0) {
        await context.sendText('No active service');
      } else {
        await context.sendText(
          `Active service: ${SERVICES[context.state.service].name}`
        );
      }
      break;
    default:
      await context.sendText('Sorry. Command not found.');
      break;
  }
}

async function Others(context, props) {
  setValueForQuery(context, 'text', context.event.text);
}

async function Payload(context, props) {
  const payload = context.event.payload;
  if (payload.startsWith('s_')) {
    const service = parseInt(payload.replace('s_', ''));
    context.setState({
      service,
      query: {},
    });
    await context.sendText(`Active service: ${SERVICES[service].name}`);
  }
}

async function HandleImage(context) {
  if (!(await checkActiveService(context))) {
    return;
  }
  setValueForQuery(context, 'image', context.event.image.url);
  // await context.sendText(`received the image: ${context.event.image.url}`);
}

async function HandleAudio(context) {
  await context.sendText(`received the audio: ${context.event.audio.url}`);
}

async function HandleVideo(context) {
  await context.sendText(`received the video: ${context.event.video.url}`);
}

async function HandleFile(context) {
  await context.sendText(`received the file: ${context.event.file.url}`);
}

async function HandleLocation(context) {
  const { coordinates } = context.event.location;
  await context.sendText(
    `received the location: lat: ${coordinates.lat}, long: ${coordinates.long}`
  );
}

module.exports = async function App(context, props) {
  if (context.event.isImage) {
    return HandleImage;
  }
  if (context.event.isAudio) {
    return HandleAudio;
  }
  if (context.event.isVideo) {
    return HandleVideo;
  }
  if (context.event.isFile) {
    return HandleFile;
  }
  if (context.event.isLocation) {
    return HandleLocation;
  }
  return router([
    payload('*', Payload),
    // return the `Command` action when receiving "/join", "/invite", or "/whatever" text messages
    text(/^\/(?<command>\w+)(?:\s(?<content>.+))?/i, Command),
    text('ok', RunPrediction),
    text('*', Others),
  ]);
};
