import { Action, MessengerContext, TelegramContext } from 'bottender';
import { messenger, payload, router, text } from 'bottender/router';
import { getMessage } from './api/messenger';
import { COMMAND_REGEX, Payload_Type, Service_Type, URL_REGEX, URL_SERVICE_ID } from './const';
import {
  checkActiveService, clearServiceData, getActiveService, selectService, setQueryForService, setValueForQuery, showActiveService, showDebug
} from './context';
import { handleAudioForChat, handleTextToSpeech } from './models/audio';
import { runPrediction } from './models/prediction';
import { handleChat, handleChatSuggestionsPayload, handleChatSystemPayload, handleViewChatSuggestionsPayload, selectChatSystems } from './models/text';
import { handleUrlPayload, handleUrlPrompt } from './models/url';
import handleTelegram from './telegram';

async function Command(
  context: MessengerContext,
  {
    match: {
      groups: { command, content },
    },
  }: any
) {
  switch (command.toLowerCase()) {
    case 'h':
    case 'help':
      await context.sendText(
        `Commands\n[s] Services (page)\n[a] Active service\n[c] Clear context\n[d] Debug\n[m] My assistants (search by name)\n\nAssistants settings: https://codepen.io/viethoang012/full/xxaXQbW\n\nAssistants API: ${process.env.PROD_API_URL}/api/chat-system`
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
      if ([URL_SERVICE_ID].includes(context.state.service as number) || await checkActiveService(context)) {
        await clearServiceData(context);
      }
      break;
    case 'd':
    case 'debug':
      await showDebug(context)
      break;
    case 'm':
      await selectChatSystems(context, content || '')
      break;
    default:
      await context.sendText('Sorry! Command not found.');
      break;
  }
}

async function HandleUrl(context: MessengerContext) {
  const url = context.event.text

  context.setState({
    ...context.state,
    service: URL_SERVICE_ID,
    data: {
      ...context.state.data as any,
      url,
    },
  });
  await context.sendText('Ask me anything about this link.');
}

async function Others(context: MessengerContext) {
  if (context.state.service === URL_SERVICE_ID) {
    await handleUrlPrompt(context, context.event.text);
    return
  }
  if (!(await checkActiveService(context))) {
    return;
  }
  const activeService = getActiveService(context);
  if (
    [Service_Type.Prediction, Service_Type.DallE].includes(activeService.type)
  ) {
    await setValueForQuery(context, 'text', context.event.text);
  }
  // Chatbot
  else if (activeService.type === Service_Type.Chat) {
    await handleChat(context, context.event.text)
  }
}

async function HandleReactionReact(context: MessengerContext) {
  const { mid } = context.event.reaction
  if (mid) {
    const message = await getMessage(mid)
    await handleTextToSpeech(context, message)
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
    await setQueryForService(context, field, value);
  }
  // Select a param option for url action
  else if (payload.startsWith(Payload_Type.Select_Url_Action)) {
    const [_, value] = payload.split(Payload_Type.Splitter);
    await handleUrlPayload(context, value);
  }
  // Select a param option for chat system
  else if (payload.startsWith(Payload_Type.Select_Chat_System)) {
    const [_, value] = payload.split(Payload_Type.Splitter);
    await handleChatSystemPayload(context, value);
  }
  // Select a param option for view chat suggestions
  else if (payload.startsWith(Payload_Type.Select_View_Chat_Suggestions)) {
    const [_, value] = payload.split(Payload_Type.Splitter);
    await handleViewChatSuggestionsPayload(context, value);
  }
  // Select a param option for chat suggestions
  else if (payload.startsWith(Payload_Type.Select_Chat_Suggestions)) {
    const [_, value] = payload.split(Payload_Type.Splitter);
    await handleChatSuggestionsPayload(context, value);
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
    await setValueForQuery(context, 'image', context.event.image.url);
  } else {
    await context.sendText(`received the image: ${context.event.image.url}`);
  }
}

async function HandleAudio(context: MessengerContext) {
  if (context.state.service === URL_SERVICE_ID) {
    await handleAudioForChat(context)
    return
  }
  if (!(await checkActiveService(context))) {
    return;
  }
  const activeService = getActiveService(context);
  if ([Service_Type.Prediction].includes(activeService.type)) {
    await setValueForQuery(context, 'audio', context.event.audio.url);
  } else if ([Service_Type.Chat].includes(activeService.type)) {
    await handleAudioForChat(context)
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
    await runPrediction(context);
  } else if ([Service_Type.DallE].includes(activeService.type)) {
    await activeService.getAnswer(context);
  } else {
    Others(context);
  }
}

export default async function App(
  context: MessengerContext | TelegramContext
): Promise<Action<any> | void> {
  if (context.platform === 'telegram') {
    return handleTelegram(context)
  }

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
    messenger.reaction.react(HandleReactionReact),
    payload('*', Payload),
    text(URL_REGEX, HandleUrl),
    text(COMMAND_REGEX, Command),
    text(/^ok$/i, Submit),
    text('*', Others),
  ]);
};
