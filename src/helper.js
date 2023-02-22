const { SERVICES } = require('./const');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

const selectService = async (context) => {
  await context.sendText('Select a service', {
    quickReplies: SERVICES.map((service, i) => ({
      contentType: 'text',
      title: service.name,
      payload: `s_${i}`,
    })),
  });
};

const showActiveService = async (context) => {
  const activeService = SERVICES[context.state.service];
  await context.sendText(`${activeService.name}\n${activeService.help}`);
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
  await context.sendText('Cleared context.');
};

const setValueForQuery = async (context, type, value) => {
  if (!(await checkActiveService(context))) {
    return;
  }
  const activeService = SERVICES[context.state.service];

  let fieldName;
  let fieldValue = value;

  if (type === 'text') {
    const [textFieldName, _value] = splitByFirstSpace(value);
    // Find this field name in params list
    const param = activeService.params.find(
      (item) => item.name === textFieldName || item.alias === textFieldName
    );
    if (param) {
      fieldName = param.name;
      fieldValue = (_value || '').trim();
    }
  }

  if (!fieldName) {
    fieldName = getFieldNameByType(activeService, type);
  }
  if (!fieldName) {
    await context.sendText(`Invalid query`);
    return;
  }

  context.setState({
    ...context.state,
    query: {
      ...context.state.query,
      [fieldName]: fieldValue,
    },
  });
  await context.sendText(`Set value for ${fieldName}`);
};

module.exports = {
  sleep,
  selectService,
  showActiveService,
  checkActiveService,
  clearServiceData,
  setValueForQuery,
};
