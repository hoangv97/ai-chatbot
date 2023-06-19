import { TelegramContext } from "bottender";
import { ChatCompletionFunctions, ChatCompletionRequestMessage } from "openai";
import { addTodo, deleteTodo, getDailyTasks, getTodos, getWeeklyTasks } from "../utils/assistant";
import { ASSISTANT_SERVICE_ID } from "../utils/const";
import { createCompletionWithFunctions } from "./openai";

export const activateAssistant = async (context: TelegramContext) => {
  context.setState({
    ...context.state,
    service: ASSISTANT_SERVICE_ID,
  });
  await context.sendText('Assistant activated.');
}

export const handleAssistantCommand = async (context: TelegramContext, text: string) => {
  const messages: ChatCompletionRequestMessage[] = [...context.state.context as any];

  if (!messages.length) {
    messages.push({
      role: 'system',
      content: "Act as a personal assistant. Don't make assumptions about what values to plug into functions. Ask for clarification if a user request is ambiguous."
    })
  }
  messages.push({ role: 'user', content: text })

  const functions: ChatCompletionFunctions[] = [
    {
      name: 'getDailyTasks',
      description: 'Get daily tasks',
      parameters: {
        type: 'object',
        properties: {
        },
        required: [],
      },
    },
    {
      name: 'getWeeklyTasks',
      description: 'Get tasks this week',
      parameters: {
        type: 'object',
        properties: {
        },
        required: [],
      },
    },
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
      'getDailyTasks': getDailyTasks,
      'getWeeklyTasks': getWeeklyTasks,
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