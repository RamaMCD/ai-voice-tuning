# Design Document

## Overview

Website AI Tuning Suara adalah aplikasi web full-stack yang mengintegrasikan Node.js backend dengan Python AI engine untuk melakukan pitch correction otomatis pada audio. Sistem ini dirancang dengan arsitektur client-server yang memisahkan concerns antara presentation layer (frontend), business logic (backend), dan AI processing (Python engine).

Aplikasi ini menggunakan pendekatan asynchronous processing dimana user mengunggah/merekam audio, server memproses melalui Python script, dan hasil dikembalikan untuk diunduh. Sistem tidak real-time untuk menyederhanakan implementasi dan fokus pada konsep AI serta alur sistem yang jelas.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   HTML/CSS   │  │  JavaScript  │  │  Web Audio   │      │
│  │              │  │              │  │     API      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTP/HTTPS (REST API)
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Node.js Backend                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Express    │  │    Multer    │  │ Child Process│      │
│  │   Router     │  │  (Upload)    │  │   (Python)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ File Manager │  │Error Handler │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                    spawn/exec (CLI)
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Python AI Engine                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   librosa    │  │  soundfile   │  │    numpy     │      │
│  │ (Analysis)   │  │   (I/O)      │  │ (Processing) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐                                           │
│  │Pitch Correct │                                           │
│  │  Algorithm   │                                           │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                    File System (Storage)
                            │
┌─────────────────────────────────────────────────────────────┐
│                    File Storage                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   uploads/   │  │   outputs/   │  │    logs/     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- HTML5 untuk struktur
- CSS3 untuk styling (dark theme, animations)
- Vanilla JavaScript untuk interaksi
- Web Audio API untuk recording
- Fetch API untuk komunikasi dengan backend

**Backend:**
- Node.js v16+ sebagai runtime
- Express.js v4.x untuk web framework
- Multer untuk file upload handling
- child_process untuk menjalankan Python script
- fs/promises untuk file operations
- path untuk path management

**AI Engine:**
- Python 3.8+
- librosa untuk audio analysis dan pitch detection
- soundfile untuk audio I/O
- numpy untuk numerical operations
- scipy untuk signal processing (optional)

**Development Tools:**
- nodemon untuk auto-restart development server
- dotenv untuk environment variables
- morgan untuk HTTP request logging

## Components and Interfaces

### Frontend Components

#### 1. Main UI Component
```javascript
// Struktur HTML utama
- Header (judul aplikasi)
- Mode Selector (Upload / Record)
- Upload Section
  - File input
  - File info display
- Record Section
  - Record button
  - Recording indicator
  - Timer display
- Process Section
  - Process button
  - Loading indicator
  - Progress display
- Result Section
  - Audio player (preview)
  - Download button
  - Audio info display
- Footer
```

#### 2. Audio Recorder Module
```javascript
class AudioRecorder {
  constructor()
  async requestMicrophoneAccess()
  startRecording()
  stopRecording()
  getAudioBlob()
  getDuration()
}
```

#### 3. API Client Module
```javascript
class APIClient {
  async uploadAudio(file)
  async processAudio(audioId)
  async downloadResult(audioId)
  async getAudioInfo(audioId)
}
```

#### 4. UI Controller Module
```javascript
class UIController {
  showLoading()
  hideLoading()
  showError(message)
  showSuccess(message)
  updateProgress(percentage)
  displayAudioInfo(info)
  toggleMode(mode)
}
```

### Backend Components

#### 1. Express Server (server.js)
```javascript
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(morgan('dev'));

// Routes
app.post('/api/upload', uploadController.upload);
app.post('/api/process', processController.process);
app.get('/api/download/:id', downloadController.download);
app.get('/api/info/:id', infoController.getInfo);

// Error handling
app.use(errorHandler);
```

#### 2. Upload Controller
```javascript
const multer = require('multer');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
```

#### 3. Process Controller
```javascript
const { spawn } = require('child_process');

async function processAudio(audioPath) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', [
      'ai_engine/pitch_correction.py',
      audioPath
    ]);
    
    let outputPath = '';
    
    python.stdout.on('data', (data) => {
      outputPath += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      console.error('Python Error:', data.toString());
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath.trim());
      } else {
        reject(new Error('Python process failed'));
      }
    });
  });
}
```

