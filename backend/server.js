require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/support', require('./routes/support'));
app.use('/api/flashcards', require('./routes/flashcards'));
app.use('/api/papers', require('./routes/papers'));
app.use('/api/bookmarks', require('./routes/bookmarks'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ECET Crack API is running! 🚀', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('<h1>🚀 ECET Crack API is LIVE!</h1><p>Append /api/health to see server status.</p>');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
// Port
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n🚀 ECET Crack API Server running on port ${PORT}`);
    console.log(`📚 Health Check: http://localhost:${PORT}/api/health\n`);
  });
}

// Export the Express API for Vercel Serverless Functions
module.exports = app;
