const logger = require('../utils/logger');

/**
 * Get audio metadata
 * GET /api/info/:id
 */
const getAudioInfo = async (req, res, next) => {
  try {
    // Get audioId from URL parameter
    const { id: audioId } = req.params;
    
    if (!audioId) {
      return res.status(400).json({
        success: false,
        error: 'audioId diperlukan'
      });
    }

    // Get audio file metadata from app locals
    const audioFiles = req.app.locals.audioFiles || {};
    const audioData = audioFiles[audioId];

    if (!audioData) {
      return res.status(404).json({
        success: false,
        error: 'Audio tidak ditemukan'
      });
    }

    // Prepare metadata response
    const metadata = {
      id: audioId,
      filename: audioData.filename,
      duration: audioData.duration,
      size: audioData.size,
      format: audioData.format,
      status: audioData.status,
      uploadedAt: audioData.uploadedAt
    };

    // Add processing-related fields if available
    if (audioData.status === 'completed') {
      metadata.completedAt = audioData.completedAt;
      metadata.processingTime = audioData.processingTime;
    } else if (audioData.status === 'failed') {
      metadata.failedAt = audioData.failedAt;
      metadata.error = audioData.error;
    }

    logger.info(`Retrieved info for audio: ${audioId}`);

    res.status(200).json({
      success: true,
      data: metadata
    });

  } catch (error) {
    logger.error('Info controller error:', error);
    next(error);
  }
};

module.exports = {
  getAudioInfo
};
