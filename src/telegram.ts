import { TelegramContext } from "bottender";
import { ChatAction, ParseMode } from "bottender/dist/telegram/TelegramTypes";
import { router, text } from "bottender/router";
import { COMMAND_REGEX, URL_REGEX, URL_SERVICE_ID } from "./const";
import { clearServiceData, showDebug } from "./context";
import { handleAudioForChat } from "./models/audio";
import { handleChat, handleTelegramCharacter, saveConversation } from "./models/text";
import { handleUrlPrompt } from "./models/url";

async function HandleApps(context: TelegramContext) {
  const charactersUrl = `${process.env.PROD_API_URL}/static/telegram/characters.html`
  await context.sendText('Apps:', {
    replyMarkup: {
      keyboard: [
        [
          {
            text: 'Characters',
            web_app: {
              url: charactersUrl,
            }
          },
          {
            text: 'English tutors',
            web_app: {
              url: `${charactersUrl}?s=english`,
            }
          },
        ] as any,
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
    case 'new':
      await clearServiceData(context);
      break;
    case 'save':
      await saveConversation(context)
      break
    case 'continue':
      // TODO continue saved conversation
      break
    case 'debug':
      await showDebug(context)
      break;
    case 'help':
      const helpContent = `Start a conversation with \`/new\`.\nOr paste any URL to start a Q&A.\n\nSaved conversations: [Notion](https://hoangv.notion.site/19421a527c004d4f95c9c09501e03d9e?v=44b8e8e1458946d69ee09482ee98e94d)\n\nCharacters: [Settings](https://codepen.io/viethoang012/full/xxaXQbW) / [API](${process.env.PROD_API_URL}/api/chat-system)`
      await context.sendMessage(helpContent, { parseMode: ParseMode.Markdown });
      break;
    default:
      await context.sendText('Sorry! Command not found.');
      break;
  }
}

async function HandleAudio(context: TelegramContext) {
  await handleAudioForChat(context)
}

async function HandleUrl(context: TelegramContext) {
  const url = context.event.text

  context.setState({
    ...context.state,
    service: URL_SERVICE_ID,
    data: {
      ...context.state.data as any,
      url,
    },
  });
  const suggestions = ['Summarize this', 'Some key takeaways', 'Tóm tắt']
  await context.sendText(`Ask me anything or select option below.`, {
    replyMarkup: {
      keyboard: [
        suggestions
          .map(option => ({
            text: option
          }))
      ],
      resizeKeyboard: true,
      oneTimeKeyboard: true,
    },
  })
}

async function Others(context: TelegramContext) {
  await context.sendChatAction(ChatAction.Typing);
  if (context.state.service === URL_SERVICE_ID) {
    await handleUrlPrompt(context, context.event.text);
  } else {
    await handleChat(context, context.event.text)
  }
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
    text(URL_REGEX, HandleUrl),
    text(COMMAND_REGEX, Command),
    text('*', Others),
  ])
}

export default handleTelegram;