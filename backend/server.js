const path = require('path');

// Load .env explicitly from the backend root directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors    = require('cors');
const apiRoutes = require('./src/routes/api');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Startup: Validate Environment Variables ───────────────────────────────────
const REQUIRED_KEYS = ['PLANTNET_API_KEY', 'GROQ_API_KEY', 'WEATHER_API_KEY'];
const missingKeys   = REQUIRED_KEYS.filter(k => !process.env[k] || process.env[k].trim() === '');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  🌿 PlantSathi AI — Environment Check');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  .env loaded from: ${path.join(__dirname, '.env')}`);
console.log(`  PLANTNET_API_KEY : ${process.env.PLANTNET_API_KEY ? '✅ Set' : '❌ EMPTY — paste your key'}`);
console.log(`  GROQ_API_KEY     : ${process.env.GROQ_API_KEY     ? '✅ Set' : '❌ EMPTY — paste your key'}`);
console.log(`  WEATHER_API_KEY  : ${process.env.WEATHER_API_KEY  ? '✅ Set' : '⚠️  EMPTY — weather will be skipped'}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!process.env.PLANTNET_API_KEY || process.env.PLANTNET_API_KEY.trim() === '') {
  console.error('❌ FATAL: PLANTNET_API_KEY is empty in backend/.env');
  console.error('   → Open d:\\1m1b\\backend\\.env and set: PLANTNET_API_KEY=<your_key_here>');
  console.error('   → Get your free key at: https://my.plantnet.org/account/api\n');
}

if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.trim() === '') {
  console.error('❌ FATAL: GROQ_API_KEY is empty in backend/.env');
  console.error('   → Open d:\\1m1b\\backend\\.env and set: GROQ_API_KEY=<your_key_here>');
  console.error('   → Get your free key at: https://console.groq.com/keys\n');
}

// ── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://plant-sathi.web-app-dashboard.workers.dev',
  'https://plant-sathi.plant-sathi.workers.dev',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests without an Origin header, such as server-to-server requests.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.options(/.*/, cors());
app.use(express.json({ limit: '20mb' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Health check (lightweight, used by SplashScreen) ──────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ── Health check response shows key status ────────────────────────────────────
app.get('/api/env-status', (req, res) => {
  res.json({
    plantNetConfigured : !!process.env.PLANTNET_API_KEY?.trim(),
    groqConfigured     : !!process.env.GROQ_API_KEY?.trim(),
    weatherConfigured  : !!process.env.WEATHER_API_KEY?.trim(),
    missingKeys        : missingKeys,
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found.` });
});

// ── Central Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const status = err.status || 500;
  console.error(`[${new Date().toISOString()}] ERROR ${status} – ${err.message}`);

  // Give a helpful user-facing message for common API key errors
  let friendlyMessage = err.message;
  if (err.message.includes('PLANTNET_API_KEY') || err.message.includes('GROQ_API_KEY')) {
    friendlyMessage = 'An API key is not configured on the server. Please add your API keys to backend/.env and restart.';
  }

  res.status(status).json({
    success : false,
    message : friendlyMessage,
  });
});

// ── Start server locally ──────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is RUNNING on http://localhost:${PORT}`);

    if (missingKeys.length > 0) {
      console.log(
        `⚠️  ${missingKeys.length} key(s) missing — plant analysis requests will fail until they are configured.\n`
      );
    } else {
      console.log('✅ All API keys configured — ready to analyze plants!\n');
    }
  });
}

module.exports = app;
