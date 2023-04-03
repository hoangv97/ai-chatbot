import { Client } from "@notionhq/client";
import { MessengerContext, TelegramContext } from "bottender";
import { ChatAction, ParseMode } from "bottender/dist/telegram/TelegramTypes";
import { ChatCompletionRequestMessage } from "openai";
import { CHAT_RESPONSE_SUGGESTIONS_SPLITTER, DEFAULT_CHAT_SERVICE_ID, Payload_Type, SERVICES, Service_Type } from "../utils/const";
import { getAzureVoiceName, isAutoSpeak } from "../utils/settings";
import { handleTextToSpeechTelegram } from "./audio";
import { IChatSystem, getSystems } from "./chat_system";
import { createCompletionFromConversation, createTitleFromConversation } from "./openai";

export const selectChatSystems = async (context: MessengerContext, name: string) => {
  const systems = await getSystems()
  if (systems.length) {
    await context.sendGenericTemplate(
      systems
        .filter(s =>
          s.name.toLowerCase().includes(name.toLowerCase())
          || s.description.toLowerCase().includes(name.toLowerCase()))
        .slice(0, 8)
        .map((option: any, i: number) => ({
          title: option.name,
          subtitle: option.description,
          buttons: [
            {
              type: 'postback',
              title: 'Select',
              payload: [Payload_Type.Select_Chat_System, option._id].join(
                Payload_Type.Splitter
              ),
            },
          ],
        })), {})
  }
}

const handleChatResponse = async (context: MessengerContext | TelegramContext, response: string | null | undefined) => {
  if (!response) {
    await context.sendText(
      'Sorry! Please try again or select new assistant by `/m`'
    );
    return;
  }

  let [content, suggestions] = response.split(CHAT_RESPONSE_SUGGESTIONS_SPLITTER)
  content = content.trim()
  // console.log(content)

  if (context.platform === 'messenger') {
    await context.sendText(content);
  } else if (context.platform === 'telegram') {
    // escape 2 or more underscores in string
    content = content.replace(/(_{2,})/g, (match) => {
      const numUnderscores = match.length;
      const escapedUnderscores = "_".repeat(numUnderscores).split("").map(u => `\\${u}`).join("");
      return escapedUnderscores;
    })
    await context.sendMessage(content, { parseMode: ParseMode.Markdown });
    if (isAutoSpeak(context)) {
      await handleTextToSpeechTelegram(context, content, getAzureVoiceName(context))
    }
  }

  if (suggestions) {
    if (context.platform === 'messenger') {
      await context.sendGenericTemplate(
        suggestions
          .split('\n')
          .map(s => s.replace(/^[0-9]+\.\s+/gm, "").trim())
          .filter(s => !!s)
          .map((option: string) => ({
            title: option,
            buttons: [
              {
                type: 'postback',
                title: 'View Details',
                payload: [Payload_Type.Select_View_Chat_Suggestions, option].join(
                  Payload_Type.Splitter
                ),
              },
              {
                type: 'postback',
                title: 'Select',
                payload: [Payload_Type.Select_Chat_Suggestions, option].join(
                  Payload_Type.Splitter
                ),
              },
            ],
          })), {}
      )
    } else if (context.platform === 'telegram') {
      await context.sendText(`Select`, {
        replyMarkup: {
          keyboard: [
            suggestions
              .split('\n')
              .map(s => s.replace(/^[0-9]+\.\s+/gm, "").trim())
              .filter(s => !!s)
              .map(option => ({
                text: option
              }))
          ],
          resizeKeyboard: true,
          oneTimeKeyboard: true,
        },
      })
    }
  }
  return response;
}

