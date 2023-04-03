import axios from 'axios';
import { MessengerContext } from 'bottender';
import { Output_Type } from '../utils/const';
import { getActiveService } from '../utils/context';
import { sleep } from '../utils/helper';

export async function postPrediction(context: MessengerContext, version: string, input: any) {
  try {
    // console.log(input);
    const response = await axios({
      method: 'POST',
      url: 'https://api.replicate.com/v1/predictions',
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        version,
        input,
      },
    });

    if (response.status !== 201) {
      console.error(response.data);
      await context.sendText(response.data.data.detail);
      return null;
    }

    return response.data;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getPrediction(context: MessengerContext, id: string) {
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://api.replicate.com/v1/predictions/' + id,
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    if (response.status !== 200) {
      console.error(response.data);
      await context.sendText(response.data.data.detail);
      return null;
    }
    return response.data;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function runPrediction(context: MessengerContext) {
  if (!Object.keys(context.state.query as any)) {
    await context.sendText(`Invalid query`);
    return;
  }
  const activeService = getActiveService(context);
  let prediction = await postPrediction(
    context,
    activeService.version,
    context.state.query
  );
  if (!prediction) {
    await context.sendText('Error!');
    return;
  }

  const QUERY_INTERVAL = 1000;
  let duration = 0;

  while (
    prediction &&
    prediction.status !== 'succeeded' &&
    prediction.status !== 'failed'
  ) {
    if (duration % 7500 === 0) {
      await context.sendText(`${prediction.status}...`);
    }
    await sleep(QUERY_INTERVAL);
    duration += QUERY_INTERVAL;
    const response = await getPrediction(context, prediction.id);
    prediction = response;
  }
  // console.log(prediction);
  if (!prediction || !prediction.output) {
    await context.sendText('Error when getting result!');
    return;
  }
  switch (activeService.output_type) {
    case Output_Type.Image:
      for (const image of prediction.output) {
        await context.sendImage(image);
      }
      break;
    case Output_Type.SingleImage:
      await context.sendImage(prediction.output);
      break;
    case Output_Type.Text:
      await context.sendText(prediction.output);
      break;
    case Output_Type.Transcription:
      await context.sendText(prediction.output.detected_language);
      await context.sendText(prediction.output.transcription);
      break;
    case Output_Type.Audio:
      await context.sendAudio(prediction.output)
    default:
      // console.log(prediction.output)
      break;
  }
}