#### 4. File Manager
```javascript
class FileManager {
  async saveFile(buffer, filename)
  async deleteFile(filepath)
  async getFileInfo(filepath)
  async cleanupOldFiles(directory, maxAge)
  generateUniqueFilename(originalName)
}
```

#### 5. Error Handler Middleware
```javascript
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File terlalu besar. Maksimal 10MB'
      });
    }
  }
  
  res.status(500).json({
    error: err.message || 'Terjadi kesalahan server'
  });
}
```

### Python AI Engine Components

#### 1. Main Script (pitch_correction.py)
```python
import sys
import librosa
import soundfile as sf
import numpy as np

def main(input_path):
    try:
        # Load audio
        y, sr = librosa.load(input_path, sr=None)
        
        # Pitch correction
        y_corrected = pitch_correction(y, sr)
        
        # Save output
        output_path = generate_output_path(input_path)
        sf.write(output_path, y_corrected, sr)
        
        # Return output path
        print(output_path)
        sys.exit(0)
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pitch_correction.py <input_file>", file=sys.stderr)
        sys.exit(1)
    
    main(sys.argv[1])
```

#### 2. Pitch Detection Module
```python
def detect_pitch(y, sr):
    """
    Deteksi pitch menggunakan librosa
    Returns: array of pitch values in Hz
    """
    pitches, magnitudes = librosa.piptrack(
        y=y,
        sr=sr,
        fmin=80,  # Minimum frequency (Hz)
        fmax=400  # Maximum frequency (Hz)
    )
    
    # Extract pitch per frame
    pitch_values = []
    for t in range(pitches.shape[1]):
        index = magnitudes[:, t].argmax()
        pitch = pitches[index, t]
        pitch_values.append(pitch)
    
    return np.array(pitch_values)
```

#### 3. Pitch Correction Module
```python
def pitch_correction(y, sr, correction_strength=0.5):
    """
    Koreksi pitch sederhana menggunakan time stretching
    correction_strength: 0.0 (no correction) to 1.0 (full correction)
    """
    # Detect pitch
    pitches = detect_pitch(y, sr)
    
    # Find target pitch (quantize to nearest semitone)
    target_pitches = quantize_to_semitones(pitches)
    
    # Calculate pitch shift ratio
    pitch_shift_ratio = np.median(target_pitches / (pitches + 1e-10))
    
    # Apply pitch shift
    if 0.5 < pitch_shift_ratio < 2.0:  # Reasonable range
        y_corrected = librosa.effects.pitch_shift(
            y, 
            sr=sr, 
            n_steps=hz_to_semitones(pitch_shift_ratio)
        )
        
        # Blend original and corrected
        y_result = (1 - correction_strength) * y + correction_strength * y_corrected
        return y_result
    
    return y  # Return original if ratio is unreasonable

def quantize_to_semitones(pitches):
    """
    Quantize pitch values to nearest musical semitone
    """
    # Convert Hz to MIDI note numbers
    midi_notes = librosa.hz_to_midi(pitches + 1e-10)
    
    # Round to nearest semitone
    quantized_midi = np.round(midi_notes)
    
    # Convert back to Hz
    quantized_hz = librosa.midi_to_hz(quantized_midi)
    
    return quantized_hz

def hz_to_semitones(ratio):
    """
    Convert frequency ratio to semitones
    """
    return 12 * np.log2(ratio)
```

## Data Models

### Audio File Metadata
```javascript
{
  id: String,              // Unique identifier (UUID)
  originalName: String,    // Original filename
  filename: String,        // Stored filename
  filepath: String,        // Full path to file
  mimetype: String,        // MIME type (audio/wav, audio/mpeg)
  size: Number,            // File size in bytes
  duration: Number,        // Duration in seconds
  format: String,          // File format (wav, mp3)
  uploadedAt: Date,        // Upload timestamp
  status: String,          // 'uploaded', 'processing', 'completed', 'failed'
  outputPath: String,      // Path to tuned audio (if completed)
  error: String            // Error message (if failed)
}
```

### API Request/Response Formats

#### Upload Request
```javascript
POST /api/upload
Content-Type: multipart/form-data

{
  audio: File  // Audio file (wav/mp3)
}
```

