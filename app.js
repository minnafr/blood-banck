const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middleware/errorMiddleware');

// Import routes
const userRoutes = require('./routes/userRoutes');
const bloodRoutes = require('./routes/bloodRoutes');
const distributionRoutes = require('./routes/distributionRoutes');
const biologistRoutes = require('./routes/biologistRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Logging middleware in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/users', userRoutes);
app.use('/api/blood', bloodRoutes);
app.use('/api/distribution', distributionRoutes);
app.use('/api/biologists', biologistRoutes);
app.use('/api/stats', statsRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('public'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

module.exports = app;
