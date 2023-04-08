import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export const getNotionBlockRichText = (texts: any[]) => {
  return texts && texts.length ? texts[0].plain_text : ''
}

const getNotionPageInfo = (page: any) => {
  const { id, url, icon, cover } = page
  return {
    id,
    url,
    icon: icon ? icon[icon.type] : null,
    cover: cover ? cover[cover.type].url : null,
  }
}

export const getCharacters = async () => {
  const databaseId = process.env.CHARACTERS_NOTION_DATABASE_ID || ''
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      or: [
        {
          property: 'Active',
          checkbox: {
            equals: true,
          },
        },
      ]
    },
    sorts: [
      {
        property: 'Order',
        direction: 'descending',
      },
    ],
  })
  return response.results.map((page: any) => {
    const { properties } = page
    return {
      ...getNotionPageInfo(page),
      name: getNotionBlockRichText(properties.Name.title),
      description: getNotionBlockRichText(properties.Description.rich_text),
      system: getNotionBlockRichText(properties.System.rich_text),
      user: getNotionBlockRichText(properties.User.rich_text),
      suggestions: getNotionBlockRichText(properties.Suggestions.rich_text),
      temperature: properties.Temperature.number === null ? undefined : properties.Temperature.number,
      order: properties.Order.number || 0,
      active: properties.Active.checkbox,
    }
  })
}
