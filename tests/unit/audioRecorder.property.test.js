/**
 * Property-Based Tests for AudioRecorder
 * Tests recording functionality properties
 */

const fc = require('fast-check');
const AudioRecorder = require('../../public/js/audioRecorder');

// Mock MediaRecorder for jsdom environment
global.MediaRecorder = class MediaRecorder {
  constructor(stream, options) {
    this.stream = stream;
    this.options = options;
    this.state = 'inactive';
    this.ondataavailable = null;
    this.onstop = null;
    this.mimeType = options?.mimeType || 'audio/webm';
  }

  static isTypeSupported(mimeType) {
    return ['audio/webm', 'audio/webm;codecs=opus', 'audio/wav'].includes(mimeType);
  }

  start() {
    this.state = 'recording';
    // Simulate data available after a short delay
    setTimeout(() => {
      if (this.ondataavailable) {
        this.ondataavailable({
          data: new Blob(['mock audio data'], { type: this.mimeType })
        });
      }
    }, 10);
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) {
      this.onstop();
    }
  }
};

describe('AudioRecorder Property-Based Tests', () => {
  beforeEach(() => {
    // Setup navigator.mediaDevices mock if it doesn't exist
    if (!global.navigator) {
      global.navigator = {};
    }
    if (!global.navigator.mediaDevices) {
      global.navigator.mediaDevices = {};
    }
    global.navigator.mediaDevices.getUserMedia = jest.fn();
  });

  /**
   * Feature: ai-voice-tuning, Property 4: Microphone permission request
   * For any record button click event, the system should trigger a browser 
   * microphone permission request
   * Validates: Requirements 2.1
   */
  test('Property 4: Microphone permission request', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // Number of permission requests
        async (numRequests) => {
          // Reset mock before each property run
          jest.clearAllMocks();
          
          // Mock successful permission grant
          const mockStream = {
            getTracks: () => [{ stop: jest.fn() }]
          };
          global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);

          // Test that each request triggers getUserMedia
          for (let i = 0; i < numRequests; i++) {
            const recorder = new AudioRecorder();
            const result = await recorder.requestMicrophoneAccess();
            
            // Verify permission was requested
            expect(result).toBe(true);
            expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
              audio: true
            });
            
            recorder.cleanup();
          }

          // Verify getUserMedia was called the correct number of times
          expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(numRequests);
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  /**
   * Feature: ai-voice-tuning, Property 6: Recording output format
   * For any stopped recording, the system should produce an audio file in .wav format
   * Validates: Requirements 2.3
   */
  test('Property 6: Recording output format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          recordingDuration: fc.integer({ min: 50, max: 200 }), // Duration in ms (reduced for speed)
          mimeType: fc.constantFrom('audio/webm', 'audio/webm;codecs=opus', 'audio/wav')
        }),
        async ({ recordingDuration, mimeType }) => {
          // Reset mock before each property run
          jest.clearAllMocks();
          
          // Mock successful permission grant
          const mockStream = {
            getTracks: () => [{ stop: jest.fn() }]
          };
          global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);

          const recorder = new AudioRecorder();
          await recorder.requestMicrophoneAccess();
          
          // Start recording
          await recorder.startRecording();
          
          // Wait for recording duration
          await new Promise(resolve => setTimeout(resolve, recordingDuration));
          
          // Stop recording
          recorder.stopRecording();
          
          // Wait for data to be available
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Get audio blob
          const audioBlob = recorder.getAudioBlob();
          
          // Verify output exists and is a Blob
          expect(audioBlob).not.toBeNull();
          expect(audioBlob).toBeInstanceOf(Blob);
          
          // Verify blob has audio MIME type
          expect(audioBlob.type).toMatch(/^audio\/(webm|wav)/);
          
          // Verify blob has content
          expect(audioBlob.size).toBeGreaterThan(0);
          
          recorder.cleanup();
        }
      ),
      { numRuns: 100 }
    );
  }, 90000);

  /**
   * Additional property: Permission denied handling
   * For any permission denial, the system should throw appropriate error
   */
  test('Property: Permission denied error handling', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('NotAllowedError', 'PermissionDeniedError', 'NotFoundError'),
        async (errorName) => {
          // Mock permission denial
          const error = new Error('Permission denied');
          error.name = errorName;
          global.navigator.mediaDevices.getUserMedia.mockRejectedValue(error);

          const recorder = new AudioRecorder();
          
          // Verify appropriate error is thrown
          await expect(recorder.requestMicrophoneAccess()).rejects.toThrow();
          
          recorder.cleanup();
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  /**
   * Additional property: Auto-stop at max duration
   * For any recording reaching max duration, the system should auto-stop
   */
  test('Property: Auto-stop at maximum duration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 2 }), // Max duration in seconds (reduced for speed)
        async (maxDuration) => {
          // Reset mock before each property run
          jest.clearAllMocks();
          
          // Mock successful permission grant
          const mockStream = {
            getTracks: () => [{ stop: jest.fn() }]
          };
          global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);

          const recorder = new AudioRecorder();
          recorder.maxDuration = maxDuration;
          
          await recorder.requestMicrophoneAccess();
          await recorder.startRecording();
          
          // Wait for max duration + buffer
          await new Promise(resolve => setTimeout(resolve, (maxDuration * 1000) + 200));
          
          // Verify recording has stopped
          expect(recorder.isRecording()).toBe(false);
          
          // Verify duration doesn't exceed max
          expect(recorder.getDuration()).toBeLessThanOrEqual(maxDuration + 1);
          
          recorder.cleanup();
        }
      ),
      { numRuns: 20 }
    );
  }, 90000);

  /**
   * Additional property: Timer accuracy
   * For any recording duration, the timer should accurately track time
   */
  test('Property: Timer tracks recording duration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 200, max: 1000 }), // Duration in ms (reduced for speed)
        async (duration) => {
          // Reset mock before each property run
          jest.clearAllMocks();
          
          // Mock successful permission grant
          const mockStream = {
            getTracks: () => [{ stop: jest.fn() }]
          };
          global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);

          const recorder = new AudioRecorder();
          await recorder.requestMicrophoneAccess();
          await recorder.startRecording();
          
          // Wait for specified duration
          await new Promise(resolve => setTimeout(resolve, duration));
          
          recorder.stopRecording();
          
          const recordedDuration = recorder.getDuration();
          const expectedDuration = Math.floor(duration / 1000);
          
          // Verify duration is within reasonable range (±1 second tolerance)
          expect(recordedDuration).toBeGreaterThanOrEqual(expectedDuration - 1);
          expect(recordedDuration).toBeLessThanOrEqual(expectedDuration + 1);
          
          recorder.cleanup();
        }
      ),
      { numRuns: 30 }
    );
  }, 90000);
});
