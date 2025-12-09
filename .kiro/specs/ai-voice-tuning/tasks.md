# Implementation Plan

- [x] 1. Setup project structure dan dependencies





  - Buat struktur folder sesuai design (public, src, ai_engine, uploads, outputs, logs)
  - Inisialisasi package.json dengan dependencies yang diperlukan
  - Buat file .env untuk konfigurasi
  - Setup .gitignore untuk exclude node_modules, uploads, outputs, logs
  - _Requirements: All_

- [x] 2. Implementasi Python AI Engine untuk pitch correction







  - Buat file pitch_correction.py sebagai main script
  - Implementasi fungsi detect_pitch() menggunakan librosa.piptrack
  - Implementasi fungsi quantize_to_semitones() untuk quantize pitch ke semitone terdekat
  - Implementasi fungsi pitch_correction() dengan time stretching dan pitch shift
  - Implementasi error handling dan logging di Python
  - Buat requirements.txt untuk Python dependencies
  - _Requirements: 3.5, 6.3_

- [x] 2.1 Write property test untuk pitch correction




  - **Property 11: Pitch correction application**
  - **Validates: Requirements 3.5**

- [x] 3. Implementasi Backend Server dengan Express





  - Setup Express server di src/server.js
  - Konfigurasi middleware (express.json, express.static, morgan)
  - Setup error handling middleware
  - Implementasi logger menggunakan winston
  - Load environment variables dengan dotenv
  - _Requirements: 6.1, 7.1_

- [x] 3.1 Write unit tests untuk server setup


  - Test server initialization
  - Test middleware configuration
  - Test error handler middleware
  - _Requirements: 6.1_

- [x] 4. Implementasi file upload dengan Multer





  - Buat uploadController.js dengan Multer configuration
  - Setup storage dengan diskStorage (destination: uploads/, filename: timestamp-original)
  - Implementasi fileFilter untuk validasi MIME type (.wav, .mp3)
  - Set file size limit 10MB
  - Buat route POST /api/upload
  - Return response dengan audio metadata (id, filename, size, duration, format)
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 4.1 Write property test untuk file upload validation


  - **Property 1: Valid audio file acceptance**
  - **Validates: Requirements 1.1**

- [x] 4.2 Write property test untuk invalid file rejection


  - **Property 2: Invalid file type rejection**
  - **Validates: Requirements 1.2**

- [x] 4.3 Write unit tests untuk upload controller


  - Test successful upload
  - Test file size limit
  - Test invalid file type
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 5. Implementasi FileManager service





  - Buat fileManager.js dengan methods: saveFile, deleteFile, getFileInfo, cleanupOldFiles
  - Implementasi generateUniqueFilename() dengan UUID
  - Implementasi getFileInfo() untuk extract audio metadata
  - Implementasi cleanupOldFiles() dengan automatic cleanup setelah 5 menit
  - _Requirements: 4.4, 7.1, 8.4_

- [x] 5.1 Write property test untuk file cleanup


  - **Property 15: Temporary file cleanup**
  - **Validates: Requirements 4.4**

- [x] 5.2 Write unit tests untuk FileManager

  - Test file save operations
  - Test file deletion
  - Test cleanup logic
  - _Requirements: 4.4, 7.1_

- [x] 6. Implementasi Python integration service





  - Buat pythonService.js untuk spawn Python process
  - Implementasi processAudio() yang spawn child_process dengan script Python
  - Pass file path sebagai command-line argument ke Python
  - Capture stdout untuk output path dan stderr untuk errors
  - Handle Python process exit codes
  - Implementasi timeout handling (30 detik)
  - _Requirements: 3.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6.1 Write property test untuk Python integration


  - **Property 7: Python engine invocation**
  - **Validates: Requirements 3.1**



- [x] 6.2 Write property test untuk file path parameter





  - **Property 23: File path parameter passing**
  - **Validates: Requirements 7.3**



- [x] 6.3 Write property test untuk output path return





  - **Property 24: Output path return**


  - **Validates: Requirements 7.4**

- [x] 6.4 Write unit tests untuk Python service




  - Test successful Python execution
  - Test error handling
  - Test timeout scenarios
  - _Requirements: 3.1, 7.2, 7.5_

