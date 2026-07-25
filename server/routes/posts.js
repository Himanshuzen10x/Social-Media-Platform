const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Create post (Supports text, image, and optional poll)
router.post('/', auth, async (req, res) => {
  try {
    const { text, image, poll } = req.body;
    
    let pollData = undefined;
    if (poll && poll.question && Array.isArray(poll.options) && poll.options.length >= 2) {
      pollData = {
        question: poll.question,
        options: poll.options.map(opt => ({
          optionText: typeof opt === 'string' ? opt : opt.optionText,
          votes: []
        }))
      };
    }

    const post = new Post({ user: req.user.id, text, image, poll: pollData });
    await post.save();
    const populatedPost = await Post.findById(post._id)
      .populate('user', 'username profilePic')
      .populate('comments.user', 'username profilePic');
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Vote in a Poll
router.put('/poll/vote/:id', auth, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const userId = req.user.id;

    const post = await Post.findById(req.params.id);
    if (!post || !post.poll || !post.poll.options) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (optionIndex < 0 || optionIndex >= post.poll.options.length) {
      return res.status(400).json({ message: 'Invalid option selected' });
    }

    // Remove user's previous vote from any option
    post.poll.options.forEach(opt => {
      opt.votes = opt.votes.filter(vId => vId.toString() !== userId);
    });

    // Add user vote to the selected option
    post.poll.options[optionIndex].votes.push(userId);

    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate('user', 'username profilePic')
      .populate('comments.user', 'username profilePic');

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get feed (all posts, newest first)
router.get('/feed', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const posts = await Post.find()
      .populate('user', 'username profilePic')
      .populate('comments.user', 'username profilePic')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get friends feed (only friends' posts)
router.get('/friends-feed', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const friendIds = currentUser.friends || [];

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const posts = await Post.find({ user: { $in: friendIds } })
      .populate('user', 'username profilePic')
      .populate('comments.user', 'username profilePic')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's posts
router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .populate('user', 'username profilePic')
      .populate('comments.user', 'username profilePic')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Like / Unlike post
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isLiked = post.likes.includes(req.user.id);

    if (isLiked) {
      post.likes.pull(req.user.id);
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add comment
router.post('/comment/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ user: req.user.id, text: req.body.text });
    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate('user', 'username profilePic')
      .populate('comments.user', 'username profilePic');
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
