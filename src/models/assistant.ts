import { Client } from "@notionhq/client";
import { TelegramContext } from "bottender";
import { ASSISTANT_SERVICE_ID } from "../utils/const";
import { randomFromArray } from "../utils/helper";
import { createCompletionFromConversation } from "./openai";
import { handleChatResponse } from "./text";
import { ChatCompletionRequestMessage } from "openai";
import { ChatAction, ParseMode } from "bottender/dist/telegram/TelegramTypes";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const getBlockPlainText = (text: any) => text.length ? text[0].plain_text : ''

export const getEnv = async () => {
  const databaseId = process.env.ENV_NOTION_DATABASE_ID || ''
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      or: []
    }
  })
  return response.results.reduce((acc: any, cur: any) => {
    const key = getBlockPlainText(cur.properties.Key.title)
    const value = getBlockPlainText(cur.properties.Value.rich_text)
    if (key) {
      acc[key] = value
    }
    return acc
  }, {})
}

export const getPrompts = async (databaseId: string) => {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      or: []
    }
  })
  return response.results
}

export const getPrompt = async (pageId: string) => {
  const response = await notion.blocks.children.list({
    block_id: pageId,
  })
  return response.results
    .filter((block: any) => block.paragraph)
    .map((block: any) => getBlockPlainText(block.paragraph.rich_text))
    .join('\n')
    .trim()
}

export const activateAssistant = async (context: TelegramContext) => {
  await context.sendChatAction(ChatAction.Typing);

  const configs = await getEnv();

  const prompts = await getPrompts(configs.PROMPTS_TABLE_ID)

  const currentHour = new Date().getHours()

  const currentPrompts = prompts.filter((prompt: any) => {
    const start = prompt.properties['Start hour'].number || 0
    const end = prompt.properties['End hour'].number || 23
    return currentHour >= start && currentHour <= end
  })

  const prompt = randomFromArray(currentPrompts)
  const promptContent = await getPrompt(prompt.id)

  const system = getBlockPlainText(prompt.properties.System.rich_text)

  let temperature = prompt.properties.Temperature.number
  if (temperature === null) {
    temperature = undefined
  }

  const messages: ChatCompletionRequestMessage[] = []
  if (system) {
    messages.push({ role: 'system', content: system })
    await context.sendMessage(`*System:*\n${system}`, { parseMode: ParseMode.Markdown })
  }
  messages.push({ role: 'user', content: promptContent })
  await context.sendMessage(`_${promptContent}_`, { parseMode: ParseMode.Markdown })

  const response = await createCompletionFromConversation(
    context,
    messages,
    temperature,
  );
  const content = await handleChatResponse(context, response)
  if (content) {
    context.setState({
      ...context.state,
      service: ASSISTANT_SERVICE_ID,
      context: [
        ...messages as any,
        { role: 'assistant', content },
      ],
      query: {},
      data: {},
    });
  }
}