const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Post = require('../models/Post');
const Message = require('../models/Message');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
      .populate('followers', 'username profilePic')
      .populate('following', 'username profilePic')
      .populate('friends', 'username profilePic');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update profile (bio, profilePic, major, graduating, interests)
router.put('/profile', auth, async (req, res) => {
  try {
    const { bio, profilePic, major, graduating, interests } = req.body;
    
    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;
    if (profilePic !== undefined) updateData.profilePic = profilePic;
    if (major !== undefined) updateData.major = major;
    if (graduating !== undefined) updateData.graduating = graduating;
    if (interests !== undefined) updateData.interests = interests;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// SETTINGS ENDPOINTS

// 1. Update Email, Profile Visibility & Batch Crush Settings
router.put('/settings/account', auth, async (req, res) => {
  try {
    const { email, profileVisibility, batchCrushEnabled } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email && email.trim() !== user.email) {
      const existingEmail = await User.findOne({ email: email.trim(), _id: { $ne: req.user.id } });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email address is already in use by another account' });
      }
      user.email = email.trim();
    }

    if (profileVisibility !== undefined) {
      user.profileVisibility = profileVisibility;
    }

    if (batchCrushEnabled !== undefined) {
      user.batchCrushEnabled = batchCrushEnabled;
    }

    await user.save();
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Change Password
router.put('/settings/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Delete Account Permanently
router.delete('/account', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete user posts, messages, and remove user from other users' friends & followers
    await Post.deleteMany({ user: userId });
    await Message.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] });
    await User.updateMany({}, {
      $pull: {
        friends: userId,
        followers: userId,
        following: userId,
        secretCrushes: userId
      }
    });

    await User.findByIdAndDelete(userId);
    res.json({ message: 'Account permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// SECRET ADMIRER / BATCH CRUSH ENDPOINTS

// Toggle / Add Secret Crush
router.post('/crush/:targetId', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.targetId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: "You cannot crush on yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!targetUser.batchCrushEnabled) {
      return res.status(400).json({ message: 'This user has disabled Batch Crush on their profile' });
    }

    const isAlreadyCrush = currentUser.secretCrushes.some(
      id => id.toString() === targetUserId
    );

    if (isAlreadyCrush) {
      currentUser.secretCrushes.pull(targetUserId);
      await currentUser.save();
      return res.json({ isMatch: false, status: 'removed', isCrush: false });
    }

    currentUser.secretCrushes.push(targetUserId);

    const isMutualMatch = targetUser.secretCrushes.some(
      id => id.toString() === currentUserId
    );

    if (isMutualMatch) {
      const existingCurrentMatch = currentUser.crushMatches.find(
        m => m.user.toString() === targetUserId
      );
      if (!existingCurrentMatch) {
        currentUser.crushMatches.push({ user: targetUserId, seen: true });
      }

      const existingTargetMatch = targetUser.crushMatches.find(
        m => m.user.toString() === currentUserId
      );
      if (!existingTargetMatch) {
        targetUser.crushMatches.push({ user: currentUserId, seen: false });
      }

      if (!currentUser.friends.includes(targetUserId)) {
        currentUser.friends.push(targetUserId);
      }
      if (!targetUser.friends.includes(currentUserId)) {
        targetUser.friends.push(currentUserId);
      }

      await currentUser.save();
      await targetUser.save();

      return res.json({
        isMatch: true,
        isCrush: true,
        matchedUser: {
          _id: targetUser._id,
          username: targetUser.username,
          profilePic: targetUser.profilePic
        }
      });
    } else {
      await currentUser.save();
      return res.json({ isMatch: false, isCrush: true, status: 'saved_secretly' });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch Unseen Mutual Matches
router.get('/unseen-matches', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('crushMatches.user', 'username profilePic');

    if (!user) return res.status(404).json({ message: 'User not found' });

    const unseenMatches = user.crushMatches.filter(m => !m.seen && m.user);
    res.json(unseenMatches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark Mutual Match as Seen
router.post('/mark-match-seen/:matchedUserId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const matchItem = user.crushMatches.find(
      m => m.user.toString() === req.params.matchedUserId
    );

    if (matchItem) {
      matchItem.seen = true;
      await user.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Follow / Unfollow user
router.put('/follow/:id', auth, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) return res.status(404).json({ message: 'User not found' });

    const isFollowing = currentUser.following.includes(req.params.id);

    if (isFollowing) {
      currentUser.following.pull(req.params.id);
      userToFollow.followers.pull(req.user.id);
    } else {
      currentUser.following.push(req.params.id);
      userToFollow.followers.push(req.user.id);
    }

    await currentUser.save();
    await userToFollow.save();

    res.json({ message: isFollowing ? 'Unfollowed' : 'Followed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search users
router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = { username: { $regex: search, $options: 'i' } };
    }
    const users = await User.find(query).select('-password').limit(20);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
