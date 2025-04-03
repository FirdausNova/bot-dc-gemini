# Changelog

## [Versi Terbaru]

### Penambahan Fitur Ingatan/Memori Permanen

- **Sistem Penyimpanan File** - Bot sekarang menyimpan histori percakapan dalam file JSON di direktori `data/history`
- **Format Data Terstruktur** - Data percakapan disimpan dengan metadata lengkap (peran, pesan, timestamp)
- **Persistensi Data** - Ingatan bot tetap tersimpan meskipun bot direstart
- **Perintah Baru** - Ditambahkan perintah `!memory` dengan subperintah:
  - `!memory` - Menampilkan ringkasan memori
  - `!memory clear` - Menghapus ingatan
  - `!memory export` - Mengekspor ingatan sebagai file teks
  - `!memory help` - Menampilkan bantuan
- **Shortcuts** - Ditambahkan shortcuts di perintah lain:
  - `!chat memori` - Melihat ringkasan
  - `!charchat memori` - Melihat ringkasan
  - Ketik `ingatan` di channel auto-respond
- **Dokumentasi** - Pembaruan README dengan informasi tentang sistem ingatan
- **Histori Lebih Panjang** - Ukuran histori maksimum ditingkatkan dari 10 ke 15 pesan

### Peningkatan Kualitas Respons

- **Konteks Percakapan** - Bot menggunakan data histori untuk memberikan respons yang lebih kontekstual
- **Format Gemini API** - Implementasi format histori yang dioptimalkan untuk Google Gemini API
- **Pengelolaan Memori** - Penambahan utilitas untuk mengelola ingatan percakapan

### Peningkatan Struktur Kode

- Pemisahan yang lebih baik antara fungsi-fungsi terkait ingatan
- Penanganan error yang lebih baik saat loading/saving data
- Optimasi struktur direktori untuk penyimpanan data 