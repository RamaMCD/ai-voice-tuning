# Cara Install FFmpeg di Windows

FFmpeg diperlukan untuk memproses file audio yang direkam dari browser (format WebM).

## Metode 1: Menggunakan Winget (Recommended)

1. Buka PowerShell atau Command Prompt sebagai Administrator
2. Jalankan command berikut:
```bash
winget install ffmpeg
```

3. Restart terminal Anda
4. Verifikasi instalasi:
```bash
ffmpeg -version
```

## Metode 2: Download Manual

1. Download FFmpeg dari: https://github.com/BtbN/FFmpeg-Builds/releases
   - Pilih file: `ffmpeg-master-latest-win64-gpl.zip`

2. Extract file ZIP ke folder, misalnya: `C:\ffmpeg`

3. Tambahkan ke PATH:
   - Buka "Environment Variables" (cari di Start Menu)
   - Di "System Variables", cari variable "Path"
   - Klik "Edit"
   - Klik "New"
   - Tambahkan path ke folder bin ffmpeg, contoh: `C:\ffmpeg\bin`
   - Klik "OK" untuk semua dialog

4. Restart terminal Anda

5. Verifikasi instalasi:
```bash
ffmpeg -version
```

## Metode 3: Menggunakan Chocolatey

Jika Anda sudah punya Chocolatey:

```bash
choco install ffmpeg -y
```

## Setelah Install FFmpeg

1. Restart server aplikasi:
```bash
npm run dev
```

2. Coba record audio lagi dari browser
3. Audio seharusnya bisa diproses sekarang

## Troubleshooting

Jika masih error setelah install ffmpeg:
- Pastikan terminal sudah di-restart
- Cek apakah ffmpeg ada di PATH dengan command: `where ffmpeg`
- Restart aplikasi Node.js

## Alternative: Gunakan Upload File MP3/WAV

Jika tidak ingin install ffmpeg, Anda bisa:
1. Gunakan fitur "Upload" instead of "Record"
2. Upload file audio dalam format .wav atau .mp3
3. File-file ini bisa diproses tanpa ffmpeg
