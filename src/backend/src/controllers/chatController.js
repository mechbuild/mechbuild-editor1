const Chat = require('../models/chatModel');
const User = require('../models/userModel');

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    // Check if required fields are present
    if (!receiverId || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Receiver not found'
      });
    }

    // Create new message
    const message = await Chat.create({
      sender: senderId,
      receiver: receiverId,
      content
    });

    res.status(201).json({
      status: 'success',
      data: {
        message
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get messages with a user
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Get messages between current user and specified user
    const messages = await Chat.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'name email')
    .populate('receiver', 'name email');

    res.status(200).json({
      status: 'success',
      data: {
        messages
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  sendMessage,
  getMessages
}; 