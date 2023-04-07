require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user');
const linkRoutes = require('./routes/link');
const errorHandler = require('./middleware/errorHandler');
const sequelize = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/links', linkRoutes);

// Error handler
app.use(errorHandler);

// Start the server
(async () => {
  try {
    await sequelize.sync();
    console.log('Database synchronized');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
})();