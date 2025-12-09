const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Create upload directory if it doesn't exist
fs.mkdir(uploadDir, { recursive: true }).catch(err => {
  logger.error('Failed to create upload directory:', err);
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname;
    const uniqueName = `${timestamp}-${originalName}`;
    cb(null, uniqueName);
  }
});

// File filter for MIME type validation
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-wav', 'audio/webm', 'audio/ogg'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Format file tidak didukung. Gunakan .wav, .mp3, atau .webm');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// Helper function to get audio duration (placeholder - will be enhanced later)
async function getAudioDuration(filepath) {
  // For now, return 0. This will be properly implemented when we add audio metadata extraction
  return 0;
}

// Helper function to get file format from mimetype
function getFormatFromMimetype(mimetype) {
  const mimeToFormat = {
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg'
  };
  return mimeToFormat[mimetype] || 'unknown';
}

// Upload handler
const handleUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Tidak ada file yang diunggah'
      });
    }

    const file = req.file;
    const audioId = uuidv4();
    const duration = await getAudioDuration(file.path);
    const format = getFormatFromMimetype(file.mimetype);

    // Prepare response data
    const audioMetadata = {
      id: audioId,
      filename: file.originalname,
      size: file.size,
      duration: duration,
      format: format,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded'
    };

    // Store metadata in memory (in production, use database)
    // For now, we'll attach it to the file object
    req.app.locals.audioFiles = req.app.locals.audioFiles || {};
    req.app.locals.audioFiles[audioId] = {
      ...audioMetadata,
      filepath: file.path,
      storedFilename: file.filename
    };

    logger.info(`File uploaded successfully: ${file.originalname} (${audioId})`);

    res.status(200).json({
      success: true,
      data: audioMetadata
    });

  } catch (error) {
    logger.error('Upload error:', error);
    next(error);
  }
};

module.exports = {
  upload,
  handleUpload
};
