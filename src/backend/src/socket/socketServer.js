const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

    // Join user's personal room
    socket.join(socket.userId);

    // Handle private messages
    socket.on('private message', async ({ to, message }) => {
      try {
        const receiverSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.userId.toString() === to);

        if (receiverSocket) {
          io.to(to).emit('private message', {
            from: socket.userId,
            message
          });
        }
      } catch (error) {
        console.error('Socket message error:', error);
      }
    });

    // Handle typing indicator
    socket.on('typing', ({ to }) => {
      io.to(to).emit('typing', { from: socket.userId });
    });

    // Handle stop typing
    socket.on('stop typing', ({ to }) => {
      io.to(to).emit('stop typing', { from: socket.userId });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
    });
  });

  return io;
};

module.exports = initializeSocket; 