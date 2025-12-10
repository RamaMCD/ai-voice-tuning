# 📖 Manual Pengguna AI Voice Tuning

**Panduan Lengkap Penggunaan Website AI Voice Tuning**

---

## 📋 Daftar Isi

1. [Pengenalan](#pengenalan)
2. [Cara Mengakses Website](#cara-mengakses-website)
3. [Antarmuka Pengguna](#antarmuka-pengguna)
4. [Cara Upload Audio](#cara-upload-audio)
5. [Cara Record Audio](#cara-record-audio)
6. [Memproses Audio dengan AI](#memproses-audio-dengan-ai)
7. [Mendownload Hasil](#mendownload-hasil)
8. [Tips dan Trik](#tips-dan-trik)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## 🎵 Pengenalan

**AI Voice Tuning** adalah aplikasi web yang memungkinkan Anda untuk:
- ✨ Melakukan pitch correction (auto-tune) pada audio secara otomatis
- 🎤 Merekam suara langsung dari browser
- 📁 Upload file audio (.wav, .mp3, .webm)
- 🤖 Menggunakan teknologi AI untuk koreksi pitch yang akurat
- 💾 Download hasil audio yang sudah di-tune

**Cocok untuk:**
- Penyanyi yang ingin memperbaiki pitch vokal
- Content creator yang butuh audio berkualitas
- Musisi yang ingin eksperimen dengan auto-tune
- Siapa saja yang ingin belajar tentang pitch correction

---

## 🌐 Cara Mengakses Website

### Akses Lokal (Development)
1. Pastikan server sudah berjalan di `http://localhost:3000`
2. Buka browser (Chrome, Firefox, Safari, Edge)
3. Ketik alamat: `http://localhost:3000`
4. Tekan Enter

### Akses Online (Jika sudah di-deploy)
1. Buka browser
2. Kunjungi URL website yang sudah di-deploy
3. Website akan langsung terbuka

---

## 🖥️ Antarmuka Pengguna

### Tampilan Utama

Website memiliki desain **dark theme** yang modern dengan elemen-elemen berikut:

#### Header
- **Logo/Judul**: "AI Voice Tuning" di bagian atas
- **Subtitle**: Deskripsi singkat aplikasi

#### Tab Navigation
- **📁 Upload**: Untuk upload file audio dari komputer
- **🎤 Record**: Untuk merekam audio langsung

#### Area Konten
- **Upload Area**: Drag & drop atau klik untuk upload
- **Recording Controls**: Tombol record/stop dengan timer
- **Audio Info**: Informasi file yang di-upload/direkam
- **Process Button**: Tombol untuk memulai AI processing
- **Result Area**: Preview dan download hasil

#### Footer
- Informasi tambahan dan status aplikasi

---

## 📁 Cara Upload Audio

### Langkah-langkah Upload:

#### 1. Pilih Tab "Upload"
- Klik tab **"Upload"** di bagian atas
- Area upload akan muncul

#### 2. Pilih File Audio
**Metode 1: Drag & Drop**
- Drag file audio dari folder komputer
- Drop ke area upload yang bertuliskan "Drag & drop audio file here"

**Metode 2: Klik untuk Browse**
- Klik area upload atau tombol "Choose File"
- Pilih file dari dialog yang muncul
- Klik "Open"

#### 3. Format File yang Didukung
✅ **Didukung:**
- `.wav` (Recommended - kualitas terbaik)
- `.mp3` (Kompatibel)
- `.webm` (Dari recording browser)

❌ **Tidak Didukung:**
- `.flac`, `.aac`, `.ogg`, dll

#### 4. Batasan File
- **Ukuran maksimal**: 10MB
- **Durasi**: Disarankan < 60 detik untuk performa optimal

#### 5. Konfirmasi Upload
- Setelah file dipilih, informasi file akan muncul:
  - Nama file
  - Ukuran file
  - Durasi audio
  - Format file
- Status: "File berhasil diunggah dan siap diproses"

---

## 🎤 Cara Record Audio

### Langkah-langkah Recording:

#### 1. Pilih Tab "Record"
- Klik tab **"Record"** di bagian atas
- Interface recording akan muncul

#### 2. Izinkan Akses Mikrofon
- Browser akan meminta izin akses mikrofon
- Klik **"Allow"** atau **"Izinkan"**
- Jika ditolak, cek pengaturan browser

#### 3. Mulai Recording
- Klik tombol **"🎤 Start Recording"**
- Indikator recording (titik merah berkedip) akan muncul
- Timer akan mulai berjalan: `00:00`

#### 4. Berbicara atau Bernyanyi
- Posisikan mikrofon dengan baik
- Berbicara/bernyanyi dengan jelas
- Hindari noise latar belakang
- Maksimal durasi: 60 detik

#### 5. Stop Recording
- Klik tombol **"⏹️ Stop Recording"**
- Recording akan berhenti otomatis
- File akan otomatis di-upload ke server

#### 6. Konfirmasi Recording
- Informasi recording akan muncul:
  - Durasi recording
  - Ukuran file
  - Format: WebM
- Status: "Rekaman berhasil dan siap diproses"

### Tips Recording yang Baik:
- 🎧 Gunakan headphone untuk menghindari feedback
- 🔇 Recording di ruangan yang tenang
- 📏 Jarak mikrofon 15-30cm dari mulut
- 🎵 Bernyanyi dengan volume yang konsisten

---

## 🤖 Memproses Audio dengan AI

### Langkah-langkah Processing:

#### 1. Pastikan Audio Sudah Ready
- File sudah di-upload atau direkam
- Status menunjukkan "siap diproses"
- Informasi audio sudah muncul

#### 2. Klik Tombol "Process"
- Tombol **"🔄 Process"** akan aktif (tidak abu-abu)
- Klik tombol tersebut

#### 3. Tunggu Proses AI
- Loading indicator akan muncul
- Status: "Memproses audio dengan AI..."
- Proses biasanya memakan waktu 5-30 detik
- **Jangan refresh halaman** selama proses berlangsung

#### 4. Proses AI Melakukan:
- **Pitch Detection**: Mendeteksi nada/pitch dalam audio
- **Pitch Analysis**: Menganalisis nada yang perlu dikoreksi
- **Pitch Correction**: Memperbaiki nada ke semitone terdekat
- **Audio Enhancement**: Meningkatkan kualitas audio

#### 5. Hasil Processing
- Status berubah menjadi: "Audio berhasil di-tune!"
- Audio player akan muncul untuk preview
- Tombol download akan aktif

---

## 💾 Mendownload Hasil

### Langkah-langkah Download:

#### 1. Preview Hasil (Opsional)
- Gunakan audio player untuk mendengar hasil
- Bandingkan dengan audio asli
- Pastikan hasil sesuai harapan

#### 2. Download File
- Klik tombol **"📥 Download"**
- Browser akan mulai download
- File akan tersimpan di folder Downloads

#### 3. Informasi File Hasil
- **Format**: WAV (kualitas tinggi)
- **Nama file**: `tuned-audio-[timestamp].wav`
- **Kualitas**: Sama dengan file asli
- **Ukuran**: Mungkin sedikit berbeda dari asli

#### 4. Menggunakan Hasil
- File bisa langsung digunakan
- Compatible dengan semua media player
- Bisa di-edit lebih lanjut di DAW (Digital Audio Workstation)

---

## 💡 Tips dan Trik

### Untuk Hasil Terbaik:

#### 🎵 Kualitas Audio Input
- Gunakan file WAV untuk kualitas terbaik
- Hindari audio yang terlalu terdistorsi
- Pastikan volume tidak terlalu kecil atau besar

#### 🎤 Recording Tips
- Gunakan mikrofon berkualitas baik
- Recording di ruangan dengan akustik baik
- Hindari background noise
- Bernyanyi dengan pitch yang tidak terlalu jauh dari nada asli

#### ⚡ Performa
- Gunakan audio dengan durasi < 60 detik untuk processing cepat
- Tutup tab browser lain untuk performa optimal
- Pastikan koneksi internet stabil

#### 🔧 Troubleshooting Cepat
- Jika processing gagal, coba file audio yang lebih pendek
- Jika mikrofon tidak terdeteksi, refresh halaman
- Jika download tidak berfungsi, coba browser lain

---

## 🔧 Troubleshooting

### Masalah Umum dan Solusi:

#### ❌ "Format file tidak didukung"
**Penyebab**: File format tidak compatible
**Solusi**: 
- Convert file ke .wav atau .mp3
- Gunakan online converter seperti CloudConvert

#### ❌ "File terlalu besar"
**Penyebab**: File > 10MB
**Solusi**:
- Compress audio file
- Potong durasi audio
- Gunakan bitrate yang lebih rendah

#### ❌ "Akses mikrofon ditolak"
**Penyebab**: Browser tidak diberi izin akses mikrofon
**Solusi**:
- Klik icon 🔒 di address bar
- Pilih "Allow" untuk microphone
- Refresh halaman

#### ❌ "Gagal memproses audio"
**Penyebab**: File audio corrupt atau format tidak sesuai
**Solusi**:
- Coba file audio lain
- Pastikan file tidak corrupt
- Gunakan format .wav

#### ❌ "Processing timeout"
**Penyebab**: File terlalu panjang atau server overload
**Solusi**:
- Gunakan audio < 30 detik
- Coba lagi beberapa saat
- Refresh halaman

#### ❌ "Download tidak berfungsi"
**Penyebab**: Browser blocking download atau popup blocker
**Solusi**:
- Disable popup blocker
- Coba browser lain
- Klik kanan → "Save link as"

---

## ❓ FAQ (Frequently Asked Questions)

### Tentang Aplikasi

**Q: Apa itu AI Voice Tuning?**
A: Aplikasi web untuk melakukan pitch correction (auto-tune) pada audio menggunakan teknologi AI.

**Q: Apakah gratis?**
A: Ya, aplikasi ini gratis untuk digunakan.

**Q: Apakah data saya aman?**
A: Ya, file audio akan otomatis dihapus dari server setelah 5 menit untuk menjaga privasi.

### Tentang Penggunaan

**Q: Format audio apa saja yang didukung?**
A: WAV, MP3, dan WebM (dari recording browser).

**Q: Berapa ukuran maksimal file?**
A: Maksimal 10MB per file.

**Q: Berapa lama proses AI?**
A: Biasanya 5-30 detik tergantung durasi audio.

**Q: Bisakah memproses audio yang sangat panjang?**
A: Disarankan < 60 detik untuk performa optimal.

### Tentang Hasil

**Q: Format hasil download apa?**
A: File hasil dalam format WAV berkualitas tinggi.

**Q: Apakah kualitas audio berkurang?**
A: Tidak, kualitas audio dipertahankan bahkan ditingkatkan.

**Q: Bisakah di-edit lebih lanjut?**
A: Ya, file hasil bisa di-edit di software audio editing lainnya.

### Troubleshooting

**Q: Kenapa mikrofon tidak terdeteksi?**
A: Pastikan browser diberi izin akses mikrofon dan refresh halaman.

**Q: Kenapa processing gagal?**
A: Coba file audio yang lebih pendek atau format yang berbeda.

**Q: Kenapa tidak bisa download?**
A: Disable popup blocker atau coba browser lain.

---

## 📞 Dukungan

Jika mengalami masalah yang tidak tercantum dalam manual ini:

1. **Cek Console Browser**: Tekan F12 → Console untuk melihat error
2. **Coba Browser Lain**: Chrome, Firefox, Safari, Edge
3. **Refresh Halaman**: Kadang masalah bisa teratasi dengan refresh
4. **Restart Browser**: Tutup dan buka kembali browser

---

## 🎉 Selamat Menggunakan!

Terima kasih telah menggunakan **AI Voice Tuning**! 

Semoga aplikasi ini membantu Anda menghasilkan audio berkualitas tinggi dengan pitch correction yang akurat.

**Happy Tuning! 🎵✨**

---

*Manual ini dibuat untuk membantu pengguna memaksimalkan penggunaan AI Voice Tuning. Jika ada pertanyaan atau saran, jangan ragu untuk menghubungi developer.*