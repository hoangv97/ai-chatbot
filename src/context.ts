import { MessengerContext, TelegramContext } from 'bottender';
import { ParseMode } from 'bottender/dist/telegram/TelegramTypes';
import { Payload_Type, SERVICES, Service_Type } from './const';
import { getFieldNameByType, objectToJsonWithTruncatedUrls, splitByFirstSpace } from './helper';

export const showDebug = async (context: MessengerContext | TelegramContext) => {
  const content = objectToJsonWithTruncatedUrls(context.state)
  if (context.platform === 'messenger') {
    await context.sendText(content);
  } else if (context.platform === 'telegram') {
    await context.sendMessage(`\`\`\`\n${content}\`\`\``, { parseMode: ParseMode.Markdown });
  }
}

export const selectService = async (context: MessengerContext, page = 0) => {
  const NUM_PER_PAGE = 6;
  const startIndex = page * NUM_PER_PAGE;
  const services = SERVICES.slice(startIndex, startIndex + NUM_PER_PAGE)
  if (!services.length) {
    await context.sendText('No services.')
  }
  else {
    await context.sendGenericTemplate(
      services.map((service, i) => ({
        title: service.name,
        subtitle: service.title,
        imageUrl:
          service.imageUrl ||
          'https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjN8fHRlY2hub2xvZ3l8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60',
        defaultAction: {
          type: 'web_url',
          url: service.url,
          webviewHeightRatio: 'tall',
          // messengerExtensions: true,
          // fallbackUrl: service.url,
        },
        buttons: [
          {
            type: 'postback',
            title: 'Select',
            payload: `${Payload_Type.Select_Service}${startIndex + i}`,
          },
        ],
      })), {}
    );
  }
};

export const getActiveService = (context: MessengerContext) => {
  return SERVICES[context.state.service as any]
}

export const showActiveService = async (context: MessengerContext) => {
  const activeService = getActiveService(context);
  await context.sendText(
    `${activeService.name}\n${activeService.title}\n\n${activeService.help}\n\n${activeService.url}`
  );
};

export const checkActiveService = async (context: MessengerContext) => {
  if (context.state.service as any < 0) {
    await selectService(context);
    return false;
  }
  return true;
};

export const clearServiceData = async (context: MessengerContext | TelegramContext) => {
  if (context.platform === 'messenger') {
    context.setState({
      ...context.state,
      query: {},
      context: [],
      data: {},
    });
    const activeService = getActiveService(context);
    if (activeService && activeService.type === Service_Type.Chat) {
      await context.sendText('New conversation.');
    } else {
      await context.sendText('Clearing data.');
    }
  } else if (context.platform === 'telegram') {
    context.setState({
      ...context.state,
      service: -1,
      query: {},
      context: [],
      data: {},
    });
    await context.sendText('New conversation.');
  }
};

export const setQueryForService = async (context: MessengerContext, field: string, value: string) => {
  context.setState({
    ...context.state,
    query: {
      ...context.state.query as any,
      [field]: value,
    },
  });
  await context.sendText(`Setting ${field}`);
};

export const setValueForQuery = async (context: MessengerContext, type: string, value: string) => {
  if (!(await checkActiveService(context))) {
    return;
  }
  const activeService = getActiveService(context);

  let fieldName: string | undefined = undefined;
  let fieldValue = value;

  if (type === 'text') {
    let [textFieldName, _value] = splitByFirstSpace(value);
    textFieldName = textFieldName.toLowerCase();
    // Find this field name in params list
    const param = activeService.params.find(
      (item: any) => item.name === textFieldName || item.alias === textFieldName
    );
    if (param) {
      fieldName = param.name;
      fieldValue = (_value || '').trim();

      if (param.type === 'select' && !fieldValue) {
        // Allow user to select an option
        await context.sendText(`Select ${fieldName}`, {
          quickReplies: param.options.map((option: string) => ({
            contentType: 'text',
            title: option,
            payload: [Payload_Type.Select_Query_Option, fieldName, option].join(
              Payload_Type.Splitter
            ),
          })),
        });
        return;
      }
    }
  }

  if (!fieldName) {
    fieldName = getFieldNameByType(activeService, type);
  }
  if (!fieldName) {
    await context.sendText(`Invalid query`);
    return;
  }

  await setQueryForService(context, fieldName, fieldValue);
};
