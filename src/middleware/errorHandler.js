const logger = require('../utils/logger');
const multer = require('multer');

/**
 * Error handler middleware
 * Handles all errors and sends appropriate responses to clients
 * Logs errors to file for debugging
 */
function errorHandler(err, req, res, next) {
  // Log error details
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File terlalu besar. Maksimal 10MB'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Field file tidak sesuai'
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // Handle file filter errors (invalid file type)
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // Handle custom validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // Handle file not found errors
  if (err.code === 'ENOENT') {
    return res.status(404).json({
      success: false,
      error: 'File tidak ditemukan'
    });
  }

  // Handle disk space errors
  if (err.code === 'ENOSPC') {
    return res.status(507).json({
      success: false,
      error: 'Server kehabisan storage'
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Terjadi kesalahan server'
  });
}

module.exports = errorHandler;
