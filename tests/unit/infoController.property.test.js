const fc = require('fast-check');
const request = require('supertest');
const app = require('../../src/server');

describe('InfoController Property-Based Tests', () => {
  afterEach(() => {
    // Clean up app locals after each test
    app.locals.audioFiles = {};
  });

  /**
   * Feature: ai-voice-tuning, Property 29: Duration display
   * Feature: ai-voice-tuning, Property 30: File size display
   * Feature: ai-voice-tuning, Property 31: Format display
   * For any uploaded or recorded audio, the system should display 
   * the audio duration, file size, and format
   * Validates: Requirements 9.1, 9.2, 9.3
   */
  test('Properties 29, 30, 31: Audio info display (duration, size, format)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          audioId: fc.uuid(),
          filename: fc.stringOf(
            fc.constantFrom('a', 'b', 'c', '1', '2', '3', '-', '_', '.'),
            { minLength: 5, maxLength: 20 }
          ),
          duration: fc.float({ min: Math.fround(0.1), max: Math.fround(3600), noNaN: true }),
          size: fc.integer({ min: 1000, max: 10 * 1024 * 1024 }),
          format: fc.constantFrom('wav', 'mp3'),
          status: fc.constantFrom('uploaded', 'processing', 'completed', 'failed')
        }),
        async ({ audioId, filename, duration, size, format, status }) => {
          // Register audio file in app locals
          app.locals.audioFiles = app.locals.audioFiles || {};
          app.locals.audioFiles[audioId] = {
            id: audioId,
            filename: filename,
            duration: duration,
            size: size,
            format: format,
            status: status,
            uploadedAt: new Date().toISOString()
          };

          try {
            // Request audio info
            const response = await request(app)
              .get(`/api/info/${audioId}`)
              .timeout(5000);

            // Verify successful response
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();

            const data = response.body.data;

            // Property 29: Duration display
            expect(data.duration).toBeDefined();
            expect(typeof data.duration).toBe('number');
            expect(data.duration).toBe(duration);

            // Property 30: File size display
            expect(data.size).toBeDefined();
            expect(typeof data.size).toBe('number');
            expect(data.size).toBe(size);

            // Property 31: Format display
            expect(data.format).toBeDefined();
            expect(typeof data.format).toBe('string');
            expect(data.format).toBe(format);

            // Verify other required fields are present
            expect(data.id).toBe(audioId);
            expect(data.filename).toBe(filename);
            expect(data.status).toBe(status);
            expect(data.uploadedAt).toBeDefined();

          } finally {
            // Cleanup
            delete app.locals.audioFiles[audioId];
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property test: Info endpoint returns 404 for non-existent audio', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (nonExistentId) => {
          // Ensure the ID doesn't exist
          app.locals.audioFiles = {};

          const response = await request(app)
            .get(`/api/info/${nonExistentId}`)
            .timeout(5000);

          // Verify 404 response
          expect(response.status).toBe(404);
          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property test: Info endpoint includes processing metadata for completed audio', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          audioId: fc.uuid(),
          filename: fc.string({ minLength: 5, maxLength: 20 }),
          duration: fc.float({ min: Math.fround(0.1), max: Math.fround(60), noNaN: true }),
          size: fc.integer({ min: 1000, max: 5 * 1024 * 1024 }),
          format: fc.constantFrom('wav', 'mp3'),
          processingTime: fc.float({ min: Math.fround(0.1), max: Math.fround(30), noNaN: true })
        }),
        async ({ audioId, filename, duration, size, format, processingTime }) => {
          // Register completed audio file in app locals
          app.locals.audioFiles = app.locals.audioFiles || {};
          app.locals.audioFiles[audioId] = {
            id: audioId,
            filename: filename,
            duration: duration,
            size: size,
            format: format,
            status: 'completed',
            uploadedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            processingTime: processingTime
          };

          try {
            const response = await request(app)
              .get(`/api/info/${audioId}`)
              .timeout(5000);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const data = response.body.data;
            
            // Verify processing metadata is included
            expect(data.status).toBe('completed');
            expect(data.completedAt).toBeDefined();
            expect(data.processingTime).toBe(processingTime);

          } finally {
            delete app.locals.audioFiles[audioId];
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
