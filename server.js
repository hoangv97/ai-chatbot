const bodyParser = require('body-parser');
const express = require('express');
const { bottender } = require('bottender');
const MongoClient = require('mongodb').MongoClient;

const app = bottender({
  dev: process.env.NODE_ENV !== 'production',
});

const port = Number(process.env.PORT) || 5000;

// the request handler of the bottender app
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  const verify = (req, _, buf) => {
    req.rawBody = buf.toString();
  };
  server.use(bodyParser.json({ verify }));
  server.use(bodyParser.urlencoded({ extended: false, verify }));

  // your custom route
  server.post('/webhooks/resemble', async (req, res) => {
    try {
      const { id } = req.body;
      const client = new MongoClient(process.env.MONGO_URL || '');
      await client.connect();
      const result = await client
        .db('messenger')
        .collection('resemble')
        .updateOne({ id }, { $set: req.body }, { upsert: true });
      console.log(`received resemble clip: ${id}`);
    } catch (e) {
      console.log(e);
    }
  });

  server.get('/api', (req, res) => {
    res.json({ ok: true });
  });

  // route for webhook request
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
