const express = require('express');
const multer = require('multer');
const { analyzePlant, checkHealth, refreshWeather } = require('../controllers/analysisController');
const { chat } = require('../controllers/chatController');

const router = express.Router();

// Setup Multer for in-memory image upload handling
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.get('/health', checkHealth);
router.post('/analyze-plant', upload.single('image'), analyzePlant);
router.post('/refresh-weather', express.json(), refreshWeather);
router.post('/chat', express.json(), chat);

module.exports = router;
