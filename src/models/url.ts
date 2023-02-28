import axios from 'axios';
import { MessengerContext } from 'bottender';
import { encode } from 'gpt-3-encoder';
import { Payload_Type } from '../const';
import { selectService } from '../context';
import { truncate } from '../helper';
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
  {
    title: 'Preview',
    subtitle: `Show the article's preview`,
    type: 'preview',
    prompt: (content: string) => ``
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
  await context.sendText(`Choose one above or ask me about this article.`);
};

export const handleUrlPayload = async (context: MessengerContext, actionIndex: string) => {
  let { url, content } = context.state.data as any;
  if (!url) {
    await context.sendText(`Sorry! URL not found.`);
  } else {
    const action = URL_ACTIONS[parseInt(actionIndex)]

    let completion: string | null | undefined = truncate(content, 500)

    if (!['preview'].includes(action.type || '')) {
      const prompt = action.prompt(content)
      const tokens = encode(prompt).length;

      if (tokens >= GPT3_MAX_TOKENS) {
        await context.sendText(`Sorry! Page content is too long.`);
        return
      }

      completion = await createCompletion(prompt);
    }

    if (!completion) {
      await context.sendText(`Sorry! Can not get the result.`);
    } else {
      await context.sendText(completion);
    }
    await sendUrlActions(context);

    return content
  }
};

export const handleUrlPrompt = async (context: MessengerContext, prompt: string) => {
  try {
    let { url } = context.state.data as any;
    if (!url) {
      await context.sendText(`Sorry! URL not found.`);
      await selectService(context)
      return
    }

    const summarizeTexts = ['summarize', 'tóm tắt']
    let t
    summarizeTexts.forEach(t => {
      if (prompt.toLowerCase().startsWith(t)) {
        t = 'summarize'
      }
    })

    const response = await axios({
      method: 'GET',
      url: `${process.env.MY_AI_API_URL}/api/url`,
      params: {
        url,
        t,
        p: prompt,
      }
    });
    if (response.status !== 200) {
      console.error(response.data);
      await context.sendText('Error! Please try again.');
      return null;
    }
    const { result } = response.data;
    if (result) {
      await context.sendText(response.data.result);
    } else {
      await context.sendText('Error! Please try again.');
    }
  } catch (e) {
    console.error(e);
    return null;
  }
}
