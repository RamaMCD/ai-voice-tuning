/**
 * APIClient - Handles all API communication with the backend
 * Manages file uploads, audio processing, downloads, and metadata retrieval
 */
class APIClient {
  constructor(baseURL = '', options = {}) {
    this.baseURL = baseURL;
    this.timeout = options.timeout || 30000; // 30 seconds default timeout
    this.maxRetries = options.maxRetries !== undefined ? options.maxRetries : 3; // Maximum number of retries for network errors
    this.retryDelay = options.retryDelay || 1000; // Initial retry delay in milliseconds
  }

  /**
   * Retry a request with exponential backoff
   * @param {Function} requestFn - Function that returns a promise
   * @param {number} retries - Number of retries remaining
   * @returns {Promise} Result of the request
   */
  async retryRequest(requestFn, retries = this.maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      // Only retry on network errors, not on application errors
      const isNetworkError = error.message.includes('Network error') || 
                            error.message.includes('Failed to fetch') ||
                            error.name === 'AbortError';
      
      if (isNetworkError && retries > 0) {
        const delay = this.retryDelay * (this.maxRetries - retries + 1);
        console.log(`Retrying request in ${delay}ms... (${retries} retries left)`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(requestFn, retries - 1);
      }
      
      throw error;
    }
  }

  /**
   * Upload audio file to server
   * @param {File} file - Audio file to upload
   * @returns {Promise<Object>} Upload response with audio metadata
   */
  async uploadAudio(file) {
    return this.retryRequest(async () => {
      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('audio', file);

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseURL}/api/upload`, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Parse response
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Upload failed with status ${response.status}`);
        }

        return data;

      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Upload timeout - file terlalu besar atau koneksi lambat');
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Network error - gagal terhubung ke server');
        }
        throw error;
      }
    });
  }

  /**
   * Process audio with AI pitch correction
   * @param {string} audioId - ID of uploaded audio
   * @returns {Promise<Object>} Processing result with output path
   */
  async processAudio(audioId) {
    return this.retryRequest(async () => {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseURL}/api/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ audioId }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Parse response
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Processing failed with status ${response.status}`);
        }

        return data;

      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Processing timeout - audio terlalu panjang atau server sibuk');
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Network error - gagal terhubung ke server');
        }
        throw error;
      }
    });
  }

  /**
   * Download processed audio result
   * @param {string} audioId - ID of processed audio
   * @returns {Promise<Blob>} Audio file as blob
   */
  async downloadResult(audioId) {
    return this.retryRequest(async () => {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseURL}/api/download/${audioId}`, {
          method: 'GET',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Try to parse error message
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            throw new Error(data.error || `Download failed with status ${response.status}`);
          }
          throw new Error(`Download failed with status ${response.status}`);
        }

        // Return blob for audio file
        const blob = await response.blob();
        return blob;

      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Download timeout - koneksi lambat');
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Network error - gagal terhubung ke server');
        }
        throw error;
      }
    });
  }

  /**
   * Get audio metadata and status
   * @param {string} audioId - ID of audio
   * @returns {Promise<Object>} Audio metadata
   */
  async getAudioInfo(audioId) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/api/info/${audioId}`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Parse response
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to get info with status ${response.status}`);
      }

      return data;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - koneksi lambat');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error - gagal terhubung ke server');
      }
      throw error;
    }
  }

  /**
   * Set custom timeout for requests
   * @param {number} timeout - Timeout in milliseconds
   */
  setTimeout(timeout) {
    this.timeout = timeout;
  }
}

// Export for use in browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIClient;
}