#### Upload Response
```javascript
{
  success: true,
  data: {
    id: "abc123",
    filename: "audio.wav",
    size: 1024000,
    duration: 30.5,
    format: "wav"
  }
}
```

#### Process Request
```javascript
POST /api/process
Content-Type: application/json

{
  audioId: "abc123"
}
```

#### Process Response
```javascript
{
  success: true,
  data: {
    id: "abc123",
    status: "completed",
    outputPath: "/outputs/abc123-tuned.wav",
    processingTime: 5.2
  }
}
```

#### Error Response
```javascript
{
  success: false,
  error: "File terlalu besar. Maksimal 10MB"
}
```

## Correctnes
s Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### File Upload Properties

**Property 1: Valid audio file acceptance**
*For any* audio file with format .wav or .mp3, the system should successfully accept and store the file on the server
**Validates: Requirements 1.1**

**Property 2: Invalid file type rejection**
*For any* file with format other than .wav or .mp3, the system should reject the file and return an error message
**Validates: Requirements 1.2**

**Property 3: Upload confirmation display**
*For any* successfully uploaded audio file, the system should display a confirmation message indicating the file is ready for processing
**Validates: Requirements 1.3**

### Audio Recording Properties

**Property 4: Microphone permission request**
*For any* record button click event, the system should trigger a browser microphone permission request
**Validates: Requirements 2.1**

**Property 5: Recording indicator visibility**
*For any* active recording session, the system should display a visual indicator showing that recording is in progress
**Validates: Requirements 2.2**

**Property 6: Recording output format**
*For any* stopped recording, the system should produce an audio file in .wav format
**Validates: Requirements 2.3**

### Audio Processing Properties

**Property 7: Python engine invocation**
*For any* audio processing request, the backend server should spawn a Python child process to execute the AI engine
**Validates: Requirements 3.1**

**Property 8: Processing indicator display**
*For any* audio being processed by the AI engine, the system should display a loading indicator to the user
**Validates: Requirements 3.2**

**Property 9: Tuned audio generation**
*For any* successfully completed pitch correction process, the system should generate a new tuned audio file
**Validates: Requirements 3.3**

**Property 10: Processing error handling**
*For any* failed pitch correction process, the system should log the error to the server console and display an error message to the user
**Validates: Requirements 3.4**

**Property 11: Pitch correction application**
*For any* audio with detected pitch values, the AI engine should apply correction to quantize pitches to the nearest musical semitone
**Validates: Requirements 3.5**

### Download and Cleanup Properties

**Property 12: Download button availability**
*For any* completed tuning process, the system should display a download button for the tuned audio
**Validates: Requirements 4.1**

**Property 13: File download delivery**
*For any* download button click, the system should send the tuned audio file to the user's browser
**Validates: Requirements 4.2**

**Property 14: Tuned filename convention**
*For any* downloaded tuned audio file, the filename should contain the word "tuned"
**Validates: Requirements 4.3**

**Property 15: Temporary file cleanup**
*For any* tuned audio file that has been downloaded, the backend server should delete the temporary files after 5 minutes
**Validates: Requirements 4.4**

### UI Interaction Properties

**Property 16: Processing animation display**
*For any* audio in processing state, the frontend should display waveform or audio visualization animation
**Validates: Requirements 5.2**

**Property 17: Button interaction feedback**
*For any* button interaction (click, hover), the frontend should provide visual feedback such as hover effects or animations
**Validates: Requirements 5.3**

### Error Handling Properties

**Property 18: Server error logging**
*For any* error occurring in the backend server, the system should write the error details to a log file
**Validates: Requirements 6.1**

**Property 19: AI processing error communication**
*For any* AI engine processing failure, the system should send an informative error message to the user
**Validates: Requirements 6.2**

**Property 20: Corrupt file detection**
*For any* corrupt or invalid audio file, the system should detect and reject it before processing begins
**Validates: Requirements 6.3**

### Backend-Python Integration Properties

**Property 21: Audio file storage**
*For any* audio received by the backend server, the file should be saved to the temporary folder
**Validates: Requirements 7.1**

**Property 22: Python script execution**
*For any* saved audio file, the backend server should execute the Python script using child_process
**Validates: Requirements 7.2**

**Property 23: File path parameter passing**
*For any* Python script invocation, the backend server should pass the audio file path as a command-line parameter
**Validates: Requirements 7.3**

