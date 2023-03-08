import { Request, Response } from 'express';
import { ChatSystem, IChatSystem } from '../models/chat_system';

class ChatSystemController {
  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const chatSystems: IChatSystem[] = await ChatSystem.find();
      res.status(200).json(chatSystems);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const chatSystem: IChatSystem | null = await ChatSystem.findById(req.params.id);
      if (chatSystem) {
        res.status(200).json(chatSystem);
      } else {
        res.status(404).json({ message: 'ChatSystem not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const chatSystem: IChatSystem = new ChatSystem(req.body);
      const newChatSystem: IChatSystem = await chatSystem.save();
      res.status(201).json(newChatSystem);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const updatedChatSystem: IChatSystem | null = await ChatSystem.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true },
      );
      if (updatedChatSystem) {
        res.status(200).json(updatedChatSystem);
      } else {
        res.status(404).json({ message: 'ChatSystem not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const deletedChatSystem: IChatSystem | null = await ChatSystem.findByIdAndDelete(req.params.id);
      if (deletedChatSystem) {
        res.status(200).json(deletedChatSystem);
      } else {
        res.status(404).json({ message: 'ChatSystem not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ChatSystemController();
