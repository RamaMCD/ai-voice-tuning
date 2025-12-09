const express = require('express');
const router = express.Router();
const { upload, handleUpload } = require('../controllers/uploadController');

// POST /api/upload - Upload audio file
router.post('/', upload.single('audio'), handleUpload);

module.exports = router;
