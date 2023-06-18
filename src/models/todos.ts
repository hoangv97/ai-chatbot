import { Client } from "@notionhq/client";
import { TelegramContext } from "bottender";
import { ChatCompletionFunctions, ChatCompletionRequestMessage } from "openai";
import { TODOS_SERVICE_ID } from "../utils/const";
import { createCompletion, createCompletionWithFunctions } from "./openai";
import { getNotionBlockRichText, getNotionPageInfo } from "../utils/notion";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.TODOS_NOTION_DATABASE_ID || ''

export const activateTodos = async (context: TelegramContext) => {
  context.setState({
    ...context.state,
    service: TODOS_SERVICE_ID,
  });
  await context.sendText('Todos activated.');
}

export const getTodos = async (args: any) => {
  const response = await notion.databases.query({
    database_id: databaseId,
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
      database_id: databaseId,
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

export const handleTodosCommand = async (context: TelegramContext, text: string) => {
  const messages: ChatCompletionRequestMessage[] = [...context.state.context as any];

  if (!messages.length) {
    messages.push({
      role: 'system',
      content: "Don't make assumptions about what values to plug into functions. Ask for clarification if a user request is ambiguous."
    })
  }
  messages.push({ role: 'user', content: text })

  const functions: ChatCompletionFunctions[] = [
    {
      name: 'getTodos',
      description: 'Get todos',
      parameters: {
        type: 'object',
        properties: {
        },
        required: [],
      },
    },
    {
      name: 'addTodo',
      description: 'Add todo',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Todo name',
          }
        },
        required: ['name'],
      }
    },
    {
      name: 'removeTodo',
      description: 'Remove todo',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Todo id',
          },
        },
        required: ['id'],
      },
    },
  ]
  await createCompletionWithFunctions(
    context,
    messages,
    functions,
    {
      'getTodos': getTodos,
      'addTodo': addTodo,
      'removeTodo': deleteTodo,
    },
  )
  context.setState({
    ...context.state,
    context: messages as any,
  });
}