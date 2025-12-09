const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class FileManager {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.outputDir = process.env.OUTPUT_DIR || './outputs';
  }

  /**
   * Generate unique filename using UUID
   * @param {string} originalName - Original filename
   * @returns {string} Unique filename
   */
  generateUniqueFilename(originalName) {
    const ext = path.extname(originalName);
    const uuid = uuidv4();
    const timestamp = Date.now();
    return `${timestamp}-${uuid}${ext}`;
  }

  /**
   * Save file to specified directory
   * @param {Buffer} buffer - File buffer
   * @param {string} filename - Filename
   * @param {string} directory - Target directory (optional)
   * @returns {Promise<string>} Full path to saved file
   */
  async saveFile(buffer, filename, directory = null) {
    try {
      const targetDir = directory || this.uploadDir;
      
      // Ensure directory exists
      await fs.mkdir(targetDir, { recursive: true });
      
      const filepath = path.join(targetDir, filename);
      await fs.writeFile(filepath, buffer);
      
      logger.info(`File saved: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error(`Failed to save file ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Delete file from filesystem
   * @param {string} filepath - Full path to file
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteFile(filepath) {
    try {
      await fs.unlink(filepath);
      logger.info(`File deleted: ${filepath}`);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn(`File not found for deletion: ${filepath}`);
        return false;
      }
      logger.error(`Failed to delete file ${filepath}:`, error);
      throw error;
    }
  }

  /**
   * Get file information including metadata
   * @param {string} filepath - Full path to file
   * @returns {Promise<Object>} File information
   */
  async getFileInfo(filepath) {
    try {
      const stats = await fs.stat(filepath);
      const filename = path.basename(filepath);
      const ext = path.extname(filepath).toLowerCase();
      
      // Determine format from extension
      const formatMap = {
        '.wav': 'wav',
        '.mp3': 'mp3',
        '.mpeg': 'mp3'
      };
      
      const format = formatMap[ext] || 'unknown';
      
      return {
        filename: filename,
        filepath: filepath,
        size: stats.size,
        format: format,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        isFile: stats.isFile()
      };
    } catch (error) {
      logger.error(`Failed to get file info for ${filepath}:`, error);
      throw error;
    }
  }

  /**
   * Clean up old files from directory
   * @param {string} directory - Directory to clean
   * @param {number} maxAge - Maximum age in milliseconds (default: 5 minutes)
   * @returns {Promise<number>} Number of files deleted
   */
  async cleanupOldFiles(directory, maxAge = 5 * 60 * 1000) {
    try {
      // Ensure directory exists
      await fs.mkdir(directory, { recursive: true });
      
      const files = await fs.readdir(directory);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        const filepath = path.join(directory, file);
        
        try {
          const stats = await fs.stat(filepath);
          
          // Only process files, not directories
          if (!stats.isFile()) {
            continue;
          }
          
          const fileAge = now - stats.mtime.getTime();
          
          if (fileAge > maxAge) {
            await this.deleteFile(filepath);
            deletedCount++;
          }
        } catch (error) {
          // Skip files that can't be accessed
          logger.warn(`Skipping file ${filepath} during cleanup:`, error.message);
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleanup completed: ${deletedCount} files deleted from ${directory}`);
      }

      return deletedCount;
    } catch (error) {
      logger.error(`Failed to cleanup directory ${directory}:`, error);
      throw error;
    }
  }

  /**
   * Start automatic cleanup scheduler
   * @param {number} interval - Cleanup interval in milliseconds
   * @returns {NodeJS.Timeout} Interval timer
   */
  startCleanupScheduler(interval = null) {
    const cleanupInterval = interval || parseInt(process.env.CLEANUP_INTERVAL) || 5 * 60 * 1000;
    
    logger.info(`Starting cleanup scheduler with interval: ${cleanupInterval}ms`);
    
    const timer = setInterval(async () => {
      try {
        logger.info('Running scheduled cleanup...');
        const uploadDeleted = await this.cleanupOldFiles(this.uploadDir);
        const outputDeleted = await this.cleanupOldFiles(this.outputDir);
        logger.info(`Scheduled cleanup completed: ${uploadDeleted + outputDeleted} files deleted`);
      } catch (error) {
        logger.error('Scheduled cleanup failed:', error);
      }
    }, cleanupInterval);

    return timer;
  }

  /**
   * Stop cleanup scheduler
   * @param {NodeJS.Timeout} timer - Timer to stop
   */
  stopCleanupScheduler(timer) {
    if (timer) {
      clearInterval(timer);
      logger.info('Cleanup scheduler stopped');
    }
  }
}

module.exports = FileManager;
