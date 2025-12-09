/**
 * Main Application Logic
 * Entry point that initializes and coordinates all components
 * Handles the complete flow: upload/record → process → download
 */

// Application state
const appState = {
  currentAudioId: null,
  currentAudioBlob: null,
  currentMode: 'upload',
  isProcessing: false
};

// Initialize components
let audioRecorder;
let apiClient;
let uiController;

/**
 * Initialize the application
 */
function initializeApp() {
  // Create instances of all components
  audioRecorder = new AudioRecorder();
  apiClient = new APIClient();
  uiController = new UIController();

  // Setup event listeners
  setupModeToggle();
  setupUploadListeners();
  setupRecordListeners();
  setupProcessListener();
  setupDownloadListener();

  console.log('AI Voice Tuning application initialized');
}

/**
 * Setup mode toggle between upload and record
 */
function setupModeToggle() {
  const modeTabs = document.querySelectorAll('.mode-tab');
  
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.getAttribute('data-mode');
      appState.currentMode = mode;
      uiController.toggleMode(mode);
      
      // Reset state when switching modes
      resetAppState();
    });
  });
}

/**
 * Setup upload-related event listeners
 */
function setupUploadListeners() {
  const fileInput = document.getElementById('audio-file-input');
  
  if (fileInput) {
    fileInput.addEventListener('change', handleFileUpload);
  }
}

/**
 * Handle file upload from input
 * @param {Event} event - File input change event
 */
async function handleFileUpload(event) {
  const file = event.target.files[0];
  
  if (!file) {
    return;
  }

  // Validate file type
  const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/ogg'];
  if (!validTypes.includes(file.type)) {
    uiController.showError('Format file tidak didukung. Gunakan .wav, .mp3, atau .webm');
    event.target.value = ''; // Reset input
    return;
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    uiController.showError('File terlalu besar. Maksimal 10MB');
    event.target.value = ''; // Reset input
    return;
  }

  try {
    // Show loading state
    uiController.showInfo('Mengunggah file...');

    // Upload file to server
    const response = await apiClient.uploadAudio(file);

    if (response.success && response.data) {
      // Store audio ID
      appState.currentAudioId = response.data.id;
      
      // Display audio info
      uiController.displayAudioInfo({
        filename: response.data.filename,
        duration: response.data.duration,
        size: response.data.size,
        format: response.data.format
      });

      uiController.showSuccess('File berhasil diunggah dan siap diproses');
    } else {
      throw new Error(response.error || 'Upload gagal');
    }

  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    uiController.showError(error.message || 'Gagal mengunggah file');
    event.target.value = ''; // Reset input
  }
}

/**
 * Setup record-related event listeners
 */
