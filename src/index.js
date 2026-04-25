const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');
const complaintRoutes = require('./routes/complaintRoutes');

const app = express();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB - Complaint Service'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'complaint-service' });
});

app.get('/ready', (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.status(200).json({ status: 'ready', service: 'complaint-service', db: 'connected' });
  } else {
    res.status(503).json({ status: 'not ready', service: 'complaint-service', db: 'disconnected' });
  }
});

app.use('/api/complaints', complaintRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Complaint Service running on port ${PORT}`);
});
