import axios from "axios";
import { TelegramContext } from "bottender";
import { ParseMode } from "bottender/dist/telegram/TelegramTypes";
import { AGENTS_SERVICE_ID } from "../utils/const";
import { truncate } from "../utils/helper";
import { getAgentsTools, getAzureVoiceName, isAutoSpeak } from "../utils/settings";
import { handleTextToSpeechTelegram } from "./audio";

export const activateAgents = async (context: TelegramContext) => {
  context.setState({
    ...context.state,
    service: AGENTS_SERVICE_ID,
    context: [],
    query: {},
    data: {},
  })
  await context.sendMessage(`Agents activated.`)
  await showTools(context)
}

export const getTools = async () => {
  const response = await axios.get(`${process.env.MY_AI_API_URL}/api/tools`)
  return response.data
}

export const showTools = async (context: TelegramContext) => {
  const tools = await getTools()
  let msg = `*Tools:*

${tools.map((tool: any) => `\`${tool.name}\` - ${truncate(tool.description, 50)}`).join('\n')}

*Usage:*
\`/settings --agentsTools <tool names separated by comma>\`

*Example:*
\`/settings --agentsTools wolfram-alpha\`
\`/settings --agentsTools news-api\`
\`/settings --agentsTools open-meteo-api\`
\`/settings --agentsTools wikipedia\`
\`/settings --agentsTools google-search,llm-math\`
`
  const selectedTools = getAgentsTools(context)
  if (selectedTools) {
    msg += `\n*Selected tools:* \`${selectedTools}\``
  }

  await context.sendMessage(msg, { parseMode: ParseMode.Markdown })
}

export const handleQueryAgents = async (context: TelegramContext, text: string) => {
  const tools = getAgentsTools(context)
  if (!tools) {
    await context.sendMessage(`Please set up tools first.`, { parseMode: ParseMode.Markdown })
    await showTools(context)
    return
  }

  const response = await axios.get(`${process.env.MY_AI_API_URL}/api/ask`, {
    params: {
      p: text,
      t: tools,
    }
  })
  const { success, error, output, intermediate_steps } = response.data
  if (!success) {
    await context.sendMessage(error.length ? error[0] : 'Something went wrong. Please try again.', { parseMode: ParseMode.Markdown })
    return
  }
  for (const step of intermediate_steps || []) {
    await context.sendMessage(`\`\`\`\n${step}\`\`\``, { parseMode: ParseMode.Markdown })
  }
  await context.sendMessage(output, { parseMode: ParseMode.Markdown })
  if (isAutoSpeak(context)) {
    await handleTextToSpeechTelegram(context, output, getAzureVoiceName(context))
  }
}

