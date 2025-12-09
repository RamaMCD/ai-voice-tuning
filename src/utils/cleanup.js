const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

/**
 * Cleanup Scheduler for automatic file cleanup
 * Deletes old files from uploads and outputs directories
 */
class CleanupScheduler {
  constructor(options = {}) {
    this.uploadDir = options.uploadDir || process.env.UPLOAD_DIR || './uploads';
    this.outputDir = options.outputDir || process.env.OUTPUT_DIR || './outputs';
    this.maxAge = options.maxAge || 5 * 60 * 1000; // 5 minutes default
    this.interval = options.interval || 5 * 60 * 1000; // 5 minutes default
    this.timer = null;
    this.isRunning = false;
  }

  /**
   * Check if a file is older than maxAge
   * @param {string} filepath - Full path to file
   * @returns {Promise<boolean>} True if file is old enough to delete
   */
  async isFileOld(filepath) {
    try {
      const stats = await fs.stat(filepath);
      const now = Date.now();
      const fileAge = now - stats.mtime.getTime();
      return fileAge > this.maxAge;
    } catch (error) {
      logger.error(`Failed to check file age for ${filepath}:`, error);
      return false;
    }
  }

  /**
   * Delete a single file
   * @param {string} filepath - Full path to file
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteFile(filepath) {
    try {
      await fs.unlink(filepath);
      logger.info(`Cleanup: Deleted file ${filepath}`);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn(`Cleanup: File not found ${filepath}`);
        return false;
      }
      logger.error(`Cleanup: Failed to delete file ${filepath}:`, error);
      return false;
    }
  }

  /**
   * Clean up old files from a directory
   * @param {string} directory - Directory to clean
   * @returns {Promise<number>} Number of files deleted
   */
  async cleanupDirectory(directory) {
    try {
      // Ensure directory exists
      await fs.mkdir(directory, { recursive: true });
      
      const files = await fs.readdir(directory);
      let deletedCount = 0;

      for (const file of files) {
        const filepath = path.join(directory, file);
        
        try {
          const stats = await fs.stat(filepath);
          
          // Only process files, not directories
          if (!stats.isFile()) {
            continue;
          }
          
          const isOld = await this.isFileOld(filepath);
          
          if (isOld) {
            const deleted = await this.deleteFile(filepath);
            if (deleted) {
              deletedCount++;
            }
          }
        } catch (error) {
          // Skip files that can't be accessed
          logger.warn(`Cleanup: Skipping file ${filepath}:`, error.message);
        }
      }

      return deletedCount;
    } catch (error) {
      logger.error(`Cleanup: Failed to cleanup directory ${directory}:`, error);
      return 0;
    }
  }

  /**
   * Run cleanup on both uploads and outputs directories
   * @returns {Promise<Object>} Cleanup results
   */
  async runCleanup() {
    logger.info('Cleanup: Starting scheduled cleanup...');
    
    const uploadDeleted = await this.cleanupDirectory(this.uploadDir);
    const outputDeleted = await this.cleanupDirectory(this.outputDir);
    
    const totalDeleted = uploadDeleted + outputDeleted;
    
    logger.info(`Cleanup: Completed - ${uploadDeleted} files from uploads, ${outputDeleted} files from outputs (total: ${totalDeleted})`);
    
    return {
      uploadDeleted,
      outputDeleted,
      totalDeleted,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Start the automatic cleanup scheduler
   * @returns {CleanupScheduler} This instance for chaining
   */
  start() {
    if (this.isRunning) {
      logger.warn('Cleanup: Scheduler is already running');
      return this;
    }

    logger.info(`Cleanup: Starting scheduler - interval: ${this.interval}ms, maxAge: ${this.maxAge}ms`);
    
    // Run cleanup immediately on start
    this.runCleanup().catch(error => {
      logger.error('Cleanup: Initial cleanup failed:', error);
    });

    // Schedule periodic cleanup
    this.timer = setInterval(async () => {
      try {
        await this.runCleanup();
      } catch (error) {
        logger.error('Cleanup: Scheduled cleanup failed:', error);
      }
    }, this.interval);

    this.isRunning = true;
    return this;
  }

  /**
   * Stop the automatic cleanup scheduler
   * @returns {CleanupScheduler} This instance for chaining
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Cleanup: Scheduler is not running');
      return this;
    }

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.isRunning = false;
    logger.info('Cleanup: Scheduler stopped');
    return this;
  }

  /**
   * Check if scheduler is running
   * @returns {boolean} True if running
   */
  getStatus() {
    return this.isRunning;
  }
}

module.exports = CleanupScheduler;
