import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import { securityMiddleware } from './middleware/security.js';
import errorHandler from './middleware/errorHandler.js';
import config from './config/index.js';

console.log('1. Starting server initialization...');

const app = express();
console.log('2. Express app created');

// Basic middleware
try {
  console.log('3. Setting up middleware...');
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors(config.corsOptions));
  app.use(morgan('dev'));
  console.log('4. Basic middleware setup complete');
} catch (err) {
  console.error('Middleware setup error:', err);
  process.exit(1);
}

// Security middleware
try {
  console.log('5. Setting up security middleware...');
  app.use(...securityMiddleware);
  console.log('6. Security middleware setup complete');
} catch (err) {
  console.error('Security middleware setup error:', err);
  process.exit(1);
}

// Basic route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling - moved after routes
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  console.log('7. Attempting to connect to MongoDB Atlas...');
  try {
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      w: 'majority'
    };

    await mongoose.connect(config.mongoUri, options);
    console.log('8. MongoDB Atlas connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB disconnection:', err);
        process.exit(1);
      }
    });

  } catch (err) {
    console.error('MongoDB Atlas connection error:', err);
    // Hata durumunda 5 saniye bekle ve tekrar dene
    setTimeout(() => {
      console.log('Retrying MongoDB connection...');
      connectDB();
    }, 5000);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();
    console.log('9. Starting HTTP server...');
    const PORT = config.port;
    const server = app.listen(PORT, () => {
      console.log(`10. Server running on port ${PORT}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port.`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
};

console.log('Starting server...');
startServer();
