const { SERVICES, Payload_Type, Service_Type } = require('./const');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const objectToJsonWithTruncatedUrls = (obj) => {
  const MAX_URL_LENGTH = 50;
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'string' && value.startsWith('http')) {
        return value.length > MAX_URL_LENGTH
          ? value.slice(0, MAX_URL_LENGTH) + '...'
          : value;
      } else {
        return value;
      }
    },
    2
  );
};

function splitByFirstSpace(str) {
  const index = str.indexOf(' ');
  if (index === -1) {
    return [str];
  } else {
    return [str.slice(0, index), str.slice(index + 1)];
  }
}

const getFieldNameByType = (service, type) => {
  const field = service.params.find((item) => item.type === type);
  if (!field) return null;
  return field.name;
};

const selectService = async (context, page = 0) => {
  const NUM_PER_PAGE = 7;
  const startIndex = page * NUM_PER_PAGE;
  await context.sendGenericTemplate(
    SERVICES.slice(startIndex, startIndex + NUM_PER_PAGE).map((service, i) => ({
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
    }))
  );
};

const showActiveService = async (context) => {
  const activeService = SERVICES[context.state.service];
  await context.sendText(
    `${activeService.name}\n${activeService.title}\n\n${activeService.help}\n\n${activeService.url}`
  );
};

const checkActiveService = async (context) => {
  if (context.state.service < 0) {
    await selectService(context);
    return false;
  }
  return true;
};

const clearServiceData = async (context) => {
  context.setState({
    ...context.state,
    query: {},
    context: [],
  });
  const activeService = SERVICES[context.state.service];
  if (activeService.type === Service_Type.Chat) {
    await context.sendText('New conversation.');
  } else {
    await context.sendText('Clearing data.');
  }
};

const setQueryForService = async (context, field, value) => {
  context.setState({
    ...context.state,
    query: {
      ...context.state.query,
      [field]: value,
    },
  });
  await context.sendText(`Setting ${field}`);
};

const setValueForQuery = async (context, type, value) => {
  if (!(await checkActiveService(context))) {
    return;
  }
  const activeService = SERVICES[context.state.service];

  let fieldName;
  let fieldValue = value;

  if (type === 'text') {
    let [textFieldName, _value] = splitByFirstSpace(value);
    textFieldName = textFieldName.toLowerCase();
    // Find this field name in params list
    const param = activeService.params.find(
      (item) => item.name === textFieldName || item.alias === textFieldName
    );
    if (param) {
      fieldName = param.name;
      fieldValue = (_value || '').trim();

      if (param.type === 'select' && !fieldValue) {
        // Allow user to select an option
        await context.sendText(`Select ${fieldName}`, {
          quickReplies: param.options.map((option) => ({
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

module.exports = {
  sleep,
  objectToJsonWithTruncatedUrls,
  selectService,
  showActiveService,
  checkActiveService,
  clearServiceData,
  setValueForQuery,
  setQueryForService,
};
