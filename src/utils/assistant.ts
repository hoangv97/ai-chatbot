import { Client } from "@notionhq/client";
import { getNotionBlockRichText, getNotionPageInfo } from "../utils/notion";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const todosDatabaseId = process.env.TODOS_NOTION_DATABASE_ID || ''
const dailyDatabaseId = process.env.DAILY_NOTION_DATABASE_ID || ''

export const getTodos = async (args: any) => {
  const response = await notion.databases.query({
    database_id: todosDatabaseId,
    filter: {
      or: [
      ]
    },
    sorts: [
    ],
  })
  return response.results.map((page: any) => {
    const { properties } = page
    return {
      ...getNotionPageInfo(page, true),
      name: getNotionBlockRichText(properties.Name.title),
    }
  })
}

export const addTodo = async (args: any) => {
  await notion.pages.create({
    parent: {
      database_id: todosDatabaseId,
    },
    properties: {
      Name: { title: [{ text: { content: args.name } }] },
    },
  })
  return "Todo added."
}

export const deleteTodo = async (args: any) => {
  await notion.pages.update({
    page_id: args.id,
    archived: true,
  })
  return "Todo deleted."
}

export const parseDailyTask = (page: any) => {
  const { properties } = page as any;
  const tasks = Object.keys(properties).filter((key) => properties[key].type === 'checkbox').map((key) => {
    return {
      name: key,
      done: !!properties[key].checkbox,
    }
  })
  return tasks;
}

export const getDailyTasks = async (args: any) => {
  const response = await notion.databases.query({
    database_id: dailyDatabaseId,
    filter: {
      and: [
        {
          property: 'Date',
          date: {
            equals: new Date().toISOString().split('T')[0],
          },
        },
      ]
    },
    sorts: [
    ],
  })
  const page = response.results.length ? response.results[0] : null
  if (page) {
    return parseDailyTask(page).map((task: any) => `${task.name}: ${task.done ? 'done' : 'not done'}`).join('\n')
  }
}

export const getWeeklyTasks = async (args: any) => {
  const response = await notion.databases.query({
    database_id: dailyDatabaseId,
    filter: {
      and: [
        {
          property: 'Date',
          date: {
            this_week: {},
          },
        },
      ]
    },
    sorts: [
    ],
  })
  const tasksCount: any = {}
  response.results.forEach((page: any) => {
    parseDailyTask(page).forEach((task: any) => {
      tasksCount[task.name] = (tasksCount[task.name] || 0) + (task.done ? 1 : 0)
    })
  })
  return Object.keys(tasksCount).map((key) => `${key}: ${tasksCount[key]}`).join('\n')
}
