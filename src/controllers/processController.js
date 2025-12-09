const PythonService = require('../services/pythonService');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

const pythonService = new PythonService();

/**
 * Process audio with AI pitch correction
 * POST /api/process
 */
const processAudio = async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    // Validate audioId from request body
    const { audioId } = req.body;
    
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

    // Check if file exists
    try {
      await fs.access(audioData.filepath);
    } catch (error) {
      logger.error(`Audio file not found: ${audioData.filepath}`);
      return res.status(404).json({
        success: false,
        error: 'File audio tidak ditemukan di server'
      });
    }

    // Update status to processing
    audioData.status = 'processing';
    logger.info(`Starting audio processing for: ${audioId}`);

    try {
      // Call Python service to process audio
      const outputPath = await pythonService.processAudio(audioData.filepath);
      
      // Calculate processing time
      const processingTime = (Date.now() - startTime) / 1000; // in seconds

      // Update status to completed
      audioData.status = 'completed';
      audioData.outputPath = outputPath;
      audioData.processingTime = processingTime;
      audioData.completedAt = new Date().toISOString();

      logger.info(`Audio processing completed for ${audioId} in ${processingTime}s`);

      // Return success response
      res.status(200).json({
        success: true,
        data: {
          id: audioId,
          status: 'completed',
          outputPath: outputPath,
          processingTime: processingTime
        }
      });

    } catch (processingError) {
      // Update status to failed
      audioData.status = 'failed';
      audioData.error = processingError.message;
      audioData.failedAt = new Date().toISOString();

      logger.error(`Audio processing failed for ${audioId}: ${processingError.message}`);

      // Return error response
      res.status(500).json({
        success: false,
        error: `Gagal memproses audio: ${processingError.message}`
      });
    }

  } catch (error) {
    logger.error('Process controller error:', error);
    next(error);
  }
};

module.exports = {
  processAudio
};
