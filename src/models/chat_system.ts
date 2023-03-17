import { Schema, model, Document } from 'mongoose';

export interface IChatSystem extends Document {
  name: string;
  description: string;
  system: string;
  user: string;
  suggestions: string;
  active: boolean;
  order: number;
}

const ChatSystemSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  system: { type: String, required: true },
  user: { type: String, required: false },
  suggestions: { type: String, required: false },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
});

export const ChatSystem = model<IChatSystem>('ChatSystem', ChatSystemSchema);
