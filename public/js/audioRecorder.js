/**
 * AudioRecorder Class
 * Handles audio recording from browser microphone using MediaRecorder API
 */
class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.startTime = null;
    this.timerInterval = null;
    this.duration = 0;
    this.maxDuration = 60; // Maximum recording duration in seconds
    this.onTimerUpdate = null; // Callback for timer updates
    this.onRecordingComplete = null; // Callback when recording completes
  }

  /**
   * Request microphone access from browser
   * @returns {Promise<boolean>} True if access granted, false otherwise
   */
  async requestMicrophoneAccess() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true 
      });
      return true;
    } catch (error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('MIC_DENIED');
      } else if (error.name === 'NotFoundError') {
        throw new Error('NO_MICROPHONE');
      } else {
        throw new Error('MIC_ACCESS_ERROR');
      }
    }
  }

  /**
   * Start recording audio
   * @returns {Promise<void>}
   */
  async startRecording() {
    if (!this.stream) {
      await this.requestMicrophoneAccess();
    }

    // Reset state
    this.audioChunks = [];
    this.duration = 0;
    this.startTime = Date.now();

    // Create MediaRecorder with WAV format preference
    const options = { mimeType: 'audio/webm' };
    
    // Try to use audio/wav if supported, otherwise fall back to audio/webm
    if (MediaRecorder.isTypeSupported('audio/wav')) {
      options.mimeType = 'audio/wav';
    } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      options.mimeType = 'audio/webm;codecs=opus';
    }

    this.mediaRecorder = new MediaRecorder(this.stream, options);

    // Handle data available event
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    // Handle recording stop event
    this.mediaRecorder.onstop = () => {
      this.stopTimer();
      if (this.onRecordingComplete) {
        this.onRecordingComplete(this.duration);
      }
    };

    // Start recording
    this.mediaRecorder.start();

    // Start timer
    this.startTimer();

    // Auto-stop after max duration
    setTimeout(() => {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.stopRecording();
      }
    }, this.maxDuration * 1000);
  }

  /**
   * Stop recording audio
   */
  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.stopTimer();
      
      // Stop all tracks in the stream
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
    }
  }

  /**
   * Get the recorded audio as a Blob
   * @returns {Blob} Audio blob (WebM or WAV format)
   */
  getAudioBlob() {
    if (this.audioChunks.length === 0) {
      return null;
    }

    // Return the blob with the actual MIME type that was recorded
    const mimeType = (this.mediaRecorder && this.mediaRecorder.mimeType) || 'audio/webm';
    return new Blob(this.audioChunks, { type: mimeType });
  }

  /**
   * Get the current recording duration
   * @returns {number} Duration in seconds
   */
  getDuration() {
    return this.duration;
  }

  /**
   * Start the recording timer
   */
  startTimer() {
    this.timerInterval = setInterval(() => {
      this.duration = Math.floor((Date.now() - this.startTime) / 1000);
      
      if (this.onTimerUpdate) {
        this.onTimerUpdate(this.duration);
      }

      // Auto-stop at max duration
      if (this.duration >= this.maxDuration) {
        this.stopRecording();
      }
    }, 100); // Update every 100ms for smooth timer
  }

  /**
   * Stop the recording timer
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Check if currently recording
   * @returns {boolean}
   */
  isRecording() {
    return !!(this.mediaRecorder && this.mediaRecorder.state === 'recording');
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stopRecording();
    this.audioChunks = [];
    this.stream = null;
    this.mediaRecorder = null;
  }
}

// Export for use in other modules (if using module system)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioRecorder;
}
