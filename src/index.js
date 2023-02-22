const { router, text, payload, messenger } = require('bottender/router');
const { SERVICES } = require('./const');
const {
  selectService,
  checkActiveService,
  showActiveService,
  setValueForQuery,
} = require('./helper');
const { RunPrediction } = require('./prediction');

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
        'Commands\n1. s - Select a service\n2. a - Active service'
      );
      break;
    case 's':
    case 'service':
      await selectService(context);
      break;
    case 'a':
    case 'active':
      if (await checkActiveService(context)) {
        await showActiveService(context);
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
    await showActiveService(context);
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
    text(/ok/i, RunPrediction),
    text('*', Others),
  ]);
};
