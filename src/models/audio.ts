import { Resemble } from "@resemble/node";
import { MessengerContext, TelegramContext } from "bottender";
import { Output_Type, SERVICES, Service_Type, URL_SERVICE_ID } from "../const";
import { getActiveService } from "../context";
import { sleep } from "../helper";
import { getPrediction, postPrediction } from "./prediction";
import { handleChat } from "./text";
import { handleUrlPrompt } from "./url";
import { MongoClient } from 'mongodb'
import { getTranscription } from "./openai";
import { getFileUrl } from "../api/telegram";

export const handleAudioForChat = async (context: MessengerContext | TelegramContext) => {
  let transcription
  if (context.platform === 'messenger') {
    transcription = await getTranscription(context, context.event.audio.url)
  } else if (context.platform === 'telegram') {
    const fileUrl = await getFileUrl(context.event.voice.fileId)
    if (fileUrl) {
      transcription = await getTranscription(context, fileUrl)
    }
  }
  if (!transcription) {
    await context.sendText(`Error getting transcription!`);
    return
  }
  await context.sendText(`"${transcription}"`);

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