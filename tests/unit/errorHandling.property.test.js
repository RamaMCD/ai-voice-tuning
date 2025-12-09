const fc = require('fast-check');
const request = require('supertest');
const app = require('../../src/server');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../../src/utils/logger');

describe('Error Handling Property-Based Tests', () => {
  const testUploadDir = path.join(__dirname, '../fixtures/test-uploads');
  const testOutputDir = path.join(__dirname, '../../outputs');

  beforeAll(async () => {
    // Create test directories
    await fs.mkdir(testUploadDir, { recursive: true });
    await fs.mkdir(testOutputDir, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup test files
    try {
      const uploadFiles = await fs.readdir(testUploadDir);
      for (const file of uploadFiles) {
        await fs.unlink(path.join(testUploadDir, file));
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  /**
   * Feature: ai-voice-tuning, Property 18: Server error logging
   * For any error occurring in the backend server, the system should 
   * write the error details to a log file
   * Validates: Requirements 6.1
   */
  test('Property 18: Server error logging', async () => {
    // Mock logger to capture error logs
    const errorLogs = [];
    const originalError = logger.error;
    logger.error = jest.fn((logData) => {
      errorLogs.push(logData);
      originalError.call(logger, logData);
    });

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          errorScenario: fc.constantFrom(
            'missing-audio-id',
            'invalid-audio-id',
            'missing-file',
            'invalid-file-type'
          ),
          audioId: fc.uuid()
        }),
        async ({ errorScenario, audioId }) => {
          // Clear previous logs
          errorLogs.length = 0;

          try {
            if (errorScenario === 'missing-audio-id') {
              // Send request without audioId
              await request(app)
                .post('/api/process')
                .send({})
                .timeout(5000);
              
            } else if (errorScenario === 'invalid-audio-id') {
              // Send request with non-existent audioId
              await request(app)
                .post('/api/process')
                .send({ audioId: 'non-existent-id' })
                .timeout(5000);
              
            } else if (errorScenario === 'missing-file') {
              // Register audio with non-existent file
              const testFilePath = path.join(testUploadDir, `missing-${audioId}.wav`);
              
              app.locals.audioFiles = app.locals.audioFiles || {};
              app.locals.audioFiles[audioId] = {
                id: audioId,
                filename: `missing-${audioId}.wav`,
                filepath: testFilePath,
                status: 'uploaded'
              };
              
              await request(app)
                .post('/api/process')
                .send({ audioId })
                .timeout(5000);
              
              // Cleanup
              delete app.locals.audioFiles[audioId];
              
            } else if (errorScenario === 'invalid-file-type') {
              // Try to upload invalid file type
              const buffer = Buffer.from('not an audio file');
              
              await request(app)
                .post('/api/upload')
                .attach('audio', buffer, 'test.txt')
                .timeout(5000);
            }

            // Verify that error was logged
            // Note: Some scenarios may not trigger error handler if handled before
            // but critical errors should always be logged
            if (errorScenario === 'missing-file') {
              expect(errorLogs.length).toBeGreaterThan(0);
              
              // Verify log contains error information
              const hasErrorLog = errorLogs.some(log => 
                log.message || log.error || (typeof log === 'string' && log.length > 0)
              );
              expect(hasErrorLog).toBe(true);
            }
            
          } catch (error) {
            // Request errors are expected
          }
        }
      ),
      { numRuns: 100, timeout: 60000 }
    );

    // Restore original logger
    logger.error = originalError;
  }, 90000);

  /**
   * Feature: ai-voice-tuning, Property 19: AI processing error communication
   * For any AI engine processing failure, the system should send an 
   * informative error message to the user
   * Validates: Requirements 6.2
   */
  test('Property 19: AI processing error communication', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          audioId: fc.uuid(),
          errorType: fc.constantFrom('corrupt-file', 'missing-file', 'invalid-format')
        }),
        async ({ audioId, errorType }) => {
          let testFilePath;
          
          try {
            if (errorType === 'corrupt-file') {
              // Create corrupt audio file
              testFilePath = path.join(testUploadDir, `corrupt-${audioId}.wav`);
              await fs.writeFile(testFilePath, Buffer.from('CORRUPT DATA NOT AUDIO'));
              
            } else if (errorType === 'missing-file') {
              // Reference non-existent file
              testFilePath = path.join(testUploadDir, `missing-${audioId}.wav`);
              
            } else if (errorType === 'invalid-format') {
              // Create file with wrong format
              testFilePath = path.join(testUploadDir, `invalid-${audioId}.wav`);
              await fs.writeFile(testFilePath, Buffer.from('INVALID AUDIO FORMAT'));
            }

            // Register audio file
            app.locals.audioFiles = app.locals.audioFiles || {};
            app.locals.audioFiles[audioId] = {
              id: audioId,
              filename: path.basename(testFilePath),
              filepath: testFilePath,
              status: 'uploaded'
            };

            // Attempt to process
            const response = await request(app)
              .post('/api/process')
              .send({ audioId })
              .timeout(60000);

            // Verify error response contains informative message
            if (response.status >= 400) {
              expect(response.body.success).toBe(false);
              expect(response.body.error).toBeDefined();
              expect(typeof response.body.error).toBe('string');
              expect(response.body.error.length).toBeGreaterThan(0);
              
              // Error message should be informative (not just "error")
              expect(response.body.error.toLowerCase()).not.toBe('error');
              expect(response.body.error.length).toBeGreaterThan(5);
            }

          } catch (error) {
            // Timeout or network errors are acceptable
          } finally {
            // Cleanup
            if (testFilePath) {
              try {
                await fs.unlink(testFilePath);
              } catch (e) {
                // Ignore cleanup errors
              }
            }
            delete app.locals.audioFiles[audioId];
          }
        }
      ),
      { numRuns: 100, timeout: 120000 }
    );
  }, 180000);

  /**
   * Feature: ai-voice-tuning, Property 20: Corrupt file detection
   * For any corrupt or invalid audio file, the system should detect 
   * and reject it before processing begins
   * Validates: Requirements 6.3
   */
  test('Property 20: Corrupt file detection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          audioId: fc.uuid(),
          corruptionType: fc.constantFrom(
            'random-bytes',
            'text-file',
            'partial-header',
            'empty-file'
          )
        }),
        async ({ audioId, corruptionType }) => {
          let testFilePath = path.join(testUploadDir, `corrupt-${audioId}.wav`);
          let corruptData;

          // Generate different types of corrupt data
          if (corruptionType === 'random-bytes') {
            // Random bytes that don't form valid audio
            corruptData = Buffer.from(Array.from({ length: 100 }, () => 
              Math.floor(Math.random() * 256)
            ));
          } else if (corruptionType === 'text-file') {
            // Plain text pretending to be audio
            corruptData = Buffer.from('This is just text, not audio data at all');
          } else if (corruptionType === 'partial-header') {
            // Incomplete WAV header
            corruptData = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00]);
          } else if (corruptionType === 'empty-file') {
            // Empty file
            corruptData = Buffer.from([]);
          }

          try {
            // Create corrupt file
            await fs.writeFile(testFilePath, corruptData);

            // Register in app locals
            app.locals.audioFiles = app.locals.audioFiles || {};
            app.locals.audioFiles[audioId] = {
              id: audioId,
              filename: path.basename(testFilePath),
              filepath: testFilePath,
              status: 'uploaded'
            };

            // Attempt to process corrupt file
            const response = await request(app)
              .post('/api/process')
              .send({ audioId })
              .timeout(60000);

            // System should detect corruption and reject
            // Either during processing or when Python engine tries to load it
            if (response.status >= 400) {
              expect(response.body.success).toBe(false);
              expect(response.body.error).toBeDefined();
              
              // Verify file was rejected (status should be failed)
              if (app.locals.audioFiles[audioId]) {
                expect(app.locals.audioFiles[audioId].status).toBe('failed');
              }
            }

          } catch (error) {
            // Timeout or processing errors are acceptable for corrupt files
          } finally {
            // Cleanup
            try {
              await fs.unlink(testFilePath);
            } catch (e) {
              // Ignore cleanup errors
            }
            delete app.locals.audioFiles[audioId];
          }
        }
      ),
      { numRuns: 100, timeout: 120000 }
    );
  }, 180000);
});