**Property 24: Output path return**
*For any* successfully completed AI engine execution, the Python script should return the path to the tuned audio file
**Validates: Requirements 7.4**

**Property 25: Python communication error handling**
*For any* failed communication with the Python process, the backend server should handle the error gracefully and notify the user
**Validates: Requirements 7.5**

### Performance and Stability Properties

**Property 26: Long process time estimation**
*For any* processing operation taking longer than 30 seconds, the system should display an estimated time remaining
**Validates: Requirements 8.2**

**Property 27: Automatic temporary file cleanup**
*For any* temporary files created during processing, the backend server should automatically delete them after a specified period
**Validates: Requirements 8.4**

**Property 28: Single request stability**
*For any* single processing request, the system should complete without crashing
**Validates: Requirements 8.5**

### Audio Information Display Properties

**Property 29: Duration display**
*For any* uploaded or recorded audio, the system should display the audio duration
**Validates: Requirements 9.1**

**Property 30: File size display**
*For any* uploaded or recorded audio, the system should display the file size
**Validates: Requirements 9.2**

**Property 31: Format display**
*For any* uploaded or recorded audio, the system should display the file format
**Validates: Requirements 9.3**

**Property 32: Tooltip display on hover**
*For any* hover event on audio information elements, the frontend should display explanatory tooltips when appropriate
**Validates: Requirements 9.5**

## Error Handling

### Frontend Error Handling

**User-Facing Errors:**
- File type validation errors (format tidak didukung)
- File size validation errors (file terlalu besar)
- Microphone permission denied
- Network errors (gagal menghubungi server)
- Processing timeout errors

**Error Display Strategy:**
```javascript
class ErrorHandler {
  static show(error) {
    const errorTypes = {
      'FILE_TOO_LARGE': 'File terlalu besar. Maksimal 10MB',
      'INVALID_FORMAT': 'Format file tidak didukung. Gunakan .wav atau .mp3',
      'MIC_DENIED': 'Akses mikrofon ditolak. Izinkan akses untuk merekam',
      'NETWORK_ERROR': 'Gagal terhubung ke server. Periksa koneksi internet',
      'PROCESSING_FAILED': 'Gagal memproses audio. Coba lagi',
      'TIMEOUT': 'Proses memakan waktu terlalu lama. Coba dengan file lebih pendek'
    };
    
    const message = errorTypes[error.code] || error.message;
    this.displayErrorModal(message);
  }
  
  static displayErrorModal(message) {
    // Show error in UI with animation
  }
}
```

### Backend Error Handling

**Server-Side Errors:**
- Multer upload errors (file size, file type)
- File system errors (disk full, permission denied)
- Python process errors (script not found, execution failed)
- Audio processing errors (corrupt file, unsupported format)

**Error Logging:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log' }),
    new winston.transports.Console()
  ]
});

function logError(error, context) {
  logger.error({
    message: error.message,
    stack: error.stack,
    context: context,
    timestamp: new Date().toISOString()
  });
}
```

**Error Response Format:**
```javascript
function sendError(res, statusCode, errorCode, message) {
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message
    }
  });
}
```

### Python Error Handling

**AI Engine Errors:**
- File not found errors
- Audio loading errors (corrupt file, unsupported format)
- Processing errors (pitch detection failed)
- Output writing errors (disk full)

**Error Handling Pattern:**
```python
import sys
import traceback

