const fc = require('fast-check');
const fs = require('fs').promises;
const path = require('path');
const FileManager = require('../../src/services/fileManager');

describe('FileManager', () => {
  let fileManager;
  let testDir;

  beforeEach(async () => {
    fileManager = new FileManager();
    testDir = path.join(__dirname, '../fixtures/test-files');
    
    // Clean up any existing files and subdirectories first
    try {
      const entries = await fs.readdir(testDir);
      for (const entry of entries) {
        const entryPath = path.join(testDir, entry);
        const stats = await fs.stat(entryPath);
        if (stats.isDirectory()) {
          // Recursively remove subdirectory
          const subFiles = await fs.readdir(entryPath);
          for (const subFile of subFiles) {
            await fs.unlink(path.join(entryPath, subFile));
          }
          await fs.rmdir(entryPath);
        } else {
          await fs.unlink(entryPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist yet, that's fine
    }
    
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      const files = await fs.readdir(testDir);
      for (const file of files) {
        await fs.unlink(path.join(testDir, file));
      }
      await fs.rmdir(testDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Property 15: Temporary file cleanup', () => {
    /**
     * Feature: ai-voice-tuning, Property 15: Temporary file cleanup
     * For any tuned audio file that has been downloaded, the backend server 
     * should delete the temporary files after 5 minutes
     */
    test('should delete files older than specified age', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              filename: fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9]/g, 'a') + '.txt'),
              // Use ages that are clearly above or below the threshold to avoid boundary issues
              ageInMinutes: fc.integer({ min: 0, max: 10 }).filter(age => age !== 5)
            }),
            { minLength: 1, maxLength: 10 }
          ).map(files => {
            // Ensure unique filenames by adding index
            return files.map((file, index) => ({
              ...file,
              filename: `${index}-${file.filename}`
            }));
          }),
          async (files) => {
            // Clean up test directory before each iteration
            const existingEntries = await fs.readdir(testDir);
            for (const entry of existingEntries) {
              const entryPath = path.join(testDir, entry);
              const stats = await fs.stat(entryPath);
              if (stats.isFile()) {
                await fs.unlink(entryPath);
              }
            }

            // Create test files with different ages
            const createdFiles = [];

            for (const fileSpec of files) {
              const filepath = path.join(testDir, fileSpec.filename);
              await fs.writeFile(filepath, 'test content');
              
              // Set file modification time to simulate age
              const fileAge = fileSpec.ageInMinutes * 60 * 1000;
              const mtime = new Date(Date.now() - fileAge - 1000); // Subtract extra 1 second to ensure age is past the threshold
              await fs.utimes(filepath, mtime, mtime);
              
              createdFiles.push({
                filepath,
                ageInMinutes: fileSpec.ageInMinutes
              });
            }

            // Run cleanup with 5 minute threshold
            const maxAge = 5 * 60 * 1000;
            const deletedCount = await fileManager.cleanupOldFiles(testDir, maxAge);

            // Verify: files STRICTLY older than 5 minutes should be deleted
            const expectedDeleted = createdFiles.filter(f => f.ageInMinutes > 5).length;
            expect(deletedCount).toBe(expectedDeleted);

            // Verify: files younger than or equal to 5 minutes should still exist
            const allEntries = await fs.readdir(testDir);
            const remainingFiles = [];
            for (const entry of allEntries) {
              const entryPath = path.join(testDir, entry);
              const stats = await fs.stat(entryPath);
              if (stats.isFile()) {
                remainingFiles.push(entry);
              }
            }
            const expectedRemaining = createdFiles.filter(f => f.ageInMinutes <= 5).length;
            expect(remainingFiles.length).toBe(expectedRemaining);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should handle empty directories gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 60 }),
          async (maxAgeMinutes) => {
            const maxAge = maxAgeMinutes * 60 * 1000;
            const deletedCount = await fileManager.cleanupOldFiles(testDir, maxAge);
            expect(deletedCount).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests for FileManager', () => {
    describe('generateUniqueFilename', () => {
      test('should generate unique filename with UUID', () => {
        const originalName = 'test-audio.wav';
        const filename1 = fileManager.generateUniqueFilename(originalName);
        const filename2 = fileManager.generateUniqueFilename(originalName);

        expect(filename1).not.toBe(filename2);
        expect(filename1).toMatch(/\.wav$/);
        expect(filename2).toMatch(/\.wav$/);
      });

      test('should preserve file extension', () => {
        const testCases = [
          { input: 'audio.mp3', ext: '.mp3' },
          { input: 'voice.wav', ext: '.wav' },
          { input: 'file.txt', ext: '.txt' }
        ];

        testCases.forEach(({ input, ext }) => {
          const result = fileManager.generateUniqueFilename(input);
          expect(result).toMatch(new RegExp(`${ext.replace('.', '\\.')}$`));
        });
      });
    });

    describe('saveFile', () => {
      test('should save file successfully', async () => {
        const buffer = Buffer.from('test audio data');
        const filename = 'test-save.wav';
        
        const filepath = await fileManager.saveFile(buffer, filename, testDir);
        
        expect(filepath).toBe(path.join(testDir, filename));
        
        const exists = await fs.access(filepath).then(() => true).catch(() => false);
        expect(exists).toBe(true);
        
        const content = await fs.readFile(filepath);
        expect(content.toString()).toBe('test audio data');
      });

      test('should create directory if it does not exist', async () => {
        const buffer = Buffer.from('test data');
        const newDir = path.join(testDir, 'new-subdir');
        const filename = 'test.wav';
        
        const filepath = await fileManager.saveFile(buffer, filename, newDir);
        
        const exists = await fs.access(filepath).then(() => true).catch(() => false);
        expect(exists).toBe(true);
        
        // Cleanup
        await fs.unlink(filepath);
        await fs.rmdir(newDir);
      });
    });

    describe('deleteFile', () => {
      test('should delete existing file', async () => {
        const filepath = path.join(testDir, 'delete-test.txt');
        await fs.writeFile(filepath, 'test content');
        
        const result = await fileManager.deleteFile(filepath);
        
        expect(result).toBe(true);
        
        const exists = await fs.access(filepath).then(() => true).catch(() => false);
        expect(exists).toBe(false);
      });

      test('should return false for non-existent file', async () => {
        const filepath = path.join(testDir, 'non-existent.txt');
        
        const result = await fileManager.deleteFile(filepath);
        
        expect(result).toBe(false);
      });
    });

    describe('getFileInfo', () => {
      test('should return correct file information', async () => {
        const filepath = path.join(testDir, 'info-test.wav');
        const content = 'test audio content';
        await fs.writeFile(filepath, content);
        
        const info = await fileManager.getFileInfo(filepath);
        
        expect(info.filename).toBe('info-test.wav');
        expect(info.filepath).toBe(filepath);
        expect(info.size).toBe(content.length);
        expect(info.format).toBe('wav');
        expect(info.isFile).toBe(true);
        expect(info.createdAt).toBeDefined();
        expect(info.modifiedAt).toBeDefined();
        expect(typeof info.createdAt.getTime).toBe('function');
        expect(typeof info.modifiedAt.getTime).toBe('function');
      });

      test('should detect correct format from extension', async () => {
        const testCases = [
          { filename: 'test.wav', expectedFormat: 'wav' },
          { filename: 'test.mp3', expectedFormat: 'mp3' },
          { filename: 'test.mpeg', expectedFormat: 'mp3' },
          { filename: 'test.txt', expectedFormat: 'unknown' }
        ];

        for (const { filename, expectedFormat } of testCases) {
          const filepath = path.join(testDir, filename);
          await fs.writeFile(filepath, 'test');
          
          const info = await fileManager.getFileInfo(filepath);
          expect(info.format).toBe(expectedFormat);
        }
      });

      test('should throw error for non-existent file', async () => {
        const filepath = path.join(testDir, 'non-existent.wav');
        
        await expect(fileManager.getFileInfo(filepath)).rejects.toThrow();
      });
    });

    describe('cleanupOldFiles', () => {
      test('should delete only old files', async () => {
        const now = Date.now();
        
        // Create old file (10 minutes old)
        const oldFile = path.join(testDir, 'old-file.txt');
        await fs.writeFile(oldFile, 'old');
        const oldTime = new Date(now - 10 * 60 * 1000);
        await fs.utimes(oldFile, oldTime, oldTime);
        
        // Create new file (1 minute old)
        const newFile = path.join(testDir, 'new-file.txt');
        await fs.writeFile(newFile, 'new');
        const newTime = new Date(now - 1 * 60 * 1000);
        await fs.utimes(newFile, newTime, newTime);
        
        // Cleanup files older than 5 minutes
        const deletedCount = await fileManager.cleanupOldFiles(testDir, 5 * 60 * 1000);
        
        expect(deletedCount).toBe(1);
        
        const oldExists = await fs.access(oldFile).then(() => true).catch(() => false);
        const newExists = await fs.access(newFile).then(() => true).catch(() => false);
        
        expect(oldExists).toBe(false);
        expect(newExists).toBe(true);
      });

      test('should return 0 when no files need cleanup', async () => {
        const now = Date.now();
        
        // Create recent file
        const recentFile = path.join(testDir, 'recent.txt');
        await fs.writeFile(recentFile, 'recent');
        const recentTime = new Date(now - 1 * 60 * 1000);
        await fs.utimes(recentFile, recentTime, recentTime);
        
        const deletedCount = await fileManager.cleanupOldFiles(testDir, 5 * 60 * 1000);
        
        expect(deletedCount).toBe(0);
      });

      test('should handle non-existent directory by creating it', async () => {
        const nonExistentDir = path.join(testDir, 'non-existent');
        
        const deletedCount = await fileManager.cleanupOldFiles(nonExistentDir, 5 * 60 * 1000);
        
        expect(deletedCount).toBe(0);
        
        const exists = await fs.access(nonExistentDir).then(() => true).catch(() => false);
        expect(exists).toBe(true);
        
        // Cleanup
        await fs.rmdir(nonExistentDir);
      });
    });
  });
});