- [x] 7. Implementasi process controller dan route





  - Buat processController.js
  - Implementasi POST /api/process endpoint
  - Validate audioId dari request body
  - Call pythonService.processAudio() dengan file path
  - Update audio status (processing → completed/failed)
  - Return response dengan output path dan processing time
  - Handle errors dan log ke file
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.2_

- [x] 7.1 Write property test untuk audio processing


  - **Property 9: Tuned audio generation**
  - **Validates: Requirements 3.3**

- [x] 7.2 Write property test untuk processing error handling


  - **Property 10: Processing error handling**
  - **Validates: Requirements 3.4**

- [x] 7.3 Write unit tests untuk process controller


  - Test successful processing
  - Test error scenarios
  - Test status updates
  - _Requirements: 3.1, 3.3, 3.4_

- [x] 8. Implementasi download controller dan route





  - Buat downloadController.js
  - Implementasi GET /api/download/:id endpoint
  - Validate audioId dan check file existence
  - Set proper headers (Content-Type: audio/wav, Content-Disposition)
  - Stream file ke response
  - Ensure filename contains "tuned"
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 8.1 Write property test untuk download functionality


  - **Property 13: File download delivery**
  - **Validates: Requirements 4.2**

- [x] 8.2 Write property test untuk filename convention


  - **Property 14: Tuned filename convention**
  - **Validates: Requirements 4.3**

- [x] 8.3 Write unit tests untuk download controller


  - Test successful download
  - Test file not found
  - Test filename format
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 9. Implementasi info endpoint untuk audio metadata





  - Buat infoController.js
  - Implementasi GET /api/info/:id endpoint
  - Return audio metadata (duration, size, format, status)
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 9.1 Write property test untuk audio info display


  - **Property 29: Duration display**
  - **Property 30: File size display**
  - **Property 31: Format display**
  - **Validates: Requirements 9.1, 9.2, 9.3**

- [x] 10. Implementasi Frontend HTML structure





  - Buat public/index.html dengan struktur lengkap
  - Header dengan judul aplikasi
  - Mode selector (Upload / Record) dengan radio buttons atau tabs
  - Upload section dengan file input dan file info display
  - Record section dengan record/stop buttons dan timer
  - Process section dengan process button dan loading indicator
  - Result section dengan audio player dan download button
  - Footer dengan informasi
  - _Requirements: 1.5, 2.5, 4.5, 5.1_

- [x] 11. Implementasi Frontend CSS styling




  - Buat public/css/style.css dengan dark theme
  - Styling untuk layout responsif
  - Implementasi animasi waveform untuk loading state
  - Styling untuk buttons dengan hover effects
  - Implementasi visual feedback untuk interactions
  - Gunakan ikon musik yang relevan (Font Awesome atau custom SVG)
  - Background dengan subtle animation (particles atau waveform)
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 12. Implementasi AudioRecorder class





  - Buat public/js/audioRecorder.js
  - Implementasi requestMicrophoneAccess() dengan navigator.mediaDevices.getUserMedia
  - Implementasi startRecording() dengan MediaRecorder API
  - Implementasi stopRecording() dan getAudioBlob()
  - Implementasi timer untuk durasi rekaman
  - Auto-stop setelah 60 detik
  - Handle permission denied error
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 12.1 Write property test untuk recording functionality


  - **Property 4: Microphone permission request**
  - **Property 6: Recording output format**
  - **Validates: Requirements 2.1, 2.3**


- [x] 12.2 Write unit tests untuk AudioRecorder






  - Test microphone access
  - Test recording start/stop
  - Test duration limit
  - _Requirements: 2.1, 2.3, 2.4_


- [x] 13. Implementasi APIClient class



  - Buat public/js/apiClient.js
  - Implementasi uploadAudio(file) dengan FormData dan fetch POST /api/upload
  - Implementasi processAudio(audioId) dengan fetch POST /api/process
  - Implementasi downloadResult(audioId) dengan fetch GET /api/download/:id
  - Implementasi getAudioInfo(audioId) dengan fetch GET /api/info/:id
  - Handle network errors dan timeouts
  - _Requirements: 1.1, 3.1, 4.2, 9.1_


