# Requirements Document

## Introduction

Website AI Tuning Suara adalah aplikasi berbasis web yang memungkinkan pengguna untuk mengunggah atau merekam audio, kemudian secara otomatis melakukan pitch correction (auto-tune) menggunakan AI engine berbasis Python. Aplikasi ini dibangun dengan Node.js (Express) sebagai backend dan Python (librosa) sebagai AI engine untuk tugas akhir semester Teknik Informatika.

## Glossary

- **System**: Website AI Tuning Suara
- **User**: Pengguna yang mengakses website untuk melakukan tuning suara
- **Audio File**: File audio dalam format .wav atau .mp3
- **Pitch Correction**: Proses koreksi nada/pitch audio secara otomatis menggunakan algoritma AI
- **AI Engine**: Script Python yang menggunakan librosa dan soundfile untuk analisis dan koreksi pitch
- **Backend Server**: Server Node.js dengan Express yang menangani request dan response
- **Frontend**: Antarmuka web yang diakses user melalui browser
- **Upload**: Proses mengunggah file audio dari komputer user ke server
- **Recording**: Proses merekam suara langsung dari browser menggunakan Web Audio API
- **Tuned Audio**: File audio hasil pitch correction yang siap diunduh

## Requirements

### Requirement 1

**User Story:** Sebagai user, saya ingin mengunggah file audio dari komputer saya, sehingga saya dapat melakukan pitch correction pada audio tersebut.

#### Acceptance Criteria

1. WHEN user memilih file audio dengan format .wav atau .mp3 THEN the System SHALL menerima dan menyimpan file tersebut di server
2. WHEN user mengunggah file dengan format selain .wav atau .mp3 THEN the System SHALL menolak file dan menampilkan pesan error
3. WHEN file audio berhasil diunggah THEN the System SHALL menampilkan konfirmasi bahwa file siap diproses
4. WHEN ukuran file melebihi 10MB THEN the System SHALL menolak upload dan menampilkan pesan batas ukuran file
5. WHERE user memilih opsi upload THEN the System SHALL menampilkan tombol untuk memilih file dari komputer

### Requirement 2

**User Story:** Sebagai user, saya ingin merekam suara langsung dari browser, sehingga saya dapat melakukan pitch correction tanpa harus mengunggah file.

#### Acceptance Criteria

1. WHEN user mengklik tombol rekam THEN the System SHALL meminta izin akses mikrofon dari browser
2. WHILE user sedang merekam THEN the System SHALL menampilkan indikator visual bahwa rekaman sedang berlangsung
3. WHEN user menghentikan rekaman THEN the System SHALL menyimpan audio hasil rekaman dalam format .wav
4. WHEN durasi rekaman melebihi 60 detik THEN the System SHALL otomatis menghentikan rekaman
5. WHERE user memilih opsi rekam THEN the System SHALL menampilkan tombol mulai dan stop rekaman

### Requirement 3

**User Story:** Sebagai user, saya ingin audio saya diproses dengan AI pitch correction, sehingga saya mendapatkan audio dengan nada yang lebih baik.

#### Acceptance Criteria

1. WHEN audio dikirim untuk diproses THEN the Backend Server SHALL memanggil AI Engine Python untuk melakukan pitch correction
2. WHILE AI Engine memproses audio THEN the System SHALL menampilkan indikator loading kepada user
3. WHEN AI Engine selesai memproses THEN the System SHALL menghasilkan file Tuned Audio baru
4. WHEN proses pitch correction gagal THEN the System SHALL menampilkan pesan error dan log error ke console server
5. WHEN AI Engine mendeteksi pitch THEN the AI Engine SHALL mengkoreksi pitch mendekati nada yang paling sesuai

### Requirement 4

**User Story:** Sebagai user, saya ingin mengunduh hasil audio yang sudah di-tune, sehingga saya dapat menyimpan dan menggunakan audio tersebut.

#### Acceptance Criteria

1. WHEN proses tuning selesai THEN the System SHALL menampilkan tombol download untuk Tuned Audio
2. WHEN user mengklik tombol download THEN the System SHALL mengirimkan file Tuned Audio ke browser user
3. WHEN download selesai THEN the System SHALL menyimpan file dengan nama yang jelas mencantumkan "tuned"
4. WHEN file Tuned Audio sudah diunduh THEN the Backend Server SHALL menghapus file temporary dari server setelah 5 menit
5. WHERE hasil tuning tersedia THEN the System SHALL menampilkan preview audio player untuk mendengarkan hasil sebelum download

