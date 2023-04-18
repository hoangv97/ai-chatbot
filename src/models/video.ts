import { TelegramContext } from "bottender";
import { getTranscriptionFromTelegramFileId } from "./audio";
import { ChatAction, ParseMode } from "bottender/dist/telegram/TelegramTypes";
import { AGENTS_SERVICE_ID } from "../utils/const";
import { handleQueryAgents } from "./agents";
import { handleChat } from "./text";

export const handleVideoForChat = async (context: TelegramContext, fileId: string) => {
  const transcription = await getTranscriptionFromTelegramFileId(context, fileId)
  if (!transcription) {
    await context.sendText(`Error getting transcription!`);
    return
  }
  await context.sendMessage(`_${transcription}_`, { parseMode: ParseMode.Markdown });

  await context.sendChatAction(ChatAction.Typing);

  if (context.state.service === AGENTS_SERVICE_ID) {
    await handleQueryAgents(context, transcription)
  } else {
    await handleChat(context, transcription)
  }
};