def main(input_path):
    try:
        # Processing logic
        pass
    except FileNotFoundError:
        print("ERROR:FILE_NOT_FOUND", file=sys.stderr)
        sys.exit(1)
    except librosa.LibrosaError as e:
        print(f"ERROR:AUDIO_PROCESSING:{str(e)}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR:UNKNOWN:{str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
```

### Error Recovery Strategies

1. **Automatic Retry:** Untuk network errors, retry hingga 3 kali dengan exponential backoff
2. **Graceful Degradation:** Jika pitch correction gagal, kembalikan audio original dengan warning
3. **Cleanup on Error:** Hapus file temporary jika terjadi error di tengah proses
4. **User Notification:** Selalu informasikan user dengan pesan yang jelas dan actionable

## Testing Strategy

### Unit Testing

**Frontend Unit Tests (Jest):**
- AudioRecorder class methods
- APIClient request/response handling
- UIController state management
- File validation functions
- Error handling functions

**Backend Unit Tests (Jest/Mocha):**
- File upload validation
- File manager operations
- API route handlers
- Error middleware
- Python process spawning

**Python Unit Tests (pytest):**
- Pitch detection accuracy
- Pitch correction algorithm
- File I/O operations
- Error handling

### Property-Based Testing

**Property-Based Testing Library:**
- **JavaScript/Node.js:** fast-check
- **Python:** Hypothesis

**Configuration:**
- Minimum 100 iterations per property test
- Each property test must reference the design document property using format: `**Feature: ai-voice-tuning, Property {number}: {property_text}**`

**JavaScript Property Tests (fast-check):**

```javascript
const fc = require('fast-check');

describe('File Upload Properties', () => {
  test('Property 1: Valid audio file acceptance', () => {
    /**
     * Feature: ai-voice-tuning, Property 1: Valid audio file acceptance
     * For any audio file with format .wav or .mp3, the system should 
     * successfully accept and store the file on the server
     */
    fc.assert(
      fc.property(
        fc.record({
          filename: fc.string(),
          mimetype: fc.constantFrom('audio/wav', 'audio/mpeg'),
          size: fc.integer({ min: 1, max: 10 * 1024 * 1024 })
        }),
        async (audioFile) => {
          const result = await uploadAudio(audioFile);
          expect(result.success).toBe(true);
          expect(fs.existsSync(result.filepath)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property 2: Invalid file type rejection', () => {
    /**
     * Feature: ai-voice-tuning, Property 2: Invalid file type rejection
     * For any file with format other than .wav or .mp3, the system should 
     * reject the file and return an error message
     */
    fc.assert(
      fc.property(
        fc.record({
          filename: fc.string(),
          mimetype: fc.string().filter(m => !['audio/wav', 'audio/mpeg'].includes(m)),
          size: fc.integer({ min: 1, max: 10 * 1024 * 1024 })
        }),
        async (invalidFile) => {
          const result = await uploadAudio(invalidFile);
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Python Property Tests (Hypothesis):**

```python
from hypothesis import given, strategies as st
import numpy as np

class TestPitchCorrection:
    @given(
        audio=st.lists(
            st.floats(min_value=-1.0, max_value=1.0),
            min_size=1000,
            max_size=100000
        ),
        sample_rate=st.integers(min_value=8000, max_value=48000)
    )
    def test_property_11_pitch_correction_application(self, audio, sample_rate):
        """
        Feature: ai-voice-tuning, Property 11: Pitch correction application
        For any audio with detected pitch values, the AI engine should apply 
        correction to quantize pitches to the nearest musical semitone
        """
        y = np.array(audio)
        y_corrected = pitch_correction(y, sample_rate)
        
        # Verify output has same length
        assert len(y_corrected) == len(y)
        
        # Verify output is valid audio
        assert np.all(np.abs(y_corrected) <= 1.0)
```

### Integration Testing

**End-to-End Flow Tests:**
1. Upload → Process → Download flow
2. Record → Process → Download flow
3. Error scenarios (invalid file, processing failure)
4. Concurrent request handling

**Integration Test Example:**
```javascript
describe('Complete Audio Processing Flow', () => {
  it('should process uploaded audio end-to-end', async () => {
    // Upload
    const uploadResponse = await request(app)
      .post('/api/upload')
      .attach('audio', 'test/fixtures/sample.wav');
    
    expect(uploadResponse.status).toBe(200);
    const audioId = uploadResponse.body.data.id;
    
    // Process
    const processResponse = await request(app)
      .post('/api/process')
      .send({ audioId });
    
    expect(processResponse.status).toBe(200);
    expect(processResponse.body.data.status).toBe('completed');
    
    // Download
    const downloadResponse = await request(app)
      .get(`/api/download/${audioId}`);
    
    expect(downloadResponse.status).toBe(200);
    expect(downloadResponse.headers['content-type']).toContain('audio');
  });
});
```

### Test Data and Fixtures

**Audio Test Files:**
- `sample-short.wav` (5 seconds, 44.1kHz)
- `sample-long.wav` (45 seconds, 44.1kHz)
- `sample-mono.mp3` (mono channel)
- `sample-stereo.mp3` (stereo channels)
- `corrupt.wav` (intentionally corrupted)
- `invalid.txt` (non-audio file)

**Test Generators:**
```javascript
// Generate random valid audio metadata
function generateAudioMetadata() {
  return {
    id: uuid(),
    filename: `test-${Date.now()}.wav`,
    mimetype: 'audio/wav',
    size: Math.floor(Math.random() * 5000000),
    duration: Math.random() * 60,
    format: 'wav'
  };
}
```

## Deployment and Configuration

### Environment Variables

```bash
# .env file
NODE_ENV=development
PORT=3000
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
LOG_DIR=./logs
MAX_FILE_SIZE=10485760  # 10MB in bytes
CLEANUP_INTERVAL=300000  # 5 minutes in milliseconds
PYTHON_PATH=python  # or python3
AI_SCRIPT_PATH=./ai_engine/pitch_correction.py
```

### Directory Structure

```
ai-voice-tuning/
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── main.js
│   │   ├── audioRecorder.js
│   │   ├── apiClient.js
│   │   └── uiController.js
│   └── assets/
│       ├── icons/
│       └── images/
├── src/
│   ├── server.js
│   ├── routes/
│   │   ├── upload.js
│   │   ├── process.js
│   │   └── download.js
│   ├── controllers/
│   │   ├── uploadController.js
│   │   ├── processController.js
│   │   └── downloadController.js
│   ├── services/
│   │   ├── fileManager.js
│   │   └── pythonService.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── validator.js
│   └── utils/
│       ├── logger.js
│       └── cleanup.js
├── ai_engine/
│   ├── pitch_correction.py
│   ├── pitch_detection.py
│   └── requirements.txt
├── uploads/
├── outputs/
├── logs/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── package.json
├── .env
├── .gitignore
└── README.md
```

### Installation and Setup

**Prerequisites:**
- Node.js v16 or higher
- Python 3.8 or higher
- npm or yarn

**Installation Steps:**

1. Install Node.js dependencies:
```bash
npm install
```

2. Install Python dependencies:
```bash
pip install -r ai_engine/requirements.txt
```

3. Create necessary directories:
```bash
mkdir uploads outputs logs
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run development server:
```bash
npm run dev
```

### Python Dependencies (requirements.txt)

```
librosa==0.10.0
soundfile==0.12.1
numpy==1.24.0
scipy==1.10.0
```

### Node.js Dependencies (package.json)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.0.3",
    "morgan": "^1.10.0",
    "uuid": "^9.0.0",
    "winston": "^3.8.2"
  },
  "devDependencies": {
    "nodemon": "^2.0.22",
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "fast-check": "^3.8.0"
  }
}
```

## Performance Considerations

### Optimization Strategies

1. **File Size Limits:** Batasi upload maksimal 10MB untuk menjaga performa
2. **Processing Queue:** Implementasi queue sederhana untuk menangani multiple requests
3. **Caching:** Cache hasil pitch detection untuk audio yang sama
4. **Streaming:** Gunakan streaming untuk file besar (future enhancement)
5. **Cleanup:** Automatic cleanup untuk mencegah disk penuh

### Expected Performance

- Upload time: < 2 seconds untuk file 5MB
- Processing time: 5-15 seconds untuk audio 30 detik
- Download time: < 1 second untuk file hasil
- Memory usage: < 500MB per request

## Security Considerations

1. **File Validation:** Validasi MIME type dan file extension
2. **File Size Limits:** Prevent DoS dengan batasan ukuran
3. **Path Traversal:** Sanitize filename untuk prevent path traversal
4. **Input Sanitization:** Sanitize semua user input
5. **Error Messages:** Jangan expose internal paths atau stack traces ke user
6. **CORS:** Configure CORS dengan proper origin restrictions (production)

## Future Enhancements

1. **Real-time Processing:** WebSocket untuk real-time pitch correction
2. **Multiple Pitch Correction Modes:** Auto-tune, natural, aggressive
3. **Audio Effects:** Reverb, echo, compression
4. **User Accounts:** Save history dan preferences
5. **Batch Processing:** Process multiple files sekaligus
6. **Advanced Visualization:** Real-time waveform dan spectrogram
7. **Mobile App:** React Native atau Flutter version
8. **Cloud Storage:** Integration dengan S3 atau Google Cloud Storage
