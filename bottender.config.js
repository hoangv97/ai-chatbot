module.exports = {
  session: {
    driver: process.env.SESSION_DRIVER || 'memory',
    stores: {
      memory: {
        maxSize: 500,
      },
      file: {
        dirname: '.sessions',
      },
      redis: {
        port: process.env.REDIS_PORT || 6379,
        host: process.env.REDIS_HOST || '127.0.0.1',
        password: process.env.REDIS_PASSWORD || 'auth',
        db: 0,
      },
      mongo: {
        url: process.env.MONGO_URL || 'mongodb://localhost:27017',
        collectionName: process.env.MONGO_COLLECTION || 'sessions',
      },
    },
  },
  initialState: {
    service: -1,
    query: {},
    context: [],
  },
  channels: {
    messenger: {
      enabled: true,
      path: '/webhooks/messenger',
      pageId: process.env.MESSENGER_PAGE_ID,
      accessToken: process.env.MESSENGER_ACCESS_TOKEN,
      appId: process.env.MESSENGER_APP_ID,
      appSecret: process.env.MESSENGER_APP_SECRET,
      verifyToken: process.env.MESSENGER_VERIFY_TOKEN,
      fields: [
        'messages',
        'messaging_postbacks',
        'messaging_optins',
        'messaging_referrals',
        'messaging_handovers',
        'messaging_policy_enforcement',
      ],
      profile: {
        getStarted: {
          payload: 'GET_STARTED',
        },
        persistentMenu: [
          {
            locale: 'default',
            composerInputDisabled: false,
            callToActions: [
              {
                type: 'postback',
                title: 'Talk to an agent',
                payload: 'CARE_HELP',
              },
              {
                type: 'postback',
                title: 'Outfit suggestions',
                payload: 'CURATION',
              },
              {
                type: 'web_url',
                title: 'Shop now',
                url: 'https://www.originalcoastclothing.com/',
                webviewHeightRatio: 'full',
              },
            ],
          },
        ],
        greeting: [
          {
            locale: 'default',
            text: 'Hello {{user_full_name}}! Welcome to my bot~ ?',
          },
        ],
        iceBreakers: [
          {
            question: '<QUESTION>',
            payload: '<PAYLOAD>',
          },
          {
            question: '<QUESTION>',
            payload: '<PAYLOAD>',
          },
        ],
      },
    },
    whatsapp: {
      enabled: false,
      path: '/webhooks/whatsapp',
      accountSid: process.env.WHATSAPP_ACCOUNT_SID,
      authToken: process.env.WHATSAPP_AUTH_TOKEN,
      phoneNumber: process.env.WHATSAPP_PHONE_NUMBER,
    },
    line: {
      enabled: false,
      path: '/webhooks/line',
      accessToken: process.env.LINE_ACCESS_TOKEN,
      channelSecret: process.env.LINE_CHANNEL_SECRET,
    },
    telegram: {
      enabled: false,
      path: '/webhooks/telegram',
      accessToken: process.env.TELEGRAM_ACCESS_TOKEN,
    },
    slack: {
      enabled: false,
      path: '/webhooks/slack',
      accessToken: process.env.SLACK_ACCESS_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
    },
    viber: {
      enabled: false,
      path: '/webhooks/viber',
      accessToken: process.env.VIBER_ACCESS_TOKEN,
      sender: {
        name: 'xxxx',
      },
    },
  },
};
