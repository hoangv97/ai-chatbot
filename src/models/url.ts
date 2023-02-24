import { MessengerContext } from 'bottender';
import { encode } from 'gpt-3-encoder';
import { Payload_Type } from '../const';
import { getReadableContentFromUrl } from '../helper';
import { createCompletion, GPT3_MAX_TOKENS } from './openai';

export const URL_ACTIONS = ['Summarize', 'Explain'];

export const sendUrlActions = async (context: MessengerContext) => {
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

const processByAction = async (url: string, action = 'Summarize', sentences = 1) => {
  const content = await getReadableContentFromUrl(url);

  let prompt;
  if (action === 'Explain') {
    prompt = `Explain this article in ${sentences} sentences or less: ${content}`;
  } else {
    prompt = `Summarize this article in ${sentences} sentences or less: ${content}`;
  }
  const tokens = encode(prompt).length;
  const result: any = { url, tokens, content };

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

export const handleUrl = async (context: MessengerContext, action: string) => {
  const { url } = context.state.data as any;
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
