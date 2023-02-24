const { encode } = require('gpt-3-encoder');
const { Payload_Type } = require('../const');
const { getReadableContentFromUrl } = require('../helper');
const { GPT3_MAX_TOKENS, createCompletion } = require('./openai');

const URL_ACTIONS = ['Summarize', 'Explain'];

const sendUrlActions = async (context) => {
  await context.sendText(`Select an action`, {
    quickReplies: URL_ACTIONS.map((option) => ({
      contentType: 'text',
      title: option,
      payload: [Payload_Type.Select_Url_Action, option].join(
        Payload_Type.Splitter
      ),
    })),
  });
};

const processByAction = async (url, action = 'Summarize', sentences = 1) => {
  const content = await getReadableContentFromUrl(url);

  let prompt;
  if (action === 'Explain') {
    prompt = `Explain this article in ${sentences} sentences or less: ${content}`;
  } else {
    prompt = `Summarize this article in ${sentences} sentences or less: ${content}`;
  }
  const tokens = encode(prompt).length;
  const result = { url, tokens, content };

  if (tokens >= GPT3_MAX_TOKENS) {
    result.message = 'Page content is too long.';
  } else if (!content) {
    result.message = 'Page content is empty.';
  } else {
    const completion = await createCompletion(prompt);
    result.completion = completion;
  }

  return result;
};

const handleUrl = async (context, action) => {
  const url = context.state.data.url;
  if (!url) {
    await context.sendText(`Error. URL not found.`);
  } else {
    let sentences = 1;
    if (action === 'Explain') {
      sentences = 3;
    }
    const result = await processByAction(url, action, sentences);
    if (!result.completion) {
      await context.sendText(`Error. ${result.message}`);
    } else {
      await context.sendText(result.completion);
    }
    await sendUrlActions(context);
  }
};

module.exports = {
  URL_ACTIONS,
  handleUrl,
  sendUrlActions,
};
