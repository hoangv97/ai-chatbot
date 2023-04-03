import { Action, MessengerContext, TelegramContext } from 'bottender';
import handleMessenger from './platforms/messenger';
import handleTelegram from './platforms/telegram';

export default async function App(
  context: MessengerContext | TelegramContext
): Promise<Action<any> | void> {
  if (context.platform === 'telegram') {
    return handleTelegram(context)
  } else if (context.platform === 'messenger') {
    return handleMessenger(context)
  }
};
