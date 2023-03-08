import axios from "axios";
import { MessengerContext } from "bottender";
import { Payload_Type, SERVICES, Service_Type } from "../const";
import { getActiveService } from "../context";
import { createCompletionFromConversation } from "./openai";

export const getSystems = async () => {
  try {
    const response = await axios.get(`${process.env.PROD_API_URL}/api/chat-system`);
    const systems = response.data.filter((s: any) => s.active);
    // console.log(systems)
    return systems
  } catch (e) {
    console.error(e)
    return []
  }
}

export const selectChatSystems = async (context: MessengerContext) => {
  const systems = await getSystems()
  if (systems.length) {
    await context.sendGenericTemplate(systems.map((option: any, i: number) => ({
      title: option.name,
      subtitle: option.description,
      buttons: [
        {
          type: 'postback',
          title: 'Select',
          payload: [Payload_Type.Select_Chat_System, i].join(
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
    const system = systems[parseInt(value)]
    const response = await createCompletionFromConversation(context, [
      { role: 'system', content: system.content },
    ]);
    if (!response) {
      await context.sendText(
        'Sorry! Please try again or select new assistant by `/m`'
      );
      return;
    }
    await context.sendText(response);
    context.setState({
      ...context.state,
      service: SERVICES.findIndex(s => s.type === Service_Type.Chat),
      context: [
        { role: 'system', content: system.content },
        { role: 'assistant', content: response },
      ],
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