const express = require('express');
const cors = require('cors');
const monitoringRoutes = require('./routes/monitoring');

const app = express();

app.use(cors());
app.use(express.json());

// Monitoring routes
app.use('/api/monitoring', monitoringRoutes);

// ... existing code ...

module.exports = app; 