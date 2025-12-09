const { spawn } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');

class PythonService {
  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python';
    this.scriptPath = process.env.AI_SCRIPT_PATH || path.join(__dirname, '../../ai_engine/pitch_correction.py');
    this.timeout = parseInt(process.env.PYTHON_TIMEOUT) || 30000; // 30 seconds default
  }

  /**
   * Process audio file using Python AI engine
   * @param {string} audioFilePath - Full path to audio file
   * @returns {Promise<string>} Path to output tuned audio file
   */
  async processAudio(audioFilePath) {
    return new Promise((resolve, reject) => {
      logger.info(`Starting Python process for: ${audioFilePath}`);
      
      // Spawn Python process with audio file path as argument
      const python = spawn(this.pythonPath, [this.scriptPath, audioFilePath]);
      
      let outputPath = '';
      let errorOutput = '';
      let timeoutId = null;
      let processCompleted = false;

      // Set timeout handler
      timeoutId = setTimeout(() => {
        if (!processCompleted) {
          processCompleted = true;
          logger.error(`Python process timeout after ${this.timeout}ms`);
          python.kill('SIGTERM');
          reject(new Error(`Processing timeout: exceeded ${this.timeout}ms`));
        }
      }, this.timeout);

      // Capture stdout for output path
      python.stdout.on('data', (data) => {
        const output = data.toString();
        logger.info(`Python stdout: ${output}`);
        outputPath += output;
      });

      // Capture stderr for errors
      python.stderr.on('data', (data) => {
        const error = data.toString();
        logger.error(`Python stderr: ${error}`);
        errorOutput += error;
      });

      // Handle process exit
      python.on('close', (code) => {
        if (processCompleted) {
          return; // Already handled by timeout
        }
        
        processCompleted = true;
        clearTimeout(timeoutId);

        logger.info(`Python process exited with code: ${code}`);

        if (code === 0) {
          // Success - return output path
          const trimmedPath = outputPath.trim();
          
          if (!trimmedPath) {
            reject(new Error('Python process succeeded but returned no output path'));
            return;
          }
          
          logger.info(`Audio processing completed: ${trimmedPath}`);
          resolve(trimmedPath);
        } else {
          // Error - parse error message from stderr
          const errorMessage = this.parseErrorMessage(errorOutput);
          logger.error(`Python process failed: ${errorMessage}`);
          reject(new Error(errorMessage));
        }
      });

      // Handle process errors (e.g., Python not found)
      python.on('error', (error) => {
        if (processCompleted) {
          return;
        }
        
        processCompleted = true;
        clearTimeout(timeoutId);
        
        logger.error(`Failed to spawn Python process: ${error.message}`);
        reject(new Error(`Failed to start Python engine: ${error.message}`));
      });
    });
  }

  /**
   * Parse error message from Python stderr output
   * @param {string} errorOutput - stderr output from Python
   * @returns {string} Parsed error message
   */
  parseErrorMessage(errorOutput) {
    // Python script outputs errors in format: ERROR:TYPE:message
    const errorMatch = errorOutput.match(/ERROR:([A-Z_]+):(.+)/);
    
    if (errorMatch) {
      const errorType = errorMatch[1];
      const errorMessage = errorMatch[2].trim();
      
      // Map error types to user-friendly messages
      const errorMessages = {
        'FILE_NOT_FOUND': 'Audio file not found',
        'INVALID_ARGUMENTS': 'Invalid arguments provided to Python engine',
        'PROCESSING_FAILED': `Audio processing failed: ${errorMessage}`
      };
      
      return errorMessages[errorType] || `Processing error: ${errorMessage}`;
    }
    
    // If no structured error, return raw stderr
    return errorOutput.trim() || 'Unknown Python processing error';
  }

  /**
   * Validate that Python and required libraries are available
   * @returns {Promise<boolean>} True if Python environment is valid
   */
  async validateEnvironment() {
    try {
      const result = await new Promise((resolve, reject) => {
        const python = spawn(this.pythonPath, ['-c', 'import librosa, soundfile, numpy; print("OK")']);
        
        let output = '';
        python.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        python.on('close', (code) => {
          if (code === 0 && output.includes('OK')) {
            resolve(true);
          } else {
            reject(new Error('Python libraries not available'));
          }
        });
        
        python.on('error', (error) => {
          reject(error);
        });
      });
      
      logger.info('Python environment validation successful');
      return result;
    } catch (error) {
      logger.error(`Python environment validation failed: ${error.message}`);
      return false;
    }
  }
}

module.exports = PythonService;
