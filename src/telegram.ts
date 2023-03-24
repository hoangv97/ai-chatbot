import { TelegramContext } from "bottender";
import { ChatAction } from "bottender/dist/telegram/TelegramTypes";
import { router, text } from "bottender/router";
import { clearServiceData, showDebug } from "./context";
import { handleAudioForChat } from "./models/audio";
import { handleChat } from "./models/text";

async function Command(
  context: TelegramContext,
  {
    match: {
      groups: { command, content },
    },
  }: any
) {
  switch (command.toLowerCase()) {
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
  if (context.event.voice) {
    return HandleAudio;
  }
  return router([
    text(/^[/.](?<command>\w+)(?:\s(?<content>.+))?/i, Command),
    text('*', Others),
  ])
}

export default handleTelegram;