const express = require('express');
const router = express.Router();
const { processAudio } = require('../controllers/processController');

// POST /api/process - Process audio with AI pitch correction
router.post('/', processAudio);

module.exports = router;
