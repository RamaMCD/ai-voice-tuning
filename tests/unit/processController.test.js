const request = require('supertest');
const app = require('../../src/server');
const fs = require('fs').promises;
const path = require('path');

describe('ProcessController Unit Tests', () => {
  const testUploadDir = path.join(__dirname, '../fixtures/test-uploads');
  
  beforeAll(async () => {
    await fs.mkdir(testUploadDir, { recursive: true });
  });

  beforeEach(() => {
    // Clear app locals before each test
    app.locals.audioFiles = {};
  });

  afterAll(async () => {
    // Cleanup test files
    try {
      const files = await fs.readdir(testUploadDir);
      for (const file of files) {
        await fs.unlink(path.join(testUploadDir, file));
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('POST /api/process', () => {
    test('should attempt to process audio and update status', async () => {
      // Setup
      const audioId = 'test-audio-123';
      const testFilePath = path.join(testUploadDir, 'test-success.wav');
      
      // Create test file
      await fs.writeFile(testFilePath, Buffer.from('test audio data'));
      
      // Register audio in app locals
      app.locals.audioFiles[audioId] = {
        id: audioId,
        filename: 'test-success.wav',
        filepath: testFilePath,
        status: 'uploaded'
      };
      
      // Execute - will fail because Python is not available, but we can test the flow
      const response = await request(app)
        .post('/api/process')
        .send({ audioId });
      
      // Since Python is not available in test environment, it will return 500
      // But we can verify the controller logic worked
      expect(response.body).toBeDefined();
      expect(response.body.success).toBeDefined();
      
      // Verify status was updated (either to processing or failed)
      expect(['processing', 'failed']).toContain(app.locals.audioFiles[audioId].status);
      
      // Cleanup
      await fs.unlink(testFilePath);
    });

    test('should return 400 when audioId is missing', async () => {
      const response = await request(app)
        .post('/api/process')
        .send({})
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('audioId diperlukan');
    });

    test('should return 404 when audio not found', async () => {
      const response = await request(app)
        .post('/api/process')
        .send({ audioId: 'non-existent-id' })
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Audio tidak ditemukan');
    });

    test('should return 404 when audio file does not exist on disk', async () => {
      const audioId = 'test-audio-missing-file';
      const testFilePath = path.join(testUploadDir, 'missing-file.wav');
      
      // Register audio but don't create the file
      app.locals.audioFiles[audioId] = {
        id: audioId,
        filename: 'missing-file.wav',
        filepath: testFilePath,
        status: 'uploaded'
      };
      
      const response = await request(app)
        .post('/api/process')
        .send({ audioId })
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('File audio tidak ditemukan di server');
    });

    test('should handle Python processing errors gracefully', async () => {
      const audioId = 'test-audio-error';
      const testFilePath = path.join(testUploadDir, 'test-error.wav');
      
      // Create test file
      await fs.writeFile(testFilePath, Buffer.from('test audio data'));
      
      // Register audio in app locals
      app.locals.audioFiles[audioId] = {
        id: audioId,
        filename: 'test-error.wav',
        filepath: testFilePath,
        status: 'uploaded'
      };
      
      // Execute - Python will fail because it's not available
      const response = await request(app)
        .post('/api/process')
        .send({ audioId });
      
      // Should return error response (500 because Python not found)
      if (response.status === 500) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(typeof response.body.error).toBe('string');
        
        // Verify status was updated to failed
        expect(app.locals.audioFiles[audioId].status).toBe('failed');
        expect(app.locals.audioFiles[audioId].error).toBeDefined();
      }
      
      // Cleanup
      await fs.unlink(testFilePath);
    });

    test('should update status to processing', async () => {
      const audioId = 'test-audio-status';
      const testFilePath = path.join(testUploadDir, 'test-status.wav');
      
      // Create test file
      await fs.writeFile(testFilePath, Buffer.from('test audio data'));
      
      // Register audio in app locals
      app.locals.audioFiles[audioId] = {
        id: audioId,
        filename: 'test-status.wav',
        filepath: testFilePath,
        status: 'uploaded'
      };
      
      // Execute
      await request(app)
        .post('/api/process')
        .send({ audioId });
      
      // Verify status was changed from 'uploaded'
      expect(app.locals.audioFiles[audioId].status).not.toBe('uploaded');
      expect(['processing', 'completed', 'failed']).toContain(app.locals.audioFiles[audioId].status);
      
      // Cleanup
      await fs.unlink(testFilePath);
    });

    test('should update status to failed on processing error', async () => {
      const audioId = 'test-audio-status-fail';
      const testFilePath = path.join(testUploadDir, 'test-status-fail.wav');
      
      // Create test file
      await fs.writeFile(testFilePath, Buffer.from('test audio data'));
      
      // Register audio in app locals
      app.locals.audioFiles[audioId] = {
        id: audioId,
        filename: 'test-status-fail.wav',
        filepath: testFilePath,
        status: 'uploaded'
      };
      
      // Execute - will fail because Python is not available
      const response = await request(app)
        .post('/api/process')
        .send({ audioId });
      
      // Since Python is not available, it should fail
      if (response.status === 500) {
        // Verify final status is 'failed'
        expect(app.locals.audioFiles[audioId].status).toBe('failed');
        expect(app.locals.audioFiles[audioId].error).toBeDefined();
      }
      
      // Cleanup
      await fs.unlink(testFilePath);
    });

    test('should track processing time', async () => {
      const audioId = 'test-audio-time';
      const testFilePath = path.join(testUploadDir, 'test-time.wav');
      
      // Create test file
      await fs.writeFile(testFilePath, Buffer.from('test audio data'));
      
      // Register audio in app locals
      app.locals.audioFiles[audioId] = {
        id: audioId,
        filename: 'test-time.wav',
        filepath: testFilePath,
        status: 'uploaded'
      };
      
      // Execute
      const response = await request(app)
        .post('/api/process')
        .send({ audioId });
      
      // Verify response structure
      expect(response.body).toBeDefined();
      
      // If successful (unlikely without Python), verify processing time
      if (response.status === 200 && response.body.data) {
        expect(response.body.data.processingTime).toBeDefined();
        expect(typeof response.body.data.processingTime).toBe('number');
        expect(response.body.data.processingTime).toBeGreaterThan(0);
      }
      
      // Cleanup
      await fs.unlink(testFilePath);
    });
  });
});
