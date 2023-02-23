const { downloadFile } = require('../file');
const fs = require('fs');
const { encode } = require('gpt-3-encoder');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const handleError = async (context, error) => {
  let message;
  try {
    if (error.response) {
      message = error.response.data.error.message;
    } else {
      message = error.message;
    }
  } finally {
    await context.sendText(message || 'Error!');
  }
};

const createCompletion = async (prompt) => {
  const response = await openai.createCompletion({
    prompt,
    model: 'text-davinci-003',
    max_tokens: 4096,
  });
  return response.data.choices[0].text;
};

const createCompletionFromConversation = async (context, messages) => {
  const prompt =
    'I am a friendly artificial intelligence.\n' +
    messages.map((m, i) => `${i % 2 ? 'AI' : 'USER'}: ${m}`).join('\n') +
    '\nAI: ';

  try {
    const max_tokens = 4096 - encode(prompt).length;
    const response = await openai.createCompletion({
      prompt,
      max_tokens,
      model: 'text-davinci-003',
    });
    return response.data.choices[0].text.trim();
  } catch (e) {
    handleError(context, e);
  }
};

const createImage = async ({ prompt, n }) => {
  const response = await openai.createImage({
    prompt,
    n: n ? parseInt(n) : undefined,
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
    n ? parseInt(n) : undefined,
    '512x512',
    'url'
  );
  return response.data.data;
};

const createImageVariation = async ({ image, n }) => {
  const imagePath = await downloadFile(image, imageDownloadsPath);
  const response = await openai.createImageVariation(
    fs.createReadStream(imagePath),
    n ? parseInt(n) : undefined,
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
  try {
    const outputs = await createFunc(others);
    for (const image of outputs) {
      await context.sendImage(image.url);
    }
  } catch (e) {
    handleError(context, e);
  }
};

module.exports = {
  createCompletion,
  createCompletionFromConversation,
  generateImage,
};
