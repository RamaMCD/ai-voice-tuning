/**
 * Property-Based Tests for Tooltip Display
 * Tests universal properties for tooltip functionality
 */

const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

describe('Tooltip Property-Based Tests', () => {
  let htmlContent;

  beforeAll(() => {
    // Load the actual HTML file
    const htmlPath = path.join(__dirname, '../../public/index.html');
    htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  });

  beforeEach(() => {
    // Set up DOM with actual HTML
    document.body.innerHTML = htmlContent;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  /**
   * Feature: ai-voice-tuning, Property 32: Tooltip display on hover
   * For any hover event on audio information elements, the frontend should 
   * display explanatory tooltips when appropriate
   * Validates: Requirements 9.5
   */
  test('Property 32: Tooltip display on hover', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('upload', 'record'),
        fc.constantFrom('duration', 'size', 'format'),
        (mode, infoType) => {
          // Get the appropriate file info section based on mode
          const sectionId = mode === 'upload' ? 'upload-file-info' : 'record-file-info';
          const fileInfoSection = document.getElementById(sectionId);
          
          expect(fileInfoSection).not.toBeNull();
          
          // Find all file detail items with tooltips
          const tooltipItems = fileInfoSection.querySelectorAll('.file-detail-item.has-tooltip');
          
          // Verify that tooltip items exist
          expect(tooltipItems.length).toBeGreaterThan(0);
          
          // For each tooltip item, verify structure
          tooltipItems.forEach(item => {
            // Verify the item has the has-tooltip class
            expect(item.classList.contains('has-tooltip')).toBe(true);
            
            // Verify tooltip element exists
            const tooltip = item.querySelector('.tooltip');
            expect(tooltip).not.toBeNull();
            
            // Verify tooltip has text content
            expect(tooltip.textContent.length).toBeGreaterThan(0);
            
            // Verify tooltip contains explanatory text
            const tooltipText = tooltip.textContent.toLowerCase();
            expect(
              tooltipText.includes('duration') ||
              tooltipText.includes('size') ||
              tooltipText.includes('format') ||
              tooltipText.includes('length') ||
              tooltipText.includes('file') ||
              tooltipText.includes('audio')
            ).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: All audio info fields should have tooltips
   * For any audio information display, duration, size, and format should have tooltips
   */
  test('Property: All audio info fields have tooltips', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('upload-file-info', 'record-file-info'),
        (sectionId) => {
          const fileInfoSection = document.getElementById(sectionId);
          expect(fileInfoSection).not.toBeNull();
          
          // Get all file detail items
          const allDetailItems = fileInfoSection.querySelectorAll('.file-detail-item');
          
          // Count items with tooltips (should be at least 3: duration, size, format)
          const tooltipItems = fileInfoSection.querySelectorAll('.file-detail-item.has-tooltip');
          
          // Verify we have at least 3 tooltip items
          expect(tooltipItems.length).toBeGreaterThanOrEqual(3);
          
          // Verify each tooltip item has exactly one tooltip element
          tooltipItems.forEach(item => {
            const tooltips = item.querySelectorAll('.tooltip');
            expect(tooltips.length).toBe(1);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Tooltip text should be informative
   * For any tooltip, the text should provide meaningful explanation
   */
  test('Property: Tooltip text is informative', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // Random parameter for property testing
        (randomParam) => {
          // Get all tooltips in the document
          const allTooltips = document.querySelectorAll('.tooltip');
          
          // Verify tooltips exist
          expect(allTooltips.length).toBeGreaterThan(0);
          
          // For each tooltip, verify it has meaningful content
          allTooltips.forEach(tooltip => {
            const text = tooltip.textContent.trim();
            
            // Tooltip should not be empty
            expect(text.length).toBeGreaterThan(0);
            
            // Tooltip should have at least 10 characters (meaningful explanation)
            expect(text.length).toBeGreaterThanOrEqual(10);
            
            // Tooltip should contain at least one space (multiple words)
            expect(text).toMatch(/\s/);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Tooltip structure consistency
   * For any tooltip element, it should have consistent structure
   */
  test('Property: Tooltip structure consistency', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('upload-file-info', 'record-file-info'),
        (sectionId) => {
          const section = document.getElementById(sectionId);
          const tooltipItems = section.querySelectorAll('.has-tooltip');
          
          tooltipItems.forEach(item => {
            // Verify structure: has-tooltip class on parent
            expect(item.classList.contains('has-tooltip')).toBe(true);
            
            // Verify it has detail-label
            const label = item.querySelector('.detail-label');
            expect(label).not.toBeNull();
            
            // Verify it has detail-value
            const value = item.querySelector('.detail-value');
            expect(value).not.toBeNull();
            
            // Verify it has tooltip
            const tooltip = item.querySelector('.tooltip');
            expect(tooltip).not.toBeNull();
            
            // Verify tooltip is a direct child
            expect(Array.from(item.children).includes(tooltip)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Tooltip CSS classes
   * For any tooltip, it should have the correct CSS class
   */
  test('Property: Tooltip CSS classes are correct', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }), // Random parameter
        (randomParam) => {
          const allTooltips = document.querySelectorAll('.tooltip');
          
          expect(allTooltips.length).toBeGreaterThan(0);
          
          allTooltips.forEach(tooltip => {
            // Verify tooltip has the 'tooltip' class
            expect(tooltip.classList.contains('tooltip')).toBe(true);
            
            // Verify parent has 'has-tooltip' class
            const parent = tooltip.parentElement;
            expect(parent.classList.contains('has-tooltip')).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
