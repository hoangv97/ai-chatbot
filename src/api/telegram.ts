import axios from "axios"

export const getFileUrl = async (file_id: string) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `https://api.telegram.org/bot${process.env.TELEGRAM_ACCESS_TOKEN}/getFile`,
      params: {
        file_id
      }
    })
    if (response.status !== 200) {
      console.error(response.data);
      return null;
    }

    const filePath = response.data.result.file_path;
    return `https://api.telegram.org/file/bot${process.env.TELEGRAM_ACCESS_TOKEN}/${filePath}`
  } catch (e) {
    console.error(e);
    return null;
  }
}