function setupRecordListeners() {
  const recordButton = document.getElementById('record-button');
  const stopButton = document.getElementById('stop-button');
  const recordingIndicator = document.getElementById('recording-indicator');
  const timerDisplay = document.getElementById('timer-display');
  const timerValue = document.getElementById('timer-value');

  if (recordButton) {
    recordButton.addEventListener('click', async () => {
      try {
        // Request microphone access and start recording
        await audioRecorder.startRecording();

        // Update UI
        recordButton.style.display = 'none';
        stopButton.style.display = 'block';
        recordingIndicator.style.display = 'flex';
        timerDisplay.style.display = 'flex';

        uiController.showInfo('Rekaman dimulai...');

      } catch (error) {
        console.error('Recording error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        
        if (error.message === 'MIC_DENIED') {
          uiController.showError('Akses mikrofon ditolak. Izinkan akses untuk merekam');
        } else if (error.message === 'NO_MICROPHONE') {
          uiController.showError('Mikrofon tidak ditemukan');
        } else {
          uiController.showError('Gagal memulai rekaman');
        }
      }
    });
  }

  if (stopButton) {
    stopButton.addEventListener('click', () => {
      handleStopRecording();
    });
  }

  // Setup timer update callback
  audioRecorder.onTimerUpdate = (duration) => {
    if (timerValue) {
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      timerValue.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // Setup recording complete callback
  audioRecorder.onRecordingComplete = async (duration) => {
    // Update UI
    if (recordButton) recordButton.style.display = 'block';
    if (stopButton) stopButton.style.display = 'none';
    if (recordingIndicator) recordingIndicator.style.display = 'none';
    if (timerDisplay) timerDisplay.style.display = 'none';

    // Get audio blob
    const audioBlob = audioRecorder.getAudioBlob();
    
    if (audioBlob) {
      try {
        // Create file from blob with correct extension based on actual format
        const actualType = audioBlob.type || 'audio/webm';
        const extension = actualType.includes('webm') ? 'webm' : 'wav';
        const fileName = `recording-${Date.now()}.${extension}`;
        const file = new File([audioBlob], fileName, { type: actualType });

        // Upload to server
        uiController.showInfo('Mengunggah rekaman...');
        const response = await apiClient.uploadAudio(file);

        if (response.success && response.data) {
          // Store audio ID
          appState.currentAudioId = response.data.id;
          
          // Display audio info
          uiController.displayAudioInfo({
            duration: response.data.duration,
            size: response.data.size,
            format: 'wav'
          });

          uiController.showSuccess('Rekaman berhasil dan siap diproses');
        } else {
          throw new Error(response.error || 'Upload gagal');
        }

      } catch (error) {
        console.error('Upload recording error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        uiController.showError(error.message || 'Gagal mengunggah rekaman');
      }
    }
  };
}

/**
 * Handle stop recording
 */
function handleStopRecording() {
  audioRecorder.stopRecording();
  uiController.showInfo('Rekaman dihentikan');
}

/**
 * Setup process button listener
 */
function setupProcessListener() {
  const processButton = document.getElementById('process-button');
  
  if (processButton) {
    processButton.addEventListener('click', handleProcessAudio);
  }
}

/**
 * Handle audio processing
 */
async function handleProcessAudio() {
  if (!appState.currentAudioId) {
    uiController.showError('Tidak ada audio untuk diproses');
    return;
  }

  if (appState.isProcessing) {
    uiController.showWarning('Proses sedang berlangsung...');
    return;
  }

  try {
    appState.isProcessing = true;
    
    // Show loading state
    uiController.showLoading();
    uiController.showInfo('Memproses audio dengan AI...');

    // Process audio
    const response = await apiClient.processAudio(appState.currentAudioId);

    if (response.success && response.data) {
      // Hide loading
      uiController.hideLoading();

      // Show result section with audio player
      const audioUrl = `/api/download/${appState.currentAudioId}`;
      uiController.showResult(audioUrl);

      uiController.showSuccess('Audio berhasil di-tune!');
    } else {
      throw new Error(response.error || 'Processing gagal');
    }

  } catch (error) {
    console.error('Processing error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      audioId: appState.currentAudioId,
      timestamp: new Date().toISOString()
    });
    uiController.hideLoading();
    uiController.showError(error.message || 'Gagal memproses audio');
  } finally {
    appState.isProcessing = false;
  }
}

/**
 * Setup download button listener
 */
function setupDownloadListener() {
  const downloadButton = document.getElementById('download-button');
  
  if (downloadButton) {
    downloadButton.addEventListener('click', handleDownload);
  }
}

/**
 * Handle audio download
 */
async function handleDownload() {
  if (!appState.currentAudioId) {
    uiController.showError('Tidak ada audio untuk diunduh');
    return;
  }

  try {
    uiController.showInfo('Mengunduh audio...');

    // Download audio blob
    const blob = await apiClient.downloadResult(appState.currentAudioId);

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tuned-audio-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    uiController.showSuccess('Audio berhasil diunduh');

  } catch (error) {
    console.error('Download error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      audioId: appState.currentAudioId,
      timestamp: new Date().toISOString()
    });
    uiController.showError(error.message || 'Gagal mengunduh audio');
  }
}

/**
 * Reset application state
 */
function resetAppState() {
  appState.currentAudioId = null;
  appState.currentAudioBlob = null;
  appState.isProcessing = false;
  
  // Reset file input
  const fileInput = document.getElementById('audio-file-input');
  if (fileInput) {
    fileInput.value = '';
  }
  
  // Cleanup recorder
  if (audioRecorder) {
    audioRecorder.cleanup();
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
