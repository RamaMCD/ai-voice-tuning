const fs = require('fs').promises;
const path = require('path');
const CleanupScheduler = require('../../src/utils/cleanup');

describe('CleanupScheduler', () => {
  let cleanupScheduler;
  let testUploadDir;
  let testOutputDir;

  beforeEach(async () => {
    // Create unique test directories to avoid conflicts with other tests
    const timestamp = Date.now();
    testUploadDir = path.join(__dirname, `../fixtures/cleanup-test-uploads-${timestamp}`);
    testOutputDir = path.join(__dirname, `../fixtures/cleanup-test-outputs-${timestamp}`);
    
    await fs.mkdir(testUploadDir, { recursive: true });
    await fs.mkdir(testOutputDir, { recursive: true });

    // Initialize cleanup scheduler with test directories
    cleanupScheduler = new CleanupScheduler({
      uploadDir: testUploadDir,
      outputDir: testOutputDir,
      maxAge: 100, // 100ms for testing
      interval: 200 // 200ms for testing
    });
  });

  afterEach(async () => {
    // Stop scheduler if running
    if (cleanupScheduler) {
      cleanupScheduler.stop();
    }

    // Clean up test directories
    try {
      const uploadFiles = await fs.readdir(testUploadDir);
      for (const file of uploadFiles) {
        await fs.unlink(path.join(testUploadDir, file));
      }
      await fs.rmdir(testUploadDir);
    } catch (error) {
      // Ignore errors
    }

    try {
      const outputFiles = await fs.readdir(testOutputDir);
      for (const file of outputFiles) {
        await fs.unlink(path.join(testOutputDir, file));
      }
      await fs.rmdir(testOutputDir);
    } catch (error) {
      // Ignore errors
    }
  });

  describe('File Age Detection', () => {
    test('should detect old files correctly', async () => {
      // Create a test file
      const testFile = path.join(testUploadDir, 'old-file.txt');
      await fs.writeFile(testFile, 'test content');

      // Wait for file to become old (> 100ms)
      await new Promise(resolve => setTimeout(resolve, 150));

      const isOld = await cleanupScheduler.isFileOld(testFile);
      expect(isOld).toBe(true);
    });

    test('should detect new files correctly', async () => {
      // Create a test file
      const testFile = path.join(testUploadDir, 'new-file.txt');
      await fs.writeFile(testFile, 'test content');

      // Check immediately (< 100ms)
      const isOld = await cleanupScheduler.isFileOld(testFile);
      expect(isOld).toBe(false);
    });

    test('should return false for non-existent files', async () => {
      const nonExistentFile = path.join(testUploadDir, 'does-not-exist.txt');
      const isOld = await cleanupScheduler.isFileOld(nonExistentFile);
      expect(isOld).toBe(false);
    });
  });

  describe('File Deletion Logic', () => {
    test('should delete a file successfully', async () => {
      // Create a test file
      const testFile = path.join(testUploadDir, 'delete-me.txt');
      await fs.writeFile(testFile, 'test content');

      // Verify file exists
      let exists = await fs.access(testFile).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Delete file
      const deleted = await cleanupScheduler.deleteFile(testFile);
      expect(deleted).toBe(true);

      // Verify file is deleted
      exists = await fs.access(testFile).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });

    test('should handle deletion of non-existent file', async () => {
      const nonExistentFile = path.join(testUploadDir, 'does-not-exist.txt');
      const deleted = await cleanupScheduler.deleteFile(nonExistentFile);
      expect(deleted).toBe(false);
    });

    test('should delete only old files from directory', async () => {
      // Create old file
      const oldFile = path.join(testUploadDir, 'old-file.txt');
      await fs.writeFile(oldFile, 'old content');

      // Wait for file to become old
      await new Promise(resolve => setTimeout(resolve, 150));

      // Create new file
      const newFile = path.join(testUploadDir, 'new-file.txt');
      await fs.writeFile(newFile, 'new content');

      // Run cleanup
      const deletedCount = await cleanupScheduler.cleanupDirectory(testUploadDir);

      // Should delete only 1 file (the old one)
      expect(deletedCount).toBe(1);

      // Verify old file is deleted
      const oldExists = await fs.access(oldFile).then(() => true).catch(() => false);
      expect(oldExists).toBe(false);

      // Verify new file still exists
      const newExists = await fs.access(newFile).then(() => true).catch(() => false);
      expect(newExists).toBe(true);
    });

    test('should handle empty directory', async () => {
      const deletedCount = await cleanupScheduler.cleanupDirectory(testUploadDir);
      expect(deletedCount).toBe(0);
    });

    test('should skip subdirectories', async () => {
      // Create a subdirectory
      const subDir = path.join(testUploadDir, 'subdir');
      await fs.mkdir(subDir, { recursive: true });

      // Create old file in main directory
      const oldFile = path.join(testUploadDir, 'old-file.txt');
      await fs.writeFile(oldFile, 'old content');

      // Wait for file to become old
      await new Promise(resolve => setTimeout(resolve, 150));

      // Run cleanup
      const deletedCount = await cleanupScheduler.cleanupDirectory(testUploadDir);

      // Should delete only the file, not the directory
      expect(deletedCount).toBe(1);

      // Verify subdirectory still exists
      const subDirExists = await fs.access(subDir).then(() => true).catch(() => false);
      expect(subDirExists).toBe(true);
    });
  });

  describe('Cleanup Execution', () => {
    test('should cleanup both uploads and outputs directories', async () => {
      // Create old files in both directories
      const uploadFile = path.join(testUploadDir, 'upload-old.txt');
      const outputFile = path.join(testOutputDir, 'output-old.txt');
      
      await fs.writeFile(uploadFile, 'upload content');
      await fs.writeFile(outputFile, 'output content');

      // Wait for files to become old
      await new Promise(resolve => setTimeout(resolve, 150));

      // Run cleanup
      const result = await cleanupScheduler.runCleanup();

      expect(result.uploadDeleted).toBe(1);
      expect(result.outputDeleted).toBe(1);
      expect(result.totalDeleted).toBe(2);
      expect(result.timestamp).toBeDefined();

      // Verify files are deleted
      const uploadExists = await fs.access(uploadFile).then(() => true).catch(() => false);
      const outputExists = await fs.access(outputFile).then(() => true).catch(() => false);
      
      expect(uploadExists).toBe(false);
      expect(outputExists).toBe(false);
    });

    test('should return zero when no old files exist', async () => {
      const result = await cleanupScheduler.runCleanup();

      expect(result.uploadDeleted).toBe(0);
      expect(result.outputDeleted).toBe(0);
      expect(result.totalDeleted).toBe(0);
    });
  });

  describe('Scheduler Control', () => {
    test('should start scheduler successfully', () => {
      cleanupScheduler.start();
      expect(cleanupScheduler.getStatus()).toBe(true);
    });

    test('should stop scheduler successfully', () => {
      cleanupScheduler.start();
      expect(cleanupScheduler.getStatus()).toBe(true);

      cleanupScheduler.stop();
      expect(cleanupScheduler.getStatus()).toBe(false);
    });

    test('should not start scheduler twice', () => {
      cleanupScheduler.start();
      const firstStatus = cleanupScheduler.getStatus();

      cleanupScheduler.start(); // Try to start again
      const secondStatus = cleanupScheduler.getStatus();

      expect(firstStatus).toBe(true);
      expect(secondStatus).toBe(true);
    });

    test('should handle stop when not running', () => {
      expect(cleanupScheduler.getStatus()).toBe(false);
      cleanupScheduler.stop();
      expect(cleanupScheduler.getStatus()).toBe(false);
    });

    test('should run cleanup periodically', async () => {
      // Create old file
      const testFile = path.join(testUploadDir, 'periodic-test.txt');
      await fs.writeFile(testFile, 'test content');

      // Wait for file to become old
      await new Promise(resolve => setTimeout(resolve, 150));

      // Start scheduler
      cleanupScheduler.start();

      // Wait for at least one cleanup cycle (200ms interval + buffer)
      await new Promise(resolve => setTimeout(resolve, 300));

      // Stop scheduler
      cleanupScheduler.stop();

      // Verify file was deleted
      const exists = await fs.access(testFile).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle cleanup errors gracefully', async () => {
      // Use non-existent directory
      const invalidScheduler = new CleanupScheduler({
        uploadDir: '/invalid/path/that/does/not/exist',
        outputDir: testOutputDir,
        maxAge: 100
      });

      // Should not throw error
      const result = await invalidScheduler.runCleanup();
      
      // Should return 0 for invalid directory
      expect(result.uploadDeleted).toBe(0);
      expect(result.totalDeleted).toBeGreaterThanOrEqual(0);
    });
  });
});
