/**
 * Property-Based Tests for UIController
 * Tests universal properties that should hold across all inputs
 */

const fc = require('fast-check');

describe('UIController Property-Based Tests', () => {
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
      recordFormat: document.createElement('span')
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

  /**
   * Feature: ai-voice-tuning, Property 3: Upload confirmation display
   * For any successfully uploaded audio file, the system should display 
   * a confirmation message indicating the file is ready for processing
   * Validates: Requirements 1.3
   */
  test('Property 3: Upload confirmation display', () => {
    fc.assert(
      fc.property(
        fc.record({
          filename: fc.string({ minLength: 1, maxLength: 100 }),
          duration: fc.float({ min: Math.fround(0.1), max: Math.fround(3600) }),
          size: fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
          format: fc.constantFrom('wav', 'mp3')
        }),
        (audioInfo) => {
          // Set mode to upload
          uiController.currentMode = 'upload';
          
          // Display audio info
          uiController.displayAudioInfo(audioInfo);
          
          // Verify upload file info is displayed
          const uploadFileInfo = document.getElementById('upload-file-info');
          expect(uploadFileInfo.style.display).toBe('block');
          
          // Verify process section is shown (ready for processing)
          const processSection = document.getElementById('process-section');
          expect(processSection.style.display).toBe('block');
          
          // Verify filename is displayed
          const filenameEl = document.getElementById('upload-filename');
          expect(filenameEl.textContent).toBe(audioInfo.filename);
          
          // Verify format is displayed
          const formatEl = document.getElementById('upload-format');
          expect(formatEl.textContent).toBe(audioInfo.format.toUpperCase());
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: ai-voice-tuning, Property 8: Processing indicator display
   * For any audio being processed by the AI engine, the system should 
   * display a loading indicator to the user
   * Validates: Requirements 3.2
   */
  test('Property 8: Processing indicator display', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // Random state to test idempotence
        (randomState) => {
          // Show loading
          uiController.showLoading();
          
          // Verify loading indicator is visible
          const loadingIndicator = document.getElementById('loading-indicator');
          expect(loadingIndicator.style.display).toBe('block');
          
          // Verify process button is disabled during loading
          const processButton = document.getElementById('process-button');
          expect(processButton.disabled).toBe(true);
          expect(processButton.style.opacity).toBe('0.6');
          expect(processButton.style.cursor).toBe('not-allowed');
          
          // Hide loading
          uiController.hideLoading();
          
          // Verify loading indicator is hidden
          expect(loadingIndicator.style.display).toBe('none');
          
          // Verify process button is re-enabled
          expect(processButton.disabled).toBe(false);
          expect(processButton.style.opacity).toBe('1');
          expect(processButton.style.cursor).toBe('pointer');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Error messages should always be displayed
   * For any error message string, the system should create and display a toast
   */
  test('Property: Error message display', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => !s.includes('<') && !s.includes('>')),
        (errorMessage) => {
          const messageContainer = document.getElementById('message-container');
          const initialChildCount = messageContainer.children.length;
          
          // Show error
          uiController.showError(errorMessage);
          
          // Verify message was added
          expect(messageContainer.children.length).toBe(initialChildCount + 1);
          
          // Verify message contains error text
          const lastMessage = messageContainer.lastChild;
          expect(lastMessage.textContent).toContain(errorMessage);
          expect(lastMessage.className).toContain('error');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Success messages should always be displayed
   * For any success message string, the system should create and display a toast
   */
  test('Property: Success message display', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => !s.includes('<') && !s.includes('>')),
        (successMessage) => {
          const messageContainer = document.getElementById('message-container');
          const initialChildCount = messageContainer.children.length;
          
          // Show success
          uiController.showSuccess(successMessage);
          
          // Verify message was added
          expect(messageContainer.children.length).toBe(initialChildCount + 1);
          
          // Verify message contains success text
          const lastMessage = messageContainer.lastChild;
          expect(lastMessage.textContent).toContain(successMessage);
          expect(lastMessage.className).toContain('success');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Mode toggle should always update UI state
   * For any mode (upload/record), toggling should update the UI correctly
   */
  test('Property: Mode toggle updates UI state', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('upload', 'record'),
        (mode) => {
          // Toggle mode
          uiController.toggleMode(mode);
          
          // Verify current mode is updated
          expect(uiController.currentMode).toBe(mode);
          
          // Verify correct section is visible
          const uploadSection = document.getElementById('upload-section');
          const recordSection = document.getElementById('record-section');
          
          if (mode === 'upload') {
            expect(uploadSection.style.display).toBe('block');
            expect(recordSection.style.display).toBe('none');
          } else {
            expect(uploadSection.style.display).toBe('none');
            expect(recordSection.style.display).toBe('block');
          }
          
          // Verify process and result sections are hidden
          const processSection = document.getElementById('process-section');
          const resultSection = document.getElementById('result-section');
          expect(processSection.style.display).toBe('none');
          expect(resultSection.style.display).toBe('none');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Audio info display should format data correctly
   * For any valid audio metadata, the display should format it properly
   */
  test('Property: Audio info formatting', () => {
    fc.assert(
      fc.property(
        fc.record({
          filename: fc.string({ minLength: 1 }),
          duration: fc.float({ min: Math.fround(0), max: Math.fround(3600) }),
          size: fc.integer({ min: 0, max: 100 * 1024 * 1024 }),
          format: fc.constantFrom('wav', 'mp3', 'WAV', 'MP3')
        }),
        (audioInfo) => {
          uiController.currentMode = 'upload';
          uiController.displayAudioInfo(audioInfo);
          
          // Verify duration is formatted as MM:SS
          const durationEl = document.getElementById('upload-duration');
          const durationText = durationEl.textContent;
          if (audioInfo.duration > 0) {
            expect(durationText).toMatch(/^\d{2}:\d{2}$/);
          }
          
          // Verify size is formatted with units
          const sizeEl = document.getElementById('upload-size');
          const sizeText = sizeEl.textContent;
          if (audioInfo.size > 0) {
            expect(sizeText).toMatch(/\d+(\.\d+)?\s*(B|KB|MB)$/);
          }
          
          // Verify format is uppercase
          const formatEl = document.getElementById('upload-format');
          expect(formatEl.textContent).toBe(audioInfo.format.toUpperCase());
        }
      ),
      { numRuns: 100 }
    );
  });
});
