import { TelegramContext } from "bottender";
import { ChatAction, ParseMode } from "bottender/dist/telegram/TelegramTypes";
import { router, text } from "bottender/router";
import { getFileUrl } from "../api/telegram";
import { activateAgents, handleQueryAgents } from "../models/agents";
import { activateAssistant } from "../models/assistant";
import { getTranscriptionFromTelegramFileId, handleAudioForChat, handleTextToSpeechTelegram } from "../models/audio";
import { generateImageTelegram } from "../models/openai";
import { handleChat, handleTelegramCharacter, saveConversation } from "../models/text";
import { handleUrlPrompt } from "../models/url";
import { AGENTS_SERVICE_ID, COMMAND_REGEX, URL_REGEX, URL_SERVICE_ID } from "../utils/const";
import { clearServiceData, showDebug } from "../utils/context";
import { parseCommand } from "../utils/helper";
import { getAgentsTools, handleDefaultSettings, handleSettings, handleVoices } from "../utils/settings";

async function showHelp(context: TelegramContext) {
  const helpContent = `Start a conversation with \`/new\`.\nOr paste any URL to start a Q&A.\n\nSaved conversations: [Notion](https://hoangv.notion.site/19421a527c004d4f95c9c09501e03d9e?v=44b8e8e1458946d69ee09482ee98e94d)\n\nCharacters: [Settings](https://codepen.io/viethoang012/full/xxaXQbW) / [API](${process.env.PROD_API_URL}/api/chat-system)`
  await context.sendMessage(helpContent, { parseMode: ParseMode.Markdown, disableWebPagePreview: true });
}

function isLoggedIn(context: TelegramContext) {
  const { auth } = context.state.settings || {} as any
  return !!auth
}

async function handleAuth(context: TelegramContext) {
  const { text } = context.event;
  if (text === process.env.AUTH_KEY) {
    context.setState({
      ...context.state,
      settings: {
        auth: true,
      },
    })
    await context.sendMessage(`Good. You may enter now 😎`, { parseMode: ParseMode.Markdown })
    await showHelp(context)
  } else {
    await context.sendMessage(`Give me the key before entering.\n\nщ(゜ロ゜щ)`, { parseMode: ParseMode.Markdown })
  }
}


async function HandleApps(context: TelegramContext) {
  const charactersUrl = `${process.env.PROD_API_URL}/static/telegram/characters/index.html`

  const agentsTools = getAgentsTools(context)
  const agentsUrl = `${process.env.PROD_API_URL}/static/telegram/agents/index.html?apiKey=${process.env.MY_AI_API_AUTH_KEY}&tools=${agentsTools}`

  await context.sendText('Apps:', {
    replyMarkup: {
      keyboard: [
        [
          {
            text: 'Agents',
            web_app: {
              url: agentsUrl,
            }
          },
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
    } else if (_type === 'agents') {
      await activateAgents(context, others.tools)
    }
  } catch (e) {
    console.error(e)
    await context.sendText('Error getting web app data.')
  }
}

export const handleTTS = async (context: TelegramContext, command: string) => {
  let { content, params } = parseCommand(command) || {};
  const { voice } = params || {}
  const { replyToMessage } = context.event;
  const { text: replyText } = replyToMessage || {}

  if (!content && !replyText) {
    await context.sendMessage(`Use command \`/speak <content> --voice <azure_voice>\` to speak or reply any message with this command.`, { parseMode: ParseMode.Markdown })
    return;
  }

  content = content || ''
  if (replyText) {
    content += `\n${replyText}`
  }
  content = content.trim()

  if (content) {
    await handleTextToSpeechTelegram(context, content, voice)
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
    case 'ai':
      await activateAssistant(context)
      break
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
    case 'imagine':
      await generateImageTelegram(context, content)
      break;
    case 'speak':
      await handleTTS(context, content)
      break;
    case 'voices':
      await handleVoices(context, content)
      break;
    case 'settings':
      await handleSettings(context, content)
      break;
    case 'settings_default':
      await handleDefaultSettings(context)
      break;
    case 'debug':
      await showDebug(context)
      break;
    case 'help':
      await showHelp(context)
      break;
    default:
      await context.sendText('Sorry! Command not found.');
      break;
  }
}

async function HandleAudio(context: TelegramContext) {
  await handleAudioForChat(context)
}

async function HandlePhoto(context: TelegramContext) {
  const { photo } = context.event.message
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
  let { text, replyToMessage } = context.event;
  const { text: replyText, voice: replyVoice } = replyToMessage || {}
  if (replyVoice) {
    const voiceTranscription = await getTranscriptionFromTelegramFileId(context, replyVoice.fileId)
    if (voiceTranscription) {
      text += `\n${voiceTranscription}`
    }
  }
  if (replyText) {
    text += `\n${replyText}`
  }

  if (context.state.service === URL_SERVICE_ID) {
    await handleUrlPrompt(context, text);
  } else if (context.state.service === AGENTS_SERVICE_ID) {
    const { photo, document } = replyToMessage || {}
    if (photo && photo.length) {
      const { fileId } = photo[0]
      const filePath = await getFileUrl(fileId)
      text += `\nImage URL: ${filePath}`
    }
    if (document) {
      const { fileId } = document
      const filePath = await getFileUrl(fileId)
      text += `\nFile URL: ${filePath}`
    }
    await handleQueryAgents(context, text)
  } else {
    await handleChat(context, text)
  }
}

const handleTelegram = (context: TelegramContext) => {
  // console.log(context.event)
  if (!isLoggedIn(context)) {
    return handleAuth;
  }
  if (context.event.message.webAppData) {
    return HandleWebApp;
  }
  if (context.event.voice) {
    return HandleAudio;
  }
  if (context.event.message.photo) {
    return HandlePhoto;
  }
  return router([
    text(URL_REGEX, HandleUrl),
    text(COMMAND_REGEX, Command),
    text('*', Others),
  ])
}

export default handleTelegram;