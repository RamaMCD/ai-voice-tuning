const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';

// Mock logger to avoid file writes during tests
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
}));

// Mock Python service to avoid actual Python execution
jest.mock('../../src/services/pythonService', () => {
  return jest.fn().mockImplementation(() => {
    return {
      processAudio: jest.fn().mockResolvedValue('outputs/test-tuned.wav'),
      validateEnvironment: jest.fn().mockResolvedValue(true)
    };
  });
});

describe('Complete Flow Integration Tests', () => {
  let app;
  let uploadedAudioId;
  const testAudioPath = path.join(__dirname, '../fixtures/test-audio.wav');

  beforeAll(async () => {
    app = require('../../src/server');
    
    // Ensure fixtures directory exists
    await fs.mkdir(path.dirname(testAudioPath), { recursive: true });
    
    // Create a minimal valid WAV file for testing
    const wavHeader = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x24, 0x08, 0x00, 0x00, // File size - 8 (2084 bytes)
      0x57, 0x41, 0x56, 0x45, // "WAVE"
      0x66, 0x6D, 0x74, 0x20, // "fmt "
      0x10, 0x00, 0x00, 0x00, // Subchunk1Size (16 for PCM)
      0x01, 0x00,             // AudioFormat (1 for PCM)
      0x01, 0x00,             // NumChannels (1 = mono)
      0x44, 0xAC, 0x00, 0x00, // SampleRate (44100)
      0x88, 0x58, 0x01, 0x00, // ByteRate
      0x02, 0x00,             // BlockAlign
      0x10, 0x00,             // BitsPerSample (16)
      0x64, 0x61, 0x74, 0x61, // "data"
      0x00, 0x08, 0x00, 0x00  // Subchunk2Size (2048 bytes)
    ]);
    
    // Add some audio data (silence)
    const audioData = Buffer.alloc(2048, 0);
    const fullWav = Buffer.concat([wavHeader, audioData]);
    
    await fs.writeFile(testAudioPath, fullWav);
  });

  afterAll(async () => {
    // Cleanup test files
    try {
      await fs.unlink(testAudioPath);
      // Clean up uploads and outputs directories
      const uploadsDir = path.join(__dirname, '../../uploads');
      const outputsDir = path.join(__dirname, '../../outputs');
      
      try {
        const uploadFiles = await fs.readdir(uploadsDir);
        for (const file of uploadFiles) {
          await fs.unlink(path.join(uploadsDir, file));
        }
      } catch (e) {
        // Ignore
      }
      
      try {
        const outputFiles = await fs.readdir(outputsDir);
        for (const file of outputFiles) {
          await fs.unlink(path.join(outputsDir, file));
        }
      } catch (e) {
        // Ignore
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Upload → Process → Download Flow', () => {
    test('should complete full flow: upload audio file', async () => {
      // Step 1: Upload audio file
      const uploadResponse = await request(app)
        .post('/api/upload')
        .attach('audio', testAudioPath)
        .expect(200);

      expect(uploadResponse.body.success).toBe(true);
      expect(uploadResponse.body.data).toBeDefined();
      expect(uploadResponse.body.data.id).toBeDefined();
      expect(uploadResponse.body.data.filename).toBeDefined();
      expect(uploadResponse.body.data.size).toBeGreaterThan(0);
      
      // Store audio ID for next steps
      uploadedAudioId = uploadResponse.body.data.id;
    });

    test('should complete full flow: process uploaded audio', async () => {
      // Step 2: Process the uploaded audio
      const processResponse = await request(app)
        .post('/api/process')
        .send({ audioId: uploadedAudioId })
        .expect(200);

      expect(processResponse.body.success).toBe(true);
      expect(processResponse.body.data).toBeDefined();
      expect(processResponse.body.data.status).toBe('completed');
      expect(processResponse.body.data.outputPath).toBeDefined();
    });

    test('should complete full flow: download processed audio', async () => {
      // Step 3: Download the processed audio
      const downloadResponse = await request(app)
        .get(`/api/download/${uploadedAudioId}`)
        .expect(200);

      expect(downloadResponse.headers['content-type']).toContain('audio');
      expect(downloadResponse.headers['content-disposition']).toContain('tuned');
      expect(downloadResponse.body).toBeDefined();
    });

    test('should complete full flow: get audio info', async () => {
      // Step 4: Get audio information
      const infoResponse = await request(app)
        .get(`/api/info/${uploadedAudioId}`)
        .expect(200);

      expect(infoResponse.body.success).toBe(true);
      expect(infoResponse.body.data).toBeDefined();
      expect(infoResponse.body.data.duration).toBeDefined();
      expect(infoResponse.body.data.size).toBeDefined();
      expect(infoResponse.body.data.format).toBeDefined();
    });
  });

  describe('Record → Process → Download Flow (Simulated)', () => {
    let recordedAudioId;

    test('should handle recorded audio upload', async () => {
      // Simulate recording by uploading a WAV file
      const uploadResponse = await request(app)
        .post('/api/upload')
        .attach('audio', testAudioPath)
        .expect(200);

      expect(uploadResponse.body.success).toBe(true);
      expect(uploadResponse.body.data).toBeDefined();
      
      recordedAudioId = uploadResponse.body.data.id;
    });

    test('should process recorded audio', async () => {
      const processResponse = await request(app)
        .post('/api/process')
        .send({ audioId: recordedAudioId })
        .expect(200);

      expect(processResponse.body.success).toBe(true);
      expect(processResponse.body.data.status).toBe('completed');
    });

    test('should download processed recorded audio', async () => {
      const downloadResponse = await request(app)
        .get(`/api/download/${recordedAudioId}`)
        .expect(200);

      expect(downloadResponse.headers['content-type']).toContain('audio');
    });
  });

  describe('Error Scenarios', () => {
    test('should reject invalid file type', async () => {
      // Create a text file
      const textFilePath = path.join(__dirname, '../fixtures/test.txt');
      await fs.writeFile(textFilePath, 'This is not an audio file');

      const response = await request(app)
        .post('/api/upload')
        .attach('audio', textFilePath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();

      // Cleanup
      await fs.unlink(textFilePath);
    });

    test('should reject file that is too large', async () => {
      // Create a large file (> 10MB)
      const largeFilePath = path.join(__dirname, '../fixtures/large-audio.wav');
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      await fs.writeFile(largeFilePath, largeBuffer);

      const response = await request(app)
        .post('/api/upload')
        .attach('audio', largeFilePath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('terlalu besar');

      // Cleanup
      await fs.unlink(largeFilePath);
    });

    test('should handle processing with invalid audio ID', async () => {
      const response = await request(app)
        .post('/api/process')
        .send({ audioId: 'invalid-id-12345' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should handle download with non-existent audio ID', async () => {
      const response = await request(app)
        .get('/api/download/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should handle processing without audio ID', async () => {
      const response = await request(app)
        .post('/api/process')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should handle upload without file', async () => {
      const response = await request(app)
        .post('/api/upload')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Concurrent Request Handling', () => {
    test('should handle multiple uploads concurrently', async () => {
      const uploadPromises = [];
      
      for (let i = 0; i < 3; i++) {
        uploadPromises.push(
          request(app)
            .post('/api/upload')
            .attach('audio', testAudioPath)
        );
      }

      const responses = await Promise.all(uploadPromises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBeDefined();
      });

      // Verify all IDs are unique
      const ids = responses.map(r => r.body.data.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('End-to-End Flow with Validation', () => {
    test('should complete entire workflow with all validations', async () => {
      // 1. Upload
      const uploadRes = await request(app)
        .post('/api/upload')
        .attach('audio', testAudioPath)
        .expect(200);

      const audioId = uploadRes.body.data.id;
      expect(audioId).toBeDefined();

      // 2. Get info before processing
      const infoBefore = await request(app)
        .get(`/api/info/${audioId}`)
        .expect(200);

      expect(infoBefore.body.data.status).toBe('uploaded');

      // 3. Process
      const processRes = await request(app)
        .post('/api/process')
        .send({ audioId })
        .expect(200);

      expect(processRes.body.data.status).toBe('completed');

      // 4. Get info after processing
      const infoAfter = await request(app)
        .get(`/api/info/${audioId}`)
        .expect(200);

      expect(infoAfter.body.data.status).toBe('completed');

      // 5. Download
      const downloadRes = await request(app)
        .get(`/api/download/${audioId}`)
        .expect(200);

      expect(downloadRes.body).toBeDefined();
      expect(downloadRes.headers['content-disposition']).toContain('tuned');
    });
  });

  describe('API Response Format Validation', () => {
    test('should return consistent response format for upload', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('audio', testAudioPath)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('filename');
      expect(response.body.data).toHaveProperty('size');
      expect(response.body.data).toHaveProperty('format');
    });

    test('should return consistent error format', async () => {
      const response = await request(app)
        .post('/api/process')
        .send({ audioId: 'invalid' })
        .expect(404);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });
});
