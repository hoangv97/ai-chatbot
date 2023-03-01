import axios from "axios"

export const getMessage = async (id: string) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `https://graph.facebook.com/v16.0/${id}`,
      params: {
        access_token: process.env.MESSENGER_ACCESS_TOKEN,
        fields: 'message,created_time,tags,from,to'
      }
    })
    if (response.status !== 200) {
      console.error(response.data);
      return null;
    }

    return response.data.message;
  } catch (e) {
    console.error(e);
    return null;
  }
}