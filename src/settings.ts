import { TelegramContext } from "bottender"
import { ParseMode } from "bottender/dist/telegram/TelegramTypes"
import { getVoices } from "./api/azure";
import { objectToJsonWithTruncatedUrls, parseCommand } from "./helper";

const quickCmdsText = `Quick commands

Auto speak when reply to message
\`/settings --autoSpeak true\`
\`/settings --autoSpeak false\`

Talking with me in any languages
\`/settings --azureVoiceName en-US-AshleyNeural --whisperLang en\`
\`/settings --azureVoiceName en-US-ChristopherNeural --whisperLang en\`

\`/settings --azureVoiceName vi-VN-HoaiMyNeural --whisperLang vi\`
\`/settings --azureVoiceName vi-VN-NamMinhNeural --whisperLang vi\`

\`/settings --azureVoiceName zh-CN-XiaoxiaoNeural --whisperLang zh\`
\`/settings --azureVoiceName zh-CN-YunyangNeural --whisperLang zh\`

\`/settings --azureVoiceName ja-JP-NanamiNeural --whisperLang ja\`
\`/settings --azureVoiceName ja-JP-DaichiNeural --whisperLang ja\`
`

export const handleVoices = async (context: TelegramContext, command: string) => {
  const localesList = [
    'en-US',
    'en-GB',
    'en-AU',
    'fr-FR',
    'es-ES',
    'de-DE',
    'it-IT',
    'ja-JP',
    'ko-KR',
    'zh-CN',
    'vi-VN',
  ]
  const quickCmds = localesList.map(locale => `\`/voices ${locale}\``).join('\n');

  const getGender = (id: number) => ['Unknown', 'Female', 'Male'][id]

  if (!command || command.length < 5) {
    await context.sendMessage(`Use command \`/voices <language>\` to get list of [voices](https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support?tabs=tts).\n\nQuick commands: \n${quickCmds}`, { parseMode: ParseMode.Markdown })
    return;
  }

  const voices = await getVoices([command]);
  const languages = voices.reduce((acc, voice) => {
    const { locale } = voice
    if (!acc[locale]) {
      acc[locale] = []
    }
    acc[locale].push(voice)
    return acc
  }, {} as any);
  let voiceName = '<voice_name>'

  let text = `Voices\n`
  for (let locale in languages) {
    text += `\n${locale}\n`
    for (let voice of languages[locale]) {
      text += `${voice.localName} (${getGender(voice.gender)}): \`${voice.shortName}\`\n`
      voiceName = voice.shortName
    }
  }
  text += `\nYou can set this voice to settings by:\n\`/settings --azureVoiceName ${voiceName}\``
  await context.sendMessage(text, { parseMode: ParseMode.Markdown })
}


export const handleSettings = async (context: TelegramContext, command: string) => {
  let { params } = parseCommand(command) || {};
  if (!params) {
    await sendHelpSettings(context)
    return;
  }
  for (let key in params) {
    setSettings(context, key, params[key])
  }
  await context.sendMessage(`Settings updated.`, { parseMode: ParseMode.Markdown })
}

export const handleDefaultSettings = async (context: TelegramContext) => {
  context.setState({
    ...context.state,
    settings: {
      auth: true,
    },
  })
  await context.sendMessage(`Default settings`, { parseMode: ParseMode.Markdown })
}

export const sendHelpSettings = async (context: TelegramContext) => {
  const currentSettings = { ...getSettings(context) }
  delete currentSettings.auth

  let helpText = `Use command \`/settings --key value\` to use settings.\n\n`
  const currentSettingsContent = objectToJsonWithTruncatedUrls(currentSettings)
  if (Object.keys(currentSettings).length > 0) {
    helpText += `Current settings:\n\`\`\`\n${currentSettingsContent}\`\`\``
  }

  await context.sendMessage(helpText, { parseMode: ParseMode.Markdown })
  await context.sendMessage(quickCmdsText, { parseMode: ParseMode.Markdown })
}

const getSettings = (context: TelegramContext): any => {
  return context.state.settings || {}
}

export const setSettings = (context: TelegramContext, key: string, value: string) => {
  let newValue: any = value
  if (value === 'true') {
    newValue = true
  } else if (value === 'false') {
    newValue = false
  }
  context.setState({
    ...context.state,
    settings: {
      ...getSettings(context),
      [key]: newValue,
    },
  })
}

export const isAutoSpeak = (context: TelegramContext) => {
  return !!getSettings(context).autoSpeak;
}

export const getAzureVoiceName = (context: TelegramContext) => {
  return getSettings(context).azureVoiceName || 'en-US-JennyNeural';
}

export const getWhisperLang = (context: TelegramContext) => {
  return getSettings(context).whisperLang || 'en';
}