import { TelegramContext } from "bottender";
import { ParseMode } from "bottender/dist/telegram/TelegramTypes";
import { askAgents } from '../api/my_ai';
import { AGENTS_SERVICE_ID } from "../utils/const";
import { getAgentsTools, getAzureVoiceName, isAutoSpeak } from "../utils/settings";
import { handleTextToSpeechTelegram } from "./audio";
import { checkPredictionTelegram } from "./replicate";

export const activateAgents = async (context: TelegramContext, tools: string) => {
  context.setState({
    ...context.state,
    service: AGENTS_SERVICE_ID,
    context: [],
    query: {},
    data: {},
    settings: {
      ...context.state.settings as any,
      agentsTools: tools,
    },
  })

  const currentTools = getAgentsTools(context)
  await context.sendMessage(`Agents activated with tools: \`${currentTools}\``, { parseMode: ParseMode.Markdown })
}

export const handleQueryAgents = async (context: TelegramContext, text: string) => {
  const tools = getAgentsTools(context)
  if (!tools) {
    await context.sendMessage(`Please set up tools first.`, { parseMode: ParseMode.Markdown })
    return
  }

  const response = await askAgents(text, tools)
  const { success, error, output, intermediate_steps } = response.data
  if (!success) {
    await context.sendMessage(error.length ? error[0] : 'Something went wrong. Please try again.', { parseMode: ParseMode.Markdown })
    return
  }
  for (const step of intermediate_steps || []) {
    await context.sendMessage(`\`\`\`\n${step}\`\`\``, { parseMode: ParseMode.Markdown })
  }
  // if output is object
  if (typeof output === 'object') {
    const { success, error, prediction } = output
    if (success) {
      if (prediction) {
        const { output_type } = prediction
        await checkPredictionTelegram(context, prediction, output_type)
      }
    } else {
      await context.sendMessage(error.length ? error[0] : 'Something went wrong. Please try again.')
    }
  } else if (typeof output === 'string') {
    await context.sendMessage(output, { parseMode: ParseMode.Markdown })
    if (isAutoSpeak(context)) {
      await handleTextToSpeechTelegram(context, output, getAzureVoiceName(context))
    }
  }
}

