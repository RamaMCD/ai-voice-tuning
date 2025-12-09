/**
 * Unit Tests for AudioRecorder
 * Tests specific functionality and edge cases
 */

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

describe('AudioRecorder Unit Tests', () => {
  let recorder;
  let mockStream;

  beforeEach(() => {
    // Setup navigator.mediaDevices mock if it doesn't exist
    if (!global.navigator) {
      global.navigator = {};
    }
    if (!global.navigator.mediaDevices) {
      global.navigator.mediaDevices = {};
    }
    global.navigator.mediaDevices.getUserMedia = jest.fn();
    
    recorder = new AudioRecorder();
    
    mockStream = {
      getTracks: () => [{ stop: jest.fn() }]
    };
  });

  afterEach(() => {
    if (recorder) {
      recorder.cleanup();
    }
  });

  describe('Microphone Access', () => {
    test('should successfully request microphone access', async () => {
      global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);

      const result = await recorder.requestMicrophoneAccess();

      expect(result).toBe(true);
      expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: true
      });
      expect(recorder.stream).toBe(mockStream);
    });

    test('should throw MIC_DENIED error when permission is denied', async () => {
      const error = new Error('Permission denied');
      error.name = 'NotAllowedError';
      global.navigator.mediaDevices.getUserMedia.mockRejectedValue(error);

      await expect(recorder.requestMicrophoneAccess()).rejects.toThrow('MIC_DENIED');
    });

    test('should throw MIC_DENIED error for PermissionDeniedError', async () => {
      const error = new Error('Permission denied');
      error.name = 'PermissionDeniedError';
      global.navigator.mediaDevices.getUserMedia.mockRejectedValue(error);

      await expect(recorder.requestMicrophoneAccess()).rejects.toThrow('MIC_DENIED');
    });

    test('should throw NO_MICROPHONE error when no microphone found', async () => {
      const error = new Error('No microphone found');
      error.name = 'NotFoundError';
      global.navigator.mediaDevices.getUserMedia.mockRejectedValue(error);

      await expect(recorder.requestMicrophoneAccess()).rejects.toThrow('NO_MICROPHONE');
    });

    test('should throw MIC_ACCESS_ERROR for other errors', async () => {
      const error = new Error('Unknown error');
      error.name = 'UnknownError';
      global.navigator.mediaDevices.getUserMedia.mockRejectedValue(error);

      await expect(recorder.requestMicrophoneAccess()).rejects.toThrow('MIC_ACCESS_ERROR');
    });
  });

  describe('Recording Start/Stop', () => {
    beforeEach(async () => {
      global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      await recorder.requestMicrophoneAccess();
    });

    test('should start recording successfully', async () => {
      await recorder.startRecording();

      expect(recorder.isRecording()).toBe(true);
      expect(recorder.mediaRecorder).not.toBeNull();
      expect(recorder.mediaRecorder.state).toBe('recording');
    });

    test('should stop recording successfully', async () => {
      await recorder.startRecording();
      expect(recorder.isRecording()).toBe(true);

      recorder.stopRecording();

      expect(recorder.isRecording()).toBe(false);
    });

    test('should reset audio chunks when starting new recording', async () => {
      await recorder.startRecording();
      recorder.audioChunks = [new Blob(['old data'])];
      
      recorder.stopRecording();
      await recorder.startRecording();

      expect(recorder.audioChunks.length).toBe(0);
    });

    test('should stop all stream tracks when stopping recording', async () => {
      const stopMock = jest.fn();
      mockStream.getTracks = () => [{ stop: stopMock }];
      recorder.stream = mockStream;

      await recorder.startRecording();
      recorder.stopRecording();

      expect(stopMock).toHaveBeenCalled();
    });

    test('should handle stop when not recording', () => {
      expect(() => recorder.stopRecording()).not.toThrow();
    });
  });

  describe('Duration Limit', () => {
    beforeEach(async () => {
      global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      await recorder.requestMicrophoneAccess();
    });

    test('should auto-stop after 60 seconds by default', async () => {
      recorder.maxDuration = 1; // Set to 1 second for testing
      await recorder.startRecording();

      expect(recorder.isRecording()).toBe(true);

      // Wait for auto-stop
      await new Promise(resolve => setTimeout(resolve, 1200));

      expect(recorder.isRecording()).toBe(false);
    }, 10000);

    test('should track duration correctly', async () => {
      await recorder.startRecording();

      // Wait 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));

      const duration = recorder.getDuration();
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThanOrEqual(2);

      recorder.stopRecording();
    });

    test('should call onTimerUpdate callback during recording', async () => {
      const onTimerUpdate = jest.fn();
      recorder.onTimerUpdate = onTimerUpdate;

      await recorder.startRecording();

      // Wait for timer updates
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(onTimerUpdate).toHaveBeenCalled();

      recorder.stopRecording();
    });

    test('should call onRecordingComplete callback when stopped', async () => {
      const onRecordingComplete = jest.fn();
      recorder.onRecordingComplete = onRecordingComplete;

      await recorder.startRecording();
      await new Promise(resolve => setTimeout(resolve, 100));
      recorder.stopRecording();

      // Wait for stop event
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onRecordingComplete).toHaveBeenCalled();
    });
  });

  describe('Audio Blob Generation', () => {
    beforeEach(async () => {
      global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      await recorder.requestMicrophoneAccess();
    });

    test('should return null when no audio recorded', () => {
      const blob = recorder.getAudioBlob();
      expect(blob).toBeNull();
    });

    test('should return audio blob after recording', async () => {
      await recorder.startRecording();
      
      // Wait for data to be available
      await new Promise(resolve => setTimeout(resolve, 100));
      
      recorder.stopRecording();

      const blob = recorder.getAudioBlob();
      expect(blob).not.toBeNull();
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toMatch(/^audio\//);
    });

    test('should create blob with correct MIME type', async () => {
      await recorder.startRecording();
      await new Promise(resolve => setTimeout(resolve, 100));
      recorder.stopRecording();

      const blob = recorder.getAudioBlob();
      expect(blob.type).toMatch(/^audio\/(webm|wav)/);
    });
  });

  describe('Cleanup', () => {
    test('should clean up all resources', async () => {
      global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      await recorder.requestMicrophoneAccess();
      await recorder.startRecording();

      recorder.cleanup();

      expect(recorder.isRecording()).toBe(false);
      expect(recorder.audioChunks).toEqual([]);
      expect(recorder.stream).toBeNull();
      expect(recorder.mediaRecorder).toBeNull();
    });
  });

  describe('State Management', () => {
    test('should initialize with correct default values', () => {
      expect(recorder.mediaRecorder).toBeNull();
      expect(recorder.audioChunks).toEqual([]);
      expect(recorder.stream).toBeNull();
      expect(recorder.duration).toBe(0);
      expect(recorder.maxDuration).toBe(60);
    });

    test('should correctly report recording state', async () => {
      global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      await recorder.requestMicrophoneAccess();

      expect(recorder.isRecording()).toBe(false);

      await recorder.startRecording();
      expect(recorder.isRecording()).toBe(true);

      recorder.stopRecording();
      expect(recorder.isRecording()).toBe(false);
    });

    test('should return current duration', async () => {
      global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      await recorder.requestMicrophoneAccess();
      await recorder.startRecording();

      await new Promise(resolve => setTimeout(resolve, 500));

      const duration = recorder.getDuration();
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);

      recorder.stopRecording();
    });
  });

  describe('Timer Management', () => {
    beforeEach(async () => {
      global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      await recorder.requestMicrophoneAccess();
    });

    test('should start timer when recording starts', async () => {
      await recorder.startRecording();
      expect(recorder.timerInterval).not.toBeNull();
      recorder.stopRecording();
    });

    test('should stop timer when recording stops', async () => {
      await recorder.startRecording();
      recorder.stopRecording();
      expect(recorder.timerInterval).toBeNull();
    });

    test('should clear timer interval on cleanup', async () => {
      await recorder.startRecording();
      const intervalId = recorder.timerInterval;
      expect(intervalId).not.toBeNull();
      
      recorder.cleanup();
      expect(recorder.timerInterval).toBeNull();
    });
  });
});
