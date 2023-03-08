import { Schema, model, Document } from 'mongoose';

export interface IChatSystem extends Document {
  name: string;
  description: string;
  content: string;
  active: boolean;
}

const ChatSystemSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  content: { type: String, required: true },
  active: { type: Boolean, default: true },
});

export const ChatSystem = model<IChatSystem>('ChatSystem', ChatSystemSchema);
