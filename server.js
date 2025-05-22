const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const bloodBagRoutes = require('./routes/bloodBag.routes');
const distributionRoutes = require('./routes/distribution.routes');
const componentRoutes = require('./routes/component.routes');
const statisticsRoutes = require('./routes/statistics.routes');
const userRoutes = require('./routes/user.routes');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/blood-bags', bloodBagRoutes);
app.use('/api/distribution', distributionRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/users', userRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Blood Bank Management System API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});