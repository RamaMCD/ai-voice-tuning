# AI Voice Tuning

Website AI Tuning Suara adalah aplikasi berbasis web yang memungkinkan pengguna untuk mengunggah atau merekam audio, kemudian secara otomatis melakukan pitch correction (auto-tune) menggunakan AI engine berbasis Python.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- 🎵 **Upload Audio Files** - Support untuk format .wav dan .mp3 (maksimal 10MB)
- 🎤 **Record Audio** - Rekam audio langsung dari browser menggunakan Web Audio API
- 🤖 **AI Pitch Correction** - Automatic pitch correction menggunakan librosa dan algoritma AI
- 📥 **Download Results** - Download audio yang sudah di-tune dengan mudah
- 🎨 **Modern UI** - Dark theme dengan animasi waveform dan visual feedback
- 🧹 **Auto Cleanup** - Automatic cleanup file temporary setelah 5 menit
- 📊 **Audio Info** - Tampilan metadata audio (duration, size, format)

## Prerequisites

Sebelum memulai, pastikan sistem Anda memiliki:

- **Node.js** v16 atau lebih tinggi ([Download](https://nodejs.org/))
- **Python** 3.8 atau lebih tinggi ([Download](https://www.python.org/downloads/))
- **npm** atau **yarn** (termasuk dalam instalasi Node.js)
- **pip** (Python package manager, termasuk dalam instalasi Python)

### Verifikasi Instalasi

Cek versi yang terinstal:

```bash
node --version    # Should be v16 or higher
python --version  # Should be 3.8 or higher
npm --version
pip --version
```

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd ai-voice-tuning
```

### 2. Install Node.js Dependencies

```bash
npm install
```

Dependencies yang akan diinstal:
- `express` - Web framework
- `multer` - File upload handling
- `dotenv` - Environment variables
- `morgan` - HTTP request logger
- `winston` - Application logger
- `uuid` - Unique ID generator

### 3. Install Python Dependencies

#### Windows:

```bash
pip install -r ai_engine/requirements.txt
```

#### macOS/Linux:

```bash
pip3 install -r ai_engine/requirements.txt
```

Python dependencies yang akan diinstal:
- `librosa>=0.10.0` - Audio analysis dan pitch detection
- `soundfile>=0.12.1` - Audio file I/O
- `numpy>=1.24.0` - Numerical operations
- `scipy>=1.10.0` - Signal processing
- `pydub>=0.25.1` - Audio format conversion
- `hypothesis>=6.82.0` - Property-based testing (dev)
- `pytest>=7.4.0` - Testing framework (dev)

**Note:** Instalasi librosa mungkin memerlukan waktu beberapa menit karena dependencies yang besar.

### 3.5. Install FFmpeg (Required for Recording Feature)

FFmpeg diperlukan untuk memproses audio yang direkam dari browser (format WebM).

#### Windows (Recommended):

```bash
winget install ffmpeg
```

#### Alternative Methods:

Lihat file `INSTALL_FFMPEG.md` untuk metode instalasi lainnya.

**Note:** Jika Anda hanya menggunakan fitur Upload dengan file .wav atau .mp3, FFmpeg tidak diperlukan.

### 4. Configure Environment Variables

File `.env` sudah tersedia dengan konfigurasi default. Jika perlu, edit file tersebut:

```bash
# Edit .env file sesuai kebutuhan
```

Lihat bagian [Configuration](#configuration) untuk detail lengkap.

### 5. Verify Installation

Jalankan server untuk memverifikasi instalasi:

```bash
npm run dev
```

Buka browser dan akses `http://localhost:3000`. Jika halaman muncul, instalasi berhasil!

## Configuration

### Environment Variables

Aplikasi menggunakan file `.env` untuk konfigurasi. Berikut adalah daftar lengkap environment variables:

#### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode (`development` atau `production`) |
| `PORT` | `3000` | Port server akan berjalan |

#### Directory Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `UPLOAD_DIR` | `./uploads` | Direktori untuk menyimpan file upload |
| `OUTPUT_DIR` | `./outputs` | Direktori untuk menyimpan hasil tuning |
| `LOG_DIR` | `./logs` | Direktori untuk menyimpan log files |

#### File Upload Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_FILE_SIZE` | `10485760` | Maksimal ukuran file upload (bytes). Default: 10MB |

#### Cleanup Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CLEANUP_INTERVAL` | `300000` | Interval cleanup file temporary (milliseconds). Default: 5 menit |

#### Python Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PYTHON_PATH` | `python` | Path ke Python executable. Gunakan `python3` untuk macOS/Linux |
| `AI_SCRIPT_PATH` | `./ai_engine/pitch_correction.py` | Path ke script Python AI engine |

#### Processing Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PROCESSING_TIMEOUT` | `30000` | Timeout untuk proses AI (milliseconds). Default: 30 detik |

### Example Configuration

```bash
# Development
NODE_ENV=development
PORT=3000
PYTHON_PATH=python

# Production
NODE_ENV=production
PORT=8080
PYTHON_PATH=/usr/bin/python3
MAX_FILE_SIZE=20971520  # 20MB
```

## Usage

### Development Mode

Untuk development dengan auto-reload:

```bash
npm run dev
```

Server akan restart otomatis setiap kali ada perubahan file.

### Production Mode

Untuk production:

```bash
npm start
```

### Accessing the Application

1. Buka browser dan akses `http://localhost:3000` (atau port yang dikonfigurasi)
2. Pilih mode **Upload** atau **Record**
3. Upload file audio atau rekam suara
4. Klik tombol **Process** untuk melakukan pitch correction
5. Tunggu hingga proses selesai (ditandai dengan loading indicator)
6. Preview hasil dengan audio player
7. Klik tombol **Download** untuk mengunduh hasil

### Usage Examples

#### Example 1: Upload dan Process Audio

```javascript
// Menggunakan API Client
const apiClient = new APIClient();

// Upload file
const file = document.getElementById('audioFile').files[0];
const uploadResult = await apiClient.uploadAudio(file);
console.log('Audio ID:', uploadResult.data.id);

// Process audio
const processResult = await apiClient.processAudio(uploadResult.data.id);
console.log('Output path:', processResult.data.outputPath);

// Download result
await apiClient.downloadResult(uploadResult.data.id);
```

#### Example 2: Record dan Process Audio

```javascript
// Menggunakan Audio Recorder
const recorder = new AudioRecorder();

// Request microphone access
await recorder.requestMicrophoneAccess();

// Start recording
recorder.startRecording();

// Stop recording after some time
setTimeout(() => {
  recorder.stopRecording();
  const audioBlob = recorder.getAudioBlob();
  
  // Upload and process
  apiClient.uploadAudio(audioBlob).then(result => {
    return apiClient.processAudio(result.data.id);
  });
}, 5000);
```

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Endpoints

#### 1. Upload Audio

Upload file audio untuk diproses.

**Endpoint:** `POST /api/upload`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
audio: File (required) - Audio file (.wav atau .mp3, max 10MB)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "abc123-def456",
    "filename": "audio.wav",
    "size": 1024000,
    "duration": 30.5,
    "format": "wav",
    "uploadedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "File terlalu besar. Maksimal 10MB"
}
```

**Error Codes:**
- `400` - Invalid file type atau file terlalu besar
- `500` - Server error

---

#### 2. Process Audio

Proses audio dengan AI pitch correction.

**Endpoint:** `POST /api/process`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "audioId": "abc123-def456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "abc123-def456",
    "status": "completed",
    "outputPath": "/outputs/abc123-def456-tuned.wav",
    "processingTime": 5.2
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Audio ID tidak valid"
}
```

**Error Codes:**
- `400` - Invalid audio ID
- `404` - Audio file tidak ditemukan
- `500` - Processing error

---

#### 3. Download Audio

Download hasil audio yang sudah di-tune.

**Endpoint:** `GET /api/download/:id`

**Parameters:**
- `id` (path parameter) - Audio ID

**Success Response (200):**
- Content-Type: `audio/wav` atau `audio/mpeg`
- Content-Disposition: `attachment; filename="audio-tuned.wav"`
- Body: Audio file stream

**Error Response (404):**
```json
{
  "success": false,
  "error": "File tidak ditemukan"
}
```

**Error Codes:**
- `404` - File tidak ditemukan
- `500` - Server error

---

#### 4. Get Audio Info

Mendapatkan metadata audio.

**Endpoint:** `GET /api/info/:id`

**Parameters:**
- `id` (path parameter) - Audio ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "abc123-def456",
    "filename": "audio.wav",
    "size": 1024000,
    "duration": 30.5,
    "format": "wav",
    "status": "completed",
    "uploadedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Audio tidak ditemukan"
}
```

**Error Codes:**
- `404` - Audio tidak ditemukan
- `500` - Server error

## Project Structure

```
ai-voice-tuning/
├── public/                      # Frontend files (served statically)
│   ├── index.html              # Main HTML file
│   ├── css/
│   │   └── style.css           # Stylesheet dengan dark theme
│   ├── js/
│   │   ├── main.js             # Main application logic
│   │   ├── audioRecorder.js    # Audio recording functionality
│   │   ├── apiClient.js        # API communication
│   │   └── uiController.js     # UI state management
│   └── assets/                 # Images, icons, etc.
│
├── src/                        # Backend source code
│   ├── server.js               # Express server entry point
│   ├── routes/                 # API route definitions
│   │   ├── upload.js
│   │   ├── process.js
│   │   ├── download.js
│   │   └── info.js
│   ├── controllers/            # Request handlers
│   │   ├── uploadController.js
│   │   ├── processController.js
│   │   ├── downloadController.js
│   │   └── infoController.js
│   ├── services/               # Business logic
│   │   ├── fileManager.js      # File operations
│   │   └── pythonService.js    # Python integration
│   ├── middleware/             # Express middleware
│   │   └── errorHandler.js     # Error handling
│   └── utils/                  # Utility functions
│       ├── logger.js           # Winston logger
│       └── cleanup.js          # File cleanup scheduler
│
├── ai_engine/                  # Python AI engine
│   ├── pitch_correction.py     # Main pitch correction script
│   └── requirements.txt        # Python dependencies
│
├── uploads/                    # Temporary uploaded files (auto-cleanup)
├── outputs/                    # Processed audio files (auto-cleanup)
├── logs/                       # Application logs
│   ├── combined.log           # All logs
│   └── error.log              # Error logs only
│
├── tests/                      # Test files
│   ├── unit/                   # Unit tests
│   │   ├── *.test.js          # JavaScript unit tests
│   │   ├── *.property.test.js # Property-based tests
│   │   └── test_*.py          # Python unit tests
│   ├── integration/            # Integration tests
│   │   └── completeFlow.test.js
│   └── fixtures/               # Test data
│       └── test-uploads/       # Sample audio files
│
├── .env                        # Environment variables (not in git)
├── .env.example               # Example environment variables
├── .gitignore                 # Git ignore rules
├── package.json               # Node.js dependencies
├── jest.config.js             # Jest configuration
└── README.md                  # This file
```

## Testing

Aplikasi menggunakan Jest untuk JavaScript testing dan pytest untuk Python testing.

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Python Tests

```bash
# Windows
python -m pytest tests/unit/test_pitch_correction.py

# macOS/Linux
python3 -m pytest tests/unit/test_pitch_correction.py
```

### Test Types

1. **Unit Tests** - Test individual functions dan components
2. **Property-Based Tests** - Test universal properties dengan random inputs (menggunakan fast-check)
3. **Integration Tests** - Test complete flow dari upload hingga download

### Test Coverage

Target coverage: 80%+ untuk semua modules

## Troubleshooting

### Common Issues

#### 1. Python Not Found

**Error:**
```
Error: spawn python ENOENT
```

**Solution:**
- Pastikan Python terinstal dan ada di PATH
- Untuk macOS/Linux, ubah `PYTHON_PATH=python3` di file `.env`
- Verifikasi dengan: `python --version` atau `python3 --version`

---

#### 2. Python Dependencies Installation Failed

**Error:**
```
ERROR: Could not find a version that satisfies the requirement librosa
```

**Solution:**

**Windows:**
```bash
# Upgrade pip terlebih dahulu
python -m pip install --upgrade pip

# Install dependencies
pip install -r ai_engine/requirements.txt
```

**macOS/Linux:**
```bash
# Upgrade pip
pip3 install --upgrade pip

# Install dependencies
pip3 install -r ai_engine/requirements.txt
```

**Alternative:** Gunakan virtual environment:
```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r ai_engine/requirements.txt
```

---

#### 3. Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
- Ubah PORT di file `.env` ke port lain (misalnya 3001)
- Atau kill process yang menggunakan port 3000:

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

---

#### 4. File Upload Failed

**Error:**
```
File terlalu besar. Maksimal 10MB
```

**Solution:**
- Compress audio file terlebih dahulu
- Atau tingkatkan `MAX_FILE_SIZE` di file `.env`:
```bash
MAX_FILE_SIZE=20971520  # 20MB
```

---

#### 5. Microphone Access Denied

**Error:**
```
Akses mikrofon ditolak
```

**Solution:**
- Pastikan browser memiliki permission untuk akses mikrofon
- Untuk Chrome: Settings → Privacy and Security → Site Settings → Microphone
- Untuk Firefox: Preferences → Privacy & Security → Permissions → Microphone
- Pastikan menggunakan HTTPS atau localhost (HTTP tidak diizinkan untuk getUserMedia)

---

#### 6. Processing Timeout

**Error:**
```
Proses memakan waktu terlalu lama
```

**Solution:**
- Gunakan file audio yang lebih pendek (< 60 detik)
- Tingkatkan `PROCESSING_TIMEOUT` di file `.env`:
```bash
PROCESSING_TIMEOUT=60000  # 60 seconds
```

---

#### 7. Cleanup Not Working

**Issue:** File temporary tidak terhapus otomatis

**Solution:**
- Cek log file di `logs/combined.log` untuk error
- Pastikan aplikasi memiliki write permission ke folder uploads/ dan outputs/
- Verifikasi `CLEANUP_INTERVAL` di file `.env`

---

#### 8. Tests Failing

**Error:**
```
FAIL tests/unit/pythonService.test.js
```

**Solution:**
- Pastikan semua dependencies terinstal: `npm install`
- Pastikan Python dependencies terinstal: `pip install -r ai_engine/requirements.txt`
- Clear Jest cache: `npx jest --clearCache`
- Run tests dengan verbose: `npm test -- --verbose`

---

### Getting Help

Jika masalah masih berlanjut:

1. Cek log files di folder `logs/`:
   - `combined.log` - All application logs
   - `error.log` - Error logs only

2. Run dengan debug mode:
```bash
NODE_ENV=development npm run dev
```

3. Cek console browser (F12) untuk frontend errors

4. Verifikasi semua prerequisites terinstal dengan benar

### Performance Tips

1. **Gunakan file audio pendek** - Audio < 30 detik akan diproses lebih cepat
2. **Format WAV lebih cepat** - Format .wav lebih cepat diproses dibanding .mp3
3. **Cleanup regular** - Cleanup interval default 5 menit sudah optimal
4. **Production mode** - Gunakan `npm start` untuk production (lebih cepat dari dev mode)

## License

ISC

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [librosa](https://librosa.org/) - Audio analysis library
- [Express.js](https://expressjs.com/) - Web framework
- [Jest](https://jestjs.io/) - Testing framework
- [fast-check](https://fast-check.dev/) - Property-based testing
