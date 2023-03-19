import axios from "axios";
import { MessengerContext } from "bottender";
import { ChatCompletionRequestMessage } from "openai";
import { CHAT_RESPONSE_SUGGESTIONS_SPLITTER, Payload_Type, SERVICES, Service_Type } from "../const";
import { IChatSystem } from "./chat_system";
import { createCompletionFromConversation } from "./openai";

export const getSystems = async () => {
  try {
    const response = await axios.get(`${process.env.PROD_API_URL}/api/chat-system`);
    const systems: IChatSystem[] = response.data.filter((s: any) => s.active);
    // console.log(systems)
    return systems
  } catch (e) {
    console.error(e)
    return []
  }
}

export const selectChatSystems = async (context: MessengerContext, name: string) => {
  const systems = await getSystems()
  if (systems.length) {
    systems.sort((a, b) => a.order === b.order ? 0 : a.order < b.order ? 1 : -1)

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

const handleChatResponse = async (context: MessengerContext, response: string | null | undefined) => {
  if (!response) {
    await context.sendText(
      'Sorry! Please try again or select new assistant by `/m`'
    );
    return;
  }

  let [content, suggestions] = response.split(CHAT_RESPONSE_SUGGESTIONS_SPLITTER)

  await context.sendText(content.trim());

  if (suggestions) {
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

export const handleChat = async (context: MessengerContext, text: string) => {
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