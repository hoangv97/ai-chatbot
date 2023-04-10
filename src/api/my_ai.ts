import axios from "axios"

const apiKey = process.env.MY_AI_API_AUTH_KEY

export const getTools = async () => {
  const response = await axios.get(`${process.env.MY_AI_API_URL}/api/tools`, { params: { apiKey } })
  return response
}

export const chatAgents = async (text: string, tools: string, chatHistory: string[], chatId?: number) => {
  const response = await axios(`${process.env.MY_AI_API_URL}/api/chat`, {
    method: 'POST',
    params: {
      apiKey,
      t: tools,
    },
    data: {
      p: text,
      h: chatHistory,
      telegram: chatId ? {
        bot_id: process.env.TELEGRAM_ACCESS_TOKEN,
        chat_id: chatId,
      } : undefined,
    },
  })
  return response
}

export const askUrl = async (url: string, t: string | undefined, prompt: string) => {
  const response = await axios.get(`${process.env.MY_AI_API_URL}/api/url`, {
    params: {
      apiKey,
      url,
      t,
      p: prompt,
    }
  })
  return response
}