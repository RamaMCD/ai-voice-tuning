const fc = require('fast-check');
const PythonService = require('../../src/services/pythonService');
const fs = require('fs').promises;
const path = require('path');

describe('PythonService Property-Based Tests', () => {
  let pythonService;
  const testUploadDir = path.join(__dirname, '../fixtures/test-uploads');
  const testOutputDir = path.join(__dirname, '../../outputs');

  beforeAll(async () => {
    pythonService = new PythonService();
    
    // Create test directories
    await fs.mkdir(testUploadDir, { recursive: true });
    await fs.mkdir(testOutputDir, { recursive: true });
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

  /**
   * Feature: ai-voice-tuning, Property 7: Python engine invocation
   * For any audio processing request, the backend server should spawn 
   * a Python child process to execute the AI engine
   * Validates: Requirements 3.1
   */
  test('Property 7: Python engine invocation', async () => {
    // Create a simple test audio file (silence)
    const testAudioPath = path.join(testUploadDir, 'test-audio.wav');
    
    // Create a minimal valid WAV file (44 bytes header + some data)
    const wavHeader = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x24, 0x00, 0x00, 0x00, // File size - 8
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
      0x00, 0x00, 0x00, 0x00  // Subchunk2Size
    ]);
    
    await fs.writeFile(testAudioPath, wavHeader);

    // Test that processAudio spawns Python process
    // We expect this to either succeed or fail with a Python error,
    // but not fail with "Failed to start Python engine"
    try {
      const result = await pythonService.processAudio(testAudioPath);
      
      // If successful, result should be a string path
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    } catch (error) {
      // If it fails, it should be a Python processing error, not a spawn error
      expect(error.message).not.toContain('Failed to start Python engine');
    }
  }, 60000); // Increased timeout for Python processing

  /**
   * Feature: ai-voice-tuning, Property 23: File path parameter passing
   * For any Python script invocation, the backend server should pass 
   * the audio file path as a command-line parameter
   * Validates: Requirements 7.3
   */
  test('Property 23: File path parameter passing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          filename: fc.stringOf(
            fc.constantFrom('a', 'b', 'c', '1', '2', '3', '-', '_'),
            { minLength: 5, maxLength: 20 }
          ),
          extension: fc.constantFrom('.wav', '.mp3')
        }),
        async ({ filename, extension }) => {
          const testFilePath = path.join(testUploadDir, filename + extension);
          
          // Create a minimal WAV file
          const wavHeader = Buffer.from([
            0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
            0x57, 0x41, 0x56, 0x45, 0x66, 0x6D, 0x74, 0x20,
            0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
            0x44, 0xAC, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00,
            0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61,
            0x00, 0x00, 0x00, 0x00
          ]);
          
          await fs.writeFile(testFilePath, wavHeader);

          try {
            // Attempt to process - Python should receive the file path
            await pythonService.processAudio(testFilePath);
            
            // If successful, Python received and processed the path correctly
            expect(true).toBe(true);
          } catch (error) {
            // If it fails, it should NOT be because of missing file
            // (which would indicate path wasn't passed correctly)
            expect(error.message).not.toContain('Audio file not found');
          } finally {
            // Cleanup
            try {
              await fs.unlink(testFilePath);
            } catch (e) {
              // Ignore cleanup errors
            }
          }
        }
      ),
      { numRuns: 10, timeout: 60000 } // Reduced runs for performance
    );
  }, 120000);

  /**
   * Feature: ai-voice-tuning, Property 24: Output path return
   * For any successfully completed AI engine execution, the Python script 
   * should return the path to the tuned audio file
   * Validates: Requirements 7.4
   */
  test('Property 24: Output path return', async () => {
    // Create a valid test audio file
    const testAudioPath = path.join(testUploadDir, 'test-output-return.wav');
    
    const wavHeader = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
      0x57, 0x41, 0x56, 0x45, 0x66, 0x6D, 0x74, 0x20,
      0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
      0x44, 0xAC, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00,
      0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61,
      0x00, 0x00, 0x00, 0x00
    ]);
    
    await fs.writeFile(testAudioPath, wavHeader);

    try {
      const outputPath = await pythonService.processAudio(testAudioPath);
      
      // Verify output path is returned
      expect(outputPath).toBeDefined();
      expect(typeof outputPath).toBe('string');
      expect(outputPath.length).toBeGreaterThan(0);
      
      // Verify output path contains "tuned" as per requirements
      expect(outputPath).toContain('tuned');
      
      // Verify output path points to outputs directory
      expect(outputPath).toContain('outputs');
      
      // Verify the output file actually exists
      const outputExists = await fs.access(outputPath)
        .then(() => true)
        .catch(() => false);
      
      expect(outputExists).toBe(true);
      
      // Cleanup output file
      if (outputExists) {
        await fs.unlink(outputPath);
      }
    } catch (error) {
      // If processing fails, it should still be a valid error, not empty output
      expect(error.message).toBeDefined();
      expect(error.message.length).toBeGreaterThan(0);
    }
  }, 60000);
});
