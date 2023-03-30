import bodyParser from 'body-parser';
import { bottender } from 'bottender';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import ChatSystemController from './api/chat_system';
import { handleWebhooks } from './models/resemble';

const app = bottender({
  dev: process.env.NODE_ENV !== 'production',
});

const port = Number(process.env.PORT) || 5000;

// the request handler of the bottender app
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  mongoose
    .connect(process.env.MONGO_URL || '')
    .then(() => console.log('Connected to database'))
    .catch((error) => console.log(error));

  const verify = (req: any, _: any, buf: any) => {
    req.rawBody = buf.toString();
  };
  server.use(bodyParser.json({ verify }));
  server.use(bodyParser.urlencoded({ extended: false, verify }));
  server.use(cors())

  // your custom route
  server.use('/static', express.static('static'));

  server.get('/api/chat-system', ChatSystemController.getAll);
  server.get('/api/chat-system/:id', ChatSystemController.getById);
  server.post('/api/chat-system', ChatSystemController.create);
  server.put('/api/chat-system/:id', ChatSystemController.update);
  server.delete('/api/chat-system/:id', ChatSystemController.delete);

  server.post('/webhooks/resemble', handleWebhooks);

  server.get('/api', (req, res) => {
    res.json({ ok: true });
  });

  // route for webhook request
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
