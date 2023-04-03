import { Resemble } from "@resemble/node";
import { MessengerContext, TelegramContext } from "bottender";
import { ChatAction, ParseMode } from "bottender/dist/telegram/TelegramTypes";
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { speechToText, textToSpeech } from "../api/azure";
import { getFileUrl } from "../api/telegram";
import { DOWNLOADS_PATH, Output_Type, SERVICES, Service_Type, URL_SERVICE_ID } from "../utils/const";
import { getActiveService } from "../utils/context";
import { convertOggToWav, deleteDownloadFile, downloadFile, encodeOggWithOpus } from "../utils/file";
import { sleep } from "../utils/helper";
import { getAzureRecognitionLang, getAzureVoiceName, getWhisperLang, speechRecognitionServices } from "../utils/settings";
import { getTranscription } from "./openai";
import { getPrediction, postPrediction } from "./prediction";
import { handleChat } from "./text";
import { handleUrlPrompt } from "./url";

export const getAzureSpeechRecognition = async (context: MessengerContext | TelegramContext, fileUrl: string) => {
  try {
    let filePath = await downloadFile(fileUrl, DOWNLOADS_PATH);
    if (filePath.endsWith('.oga')) {
      const newFilePath = filePath.replace('.oga', '.wav')
      await convertOggToWav(filePath, newFilePath)
      deleteDownloadFile(filePath)
      filePath = newFilePath
    }
    const response = await speechToText(filePath, getAzureRecognitionLang(context))
    deleteDownloadFile(filePath)
    return response
  } catch (e) {
    return null;
  }
}

export const handleAudioForChat = async (context: MessengerContext | TelegramContext) => {
  let transcription
  if (context.platform === 'messenger') {
    if (getAzureRecognitionLang(context) === speechRecognitionServices.azure) {
      transcription = await getAzureSpeechRecognition(context, context.event.audio.url)
    } else {
      transcription = await getTranscription(context, context.event.audio.url)
    }
  } else if (context.platform === 'telegram') {
    const fileUrl = await getFileUrl(context.event.voice.fileId)
    if (fileUrl) {
      if (getAzureRecognitionLang(context) === speechRecognitionServices.azure) {
        transcription = await getAzureSpeechRecognition(context, fileUrl)
      } else {
        transcription = await getTranscription(context, fileUrl, getWhisperLang(context))
      }
    }
  }
  if (!transcription) {
    await context.sendText(`Error getting transcription!`);
    return
  }

  if (context.platform === 'messenger') {
    await context.sendText(`"${transcription}"`);
  } else if (context.platform === 'telegram') {
    await context.sendMessage(`_${transcription}_`, { parseMode: ParseMode.Markdown });
  }


  if (context.platform === 'messenger') {
    if (context.state.service === URL_SERVICE_ID) {
      await handleUrlPrompt(context, transcription);
      return
    }

    const activeService = getActiveService(context);
    if (activeService.type === Service_Type.Chat) {
      await handleChat(context, transcription)
    }
  } else if (context.platform === 'telegram') {
    await context.sendChatAction(ChatAction.Typing);
    await handleChat(context, transcription)
  }
}

export const handleAudioForChatV0 = async (context: MessengerContext) => {
  const transcriptionService = SERVICES.find(s => s.output_type === Output_Type.Transcription)

  let prediction = await postPrediction(
    context,
    transcriptionService.version,
    { audio: context.event.audio.url }
  );
  if (!prediction) {
    await context.sendText('Error! Please try again.');
    return;
  }
  while (
    prediction &&
    prediction.status !== 'succeeded' &&
    prediction.status !== 'failed'
  ) {
    await sleep(500);
    const response = await getPrediction(context, prediction.id);
    prediction = response;
  }
  // console.log(prediction);
  if (!prediction || !prediction.output || !prediction.output.transcription) {
    await context.sendText('Error when getting transcription!');
    return;
  }
  const transcription = prediction.output.transcription.trim();
  await context.sendText(`"${transcription}"`);

  if (context.state.service === URL_SERVICE_ID) {
    await handleUrlPrompt(context, transcription);
    return
  }

  const activeService = getActiveService(context);
  if (activeService.type === Service_Type.Chat) {
    await handleChat(context, transcription)
  }
}

export const handleTextToSpeech = async (context: MessengerContext, message: string) => {
  try {
    Resemble.setApiKey(process.env.RESEMBLE_TOKEN || '')
    const projectUuid = process.env.RESEMBLE_PROJECT || ''
    const voicesResponse = await Resemble.v2.voices.all(1, 10)
    const voices = voicesResponse.success ? voicesResponse.items : []
    const voiceUuid = voices[0].uuid;

    const response = await Resemble.v2.clips.createAsync(projectUuid, {
      body: message,
      voice_uuid: voiceUuid,
      is_archived: false,
      is_public: true,
      output_format: 'mp3',
      callback_uri: `${process.env.PROD_API_URL}/webhooks/resemble`
    })
    if (response.success && response.item) {
      // console.log(response.item)
      const { uuid } = response.item
      const client = new MongoClient(process.env.MONGO_URL || '');
      await client.connect()

      let result
      let duration = 0
      const WAIT_INTERVAL = 1000
      const MAX_WAIT = 30000

      while (!result || duration < MAX_WAIT) {
        await sleep(WAIT_INTERVAL)
        duration += WAIT_INTERVAL
        result = await client.db('messenger').collection('resemble').findOne({ id: uuid })
      }
      // console.log(result)
      if (result && result.url) {
        await context.sendAudio(result.url)
      } else {
        await context.sendText('Sorry! Cannot get speech.')
      }

      await client.close()
    } else if (response.message) {
      await context.sendText(response.message)
    }
  } catch (e) {
    console.error(e);
  }
}

export const handleTextToSpeechTelegram = async (context: TelegramContext, message: string, voiceName?: string) => {
  try {
    await context.sendChatAction(ChatAction.Typing);

    const fileId = uuidv4().replaceAll('-', '')
    const outputDir = `static/voices`
    const outputFile = `${outputDir}/voice_${fileId}.ogg`
    const encodedOutputFile = `${outputDir}/voice_${fileId}_encoded.ogg`

    const result = await textToSpeech(
      message || '',
      outputFile,
      voiceName || getAzureVoiceName(context)
    )
    await encodeOggWithOpus(outputFile, encodedOutputFile)

    const voiceUrl = `${process.env.PROD_API_URL}/${encodedOutputFile}`

    await context.sendVoice(voiceUrl)

    deleteDownloadFile(outputFile)
    deleteDownloadFile(encodedOutputFile)
  } catch (err) {
    console.trace("err - " + err);
  }
}