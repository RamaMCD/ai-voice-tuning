const express = require('express');
const router = express.Router();
const { getAudioInfo } = require('../controllers/infoController');

// GET /api/info/:id - Get audio metadata
router.get('/:id', getAudioInfo);

module.exports = router;
