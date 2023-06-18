export const getNotionBlockRichText = (texts: any[]) => {
  return texts && texts.length ? texts[0].plain_text : ''
}

export const getNotionPageInfo = (page: any, idOnly?: boolean) => {
  const { id, url, icon, cover } = page
  if (idOnly) {
    return { id }
  }
  return {
    id,
    url,
    icon: icon ? icon[icon.type] : null,
    cover: cover ? cover[cover.type].url : null,
  }
}