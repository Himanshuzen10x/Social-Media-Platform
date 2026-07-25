const express = require('express');
const Event = require('../models/Event');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// 1. Get all events (Forces 3 demo events if count < 3)
router.get('/', auth, async (req, res) => {
  try {
    const count = await Event.countDocuments();

    if (count < 3) {
      const defaultUser = await User.findOne();
      const creatorId = defaultUser ? defaultUser._id : req.user.id;

      const demoEvents = [
        {
          title: 'Annual Tech Hackathon 2024',
          organizer: 'GCET Coding Club',
          category: 'Tech',
          date: 'NOV 05, 2024',
          time: '10:00 AM - 5:00 PM',
          location: 'Main Computer Center & Lab 3',
          description: 'Join us for a 24-hour coding challenge! Build web apps, AI prototypes, or mobile solutions. Cash prizes worth ₹50,000 for top 3 teams. Free snacks, coffee, and certificates for all participants!',
          createdBy: creatorId,
          attendees: [creatorId]
        },
        {
          title: 'Campus Night & Cultural Music Fest',
          organizer: 'GCET Student Council',
          category: 'Cultural',
          date: 'NOV 12, 2024',
          time: '6:00 PM',
          location: 'Open Air Auditorium & Central Ground',
          description: 'An unforgettable night of live band performances, dance competitions, beatboxing, and food stalls! Special guest DJ performance starts at 8:00 PM. Bring your student IDs for entry.',
          createdBy: creatorId,
          attendees: [creatorId]
        },
        {
          title: 'Placement Prep & Resume Review Workshop',
          organizer: 'Training & Placement Cell',
          category: 'Academic',
          date: 'NOV 18, 2024',
          time: '2:30 PM',
          location: 'Seminar Hall B, Block 2',
          description: 'Learn how to optimize your LinkedIn profile, crack technical interviews, and build a resume that gets shortlisted by top tech companies. Q&A session with alumni software engineers!',
          createdBy: creatorId,
          attendees: [creatorId]
        }
      ];

      await Event.insertMany(demoEvents);
    }

    const events = await Event.find()
      .populate('createdBy', 'username profilePic')
      .populate('attendees', 'username profilePic')
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Create new event (Admin / Verified Organizers Only)
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Option 2 Permission Check: Only Admins or Verified Organizers
    if (!user.isAdmin && !user.isOrganizer) {
      return res.status(403).json({
        message: 'Permission denied. Only Campus Admins and Verified Organizers can post official notices & events.'
      });
    }

    const { title, description, poster, category, date, time, location, organizer } = req.body;

    const newEvent = new Event({
      title,
      description,
      poster: poster || '',
      category: category || 'General',
      date,
      time,
      location,
      organizer: organizer || 'Campus Official',
      createdBy: req.user.id,
      attendees: [req.user.id]
    });

    const savedEvent = await newEvent.save();
    const populatedEvent = await Event.findById(savedEvent._id)
      .populate('createdBy', 'username profilePic')
      .populate('attendees', 'username profilePic');

    res.status(201).json(populatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Toggle RSVP / Attending Event (Any logged in student)
router.put('/rsvp/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const userId = req.user.id;
    const isAttending = event.attendees.includes(userId);

    if (isAttending) {
      event.attendees.pull(userId);
    } else {
      event.attendees.push(userId);
    }

    await event.save();
    const updatedEvent = await Event.findById(req.params.id)
      .populate('createdBy', 'username profilePic')
      .populate('attendees', 'username profilePic');

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Delete event (Admin / Creator)
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const user = await User.findById(req.user.id);
    if (event.createdBy.toString() !== req.user.id && !user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
