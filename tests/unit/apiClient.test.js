/**
 * Unit tests for APIClient
 * Tests upload, process, download, and info API methods
 */

// Mock fetch for testing
global.fetch = jest.fn();
global.FormData = class FormData {
  constructor() {
    this.data = {};
  }
  append(key, value) {
    this.data[key] = value;
  }
};
global.AbortController = class AbortController {
  constructor() {
    this.signal = { aborted: false };
  }
  abort() {
    this.signal.aborted = true;
  }
};

const APIClient = require('../../public/js/apiClient');

describe('APIClient Unit Tests', () => {
  let apiClient;

  beforeEach(() => {
    // Disable retries for faster testing
    apiClient = new APIClient('http://localhost:3000', { maxRetries: 0, retryDelay: 0 });
    fetch.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('uploadAudio', () => {
    test('should successfully upload a valid audio file', async () => {
      // Mock file
      const mockFile = new Blob(['audio data'], { type: 'audio/wav' });
      mockFile.name = 'test.wav';

      // Mock successful response
      const mockResponse = {
        success: true,
        data: {
          id: 'test-id-123',
          filename: 'test.wav',
          size: 1000,
          duration: 30,
          format: 'wav',
          uploadedAt: '2024-01-01T00:00:00.000Z',
          status: 'uploaded'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await apiClient.uploadAudio(mockFile);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/upload',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      );
      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('test-id-123');
    });

    test('should handle upload error response', async () => {
      const mockFile = new Blob(['audio data'], { type: 'audio/wav' });

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Format file tidak didukung'
        })
      });

      await expect(apiClient.uploadAudio(mockFile)).rejects.toThrow('Format file tidak didukung');
    });

    test('should handle network error', async () => {
      const mockFile = new Blob(['audio data'], { type: 'audio/wav' });

      fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(apiClient.uploadAudio(mockFile)).rejects.toThrow('Network error');
    });

    test('should handle timeout', async () => {
      const mockFile = new Blob(['audio data'], { type: 'audio/wav' });

      // Mock AbortError
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      fetch.mockRejectedValueOnce(abortError);

      await expect(apiClient.uploadAudio(mockFile)).rejects.toThrow('Upload timeout');
    });
  });

  describe('processAudio', () => {
    test('should successfully process audio', async () => {
      const audioId = 'test-id-123';

      const mockResponse = {
        success: true,
        data: {
          id: audioId,
          status: 'completed',
          outputPath: '/outputs/test-id-123-tuned.wav',
          processingTime: 5.2
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await apiClient.processAudio(audioId);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/process',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ audioId })
        })
      );
      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('completed');
    });

    test('should handle processing error', async () => {
      const audioId = 'test-id-123';

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: 'Gagal memproses audio'
        })
      });

      await expect(apiClient.processAudio(audioId)).rejects.toThrow('Gagal memproses audio');
    });

    test('should handle network error during processing', async () => {
      const audioId = 'test-id-123';

      fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(apiClient.processAudio(audioId)).rejects.toThrow('Network error');
    });
  });

  describe('downloadResult', () => {
    test('should successfully download audio file', async () => {
      const audioId = 'test-id-123';
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        blob: async () => mockBlob,
        headers: new Map([['content-type', 'audio/wav']])
      });

      const result = await apiClient.downloadResult(audioId);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3000/api/download/${audioId}`,
        expect.objectContaining({
          method: 'GET'
        })
      );
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('audio/wav');
    });

    test('should handle download error with JSON response', async () => {
      const audioId = 'test-id-123';

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: {
          get: (key) => key === 'content-type' ? 'application/json' : null
        },
        json: async () => ({
          success: false,
          error: 'Audio tidak ditemukan'
        })
      });

      await expect(apiClient.downloadResult(audioId)).rejects.toThrow('Audio tidak ditemukan');
    });

    test('should handle download error without JSON response', async () => {
      const audioId = 'test-id-123';

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: {
          get: () => null
        }
      });

      await expect(apiClient.downloadResult(audioId)).rejects.toThrow('Download failed with status 500');
    });

    test('should handle network error during download', async () => {
      const audioId = 'test-id-123';

      fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(apiClient.downloadResult(audioId)).rejects.toThrow('Network error');
    });
  });

  describe('getAudioInfo', () => {
    test('should successfully get audio info', async () => {
      const audioId = 'test-id-123';

      const mockResponse = {
        success: true,
        data: {
          id: audioId,
          filename: 'test.wav',
          duration: 30,
          size: 1000,
          format: 'wav',
          status: 'uploaded',
          uploadedAt: '2024-01-01T00:00:00.000Z'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await apiClient.getAudioInfo(audioId);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3000/api/info/${audioId}`,
        expect.objectContaining({
          method: 'GET'
        })
      );
      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(audioId);
    });

    test('should handle info error', async () => {
      const audioId = 'test-id-123';

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'Audio tidak ditemukan'
        })
      });

      await expect(apiClient.getAudioInfo(audioId)).rejects.toThrow('Audio tidak ditemukan');
    });

    test('should handle network error when getting info', async () => {
      const audioId = 'test-id-123';

      fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(apiClient.getAudioInfo(audioId)).rejects.toThrow('Network error');
    });
  });

  describe('setTimeout', () => {
    test('should allow setting custom timeout', () => {
      apiClient.setTimeout(60000);
      expect(apiClient.timeout).toBe(60000);
    });
  });

  describe('Error handling', () => {
    test('should handle upload with file size limit error', async () => {
      const mockFile = new Blob(['audio data'], { type: 'audio/wav' });

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'File terlalu besar. Maksimal 10MB'
        })
      });

      await expect(apiClient.uploadAudio(mockFile)).rejects.toThrow('File terlalu besar');
    });

    test('should handle processing with audio not found error', async () => {
      const audioId = 'invalid-id';

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'Audio tidak ditemukan'
        })
      });

      await expect(apiClient.processAudio(audioId)).rejects.toThrow('Audio tidak ditemukan');
    });

    test('should handle download with incomplete processing error', async () => {
      const audioId = 'test-id-123';

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: {
          get: (key) => key === 'content-type' ? 'application/json' : null
        },
        json: async () => ({
          success: false,
          error: 'Audio belum selesai diproses'
        })
      });

      await expect(apiClient.downloadResult(audioId)).rejects.toThrow('Audio belum selesai diproses');
    });
  });
});