export const handleChatSystemPayload = async (context: MessengerContext, value: string) => {
  const systems = await getSystems()
  try {
    const system = systems.find(s => s._id === value)
    if (!system) {
      console.log('Can not found assistant')
      return
    }

    const messages: ChatCompletionRequestMessage[] = []
    messages.push({ role: 'system', content: system.system })
    await context.sendText(`System:\n${system.system}`)

    if (system.user) {
      messages.push({ role: 'user', content: system.user })
      await context.sendText(`"${system.user}"`)

      const response = await createCompletionFromConversation(context, messages, system.temperature);
      const content = await handleChatResponse(context, response)
      if (content) {
        messages.push({ role: 'assistant', content })
      }
    }

    if (system.suggestions) {
      await context.sendText(`Select`, {
        quickReplies: system.suggestions
          .split('\n')
          .map((option: string) => option.trim())
          .map((option: string) => ({
            contentType: 'text',
            title: option,
            payload: [Payload_Type.Select_Chat_Suggestions, option].join(
              Payload_Type.Splitter
            ),
          })),
      })
    }

    context.setState({
      ...context.state,
      service: SERVICES.findIndex(s => s.type === Service_Type.Chat),
      context: messages as any,
    });
  } catch (e) {
    console.error(e)
  }
}

export const handleChat = async (context: MessengerContext | TelegramContext, text: string) => {
  const response = await createCompletionFromConversation(context, [
    ...context.state.context as any,
    { role: 'user', content: text },
  ]);
  const content = await handleChatResponse(context, response)
  if (content) {
    context.setState({
      ...context.state,
      context: [
        ...context.state.context as any,
        { role: 'user', content: text },
        { role: 'assistant', content },
      ],
    });
  }
}

export const handleViewChatSuggestionsPayload = async (context: MessengerContext, value: string) => {
  await context.sendText(`"${value}"`)
}

export const handleChatSuggestionsPayload = async (context: MessengerContext, value: string) => {
  await context.sendText(`"${value}"`)
  await handleChat(context, value)
}

export const handleTelegramCharacter = async (context: TelegramContext, character: IChatSystem) => {
  try {
    const messages: ChatCompletionRequestMessage[] = []
    messages.push({ role: 'system', content: character.system })
    await context.sendMessage(`*System:*\n${character.system}`, { parseMode: ParseMode.Markdown });

    if (character.user) {
      messages.push({ role: 'user', content: character.user })
      await context.sendMessage(`_${character.user}_`, { parseMode: ParseMode.Markdown });

      const response = await createCompletionFromConversation(context, messages, character.temperature);
      const content = await handleChatResponse(context, response)
      if (content) {
        messages.push({ role: 'assistant', content })
      }
    }

    if (character.suggestions) {
      await context.sendText(`Select`, {
        replyMarkup: {
          keyboard: [
            character.suggestions
              .split('\n')
              .map((option: string) => option.trim())
              .map(option => ({
                text: option
              }))
          ],
          resizeKeyboard: true,
          oneTimeKeyboard: true,
        },
      })
    }

    context.setState({
      ...context.state,
      context: messages as any,
    });
  } catch (e) {
    console.error(e)
  }
}

const ROLES_TO_COLORS: any = {
  system: 'blue',
  user: 'green',
  assistant: 'red',
}

export const saveConversation = async (context: TelegramContext) => {
  await context.sendChatAction(ChatAction.Typing);

  const messages = context.state.context as any;
  if (context.state.service !== DEFAULT_CHAT_SERVICE_ID || !messages || !messages.length) {
    await context.sendText('There is no conversation.')
    return;
  }
  let title = await createTitleFromConversation(messages)
  if (!title) {
    title = 'New Chat'
  }

  const notion = new Client({ auth: process.env.NOTION_API_KEY });
  const response = await notion.pages.create({
    parent: {
      database_id: process.env.CHAT_HISTORY_NOTION_DATABASE_ID || '',
    },
    properties: {
      Title: { title: [{ text: { content: title } }] },
    },
    children: messages.map((message: any) => [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              type: "text",
              text: {
                "content": message.role,
              },
              annotations: {
                bold: true,
                color: ROLES_TO_COLORS[message.role],
              }
            }
          ]
        },
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              type: "text",
              text: {
                "content": message.content,
              },
            }
          ]
        },
      },
    ]).flat()
  })
  if (response) {
    await context.sendMessage(`Saved conversation. Check it here: [Notion](https://notion.so/${response.id.replaceAll('-', '')})`, { parseMode: ParseMode.Markdown, disableWebPagePreview: true })
  }
}