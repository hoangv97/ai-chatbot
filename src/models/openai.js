const { downloadFile } = require('../file');
const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const createCompletion = async (prompt) => {
  const response = await openai.createCompletion({
    prompt,
    model: 'text-davinci-003',
    max_tokens: 4096,
  });
  return response.data.choices[0].text;
};

const createCompletionFromConversation = async (messages) => {
  const prompt =
    'I am a friendly artificial intelligence.\n' +
    messages.map((m, i) => `${i % 2 ? 'AI' : 'USER'}: ${m}`).join('\n') +
    '\nAI: ';

  try {
    const response = await openai.createCompletion({
      prompt,
      model: 'text-davinci-003',
      max_tokens: 4096 - prompt.length,
    });
    return response.data.choices[0].text.trim();
  } catch (e) {
    console.log(e);
  }
};

const createImage = async ({ prompt, n }) => {
  const response = await openai.createImage({
    prompt,
    n,
    size: '512x512',
    response_format: 'url',
  });
  return response.data.data;
};

const imageDownloadsPath = './downloads';

const createImageEdit = async ({ prompt, image, n }) => {
  const imagePath = await downloadFile(image, imageDownloadsPath);
  const response = await openai.createImageEdit(
    fs.createReadStream(imagePath),
    null, // mask is optional
    prompt,
    n,
    '512x512',
    'url'
  );
  return response.data.data;
};

const createImageVariation = async ({ image, n }) => {
  const imagePath = await downloadFile(image, imageDownloadsPath);
  const response = await openai.createImageVariation(
    fs.createReadStream(imagePath),
    n,
    '512x512',
    'url'
  );
  return response.data.data;
};

const generateImage = async (context) => {
  const { model, ...others } = context.state.query;
  let createFunc;
  switch (model) {
    // case 'e':
    // case 'edit':
    //   createFunc = createImageEdit;
    //   break;
    case 'v':
    case 'variation':
      createFunc = createImageVariation;
      break;
    default:
      createFunc = createImage;
      break;
  }
  const outputs = await createFunc(others);
  for (const image of outputs) {
    await context.sendImage(image.url);
  }
};

module.exports = {
  createCompletion,
  createCompletionFromConversation,
  generateImage,
};