- [x] 13.1 Write unit tests untuk APIClient

  - Test upload request
  - Test process request
  - Test download request
  - Test error handling
  - _Requirements: 1.1, 3.1, 4.2_

- [x] 14. Implementasi UIController class





  - Buat public/js/uiController.js
  - Implementasi showLoading() dan hideLoading() dengan animasi
  - Implementasi showError(message) dengan modal atau toast
  - Implementasi showSuccess(message)
  - Implementasi updateProgress(percentage) untuk progress bar
  - Implementasi displayAudioInfo(info) untuk menampilkan metadata
  - Implementasi toggleMode(mode) untuk switch antara upload dan record
  - _Requirements: 1.3, 3.2, 5.2, 5.3, 9.1, 9.2, 9.3_

- [x] 14.1 Write property test untuk UI feedback


  - **Property 3: Upload confirmation display**
  - **Property 8: Processing indicator display**
  - **Validates: Requirements 1.3, 3.2**

- [x] 14.2 Write unit tests untuk UIController


  - Test loading states
  - Test error display
  - Test info display
  - _Requirements: 1.3, 3.2, 9.1_
- [x] 15. Implementasi main application logic



- [ ] 15. Implementasi main application logic

  - Buat public/js/main.js sebagai entry point
  - Initialize AudioRecorder, APIClient, UIController
  - Setup event listeners untuk upload button
  - Setup event listeners untuk record button
  - Setup event listeners untuk process button
  - Setup event listeners untuk download button
  - Implement complete flow: upload/record → process → download
  - Handle semua error scenarios dengan user-friendly messages
  - _Requirements: 1.1, 2.1, 3.1, 4.2_


- [x] 15.1 Write integration tests untuk complete flow


  - Test upload → process → download flow
  - Test record → process → download flow
  - Test error scenarios
  - _Requirements: 1.1, 2.1, 3.1, 4.2_

- [x] 16. Implementasi error handling dan validation





  - Validate file type di frontend sebelum upload
  - Validate file size di frontend sebelum upload
  - Display informative error messages untuk semua error types
  - Implement retry logic untuk network errors
  - Log errors ke console untuk debugging
  - _Requirements: 1.2, 1.4, 6.1, 6.2, 6.3_

- [x] 16.1 Write property test untuk error handling


  - **Property 18: Server error logging**
  - **Property 19: AI processing error communication**
  - **Property 20: Corrupt file detection**
  - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 17. Implementasi automatic cleanup scheduler





  - Buat utils/cleanup.js
  - Implementasi scheduled job untuk cleanup old files setiap 5 menit
  - Delete files dari uploads/ dan outputs/ yang lebih dari 5 menit
  - Log cleanup activities
  - _Requirements: 4.4, 8.4_

- [x] 17.1 Write unit tests untuk cleanup scheduler







  - Test file age detection
  - Test deletion logic
  - _Requirements: 4.4, 8.4_
- [x] 18. Implementasi audio preview player



























- [ ] 18. Implementasi audio preview player

  - Add HTML5 audio player di result section
  - Load tuned audio untuk preview sebelum download
  - Styling audio player sesuai theme
  - _Requirements: 4.5_
- [x] 19. Implementasi tooltips untuk audio information











- [ ] 19. Implementasi tooltips untuk audio information

  - Add tooltip functionality dengan CSS atau library sederhana
  - Tampilkan tooltip saat hover pada audio info
  - Berikan penjelasan untuk duration, size, format
  - _Requirements: 9.5_

- [x] 19.1 Write property test untuk tooltip display


  - **Property 32: Tooltip display on hover**
  - **Validates: Requirements 9.5**

- [x] 20. Testing dan bug fixes





  - Run semua unit tests dan property tests
  - Fix failing tests
  - Test manual di browser untuk semua flows
  - Test dengan berbagai file audio (wav, mp3, berbagai ukuran)
  - Test error scenarios (invalid files, large files, corrupt files)
  - Verify cleanup berjalan dengan benar
  - _Requirements: All_

- [x] 21. Documentation dan README





  - Buat README.md dengan installation instructions
  - Document API endpoints
  - Document environment variables
  - Add usage examples
  - Add troubleshooting section
  - Document Python dependencies installation
  - _Requirements: All_

- [x] 22. Final checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
