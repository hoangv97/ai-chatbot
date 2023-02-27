import { MessengerContext } from "bottender";
import { Output_Type, SERVICES, Service_Type, URL_SERVICE_ID } from "../const";
import { getActiveService } from "../context";
import { sleep } from "../helper";
import { getPrediction, postPrediction } from "./prediction";
import { handleChat } from "./text";
import { handleUrlPrompt } from "./url";

export const handleAudioForChat = async (context: MessengerContext) => {
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