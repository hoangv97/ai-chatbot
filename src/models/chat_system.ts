import axios from 'axios';
import { Schema, model, Document } from 'mongoose';

export interface IChatSystem extends Document {
  name: string;
  description: string;
  system: string;
  user: string;
  temperature: number;
  suggestions: string;
  active: boolean;
  order: number;
}

const ChatSystemSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  system: { type: String, required: true },
  user: { type: String, required: false },
  temperature: { type: Number, required: false },
  suggestions: { type: String, required: false },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
});

export const ChatSystem = model<IChatSystem>('ChatSystem', ChatSystemSchema);

export const getSystems = async () => {
  try {
    const response = await axios.get(`${process.env.PROD_API_URL}/api/chat-system`);
    const systems: IChatSystem[] = response.data.filter((s: any) => s.active);
    systems.sort((a, b) => a.order === b.order ? 0 : a.order < b.order ? 1 : -1)
    // console.log(systems)
    return systems
  } catch (e) {
    console.error(e)
    return []
  }
}
