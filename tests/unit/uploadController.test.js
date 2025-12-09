const request = require('supertest');
const fc = require('fast-check');
const fs = require('fs').promises;
const path = require('path');

// Set test environment before requiring app
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.UPLOAD_DIR = './uploads-test';

// Mock logger to avoid file writes during tests
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
}));

describe('Upload Controller Tests', () => {
  let app;
  const testUploadDir = './uploads-test';

  beforeAll(async () => {
    // Create test upload directory
    await fs.mkdir(testUploadDir, { recursive: true });
    app = require('../../src/server');
  });

  afterAll(async () => {
    // Clean up test upload directory
    try {
      const files = await fs.readdir(testUploadDir);
      for (const file of files) {
        await fs.unlink(path.join(testUploadDir, file));
      }
      await fs.rmdir(testUploadDir);
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  afterEach(async () => {
    // Clean up uploaded files after each test
    try {
      const files = await fs.readdir(testUploadDir);
      for (const file of files) {
        await fs.unlink(path.join(testUploadDir, file));
      }
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: ai-voice-tuning, Property 1: Valid audio file acceptance
     * For any audio file with format .wav or .mp3, the system should 
     * successfully accept and store the file on the server
     * Validates: Requirements 1.1
     */
    test('Property 1: Valid audio file acceptance', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            filename: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.wav'),
            mimetype: fc.constantFrom('audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-wav'),
            size: fc.integer({ min: 100, max: 10 * 1024 * 1024 }) // 100 bytes to 10MB
          }),
          async (audioFile) => {
            // Create a test audio file buffer
            const buffer = Buffer.alloc(Math.min(audioFile.size, 1000)); // Use smaller buffer for testing
            
            // Determine file extension based on mimetype
            let extension = '.wav';
            if (audioFile.mimetype.includes('mpeg') || audioFile.mimetype.includes('mp3')) {
              extension = '.mp3';
            }
            const filename = audioFile.filename.replace(/\.(wav|mp3)$/, '') + extension;

            const response = await request(app)
              .post('/api/upload')
              .attach('audio', buffer, {
                filename: filename,
                contentType: audioFile.mimetype
              });

            // Verify response
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.filename).toBe(filename);
            expect(response.body.data.format).toMatch(/^(wav|mp3)$/);
            expect(response.body.data.status).toBe('uploaded');

            // Verify file exists on server
            const files = await fs.readdir(testUploadDir);
            expect(files.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    }, 60000); // Increase timeout for property-based test

    /**
     * Feature: ai-voice-tuning, Property 2: Invalid file type rejection
     * For any file with format other than .wav or .mp3, the system should 
     * reject the file and return an error message
     * Validates: Requirements 1.2
     */
    test('Property 2: Invalid file type rejection', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            filename: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.txt'),
            mimetype: fc.constantFrom(
              'text/plain',
              'application/json',
              'image/jpeg',
              'image/png',
              'video/mp4',
              'application/pdf',
              'text/html',
              'application/octet-stream'
            ),
            size: fc.integer({ min: 100, max: 1000 })
          }),
          async (invalidFile) => {
            // Create a test file buffer
            const buffer = Buffer.alloc(invalidFile.size);

            const response = await request(app)
              .post('/api/upload')
              .attach('audio', buffer, {
                filename: invalidFile.filename,
                contentType: invalidFile.mimetype
              });

            // Verify response indicates rejection
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
            expect(response.body.error).toContain('Format file tidak didukung');

            // Verify no file was saved
            const files = await fs.readdir(testUploadDir);
            expect(files.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    }, 60000); // Increase timeout for property-based test
  });

  describe('Unit Tests', () => {
    test('should successfully upload a valid .wav file', async () => {
      const buffer = Buffer.alloc(1000);
      
      const response = await request(app)
        .post('/api/upload')
        .attach('audio', buffer, {
          filename: 'test-audio.wav',
          contentType: 'audio/wav'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.filename).toBe('test-audio.wav');
      expect(response.body.data.format).toBe('wav');
      expect(response.body.data.id).toBeDefined();
    });

    test('should successfully upload a valid .mp3 file', async () => {
      const buffer = Buffer.alloc(1000);
      
      const response = await request(app)
        .post('/api/upload')
        .attach('audio', buffer, {
          filename: 'test-audio.mp3',
          contentType: 'audio/mpeg'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.filename).toBe('test-audio.mp3');
      expect(response.body.data.format).toBe('mp3');
    });

    test('should reject file larger than 10MB', async () => {
      const largeSize = 11 * 1024 * 1024; // 11MB
      const buffer = Buffer.alloc(largeSize);
      
      const response = await request(app)
        .post('/api/upload')
        .attach('audio', buffer, {
          filename: 'large-audio.wav',
          contentType: 'audio/wav'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('File terlalu besar');
    });

    test('should reject invalid file type (.txt)', async () => {
      const buffer = Buffer.from('This is not an audio file');
      
      const response = await request(app)
        .post('/api/upload')
        .attach('audio', buffer, {
          filename: 'test.txt',
          contentType: 'text/plain'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Format file tidak didukung');
    });

    test('should reject invalid file type (.pdf)', async () => {
      const buffer = Buffer.alloc(1000);
      
      const response = await request(app)
        .post('/api/upload')
        .attach('audio', buffer, {
          filename: 'document.pdf',
          contentType: 'application/pdf'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Format file tidak didukung');
    });

    test('should return error when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/upload');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Tidak ada file yang diunggah');
    });

    test('should include all required metadata in response', async () => {
      const buffer = Buffer.alloc(1000);
      
      const response = await request(app)
        .post('/api/upload')
        .attach('audio', buffer, {
          filename: 'metadata-test.wav',
          contentType: 'audio/wav'
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('filename');
      expect(response.body.data).toHaveProperty('size');
      expect(response.body.data).toHaveProperty('duration');
      expect(response.body.data).toHaveProperty('format');
      expect(response.body.data).toHaveProperty('uploadedAt');
      expect(response.body.data).toHaveProperty('status');
    });
  });
});
