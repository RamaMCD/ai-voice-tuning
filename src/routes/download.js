const express = require('express');
const router = express.Router();
const { downloadAudio } = require('../controllers/downloadController');

// GET /api/download/:id - Download tuned audio file
router.get('/:id', downloadAudio);

module.exports = router;
