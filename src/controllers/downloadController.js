const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

/**
 * Download tuned audio file
 * GET /api/download/:id
 */
const downloadAudio = async (req, res, next) => {
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

    // Check if audio has been processed
    if (audioData.status !== 'completed' || !audioData.outputPath) {
      return res.status(400).json({
        success: false,
        error: 'Audio belum selesai diproses'
      });
    }

    // Check if output file exists
    try {
      await fs.access(audioData.outputPath);
    } catch (error) {
      logger.error(`Output file not found: ${audioData.outputPath}`);
      return res.status(404).json({
        success: false,
        error: 'File hasil tuning tidak ditemukan'
      });
    }

    // Get file stats for Content-Length header
    const stats = await fs.stat(audioData.outputPath);
    
    // Generate filename with "tuned" in it
    const originalFilename = path.basename(audioData.filename, path.extname(audioData.filename));
    const extension = path.extname(audioData.outputPath);
    const downloadFilename = `${originalFilename}-tuned${extension}`;

    // Set proper headers
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);

    logger.info(`Streaming download for audio: ${audioId}`);

    // Stream file to response
    const fileStream = require('fs').createReadStream(audioData.outputPath);
    
    fileStream.on('error', (error) => {
      logger.error(`Error streaming file ${audioData.outputPath}:`, error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Gagal mengunduh file'
        });
      }
    });

    fileStream.pipe(res);

  } catch (error) {
    logger.error('Download controller error:', error);
    next(error);
  }
};

module.exports = {
  downloadAudio
};
