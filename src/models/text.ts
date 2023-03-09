import axios from "axios";
import { MessengerContext } from "bottender";
import { ChatCompletionRequestMessage } from "openai";
import { Payload_Type, SERVICES, Service_Type } from "../const";
import { createCompletionFromConversation } from "./openai";

export const getSystems = async () => {
  try {
    const response = await axios.get(`${process.env.PROD_API_URL}/api/chat-system`);
    const systems: any[] = response.data.filter((s: any) => s.active);
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

      const response = await createCompletionFromConversation(context, messages);
      if (!response) {
        await context.sendText(
          'Sorry! Please try again or select new assistant by `/m`'
        );
        return;
      }
      await context.sendText(response);

      messages.push({ role: 'assistant', content: response })
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
  if (!response) {
    await context.sendText(
      'Sorry! Please try again or create new conversation by `/c`'
    );
    return;
  }
  await context.sendText(response);
  context.setState({
    ...context.state,
    context: [
      ...context.state.context as any,
      { role: 'user', content: text },
      { role: 'assistant', content: response },
    ],
  });
}