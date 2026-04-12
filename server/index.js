// ================================================================
// CIL Youth Development Platform — Backend Server
// Entry point for Express application
// ================================================================

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const { testConnection } = require('./config/database');

// ── Import Routes ────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const participantRoutes  = require('./routes/participants');
const academicRoutes     = require('./routes/academic');
const developmentRoutes  = require('./routes/development');
const tesRoutes          = require('./routes/tes');
const ldcRoutes          = require('./routes/ldcs');
const subjectRoutes      = require('./routes/subjects');
const gradeRoutes        = require('./routes/grades');
const certificationRoutes = require('./routes/certifications');

// ── Initialize App ───────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────────

// Allow React frontend to communicate with backend
app.use(cors({
  origin: [
    'http://localhost:3000',    // React dev server
    'http://localhost:5173',    // Vite dev server
  ],
  credentials: true
}));

// Parse incoming JSON requests
app.use(express.json());

// Parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// ── Request Logger (Development) ────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Health Check ─────────────────────────────────────────────────
// Visit http://localhost:5000/health to verify server is running
app.get('/health', (req, res) => {
  res.json({
    status : 'ok',
    message: 'CIL Youth Platform API is running',
    time   : new Date().toISOString()
  });
});

// ── API Routes ───────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/academic',     academicRoutes);
app.use('/api/development',  developmentRoutes);
app.use('/api/tes',          tesRoutes);
app.use('/api/ldcs',         ldcRoutes);
app.use('/api/subjects',     subjectRoutes);
app.use('/api/grades',        gradeRoutes);
app.use('/api/certifications', certificationRoutes);

// ── 404 Handler ──────────────────────────────────────────────────
// Catches any route that doesn't exist
app.use((req, res) => {
  res.status(404).json({
    error  : 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`
  });
});

// ── Global Error Handler ─────────────────────────────────────────
// Catches any unhandled errors
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error  : 'Internal Server Error',
    message: process.env.NODE_ENV === 'development'
              ? err.message
              : 'Something went wrong'
  });
});

// ── Start Server ─────────────────────────────────────────────────
async function startServer() {
  try {
    // Test database connection before starting
    await testConnection();

    app.listen(PORT, () => {
      console.log('================================================');
      console.log('  CIL Youth Development Platform — API Server  ');
      console.log('================================================');
      console.log(`  Status  : Running`);
      console.log(`  Port    : ${PORT}`);
      console.log(`  Mode    : ${process.env.NODE_ENV}`);
      console.log(`  Health  : http://localhost:${PORT}/health`);
      console.log('================================================');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();