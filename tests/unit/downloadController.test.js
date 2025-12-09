const request = require('supertest');
const app = require('../../src/server');
const fs = require('fs').promises;
const path = require('path');

describe('DownloadController Unit Tests', () => {
  const testOutputDir = path.join(__dirname, '../../outputs');

  beforeAll(async () => {
    // Create test directories
    await fs.mkdir(testOutputDir, { recursive: true });
  });

  afterEach(() => {
    // Clear app locals after each test
    app.locals.audioFiles = {};
  });

  afterAll(async () => {
    // Cleanup test files
    try {
      const outputFiles = await fs.readdir(testOutputDir);
      for (const file of outputFiles) {
        if (file.includes('test-download')) {
          await fs.unlink(path.join(testOutputDir, file));
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('GET /api/download/:id', () => {
    test('should successfully download tuned audio file', async () => {
      // Create a test audio file
      const testAudioId = 'test-audio-123';
      const testOutputPath = path.join(testOutputDir, 'test-download-output.wav');
      
      const wavHeader = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
        0x57, 0x41, 0x56, 0x45, 0x66, 0x6D, 0x74, 0x20,
        0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x44, 0xAC, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00,
        0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61,
        0x00, 0x00, 0x00, 0x00
      ]);
      
      await fs.writeFile(testOutputPath, wavHeader);

      // Register audio in app locals
      app.locals.audioFiles = {
        [testAudioId]: {
          id: testAudioId,
          filename: 'test-audio.wav',
          filepath: path.join(testOutputDir, 'test-audio.wav'),
          status: 'completed',
          outputPath: testOutputPath
        }
      };

      // Request download
      const response = await request(app)
        .get(`/api/download/${testAudioId}`);

      // Verify response
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('audio');
      expect(response.headers['content-disposition']).toBeDefined();
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('tuned');
      expect(Buffer.isBuffer(response.body)).toBe(true);

      // Cleanup
      await fs.unlink(testOutputPath);
    });

    test('should return 404 when audio ID not found', async () => {
      const response = await request(app)
        .get('/api/download/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toContain('tidak ditemukan');
    });

    test('should return 400 when audio not yet processed', async () => {
      const testAudioId = 'test-audio-pending';

      // Register audio with status 'processing'
      app.locals.audioFiles = {
        [testAudioId]: {
          id: testAudioId,
          filename: 'test-audio.wav',
          filepath: path.join(testOutputDir, 'test-audio.wav'),
          status: 'processing'
        }
      };

      const response = await request(app)
        .get(`/api/download/${testAudioId}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toContain('belum selesai diproses');
    });

    test('should return 404 when output file does not exist', async () => {
      const testAudioId = 'test-audio-missing-file';
      const nonexistentPath = path.join(testOutputDir, 'nonexistent-file.wav');

      // Register audio with non-existent output path
      app.locals.audioFiles = {
        [testAudioId]: {
          id: testAudioId,
          filename: 'test-audio.wav',
          filepath: path.join(testOutputDir, 'test-audio.wav'),
          status: 'completed',
          outputPath: nonexistentPath
        }
      };

      const response = await request(app)
        .get(`/api/download/${testAudioId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toContain('tidak ditemukan');
    });

    test('should have correct filename format with "tuned" in it', async () => {
      const testAudioId = 'test-audio-filename';
      const testOutputPath = path.join(testOutputDir, 'test-download-filename.wav');
      
      const wavHeader = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
        0x57, 0x41, 0x56, 0x45, 0x66, 0x6D, 0x74, 0x20,
        0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x44, 0xAC, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00,
        0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61,
        0x00, 0x00, 0x00, 0x00
      ]);
      
      await fs.writeFile(testOutputPath, wavHeader);

      // Register audio with specific filename
      app.locals.audioFiles = {
        [testAudioId]: {
          id: testAudioId,
          filename: 'my-recording.wav',
          filepath: path.join(testOutputDir, 'my-recording.wav'),
          status: 'completed',
          outputPath: testOutputPath
        }
      };

      const response = await request(app)
        .get(`/api/download/${testAudioId}`);

      expect(response.status).toBe(200);
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      expect(contentDisposition).toMatch(/filename=".*tuned.*"/);
      
      // Verify it contains the original filename base
      expect(contentDisposition).toContain('my-recording');
      expect(contentDisposition).toContain('tuned');

      // Cleanup
      await fs.unlink(testOutputPath);
    });

    test('should set proper Content-Type header for audio', async () => {
      const testAudioId = 'test-audio-content-type';
      const testOutputPath = path.join(testOutputDir, 'test-download-content-type.wav');
      
      const wavHeader = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
        0x57, 0x41, 0x56, 0x45, 0x66, 0x6D, 0x74, 0x20,
        0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x44, 0xAC, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00,
        0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61,
        0x00, 0x00, 0x00, 0x00
      ]);
      
      await fs.writeFile(testOutputPath, wavHeader);

      app.locals.audioFiles = {
        [testAudioId]: {
          id: testAudioId,
          filename: 'test.wav',
          filepath: path.join(testOutputDir, 'test.wav'),
          status: 'completed',
          outputPath: testOutputPath
        }
      };

      const response = await request(app)
        .get(`/api/download/${testAudioId}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('audio/wav');
      expect(response.headers['content-length']).toBeDefined();

      // Cleanup
      await fs.unlink(testOutputPath);
    });
  });
});
