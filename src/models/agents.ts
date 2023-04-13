import { TelegramContext } from "bottender";
import { ParseMode } from "bottender/dist/telegram/TelegramTypes";
import { chatAgents } from '../api/my_ai';
import { AGENTS_SERVICE_ID } from "../utils/const";
import { getAgentsActor, getAgentsTools, getAzureVoiceName, getShowAgentsLogs, isAutoSpeak } from "../utils/settings";
import { handleTextToSpeechTelegram } from "./audio";
import { checkPredictionTelegram } from "./replicate";
import { objectToJsonWithTruncatedUrls } from "../utils/helper";

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

  let chatId
  if (getShowAgentsLogs(context)) {
    const chat = await context.getChat()
    chatId = chat?.id
  }
  const response = await chatAgents(text, tools, context.state.context as any, getAgentsActor(context), chatId)
  const { success, error, output, intermediate_steps } = response.data
  if (!success) {
    await context.sendMessage(
      error.length ? error[0] : 'Something went wrong. Please try again.',
      { parseMode: ParseMode.Markdown },
    )
    return
  }

  let outputMsg = output

  // if output is object
  if (typeof output === 'object') {
    const { success, error, replicate, giphy, input } = output
    if (success) {
      if (input) {
        let tool = ''
        if (replicate) tool = 'replicate'
        if (giphy) tool = 'giphy'

        if (getShowAgentsLogs(context)) {
          await context.sendMessage(
            `${tool}\n\`\`\`\n${objectToJsonWithTruncatedUrls(input)}\`\`\``.trim(),
            { parseMode: ParseMode.Markdown },
          )
        }

        outputMsg = `Used ${tool} to answer.`
      }
      if (replicate) {
        const { output_type } = replicate
        await checkPredictionTelegram(context, replicate, output_type)
      }
      if (giphy) {
        for (const image of giphy) {
          await context.sendAnimation(image.images.original.url)
        }
      }
    } else {
      await context.sendMessage(error.length ? error[0] : 'Something went wrong. Please try again.')
      return
    }
  } else if (typeof output === 'string') {
    await context.sendMessage(output, { parseMode: ParseMode.Markdown })
    if (isAutoSpeak(context)) {
      await handleTextToSpeechTelegram(context, output, getAzureVoiceName(context))
    }
  }
  // Save to context
  context.setState({
    ...context.state,
    context: [
      ...context.state.context as any,
      text,
      outputMsg,
    ],
  });
}

