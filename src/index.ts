import { Action, MessengerContext } from 'bottender';
import { payload, router, text } from 'bottender/router';
import { Payload_Type, SERVICES, Service_Type } from './const';
import {
  checkActiveService, clearServiceData, getActiveService, selectService, setQueryForService, setValueForQuery, showActiveService
} from './context';
import { objectToJsonWithTruncatedUrls } from './helper';
import { runPrediction } from './models/prediction';
import { handleUrl, sendUrlActions } from './models/url';

async function Command(
  context: MessengerContext,
  {
    match: {
      groups: { command, content },
    },
  }: any
) {
  // await context.sendText(`Executing command ${command} with content: ${content}`);
  switch (command.toLowerCase()) {
    case 'h':
    case 'help':
      await context.sendText(
        'Commands\n[s] Services & page\n[a] Active service\n[c] Clear context\n[d] Debug'
      );
      break;
    case 's':
    case 'service':
      try {
        let page = (content || '').trim();
        page = page ? parseInt(page) - 1 : 0;
        await selectService(context, page);
      } catch (e) {
        await context.sendText('Invalid command.');
      }
      break;
    case 'a':
    case 'active':
      if (await checkActiveService(context)) {
        await showActiveService(context);
      }
      break;
    case 'c':
    case 'clear':
      if (await checkActiveService(context)) {
        await clearServiceData(context);
      }
      break;
    case 'd':
    case 'debug':
      await context.sendText(objectToJsonWithTruncatedUrls(context.state));
      break;
    default:
      await context.sendText('Sorry. Command not found.');
      break;
  }
}

async function HandleUrl(context: MessengerContext) {
  context.setState({
    ...context.state,
    data: {
      ...context.state.data as any,
      url: context.event.text,
    },
  });
  await sendUrlActions(context);
}

async function Others(context: MessengerContext) {
  if (!(await checkActiveService(context))) {
    return;
  }
  const activeService = getActiveService(context);
  if (
    [Service_Type.Prediction, Service_Type.DallE].includes(activeService.type)
  ) {
    setValueForQuery(context, 'text', context.event.text);
  }
  // Chatbot
  else if (activeService.type === Service_Type.Chat) {
    const question = context.event.text;
    const response = await activeService.getAnswer(context, [
      ...context.state.context as any,
      { actor: 'USER', content: question },
      { actor: 'AI', content: '' },
    ]);
    if (!response) {
      await context.sendText(
        'An error occurred. Please try again or create new conversation by `/c`'
      );
      return;
    }
    context.setState({
      ...context.state,
      context: [
        ...context.state.context as any,
        { actor: 'USER', content: question },
        { actor: 'AI', content: response },
      ],
    });
    await context.sendText(response);
  }
}

async function Payload(context: MessengerContext) {
  const payload = context.event.payload;
  // Select a service
  if (payload.startsWith(Payload_Type.Select_Service)) {
    const service = parseInt(payload.replace(Payload_Type.Select_Service, ''));
    context.setState({
      ...context.state,
      service,
      query: {},
      context: [],
    });
    const activeService = getActiveService(context);
    if ([Service_Type.Chat].includes(activeService.type)) {
      await context.sendText(`Hi there, how can I assist you today?`);
    } else {
      await showActiveService(context);
    }
  }
  // Select a param option
  else if (payload.startsWith(Payload_Type.Select_Query_Option)) {
    const [_, field, value] = payload.split(Payload_Type.Splitter);
    setQueryForService(context, field, value);
  }
  // Select a param option for url action
  else if (payload.startsWith(Payload_Type.Select_Url_Action)) {
    const [_, value] = payload.split(Payload_Type.Splitter);
    handleUrl(context, value);
  }
}

async function HandleImage(context: MessengerContext) {
  if (!(await checkActiveService(context))) {
    return;
  }
  const activeService = getActiveService(context);
  if (
    [Service_Type.Prediction, Service_Type.DallE].includes(activeService.type)
  ) {
    setValueForQuery(context, 'image', context.event.image.url);
  } else {
    await context.sendText(`received the image: ${context.event.image.url}`);
  }
}

async function HandleAudio(context: MessengerContext) {
  if (!(await checkActiveService(context))) {
    return;
  }
  const activeService = getActiveService(context);
  if ([Service_Type.Prediction].includes(activeService.type)) {
    setValueForQuery(context, 'audio', context.event.audio.url);
  } else {
    await context.sendText(`received the audio: ${context.event.audio.url}`);
  }
}

async function HandleVideo(context: MessengerContext) {
  await context.sendText(`received the video: ${context.event.video.url}`);
}

async function HandleFile(context: MessengerContext) {
  await context.sendText(`received the file: ${context.event.file.url}`);
}

async function HandleLocation(context: MessengerContext) {
  const { coordinates } = context.event.location;
  await context.sendText(
    `received the location: lat: ${coordinates.lat}, long: ${coordinates.long}`
  );
}

async function Submit(context: MessengerContext) {
  if (!(await checkActiveService(context))) {
    return;
  }
  const activeService = getActiveService(context);
  if ([Service_Type.Prediction].includes(activeService.type)) {
    runPrediction(context);
  } else if ([Service_Type.DallE].includes(activeService.type)) {
    activeService.getAnswer(context);
  } else {
    Others(context);
  }
}

export default async function App(
  context: MessengerContext
): Promise<Action<MessengerContext> | void> {
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
    text(
      /^https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z0-9]+(?:\/[^\s]*)?$/i,
      HandleUrl
    ),
    text(/^[/.](?<command>\w+)(?:\s(?<content>.+))?/i, Command),
    text(/^ok$/i, Submit),
    text('*', Others),
  ]);
};
