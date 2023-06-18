import { Client } from "@notionhq/client";
import { getNotionBlockRichText, getNotionPageInfo } from "../utils/notion";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

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
