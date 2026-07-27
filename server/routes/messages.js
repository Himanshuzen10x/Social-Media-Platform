const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper to check if two users are friends
const sameId = (a, b) => a && b && (a._id ? a._id.toString() : a.toString()) === b.toString();

const ensureArrays = (user) => {
  if (!user.friends) user.friends = [];
  if (!user.friendRequests) user.friendRequests = [];
};

// Send message to a friend (supports both POST / and POST /send)
const sendMessageHandler = async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    const senderId = req.user.id;

    if (!recipientId || !text || !text.trim()) {
      return res.status(400).json({ message: 'Recipient and message text are required' });
    }

    if (senderId === recipientId) {
      return res.status(400).json({ message: 'Cannot message yourself' });
    }

    // Verify recipient exists
    const recipientUser = await User.findById(recipientId);
    const senderUser = await User.findById(senderId);

    if (!recipientUser || !senderUser) return res.status(404).json({ message: 'User not found' });

    ensureArrays(senderUser);
    ensureArrays(recipientUser);

    // Verify they are friends
    const isFriend = senderUser.friends.some(f => sameId(f, recipientId));
    if (!isFriend) {
      return res.status(403).json({ message: 'You can only message users who are your friends' });
    }

    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      text: text.trim()
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profilePic')
      .populate('recipient', 'username profilePic');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

router.post('/', auth, sendMessageHandler);
router.post('/send', auth, sendMessageHandler);

// Get conversation messages between current user and a friend
router.get('/:friendId', auth, async (req, res) => {
  try {
    const friendId = req.params.id || req.params.friendId;
    const currentUserId = req.user.id;

    // Fetch conversation
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: friendId },
        { sender: friendId, recipient: currentUserId }
      ]
    })
    .populate('sender', 'username profilePic')
    .populate('recipient', 'username profilePic')
    .sort({ createdAt: 1 });

    // Mark unread messages sent by friend to current user as read
    await Message.updateMany(
      { sender: friendId, recipient: currentUserId, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unread messages summary/counts
router.get('/unread/count', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const unreadMessages = await Message.find({
      recipient: currentUserId,
      read: false
    });

    // Group unread count by sender
    const counts = {};
    unreadMessages.forEach(msg => {
      const sId = msg.sender.toString();
      counts[sId] = (counts[sId] || 0) + 1;
    });

    res.json({ total: unreadMessages.length, byFriend: counts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
