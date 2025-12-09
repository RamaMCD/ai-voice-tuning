const fc = require('fast-check');
const request = require('supertest');
const app = require('../../src/server');
const fs = require('fs').promises;
const path = require('path');

describe('DownloadController Property-Based Tests', () => {
  const testOutputDir = path.join(__dirname, '../../outputs');

  beforeAll(async () => {
    // Create test directories
    await fs.mkdir(testOutputDir, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup test files
    try {
      const outputFiles = await fs.readdir(testOutputDir);
      for (const file of outputFiles) {
        if (file.includes('test-') || file.includes('tuned')) {
          await fs.unlink(path.join(testOutputDir, file));
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  /**
   * Feature: ai-voice-tuning, Property 13: File download delivery
   * For any download button click, the system should send the tuned audio 
   * file to the user's browser
   * Validates: Requirements 4.2
   */
  test('Property 13: File download delivery', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          audioId: fc.uuid(),
          filename: fc.stringOf(
            fc.constantFrom('a', 'b', 'c', '1', '2', '3', '-', '_'),
            { minLength: 5, maxLength: 15 }
          )
        }),
        async ({ audioId, filename }) => {
          // Create a minimal valid WAV file as tuned output
          const testOutputPath = path.join(testOutputDir, `test-${filename}-tuned.wav`);
          
          const wavHeader = Buffer.from([
            0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
            0x57, 0x41, 0x56, 0x45, 0x66, 0x6D, 0x74, 0x20,
            0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
            0x44, 0xAC, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00,
            0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61,
            0x00, 0x00, 0x00, 0x00
          ]);
          
          await fs.writeFile(testOutputPath, wavHeader);

          // Register completed audio file in app locals
          app.locals.audioFiles = app.locals.audioFiles || {};
          app.locals.audioFiles[audioId] = {
            id: audioId,
            filename: `${filename}.wav`,
            filepath: path.join(testOutputDir, `${filename}.wav`),
            status: 'completed',
            outputPath: testOutputPath
          };

          try {
            // Request download
            const response = await request(app)
              .get(`/api/download/${audioId}`)
              .timeout(10000);

            // Verify successful download
            expect(response.status).toBe(200);
            
            // Verify proper headers are set
            expect(response.headers['content-type']).toContain('audio');
            expect(response.headers['content-disposition']).toBeDefined();
            expect(response.headers['content-disposition']).toContain('attachment');
            
            // Verify file content is delivered
            expect(response.body).toBeDefined();
            expect(Buffer.isBuffer(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            
          } finally {
            // Cleanup
            try {
              await fs.unlink(testOutputPath);
            } catch (e) {
              // Ignore cleanup errors
            }
            delete app.locals.audioFiles[audioId];
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: ai-voice-tuning, Property 14: Tuned filename convention
   * For any downloaded tuned audio file, the filename should contain 
   * the word "tuned"
   * Validates: Requirements 4.3
   */
  test('Property 14: Tuned filename convention', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          audioId: fc.uuid(),
          filename: fc.stringOf(
            fc.constantFrom('a', 'b', 'c', '1', '2', '3', '-', '_'),
            { minLength: 5, maxLength: 15 }
          )
        }),
        async ({ audioId, filename }) => {
          // Create a minimal valid WAV file as tuned output
          const testOutputPath = path.join(testOutputDir, `test-${filename}-tuned.wav`);
          
          const wavHeader = Buffer.from([
            0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
            0x57, 0x41, 0x56, 0x45, 0x66, 0x6D, 0x74, 0x20,
            0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
            0x44, 0xAC, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00,
            0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61,
            0x00, 0x00, 0x00, 0x00
          ]);
          
          await fs.writeFile(testOutputPath, wavHeader);

          // Register completed audio file in app locals
          app.locals.audioFiles = app.locals.audioFiles || {};
          app.locals.audioFiles[audioId] = {
            id: audioId,
            filename: `${filename}.wav`,
            filepath: path.join(testOutputDir, `${filename}.wav`),
            status: 'completed',
            outputPath: testOutputPath
          };

          try {
            // Request download
            const response = await request(app)
              .get(`/api/download/${audioId}`)
              .timeout(10000);

            // Verify successful download
            expect(response.status).toBe(200);
            
            // Verify Content-Disposition header contains "tuned"
            expect(response.headers['content-disposition']).toBeDefined();
            const contentDisposition = response.headers['content-disposition'];
            expect(contentDisposition).toContain('tuned');
            
            // Extract filename from Content-Disposition header
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            expect(filenameMatch).toBeTruthy();
            
            if (filenameMatch) {
              const downloadFilename = filenameMatch[1];
              expect(downloadFilename).toContain('tuned');
            }
            
          } finally {
            // Cleanup
            try {
              await fs.unlink(testOutputPath);
            } catch (e) {
              // Ignore cleanup errors
            }
            delete app.locals.audioFiles[audioId];
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
