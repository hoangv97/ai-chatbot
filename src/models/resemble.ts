import { Request, Response } from "express";
import { MongoClient } from "mongodb";

export const handleWebhooks = async (req: Request, res: Response): Promise<void> => {
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
}