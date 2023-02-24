import { MessengerContext } from 'bottender';
import { encode } from 'gpt-3-encoder';
import { Payload_Type } from '../const';
import { getReadableContentFromUrl } from '../helper';
import { createCompletion, GPT3_MAX_TOKENS } from './openai';

export const URL_ACTIONS = [
  {
    title: 'Summarize',
    subtitle: 'Summarize in a sentence',
    prompt: (content: string) => `Summarize this article in 1 sentence: ${content}`
  },
  {
    title: 'Explain',
    subtitle: 'Explain in 3 sentences',
    prompt: (content: string) => `Explain this article in 3 sentences: ${content}`
  },
  {
    title: 'Key points',
    subtitle: 'Key points of this article',
    prompt: (content: string) => `Few key points of this article: ${content}`
  },
  {
    title: 'Additional reading',
    subtitle: 'Additional research or reading',
    prompt: (content: string) => `5 additional research or reading I need to deepen my understanding of the topic covered in this article: ${content}`
  },
  {
    title: 'Categories',
    subtitle: 'Categories of this article',
    prompt: (content: string) => `Categories of this article: ${content}`
  },
  {
    title: 'Tones',
    subtitle: 'Tones of this article',
    prompt: (content: string) => `Tone of this article: ${content}`
  },
];

export const sendUrlActions = async (context: MessengerContext) => {
  await context.sendGenericTemplate(URL_ACTIONS.map((option, i) => ({
    title: option.title,
    subtitle: option.subtitle,
    buttons: [
      {
        type: 'postback',
        title: 'Select',
        payload: [Payload_Type.Select_Url_Action, i].join(
          Payload_Type.Splitter
        ),
      },
    ],
  })), {})
};

export const handleUrl = async (context: MessengerContext, actionIndex: string) => {
  let { url } = context.state.data as any;
  if (!url) {
    await context.sendText(`Sorry. URL not found.`);
  } else {
    const action = URL_ACTIONS[parseInt(actionIndex)]

    const content = await getReadableContentFromUrl(url);
    if (!content) {
      await context.sendText(`Sorry. Page content is empty.`);
      return
    }

    const prompt = action.prompt(content)
    const tokens = encode(prompt).length;

    if (tokens >= GPT3_MAX_TOKENS) {
      await context.sendText(`Sorry. Page content is too long.`);
      return
    }

    const completion = await createCompletion(prompt);

    if (!completion) {
      await context.sendText(`Sorry. Can not get the result.`);
    } else {
      await context.sendText(completion);
    }
    await sendUrlActions(context);
  }
};
