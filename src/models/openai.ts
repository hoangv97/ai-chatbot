import { MessengerContext, TelegramContext } from 'bottender';
import { ChatAction, ParseMode } from 'bottender/dist/telegram/TelegramTypes';
import fs from 'fs';
import { encode } from 'gpt-3-encoder';
import { ChatCompletionFunctions, ChatCompletionRequestMessage, Configuration, CreateChatCompletionRequestFunctionCall, OpenAIApi } from 'openai';
import { DOWNLOADS_PATH } from '../utils/const';
import { convertMp4ToWav, convertOggToMp3, deleteDownloadFile, downloadFile } from '../utils/file';
import { parseCommand } from '../utils/helper';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const GPT3_MAX_TOKENS = 4096;

const handleError = async (context: MessengerContext | TelegramContext, error: any) => {
  let message;
  try {
    if (error.response) {
      message = error.response.data.error.message;
    } else {
      message = error.message;
    }
  } catch (e) {
    console.log(e)
  } finally {
    await context.sendText(message || 'Error!');
  }
};

export const createCompletion = async (
  messages: ChatCompletionRequestMessage[],
  max_tokens?: number,
  temperature?: number,
  functions?: ChatCompletionFunctions[],
  function_call?: CreateChatCompletionRequestFunctionCall,
  model?: string,
) => {
  const response = await openai.createChatCompletion({
    model: model || "gpt-3.5-turbo",
    messages,
    max_tokens,
    temperature,
    functions,
    function_call,
  });
  return response.data.choices;
};

export const createCompletionWithFunctions = async (
  context: TelegramContext,
  messages: ChatCompletionRequestMessage[],
  functions: ChatCompletionFunctions[],
  functionsMap: any,
  maxTries: number = 3,
) => {
  let tries = 0;
  while (tries < maxTries) {
    tries++;
    const response = await createCompletion(
      messages,
      undefined,
      undefined,
      functions,
      undefined,
      'gpt-3.5-turbo-0613',
    );
    const { message } = response[0];
    // console.log(message)
    if (message) {
      messages.push(message);
      const { function_call, content } = message;
      if (content) {
        await context.sendText(content);
        break;
      }
      if (function_call) {
        const { name } = function_call;
        const func = functionsMap[name || ''];
        if (func) {
          const funcResponse = JSON.stringify(await func(JSON.parse(function_call.arguments || '{}')));
          messages.push({ role: 'function', content: funcResponse, name });
        }
      }
    }
  }
}

const getTokens = (messages: ChatCompletionRequestMessage[]) => {
  const tokens = messages.reduce((prev, curr) => prev + encode(curr.content || '').length, 0)
  // console.log(tokens)
  return tokens;
}

export const createCompletionFromConversation = async (
  context: MessengerContext | TelegramContext,
  messages: ChatCompletionRequestMessage[],
  temperature?: number) => {
  try {
    const response_max_tokens = 500
    const max_tokens = Math.min(getTokens(messages) + response_max_tokens, GPT3_MAX_TOKENS)
    const response = await createCompletion(messages, max_tokens, temperature);
    return response[0].message?.content;
  } catch (e) {
    handleError(context, e);
    return null;
  }
};

export const createTitleFromConversation = async (messages: ChatCompletionRequestMessage[]) => {
  try {
    const response = await createCompletion([
      ...messages,
      {
        role: 'user',
        content: 'What would be a short and relevant title for this chat? You must strictly answer with only the title, no other text is allowed.'
      }
    ]);
    return response[0].message?.content;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const getTranscription = async (context: MessengerContext | TelegramContext, url: string, language?: string) => {
  try {
    let filePath = await downloadFile(url, DOWNLOADS_PATH);
    if (filePath.endsWith('.oga')) {
      const newFilePath = filePath.replace('.oga', '.mp3')
      await convertOggToMp3(filePath, newFilePath)
      deleteDownloadFile(filePath)
      filePath = newFilePath
    }
    else if (filePath.endsWith('.mp4')) {
      const newFilePath = filePath.replace('.mp4', '.wav')
      await convertMp4ToWav(filePath, newFilePath)
      deleteDownloadFile(filePath)
      filePath = newFilePath
    }
    const response = await openai.createTranscription(
      fs.createReadStream(filePath) as any,
      'whisper-1',
      undefined, undefined, undefined,
      language,
    );
    deleteDownloadFile(filePath)
    return response.data.text
  } catch (e) {
    handleError(context, e);
    return null;
  }
}

const createImage = async ({ prompt, n }: any) => {
  const response = await openai.createImage({
    prompt,
    n: n ? parseInt(n) : undefined,
    size: '512x512',
    response_format: 'url',
  });
  return response.data.data;
};


const createImageEdit = async ({ prompt, image, n }: any) => {
  const filePath = await downloadFile(image, DOWNLOADS_PATH);
  const response = await openai.createImageEdit(
    fs.createReadStream(filePath) as any,
    prompt,
    undefined,
    n ? parseInt(n) : undefined,
    '512x512',
    'url'
  );
  deleteDownloadFile(filePath)
  return response.data.data;
};

const createImageVariation = async ({ image, n }: any) => {
  const filePath = await downloadFile(image, DOWNLOADS_PATH);
  const response = await openai.createImageVariation(
    fs.createReadStream(filePath) as any,
    n ? parseInt(n) : undefined,
    '512x512',
    'url'
  );
  deleteDownloadFile(filePath)
  return response.data.data;
};

export const generateImage = async (context: MessengerContext) => {
  const { model, ...others } = context.state.query as any;
  let createFunc;
  switch (model) {
    case 'e':
    case 'edit':
      createFunc = createImageEdit;
      break;
    case 'v':
    case 'variation':
      createFunc = createImageVariation;
      break;
    default:
      createFunc = createImage;
      break;
  }
  try {
    const outputs = await createFunc(others);
    for (const image of outputs) {
      if (image.url) {
        await context.sendImage(image.url);
      }
    }
  } catch (e) {
    handleError(context, e);
  }
};

export const generateImageTelegram = async (context: TelegramContext, command: string) => {
  let { content, params } = parseCommand(command) || {};
  const { n } = params || {}
  const { replyToMessage } = context.event;
  const { text: replyText } = replyToMessage || {}

  if (!content && !replyText) {
    await context.sendMessage(`Use command \`/imagine <prompt> --n 1\` to create image.`, { parseMode: ParseMode.Markdown })
    return;
  }

  content = content || ''
  if (replyText) {
    content = replyText
  }

  try {
    await context.sendChatAction(ChatAction.Typing);
    const outputs = await createImage({ prompt: content, n: n || 1 });
    for (const image of outputs) {
      if (image.url) {
        await context.sendPhoto(image.url);
      }
    }
  } catch (e) {
    handleError(context, e);
  }
}
