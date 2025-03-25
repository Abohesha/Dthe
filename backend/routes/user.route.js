import express from "express";
import User from "../models/user.model.js";  // Import the User model
import { protectRoute } from "../middleware/auth.middleware.js";
import { getSuggestedConnections, getPublicProfile, updateProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    // Find users with name matching the query (case-insensitive)
    const users = await User.find({
      name: { $regex: query, $options: 'i' }, // Case-insensitive search
    }).limit(10); // Limit the number of users returned

    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    res.json(users);
  } catch (error) {
    console.error('Error searching for users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Other routes
router.get("/suggestions", protectRoute, getSuggestedConnections);
router.get("/:username", protectRoute, getPublicProfile);
router.put("/profile", protectRoute, updateProfile);

export default router;
