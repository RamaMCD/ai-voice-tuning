/**
 * UIController - Manages UI state and visual feedback
 * Handles loading states, error/success messages, and mode switching
 */
class UIController {
  constructor() {
    this.messageContainer = document.getElementById('message-container');
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.processButton = document.getElementById('process-button');
    this.uploadSection = document.getElementById('upload-section');
    this.recordSection = document.getElementById('record-section');
    this.processSection = document.getElementById('process-section');
    this.resultSection = document.getElementById('result-section');
    this.modeTabs = document.querySelectorAll('.mode-tab');
    
    // File info elements for upload mode
    this.uploadFileInfo = document.getElementById('upload-file-info');
    this.uploadFilename = document.getElementById('upload-filename');
    this.uploadDuration = document.getElementById('upload-duration');
    this.uploadSize = document.getElementById('upload-size');
    this.uploadFormat = document.getElementById('upload-format');
    
    // File info elements for record mode
    this.recordFileInfo = document.getElementById('record-file-info');
    this.recordDuration = document.getElementById('record-duration');
    this.recordSize = document.getElementById('record-size');
    this.recordFormat = document.getElementById('record-format');
    
    this.currentMode = 'upload';
    this.messageTimeout = null;
  }

  /**
   * Show loading indicator with animation
   */
  showLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'block';
    }
    if (this.processButton) {
      this.processButton.disabled = true;
      this.processButton.style.opacity = '0.6';
      this.processButton.style.cursor = 'not-allowed';
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'none';
    }
    if (this.processButton) {
      this.processButton.disabled = false;
      this.processButton.style.opacity = '1';
      this.processButton.style.cursor = 'pointer';
    }
  }

  /**
   * Show error message as toast notification
   * @param {string} message - Error message to display
   */
  showError(message) {
    this._showMessage(message, 'error');
  }

  /**
   * Show success message as toast notification
   * @param {string} message - Success message to display
   */
  showSuccess(message) {
    this._showMessage(message, 'success');
  }

  /**
   * Show info message as toast notification
   * @param {string} message - Info message to display
   */
  showInfo(message) {
    this._showMessage(message, 'info');
  }

  /**
   * Show warning message as toast notification
   * @param {string} message - Warning message to display
   */
  showWarning(message) {
    this._showMessage(message, 'warning');
  }

  /**
   * Internal method to show message toast
   * @param {string} message - Message text
   * @param {string} type - Message type (success, error, info, warning)
   */
  _showMessage(message, type) {
    if (!this.messageContainer) return;

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    
    // Add icon based on type
    const iconMap = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      info: 'fa-info-circle',
      warning: 'fa-exclamation-triangle'
    };
    
    const icon = iconMap[type] || 'fa-info-circle';
    
    messageEl.innerHTML = `
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    `;
    
    // Add to container
    this.messageContainer.appendChild(messageEl);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      messageEl.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl);
        }
      }, 300);
    }, 5000);
  }

  /**
   * Update progress percentage (placeholder for future progress bar)
   * @param {number} percentage - Progress percentage (0-100)
   */
  updateProgress(percentage) {
    // Placeholder for progress bar implementation
    // Can be extended in the future to show actual progress
    console.log(`Progress: ${percentage}%`);
  }

  /**
   * Display audio information in the UI
   * @param {Object} info - Audio metadata object
   * @param {string} info.filename - Audio filename
   * @param {number} info.duration - Duration in seconds
   * @param {number} info.size - File size in bytes
   * @param {string} info.format - File format (wav, mp3)
   */
  displayAudioInfo(info) {
    const mode = this.currentMode;
    
    if (mode === 'upload') {
      this._displayUploadInfo(info);
    } else if (mode === 'record') {
      this._displayRecordInfo(info);
    }
    
    // Show process section after displaying info
    if (this.processSection) {
      this.processSection.style.display = 'block';
    }
  }

  /**
   * Display audio info for upload mode
   * @param {Object} info - Audio metadata
   */
  _displayUploadInfo(info) {
    if (this.uploadFilename) {
      this.uploadFilename.textContent = info.filename || '-';
    }
    if (this.uploadDuration) {
      this.uploadDuration.textContent = this._formatDuration(info.duration);
    }
    if (this.uploadSize) {
      this.uploadSize.textContent = this._formatFileSize(info.size);
    }
    if (this.uploadFormat) {
      this.uploadFormat.textContent = (info.format || '-').toUpperCase();
    }
    if (this.uploadFileInfo) {
      this.uploadFileInfo.style.display = 'block';
    }
  }

  /**
   * Display audio info for record mode
   * @param {Object} info - Audio metadata
   */
  _displayRecordInfo(info) {
    if (this.recordDuration) {
      this.recordDuration.textContent = this._formatDuration(info.duration);
    }
    if (this.recordSize) {
      this.recordSize.textContent = this._formatFileSize(info.size);
    }
    if (this.recordFormat) {
      this.recordFormat.textContent = 'WAV';
    }
    if (this.recordFileInfo) {
      this.recordFileInfo.style.display = 'block';
    }
  }

  /**
   * Format duration in seconds to MM:SS
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  _formatDuration(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '-';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format file size in bytes to human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  _formatFileSize(bytes) {
    if (bytes === null || bytes === undefined || isNaN(bytes)) return '-';
    
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  /**
   * Toggle between upload and record modes
   * @param {string} mode - Mode to switch to ('upload' or 'record')
   */
  toggleMode(mode) {
    this.currentMode = mode;
    
    // Update mode tabs
    this.modeTabs.forEach(tab => {
      const tabMode = tab.getAttribute('data-mode');
      if (tabMode === mode) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Show/hide sections based on mode
    if (mode === 'upload') {
      if (this.uploadSection) {
        this.uploadSection.style.display = 'block';
        this.uploadSection.classList.add('active');
      }
      if (this.recordSection) {
        this.recordSection.style.display = 'none';
        this.recordSection.classList.remove('active');
      }
    } else if (mode === 'record') {
      if (this.uploadSection) {
        this.uploadSection.style.display = 'none';
        this.uploadSection.classList.remove('active');
      }
      if (this.recordSection) {
        this.recordSection.style.display = 'block';
        this.recordSection.classList.add('active');
      }
    }
    
    // Hide process and result sections when switching modes
    if (this.processSection) {
      this.processSection.style.display = 'none';
    }
    if (this.resultSection) {
      this.resultSection.style.display = 'none';
    }
    
    // Hide file info displays
    if (this.uploadFileInfo) {
      this.uploadFileInfo.style.display = 'none';
    }
    if (this.recordFileInfo) {
      this.recordFileInfo.style.display = 'none';
    }
  }

  /**
   * Show result section with audio player
   * @param {string} audioUrl - URL to the tuned audio file
   */
  showResult(audioUrl) {
    if (this.resultSection) {
      this.resultSection.style.display = 'block';
      
      // Set audio player source
      const audioPlayer = document.getElementById('result-audio-player');
      if (audioPlayer && audioUrl) {
        audioPlayer.src = audioUrl;
      }
    }
  }

  /**
   * Hide result section
   */
  hideResult() {
    if (this.resultSection) {
      this.resultSection.style.display = 'none';
    }
  }

  /**
   * Reset UI to initial state
   */
  reset() {
    this.hideLoading();
    this.hideResult();
    
    if (this.uploadFileInfo) {
      this.uploadFileInfo.style.display = 'none';
    }
    if (this.recordFileInfo) {
      this.recordFileInfo.style.display = 'none';
    }
    if (this.processSection) {
      this.processSection.style.display = 'none';
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIController;
}
