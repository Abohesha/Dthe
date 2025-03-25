import express from 'express';
import Message from '../models/message.model.js'; // Import Message model
import { protectRoute } from '../middleware/auth.middleware.js'; // Assuming protection middleware

const router = express.Router();

// Route to fetch messages between two users
router.get('/:userId/:receiverId', protectRoute, async (req, res) => {
  try {
    const { userId, receiverId } = req.params;

    // Find all messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
    })
      .sort({ timestamp: 1 }) // Sort messages by timestamp
      .limit(50); // Limit the number of messages (optional)

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Error fetching chat history' });
  }
});

export default router;