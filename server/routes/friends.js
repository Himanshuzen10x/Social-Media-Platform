const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper to compare ObjectId or populated object with string ID
const sameId = (objOrId, targetIdStr) => {
  if (!objOrId || !targetIdStr) return false;
  const idStr = objOrId._id ? objOrId._id.toString() : objOrId.toString();
  return idStr === targetIdStr.toString();
};

// Helper to ensure user arrays exist on legacy user documents
const ensureArrays = (user) => {
  if (!user.friends) user.friends = [];
  if (!user.friendRequests) user.friendRequests = [];
};

// Send friend request
router.post('/request/:id', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    ensureArrays(targetUser);
    ensureArrays(currentUser);

    // Check if already friends
    if (currentUser.friends.some(f => sameId(f, targetUserId))) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Check if request already exists (sent by current user)
    const existingSent = targetUser.friendRequests.find(
      r => sameId(r.from, currentUserId) && r.status === 'pending'
    );
    if (existingSent) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    // Check if the other user already sent us a request — auto-accept
    const existingReceived = currentUser.friendRequests.find(
      r => sameId(r.from, targetUserId) && r.status === 'pending'
    );
    if (existingReceived) {
      existingReceived.status = 'accepted';
      currentUser.friends.push(targetUserId);
      targetUser.friends.push(currentUserId);

      const targetSentReq = targetUser.friendRequests.find(
        r => sameId(r.to, currentUserId) && r.status === 'pending'
      );
      if (targetSentReq) targetSentReq.status = 'accepted';

      await currentUser.save();
      await targetUser.save();
      return res.json({ message: 'Friend request auto-accepted (mutual request)', status: 'accepted' });
    }

    // Add request to target user's friendRequests
    targetUser.friendRequests.push({
      from: currentUserId,
      to: targetUserId,
      status: 'pending'
    });

    // Also track on sender side for "sent requests" visibility
    currentUser.friendRequests.push({
      from: currentUserId,
      to: targetUserId,
      status: 'pending'
    });

    await targetUser.save();
    await currentUser.save();

    res.json({ message: 'Friend request sent', status: 'pending' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept friend request
router.put('/accept/:id', auth, async (req, res) => {
  try {
    const fromUserId = req.params.id;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);
    const fromUser = await User.findById(fromUserId);

    if (!fromUser) return res.status(404).json({ message: 'User not found' });

    ensureArrays(currentUser);
    ensureArrays(fromUser);

    const request = currentUser.friendRequests.find(
      r => sameId(r.from, fromUserId) && sameId(r.to, currentUserId) && r.status === 'pending'
    );

    if (!request) {
      return res.status(404).json({ message: 'No pending friend request from this user' });
    }

    request.status = 'accepted';

    const senderRequest = fromUser.friendRequests.find(
      r => sameId(r.from, fromUserId) && sameId(r.to, currentUserId) && r.status === 'pending'
    );
    if (senderRequest) senderRequest.status = 'accepted';

    if (!currentUser.friends.some(f => sameId(f, fromUserId))) {
      currentUser.friends.push(fromUserId);
    }
    if (!fromUser.friends.some(f => sameId(f, currentUserId))) {
      fromUser.friends.push(currentUserId);
    }

    await currentUser.save();
    await fromUser.save();

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject friend request
router.put('/reject/:id', auth, async (req, res) => {
  try {
    const fromUserId = req.params.id;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);
    const fromUser = await User.findById(fromUserId);

    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    ensureArrays(currentUser);
    if (fromUser) ensureArrays(fromUser);

    const request = currentUser.friendRequests.find(
      r => sameId(r.from, fromUserId) && sameId(r.to, currentUserId) && r.status === 'pending'
    );

    if (!request) {
      return res.status(404).json({ message: 'No pending friend request from this user' });
    }

    request.status = 'rejected';

    if (fromUser) {
      const senderRequest = fromUser.friendRequests.find(
        r => sameId(r.from, fromUserId) && sameId(r.to, currentUserId) && r.status === 'pending'
      );
      if (senderRequest) senderRequest.status = 'rejected';
      await fromUser.save();
    }

    await currentUser.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove friend (unfriend)
router.delete('/remove/:id', auth, async (req, res) => {
  try {
    const friendId = req.params.id;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);
    const friendUser = await User.findById(friendId);

    if (!friendUser) return res.status(404).json({ message: 'User not found' });

    ensureArrays(currentUser);
    ensureArrays(friendUser);

    if (!currentUser.friends.some(f => sameId(f, friendId))) {
      return res.status(400).json({ message: 'Not friends with this user' });
    }

    // Remove from both sides
    currentUser.friends = currentUser.friends.filter(f => !sameId(f, friendId));
    friendUser.friends = friendUser.friends.filter(f => !sameId(f, currentUserId));

    // Remove friend request records between them
    currentUser.friendRequests = currentUser.friendRequests.filter(
      r => !(
        (sameId(r.from, friendId) && sameId(r.to, currentUserId)) ||
        (sameId(r.from, currentUserId) && sameId(r.to, friendId))
      )
    );
    friendUser.friendRequests = friendUser.friendRequests.filter(
      r => !(
        (sameId(r.from, currentUserId) && sameId(r.to, friendId)) ||
        (sameId(r.from, friendId) && sameId(r.to, currentUserId))
      )
    );

    await currentUser.save();
    await friendUser.save();

    res.json({ message: 'Friend removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get pending friend requests (received + sent)
router.get('/requests', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id)
      .populate('friendRequests.from', 'username profilePic bio')
      .populate('friendRequests.to', 'username profilePic bio');

    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const requests = currentUser.friendRequests || [];

    const received = requests.filter(
      r => r.to && r.from && sameId(r.to, req.user.id) && !sameId(r.from, req.user.id) && r.status === 'pending'
    );
    const sent = requests.filter(
      r => r.from && r.to && sameId(r.from, req.user.id) && !sameId(r.to, req.user.id) && r.status === 'pending'
    );

    res.json({ received, sent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get friends list
router.get('/list', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id)
      .populate('friends', 'username profilePic bio');

    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    res.json(currentUser.friends || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get friend status with a specific user
router.get('/status/:id', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);

    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const friends = currentUser.friends || [];
    const requests = currentUser.friendRequests || [];

    if (friends.some(f => sameId(f, targetUserId))) {
      return res.json({ status: 'friends' });
    }

    const sentRequest = requests.find(
      r => r.from && r.to && sameId(r.from, currentUserId) && sameId(r.to, targetUserId) && r.status === 'pending'
    );
    if (sentRequest) {
      return res.json({ status: 'request_sent' });
    }

    const receivedRequest = requests.find(
      r => r.from && r.to && sameId(r.from, targetUserId) && sameId(r.to, currentUserId) && r.status === 'pending'
    );
    if (receivedRequest) {
      return res.json({ status: 'request_received' });
    }

    res.json({ status: 'none' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
