import { TelegramContext } from "bottender";
import { ChatAction } from "bottender/dist/telegram/TelegramTypes";
import { router, text } from "bottender/router";
import { clearServiceData, showDebug } from "./context";
import { handleAudioForChat } from "./models/audio";
import { handleChat, handleTelegramCharacter } from "./models/text";

async function HandleApps(context: TelegramContext) {
  await context.sendText('Apps:', {
    replyMarkup: {
      keyboard: [
        [
          {
            text: 'Characters',
            web_app: {
              url: `${process.env.PROD_API_URL}/static/telegram/characters.html`,
            }
          } as any,
        ]
      ],
      resizeKeyboard: true,
      oneTimeKeyboard: true,
    }
  });
}

async function HandleWebApp(context: TelegramContext) {
  try {
    const { _type, ...others } = JSON.parse(context.event.message.webAppData.data)
    if (_type === 'character') {
      await handleTelegramCharacter(context, others)
    }
  } catch (e) {
    console.error(e)
    await context.sendText('Error getting web app data.')
  }
}


async function Command(
  context: TelegramContext,
  {
    match: {
      groups: { command, content },
    },
  }: any
) {
  switch (command.toLowerCase()) {
    case 'apps':
      await HandleApps(context)
      break;
    case 'clear':
      await clearServiceData(context);
      break;
    case 'debug':
      await showDebug(context)
      break;
    default:
      await context.sendText('Sorry! Command not found.');
      break;
  }
}

async function HandleAudio(context: TelegramContext) {
  await handleAudioForChat(context)
}

async function Others(context: TelegramContext) {
  await context.sendChatAction(ChatAction.Typing);
  await handleChat(context, context.event.text)
}

const handleTelegram = (context: TelegramContext) => {
  // console.log(context.event)
  if (context.event.message.webAppData) {
    return HandleWebApp;
  }
  if (context.event.voice) {
    return HandleAudio;
  }
  return router([
    text(/^[/.](?<command>\w+)(?:\s(?<content>.+))?/i, Command),
    text('*', Others),
  ])
}

export default handleTelegram;