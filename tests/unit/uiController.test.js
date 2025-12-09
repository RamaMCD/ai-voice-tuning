/**
 * Unit Tests for UIController
 * Tests specific examples and edge cases
 */

describe('UIController Unit Tests', () => {
  let uiController;
  let mockDOM;

  beforeEach(() => {
    // Setup mock DOM elements
    mockDOM = {
      messageContainer: document.createElement('div'),
      loadingIndicator: document.createElement('div'),
      processButton: document.createElement('button'),
      uploadSection: document.createElement('section'),
      recordSection: document.createElement('section'),
      processSection: document.createElement('section'),
      resultSection: document.createElement('section'),
      uploadFileInfo: document.createElement('div'),
      uploadFilename: document.createElement('span'),
      uploadDuration: document.createElement('span'),
      uploadSize: document.createElement('span'),
      uploadFormat: document.createElement('span'),
      recordFileInfo: document.createElement('div'),
      recordDuration: document.createElement('span'),
      recordSize: document.createElement('span'),
      recordFormat: document.createElement('span'),
      audioPlayer: document.createElement('audio')
    };

    // Set IDs
    mockDOM.messageContainer.id = 'message-container';
    mockDOM.loadingIndicator.id = 'loading-indicator';
    mockDOM.processButton.id = 'process-button';
    mockDOM.uploadSection.id = 'upload-section';
    mockDOM.recordSection.id = 'record-section';
    mockDOM.processSection.id = 'process-section';
    mockDOM.resultSection.id = 'result-section';
    mockDOM.uploadFileInfo.id = 'upload-file-info';
    mockDOM.uploadFilename.id = 'upload-filename';
    mockDOM.uploadDuration.id = 'upload-duration';
    mockDOM.uploadSize.id = 'upload-size';
    mockDOM.uploadFormat.id = 'upload-format';
    mockDOM.recordFileInfo.id = 'record-file-info';
    mockDOM.recordDuration.id = 'record-duration';
    mockDOM.recordSize.id = 'record-size';
    mockDOM.recordFormat.id = 'record-format';
    mockDOM.audioPlayer.id = 'result-audio-player';

    // Add mode tabs
    const modeTab1 = document.createElement('button');
    modeTab1.className = 'mode-tab active';
    modeTab1.setAttribute('data-mode', 'upload');
    const modeTab2 = document.createElement('button');
    modeTab2.className = 'mode-tab';
    modeTab2.setAttribute('data-mode', 'record');

    // Append to document
    document.body.innerHTML = '';
    Object.values(mockDOM).forEach(el => document.body.appendChild(el));
    document.body.appendChild(modeTab1);
    document.body.appendChild(modeTab2);

    // Create UIController instance
    const UIController = require('../../public/js/uiController.js');
    uiController = new UIController();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Loading States', () => {
    test('should show loading indicator when showLoading is called', () => {
      uiController.showLoading();
      
      const loadingIndicator = document.getElementById('loading-indicator');
      expect(loadingIndicator.style.display).toBe('block');
    });

    test('should disable process button when loading', () => {
      uiController.showLoading();
      
      const processButton = document.getElementById('process-button');
      expect(processButton.disabled).toBe(true);
      expect(processButton.style.opacity).toBe('0.6');
      expect(processButton.style.cursor).toBe('not-allowed');
    });

    test('should hide loading indicator when hideLoading is called', () => {
      uiController.showLoading();
      uiController.hideLoading();
      
      const loadingIndicator = document.getElementById('loading-indicator');
      expect(loadingIndicator.style.display).toBe('none');
    });

    test('should re-enable process button when loading is hidden', () => {
      uiController.showLoading();
      uiController.hideLoading();
      
      const processButton = document.getElementById('process-button');
      expect(processButton.disabled).toBe(false);
      expect(processButton.style.opacity).toBe('1');
      expect(processButton.style.cursor).toBe('pointer');
    });
  });

  describe('Error Display', () => {
    test('should display error message with correct styling', () => {
      const errorMessage = 'File upload failed';
      uiController.showError(errorMessage);
      
      const messageContainer = document.getElementById('message-container');
      expect(messageContainer.children.length).toBe(1);
      
      const messageEl = messageContainer.firstChild;
      expect(messageEl.className).toContain('error');
      expect(messageEl.textContent).toContain(errorMessage);
    });

    test('should display error icon in error message', () => {
      uiController.showError('Test error');
      
      const messageContainer = document.getElementById('message-container');
      const messageEl = messageContainer.firstChild;
      const icon = messageEl.querySelector('i');
      
      expect(icon).toBeTruthy();
      expect(icon.className).toContain('fa-exclamation-circle');
    });

    test('should handle multiple error messages', () => {
      uiController.showError('Error 1');
      uiController.showError('Error 2');
      
      const messageContainer = document.getElementById('message-container');
      expect(messageContainer.children.length).toBe(2);
    });
  });

  describe('Success Display', () => {
    test('should display success message with correct styling', () => {
      const successMessage = 'File uploaded successfully';
      uiController.showSuccess(successMessage);
      
      const messageContainer = document.getElementById('message-container');
      expect(messageContainer.children.length).toBe(1);
      
      const messageEl = messageContainer.firstChild;
      expect(messageEl.className).toContain('success');
      expect(messageEl.textContent).toContain(successMessage);
    });

    test('should display success icon in success message', () => {
      uiController.showSuccess('Test success');
      
      const messageContainer = document.getElementById('message-container');
      const messageEl = messageContainer.firstChild;
      const icon = messageEl.querySelector('i');
      
      expect(icon).toBeTruthy();
      expect(icon.className).toContain('fa-check-circle');
    });
  });

  describe('Info Display', () => {
    test('should display audio info for upload mode', () => {
      uiController.currentMode = 'upload';
      
      const audioInfo = {
        filename: 'test-audio.wav',
        duration: 125.5,
        size: 2048000,
        format: 'wav'
      };
      
      uiController.displayAudioInfo(audioInfo);
      
      const uploadFileInfo = document.getElementById('upload-file-info');
      expect(uploadFileInfo.style.display).toBe('block');
      
      const filename = document.getElementById('upload-filename');
      expect(filename.textContent).toBe('test-audio.wav');
      
      const duration = document.getElementById('upload-duration');
      expect(duration.textContent).toBe('02:05');
      
      const size = document.getElementById('upload-size');
      expect(size.textContent).toBe('1.95 MB');
      
      const format = document.getElementById('upload-format');
      expect(format.textContent).toBe('WAV');
    });

    test('should display audio info for record mode', () => {
      uiController.currentMode = 'record';
      
      const audioInfo = {
        duration: 30.2,
        size: 512000,
        format: 'wav'
      };
      
      uiController.displayAudioInfo(audioInfo);
      
      const recordFileInfo = document.getElementById('record-file-info');
      expect(recordFileInfo.style.display).toBe('block');
      
      const duration = document.getElementById('record-duration');
      expect(duration.textContent).toBe('00:30');
      
      const size = document.getElementById('record-size');
      expect(size.textContent).toBe('500.00 KB');
      
      const format = document.getElementById('record-format');
      expect(format.textContent).toBe('WAV');
    });

    test('should show process section after displaying audio info', () => {
      uiController.currentMode = 'upload';
      
      uiController.displayAudioInfo({
        filename: 'test.wav',
        duration: 10,
        size: 100000,
        format: 'wav'
      });
      
      const processSection = document.getElementById('process-section');
      expect(processSection.style.display).toBe('block');
    });

    test('should format duration correctly for edge cases', () => {
      uiController.currentMode = 'upload';
      
      // Test 0 seconds
      uiController.displayAudioInfo({ duration: 0, size: 1000, format: 'wav', filename: 'test.wav' });
      let duration = document.getElementById('upload-duration');
      expect(duration.textContent).toBe('00:00');
      
      // Test 59 seconds
      uiController.displayAudioInfo({ duration: 59, size: 1000, format: 'wav', filename: 'test.wav' });
      duration = document.getElementById('upload-duration');
      expect(duration.textContent).toBe('00:59');
      
      // Test 60 seconds (1 minute)
      uiController.displayAudioInfo({ duration: 60, size: 1000, format: 'wav', filename: 'test.wav' });
      duration = document.getElementById('upload-duration');
      expect(duration.textContent).toBe('01:00');
      
      // Test 3661 seconds (1 hour 1 minute 1 second)
      uiController.displayAudioInfo({ duration: 3661, size: 1000, format: 'wav', filename: 'test.wav' });
      duration = document.getElementById('upload-duration');
      expect(duration.textContent).toBe('61:01');
    });

    test('should format file size correctly for different ranges', () => {
      uiController.currentMode = 'upload';
      
      // Test bytes
      uiController.displayAudioInfo({ duration: 10, size: 500, format: 'wav', filename: 'test.wav' });
      let size = document.getElementById('upload-size');
      expect(size.textContent).toBe('500 B');
      
      // Test kilobytes
      uiController.displayAudioInfo({ duration: 10, size: 5120, format: 'wav', filename: 'test.wav' });
      size = document.getElementById('upload-size');
      expect(size.textContent).toBe('5.00 KB');
      
      // Test megabytes
      uiController.displayAudioInfo({ duration: 10, size: 5242880, format: 'wav', filename: 'test.wav' });
      size = document.getElementById('upload-size');
      expect(size.textContent).toBe('5.00 MB');
    });

    test('should handle missing or invalid audio info gracefully', () => {
      uiController.currentMode = 'upload';
      
      uiController.displayAudioInfo({
        filename: 'test.wav',
        duration: null,
        size: undefined,
        format: 'wav'
      });
      
      const duration = document.getElementById('upload-duration');
      expect(duration.textContent).toBe('-');
      
      const size = document.getElementById('upload-size');
      expect(size.textContent).toBe('-');
    });
  });

  describe('Mode Toggle', () => {
    test('should switch to upload mode correctly', () => {
      uiController.toggleMode('upload');
      
      expect(uiController.currentMode).toBe('upload');
      
      const uploadSection = document.getElementById('upload-section');
      const recordSection = document.getElementById('record-section');
      
      expect(uploadSection.style.display).toBe('block');
      expect(recordSection.style.display).toBe('none');
    });

    test('should switch to record mode correctly', () => {
      uiController.toggleMode('record');
      
      expect(uiController.currentMode).toBe('record');
      
      const uploadSection = document.getElementById('upload-section');
      const recordSection = document.getElementById('record-section');
      
      expect(uploadSection.style.display).toBe('none');
      expect(recordSection.style.display).toBe('block');
    });

    test('should update mode tab active states', () => {
      uiController.toggleMode('record');
      
      const tabs = document.querySelectorAll('.mode-tab');
      const uploadTab = Array.from(tabs).find(tab => tab.getAttribute('data-mode') === 'upload');
      const recordTab = Array.from(tabs).find(tab => tab.getAttribute('data-mode') === 'record');
      
      expect(uploadTab.classList.contains('active')).toBe(false);
      expect(recordTab.classList.contains('active')).toBe(true);
    });

    test('should hide process and result sections when switching modes', () => {
      // Show process and result sections first
      const processSection = document.getElementById('process-section');
      const resultSection = document.getElementById('result-section');
      processSection.style.display = 'block';
      resultSection.style.display = 'block';
      
      // Switch mode
      uiController.toggleMode('record');
      
      expect(processSection.style.display).toBe('none');
      expect(resultSection.style.display).toBe('none');
    });

    test('should hide file info displays when switching modes', () => {
      const uploadFileInfo = document.getElementById('upload-file-info');
      const recordFileInfo = document.getElementById('record-file-info');
      
      uploadFileInfo.style.display = 'block';
      recordFileInfo.style.display = 'block';
      
      uiController.toggleMode('upload');
      
      expect(uploadFileInfo.style.display).toBe('none');
      expect(recordFileInfo.style.display).toBe('none');
    });
  });

  describe('Result Display', () => {
    test('should show result section with audio URL', () => {
      const audioUrl = '/api/download/test-audio-id';
      uiController.showResult(audioUrl);
      
      const resultSection = document.getElementById('result-section');
      expect(resultSection.style.display).toBe('block');
      
      const audioPlayer = document.getElementById('result-audio-player');
      expect(audioPlayer.src).toContain(audioUrl);
    });

    test('should hide result section', () => {
      uiController.showResult('/test-url');
      uiController.hideResult();
      
      const resultSection = document.getElementById('result-section');
      expect(resultSection.style.display).toBe('none');
    });
  });

  describe('Reset Functionality', () => {
    test('should reset UI to initial state', () => {
      // Set up some state
      uiController.showLoading();
      uiController.showResult('/test-url');
      const uploadFileInfo = document.getElementById('upload-file-info');
      const processSection = document.getElementById('process-section');
      uploadFileInfo.style.display = 'block';
      processSection.style.display = 'block';
      
      // Reset
      uiController.reset();
      
      // Verify everything is hidden
      const loadingIndicator = document.getElementById('loading-indicator');
      const resultSection = document.getElementById('result-section');
      
      expect(loadingIndicator.style.display).toBe('none');
      expect(resultSection.style.display).toBe('none');
      expect(uploadFileInfo.style.display).toBe('none');
      expect(processSection.style.display).toBe('none');
    });
  });

  describe('Message Types', () => {
    test('should display info message', () => {
      uiController.showInfo('Processing started');
      
      const messageContainer = document.getElementById('message-container');
      const messageEl = messageContainer.firstChild;
      
      expect(messageEl.className).toContain('info');
    });

    test('should display warning message', () => {
      uiController.showWarning('File size is large');
      
      const messageContainer = document.getElementById('message-container');
      const messageEl = messageContainer.firstChild;
      
      expect(messageEl.className).toContain('warning');
    });
  });
});
