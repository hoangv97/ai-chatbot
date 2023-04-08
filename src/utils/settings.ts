import { MessengerContext, TelegramContext } from "bottender";
import { ParseMode } from "bottender/dist/telegram/TelegramTypes";
import { objectToJsonWithTruncatedUrls } from "./helper";


export const handleSettings = async (context: TelegramContext) => {
  let msg = `Open Settings in [/apps](/apps).`

  const currentSettings = { ...getSettings(context) }

  const currentSettingsContent = objectToJsonWithTruncatedUrls(currentSettings)
  if (Object.keys(currentSettings).length > 0) {
    msg += `\n\nCurrent settings:\n\`\`\`\n${currentSettingsContent}\`\`\``
  }

  await context.sendMessage(msg, { parseMode: ParseMode.Markdown })
}

export const getSettings = (context: TelegramContext | MessengerContext): any => {
  const settings = context.state.settings || {} as any
  return settings
}

export const saveSettings = async (context: TelegramContext, settings: any) => {
  context.setState({
    ...context.state,
    settings,
  })
  await handleSettings(context)
}

export const isAutoSpeak = (context: TelegramContext) => {
  return !!getSettings(context).autoSpeak;
}

export const getAzureVoiceName = (context: TelegramContext) => {
  return getSettings(context).azureVoiceName || 'en-US-JennyNeural';
}

export const getAzureRecognitionLang = (context: TelegramContext | MessengerContext) => {
  return getSettings(context).azureRecognitionLang || 'en-US';
}

export const getWhisperLang = (context: TelegramContext) => {
  return getSettings(context).whisperLang || 'en';
}

export const speechRecognitionServices = {
  azure: 'azure',
  whisper: 'whisper',
}

export const getSpeechRecognitionService = (context: TelegramContext | MessengerContext) => {
  return getSettings(context).speechRecognitionService || speechRecognitionServices.azure;
}

export const getAgentsTools = (context: TelegramContext) => {
  return getSettings(context).agentsTools || '';
}