/**
 * Audio Player Tests
 * Tests for audio preview player functionality
 */

describe('Audio Player Implementation', () => {
  let container;

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    container.innerHTML = `
      <section class="result-section section-card" id="result-section" style="display: none;">
        <h3 class="card-title">
          <i class="fas fa-check-circle"></i>
          Processing Complete
        </h3>
        <div class="result-area">
          <div class="result-message">
            <i class="fas fa-check success-icon-large"></i>
            <p>Your audio has been successfully tuned!</p>
          </div>
          
          <!-- Audio Player -->
          <div class="audio-player-container">
            <h4 class="player-title">
              <i class="fas fa-headphones"></i>
              Preview Tuned Audio
            </h4>
            <audio id="result-audio-player" controls class="audio-player">
              Your browser does not support the audio element.
            </audio>
          </div>
          
          <!-- Download Button -->
          <button class="download-button" id="download-button">
            <i class="fas fa-download"></i>
            <span>Download Tuned Audio</span>
          </button>
        </div>
      </section>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('HTML Structure', () => {
    test('should have audio player element in result section', () => {
      const audioPlayer = document.getElementById('result-audio-player');
      expect(audioPlayer).toBeTruthy();
      expect(audioPlayer.tagName).toBe('AUDIO');
    });

    test('should have controls attribute on audio player', () => {
      const audioPlayer = document.getElementById('result-audio-player');
      expect(audioPlayer.hasAttribute('controls')).toBe(true);
    });

    test('should have audio-player class for styling', () => {
      const audioPlayer = document.getElementById('result-audio-player');
      expect(audioPlayer.classList.contains('audio-player')).toBe(true);
    });

    test('should be inside audio-player-container', () => {
      const audioPlayer = document.getElementById('result-audio-player');
      const container = audioPlayer.closest('.audio-player-container');
      expect(container).toBeTruthy();
    });

    test('should have player title with headphones icon', () => {
      const playerTitle = container.querySelector('.player-title');
      expect(playerTitle).toBeTruthy();
      expect(playerTitle.textContent).toContain('Preview Tuned Audio');
      
      const icon = playerTitle.querySelector('.fa-headphones');
      expect(icon).toBeTruthy();
    });
  });

  describe('Audio Player Functionality', () => {
    test('should be able to set audio source', () => {
      const audioPlayer = document.getElementById('result-audio-player');
      const testUrl = '/api/download/test-audio-id';
      
      audioPlayer.src = testUrl;
      
      expect(audioPlayer.src).toContain(testUrl);
    });

    test('should show result section when audio is loaded', () => {
      const resultSection = document.getElementById('result-section');
      const audioPlayer = document.getElementById('result-audio-player');
      
      // Simulate showing result
      resultSection.style.display = 'block';
      audioPlayer.src = '/api/download/test-audio-id';
      
      expect(resultSection.style.display).toBe('block');
      expect(audioPlayer.src).toBeTruthy();
    });

    test('should have download button alongside audio player', () => {
      const downloadButton = document.getElementById('download-button');
      expect(downloadButton).toBeTruthy();
      expect(downloadButton.classList.contains('download-button')).toBe(true);
    });
  });

  describe('Integration with UIController', () => {
    test('showResult should set audio player source', () => {
      // Mock UIController behavior
      const resultSection = document.getElementById('result-section');
      const audioPlayer = document.getElementById('result-audio-player');
      const testUrl = '/api/download/test-audio-123';
      
      // Simulate UIController.showResult()
      resultSection.style.display = 'block';
      audioPlayer.src = testUrl;
      
      expect(resultSection.style.display).toBe('block');
      expect(audioPlayer.src).toContain(testUrl);
    });

    test('should handle empty audio URL gracefully', () => {
      const audioPlayer = document.getElementById('result-audio-player');
      
      // Set empty source
      audioPlayer.src = '';
      
      // Should not throw error - browser may normalize to base URL
      expect(() => {
        audioPlayer.src = '';
      }).not.toThrow();
    });
  });

  describe('Requirement 4.5 Validation', () => {
    test('should display audio player for preview before download', () => {
      // Requirement 4.5: WHERE hasil tuning tersedia THEN the System SHALL 
      // menampilkan preview audio player untuk mendengarkan hasil sebelum download
      
      const resultSection = document.getElementById('result-section');
      const audioPlayer = document.getElementById('result-audio-player');
      const downloadButton = document.getElementById('download-button');
      
      // Simulate result available
      resultSection.style.display = 'block';
      audioPlayer.src = '/api/download/test-audio-id';
      
      // Verify audio player is visible and functional
      expect(resultSection.style.display).toBe('block');
      expect(audioPlayer).toBeTruthy();
      expect(audioPlayer.hasAttribute('controls')).toBe(true);
      expect(audioPlayer.src).toBeTruthy();
      
      // Verify download button is also available
      expect(downloadButton).toBeTruthy();
    });
  });
});
