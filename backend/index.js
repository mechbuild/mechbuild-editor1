require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { errorHandler } = require('./middleware/error');
const adminRoutes = require('./routes/admin');
const fileRoutes = require('./routes/files');
const authRoutes = require('./routes/auth');
const backupRoutes = require('./routes/backup');
const subscriptionRoutes = require('./routes/subscription');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Error handling
app.use(errorHandler);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB bağlantısı başarılı'))
.catch(err => console.error('MongoDB bağlantı hatası:', err));

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
}); 