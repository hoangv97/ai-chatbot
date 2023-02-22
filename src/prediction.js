const axios = require('axios');
const { SERVICES } = require('./const');
const { sleep, checkActiveService } = require('./helper');

async function postPrediction(context, version, input) {
  console.log(input);
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
}

async function getPrediction(context, id) {
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
}

async function RunPrediction(context, props) {
  if (!(await checkActiveService(context))) {
    return;
  }
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
    return;
  }

  while (
    prediction &&
    prediction.status !== 'succeeded' &&
    prediction.status !== 'failed'
  ) {
    await context.sendText(`${prediction.status}...`);
    await sleep(3000);
    const response = await getPrediction(context, prediction.id);
    if (!response) {
      return;
    }
    prediction = response;
  }
  // console.log(prediction);
  switch (activeService.output_type) {
    case 'image':
      for (const image of prediction.output) {
        await context.sendImage(image);
      }
      break;
    case 'text':
      await context.sendText(prediction.output);
      break;
    default:
      break;
  }
}

module.exports = {
  RunPrediction,
};
