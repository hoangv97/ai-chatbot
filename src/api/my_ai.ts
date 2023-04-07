import axios from "axios"

const apiKey = process.env.MY_AI_API_AUTH_KEY

export const getTools = async () => {
  const response = await axios.get(`${process.env.MY_AI_API_URL}/api/tools`, { params: { apiKey } })
  return response
}

export const askAgents = async (text: string, tools: string) => {
  const response = await axios.get(`${process.env.MY_AI_API_URL}/api/ask`, {
    params: {
      apiKey,
      p: text,
      t: tools,
    }
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