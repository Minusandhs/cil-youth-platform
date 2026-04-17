// ================================================================
// CIL Youth Development Platform — Backend Server
// Entry point for Express application
// ================================================================

require('dotenv').config();
const express         = require('express');
const cors            = require('cors');
const helmet          = require('helmet');
const rateLimit       = require('express-rate-limit');
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
const schoolGradeRoutes  = require('./routes/schoolGrades');
const constantsRoutes    = require('./routes/constants');
const { verifyConnection } = require('./config/email');

// ── Initialize App ───────────────────────────────────────────────
const app  = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// ── Security Middleware ──────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({ origin: allowedOrigins, credentials: true }));

// ── Rate Limiters ─────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs : 15 * 60 * 1000, // 15 minutes
  max      : 20,              // max 20 login attempts per window
  message  : { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders  : false,
});

const syncLimiter = rateLimit({
  windowMs : 60 * 60 * 1000, // 1 hour
  max      : 10,              // max 10 sync uploads per hour
  message  : { error: 'Too many sync requests. Please wait before uploading again.' },
  standardHeaders: true,
  legacyHeaders  : false,
});

// ── Body Parsers ──────────────────────────────────────────────────
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
app.use('/api/auth/login',            loginLimiter);
app.use('/api/participants/sync',     syncLimiter);
app.use('/api/constants',             constantsRoutes);
app.use('/api/auth',                  authRoutes);
app.use('/api/participants',          participantRoutes);
app.use('/api/academic',     academicRoutes);
app.use('/api/development',  developmentRoutes);
app.use('/api/tes',          tesRoutes);
app.use('/api/ldcs',         ldcRoutes);
app.use('/api/subjects',     subjectRoutes);
app.use('/api/grades',        gradeRoutes);
app.use('/api/school-grades', schoolGradeRoutes);
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

    // Verify Email service
    await verifyConnection();

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