### Requirement 5

**User Story:** Sebagai user, saya ingin melihat antarmuka yang menarik dan mudah digunakan, sehingga pengalaman saya menggunakan aplikasi menjadi menyenangkan.

#### Acceptance Criteria

1. WHEN user membuka website THEN the Frontend SHALL menampilkan tema dark mode dengan nuansa musik
2. WHEN audio sedang diproses THEN the Frontend SHALL menampilkan animasi waveform atau visualisasi audio
3. WHEN user berinteraksi dengan tombol THEN the Frontend SHALL memberikan feedback visual seperti hover effect atau animasi
4. THE Frontend SHALL menggunakan ikon musik yang relevan untuk setiap fitur
5. THE Frontend SHALL menampilkan layout yang responsif dan modern tanpa terlihat monoton

### Requirement 6

**User Story:** Sebagai system administrator, saya ingin sistem dapat menangani error dengan baik, sehingga aplikasi tetap stabil dan user mendapat informasi yang jelas saat terjadi masalah.

#### Acceptance Criteria

1. WHEN terjadi error pada Backend Server THEN the System SHALL mencatat error ke log file
2. WHEN AI Engine gagal memproses audio THEN the System SHALL mengirimkan pesan error yang informatif ke user
3. WHEN file audio corrupt atau tidak valid THEN the System SHALL mendeteksi dan menolak file tersebut sebelum diproses
4. WHEN server kehabisan storage THEN the System SHALL menampilkan pesan error dan mencegah upload baru
5. IF terjadi timeout saat memproses audio THEN the System SHALL membatalkan proses dan memberitahu user

### Requirement 7

**User Story:** Sebagai developer, saya ingin Backend Server dapat berkomunikasi dengan AI Engine Python, sehingga proses pitch correction dapat berjalan dengan lancar.

#### Acceptance Criteria

1. WHEN Backend Server menerima audio THEN the Backend Server SHALL menyimpan file audio ke folder temporary
2. WHEN file audio tersimpan THEN the Backend Server SHALL menjalankan script Python menggunakan child_process
3. WHEN script Python dipanggil THEN the Backend Server SHALL mengirimkan path file audio sebagai parameter
4. WHEN AI Engine selesai THEN the AI Engine SHALL mengembalikan path file Tuned Audio ke Backend Server
5. WHEN komunikasi dengan Python gagal THEN the Backend Server SHALL menangani error dan memberitahu user

### Requirement 8

**User Story:** Sebagai user, saya ingin sistem dapat memproses audio dengan cepat dan efisien, sehingga saya tidak perlu menunggu terlalu lama.

#### Acceptance Criteria

1. WHEN audio dengan durasi kurang dari 30 detik diproses THEN the System SHALL menyelesaikan pitch correction dalam waktu maksimal 15 detik
2. WHEN proses memakan waktu lebih dari 30 detik THEN the System SHALL menampilkan estimasi waktu yang tersisa
3. THE AI Engine SHALL menggunakan algoritma pitch correction yang efisien untuk audio pendek
4. THE Backend Server SHALL membersihkan file temporary secara otomatis untuk menghemat storage
5. THE System SHALL dapat menangani satu request pada satu waktu tanpa crash

### Requirement 9

**User Story:** Sebagai user, saya ingin dapat melihat informasi tentang audio yang saya upload atau rekam, sehingga saya tahu detail dari audio tersebut.

#### Acceptance Criteria

1. WHEN audio berhasil diunggah atau direkam THEN the System SHALL menampilkan durasi audio
2. WHEN audio berhasil diunggah atau direkam THEN the System SHALL menampilkan ukuran file audio
3. WHEN audio berhasil diunggah atau direkam THEN the System SHALL menampilkan format file audio
4. WHERE informasi audio ditampilkan THEN the Frontend SHALL menampilkannya dalam format yang mudah dibaca
5. WHEN user hover pada informasi THEN the Frontend SHALL menampilkan tooltip penjelasan jika diperlukan
