const axios = require('axios');
const { SERVICES, Output_Type } = require('../const');
const { sleep } = require('../helper');

async function postPrediction(context, version, input) {
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

async function getPrediction(context, id) {
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

async function runPrediction(context) {
  if (!Object.keys(context.state.query)) {
    await context.sendText(`Invalid query`);
    return;
  }
  const activeService = SERVICES[context.state.service];
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
    await sleep(QUERY_INTERVAL);
    duration += QUERY_INTERVAL;
    if (duration % 5000 === 0) {
      await context.sendText(`${prediction.status}...`);
    }
    const response = await getPrediction(context, prediction.id);
    if (!response) {
      await context.sendText('Error!');
      return;
    }
    prediction = response;
  }
  // console.log(prediction);
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
    default:
      break;
  }
}

module.exports = {
  runPrediction,
};
