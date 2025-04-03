# GeminiBot DC JS

Bot Discord AI yang terintegrasi dengan Google Gemini API, menawarkan simulasi karakter mendalam yang membuat percakapan dengan karakter favorit Anda terasa hidup dan nyata.

## Fitur

- Berbicara dengan AI menggunakan Google Gemini API
- Kustomisasi karakter AI berdasarkan karakter film/anime
- Manajemen karakter (tambah, hapus, set default)
- **Sistem Ingatan Permanen** - Bot mengingat percakapan dengan setiap pengguna dan menyimpannya dalam file JSON
- **Narasi Bergaya Novel** - Bot dapat mengubah percakapan menjadi narasi deskriptif dengan detail emosi, gerakan, dan suasana seperti di Shapes.inc
- **Respons Imersif** - Dialog yang diperkaya dengan deskripsi bahasa tubuh, emosi internal, dan detail lingkungan
- Histori percakapan untuk setiap pengguna
- Mendukung percakapan multi-saluran
- **Auto-respond di channel khusus** - Bot akan otomatis merespon pesan tanpa perlu menggunakan perintah
- **Pengalaman chatting natural** - Merespon seperti obrolan biasa dengan indikator mengetik
- **Smart fallback system** - Otomatis beralih ke model alternatif saat model utama mengalami masalah kuota
- **Dukungan Perintah Slash** - Mendukung perintah Discord modern menggunakan `/` sebagai pengganti perintah legacy dengan prefix `!`

## Pengaturan

### Prasyarat

- Node.js (versi 16.x atau lebih tinggi)
- Token Bot Discord
- API Key Google Gemini
- Discord Application ID (Client ID) untuk perintah slash

### Instalasi

1. Clone repositori ini
2. Install dependensi:
   ```bash
   npm install
   ```
3. Salin file `.env.example` menjadi `.env`
   ```bash
   cp .env.example .env
   ```
4. Ubah file `.env` dan isi token dan konfigurasi yang diperlukan:
   ```
   DISCORD_TOKEN=token_bot_discord_anda
   DISCORD_CLIENT_ID=application_id_discord_anda
   GEMINI_API_KEY=api_key_gemini_anda
   ```

### Mendapatkan API Key Google Gemini

1. Kunjungi [Google AI Studio](https://ai.google.dev/)
2. Buat akun atau masuk dengan akun Google yang ada
3. Buka [Get API Key](https://ai.google.dev/tutorials/setup)
4. Ikuti instruksi untuk membuat API key baru
5. Salin API key dan tempelkan di file `.env` pada variabel `GEMINI_API_KEY`

### Mendaftarkan Perintah Slash

Setelah mengatur `DISCORD_TOKEN` dan `DISCORD_CLIENT_ID` di file `.env`, jalankan:

```bash
npm run deploy
```

Ini akan mendaftarkan semua perintah slash ke Discord API sehingga tersedia di semua server tempat bot berada.

### Menjalankan Bot

```bash
npm start
```

Untuk pengembangan (dengan hot reload):
```bash
npm run dev
```

## Penggunaan

Bot mendukung dua mode perintah:
1. **Perintah Slash** - Menggunakan `/` (lebih modern, autocomplete, dan dukungan UI lebih baik)
2. **Perintah Legacy** - Menggunakan prefix `!` (dapat dikonfigurasi di file `.env`)

### Perintah Slash (/)

- `/chat <pesan>` - Berbicara dengan AI menggunakan karakter default
- `/character list` - Menampilkan daftar karakter yang tersedia
- `/character add <nama> <tipe> <deskripsi>` - Menambahkan karakter baru
- `/character set <nama>` - Mengatur karakter default
- `/character delete <nama>` - Menghapus karakter
- `/character info [nama]` - Menampilkan informasi karakter
- `/character appearance <nama> <penampilan>` - Mengatur deskripsi penampilan karakter
- `/character message <nama> <pesan>` - Mengatur pesan awal karakter
- `/character export <nama>` - Mengekspor konfigurasi karakter ke file JSON
- `/import <file>` - Mengimpor karakter dari file JSON (lampirkan file)
- `/character template list` - Menampilkan daftar template karakter yang tersedia
- `/character template info <nama>` - Menampilkan informasi detail tentang template
- `/character template use <template> <nama>` - Membuat karakter baru dari template
- `/character template add <template> <karakter>` - Menambahkan karakter yang ada sebagai template baru
- `/character template delete <nama>` - Menghapus template karakter
- `/character template blank` - Mengekspor template kosong yang dapat diedit dan diimpor kembali

### Perintah Legacy (dengan prefix `!`)

- `!chat <pesan>` - Berbicara dengan AI menggunakan karakter default
- `!chat memori` atau `!chat ingatan` - Melihat narasi bergaya novel dari percakapan Anda dengan bot
- `!charchat <nama_karakter> <pesan>` - Berbicara dengan AI menggunakan karakter tertentu
- `!charchat memori` - Melihat narasi bergaya novel dari percakapan Anda dengan bot dalam karakter tertentu
- `!memory` - Menampilkan narasi dari ingatan percakapan
- `!memory clear` - Menghapus semua ingatan percakapan 
- `!memory export` - Mengekspor ingatan percakapan sebagai file teks
- `!memory help` - Menampilkan bantuan perintah memori
- `!character list` - Menampilkan daftar karakter yang tersedia
- `!character add <nama> <tipe> <deskripsi>` - Menambahkan karakter baru
- `!character appearance <nama> <deskripsi_penampilan>` - Mengatur deskripsi penampilan karakter
- `!character message <nama> <pesan_awal>` - Mengatur pesan awal karakter
- `!character export <nama>` - Mengekspor konfigurasi karakter ke file JSON
- `!character import` - Mengimpor karakter dari file JSON (lampirkan file saat mengirim perintah)
- `!character template list` - Menampilkan daftar template karakter yang tersedia
- `!character template info <nama_template>` - Menampilkan informasi detail tentang template
- `!character template use <nama_template> <nama_karakter>` - Membuat karakter baru dari template
- `!character template add <nama_template> <nama_karakter>` - Menambahkan karakter yang ada sebagai template baru
- `!character template delete <nama_template>` - Menghapus template karakter
- `!character template blank` - Mengekspor template kosong yang dapat diedit dan diimpor kembali
- `!character set <nama>` - Mengatur karakter default
- `!character delete <nama>` - Menghapus karakter
- `!character info [nama]` - Menampilkan informasi karakter
- `!setchannel <add/remove> [channel_id]` - Mengatur channel untuk auto-respond (Admin only)
- `!clear` - Membersihkan histori percakapan dengan AI
- `!help` - Menampilkan bantuan penggunaan bot

### Sistem Ingatan

Bot ini dilengkapi dengan sistem ingatan yang memungkinkannya mengingat percakapan dengan setiap pengguna. Fitur ini memiliki beberapa keunggulan:

1. **Ingatan Permanen** - Percakapan disimpan dalam file JSON sehingga bertahan meskipun bot direstart
2. **Narasi Bergaya Novel** - Bot dapat menampilkan ingatan percakapan dalam bentuk narasi dengan detail emosi, gerakan, dan suasana, mirip seperti dalam novel atau film
3. **Ringkasan Percakapan** - Gunakan `!memory`, `!chat memori`, atau ketik `ingatan` di channel auto-respond untuk melihat ringkasan percakapan Anda dengan bot
4. **Ekspor Percakapan** - Dengan perintah `!memory export`, Anda dapat mengekspor seluruh histori percakapan Anda sebagai file teks
5. **Respons Kontekstual** - Bot menggunakan histori percakapan untuk memberikan respons yang lebih relevan dan personal
6. **Adaptasi Karakter** - AI akan mengingat percakapan sebelumnya sambil tetap mempertahankan karakteristik karakter yang dipilih

Data percakapan disimpan secara aman di direktori `data/history` dalam format JSON dengan struktur berikut:

```json
[
  {
    "role": "user",
    "message": "Halo, apa kabar?",
    "timestamp": "2023-08-01T12:00:00.000Z"
  },
  {
    "role": "bot",
    "message": "Halo! Saya baik-baik saja. Bagaimana dengan Anda?",
    "timestamp": "2023-08-01T12:00:05.000Z"
  }
]
```

Untuk mengelola ingatan/memori, Anda dapat menggunakan beberapa perintah:

- **Melihat Narasi Ingatan**: `!memory` atau `!chat memori` atau ketik `ingatan` di channel auto-respond - Bot akan menampilkan narasi bergaya novel dari percakapan Anda
- **Narasi Otomatis**: Bot secara otomatis membuat narasi percakapan setelah beberapa interaksi untuk meningkatkan pengalaman pengguna
- **Menghapus Ingatan**: `!memory clear` - Ini akan menghapus semua ingatan percakapan dengan bot
- **Mengekspor Ingatan**: `!memory export` - Bot akan mengirimkan file teks berisi seluruh histori percakapan

### Mode Chat Natural

Bot ini menawarkan pengalaman chat yang natural seperti shapes.inc dengan fitur-fitur berikut:

1. **Narasi Bergaya Novel** - Bot dapat mengubah percakapan menjadi cerita deskriptif dengan detail emosi, gestur, dan ekspresi wajah, memberikan pengalaman yang lebih imersif.

2. **Indikator Mengetik** - Bot akan menampilkan indikator "sedang mengetik" saat memproses respons, memberikan pengalaman chatting yang lebih natural.

3. **Auto-Respond Channel** - Setelah channel diatur dengan `!setchannel add`, semua pesan di channel tersebut akan otomatis mendapatkan respons dari bot tanpa perlu menggunakan perintah `!chat`.

4. **Format Respons Natural** - Bot akan merespons seperti obrolan normal, bukan dengan format embed, sehingga seperti berbicara dengan manusia sungguhan.

### Auto-Respond

Bot dilengkapi dengan fitur auto-respond yang memungkinkan bot merespon setiap pesan di channel tertentu tanpa perlu menggunakan prefix perintah. Untuk mengatur channel ini:

1. Gunakan perintah `!setchannel add` di channel yang ingin dijadikan channel auto-respond, atau
2. Gunakan perintah `!setchannel add [channel_id]` untuk menentukan channel lain

Setelah channel diatur, bot akan:
- Mengirim pesan perkenalan di channel tersebut
- Otomatis merespons setiap pesan tanpa perlu menggunakan perintah
- Menampilkan indikator mengetik saat memproses respons

Untuk menonaktifkan fitur ini, gunakan perintah `!setchannel remove`.

### Sistem Template Karakter

Bot ini dilengkapi dengan sistem template karakter yang memudahkan pembuatan karakter baru dengan cepat. Fitur ini memungkinkan Anda untuk:

1. **Menggunakan Template Siap Pakai** - Bot menyediakan beberapa template karakter populer dari anime, film, dan game yang bisa langsung digunakan.

2. **Membuat Karakter dengan Cepat** - Dengan perintah `/character template use <nama_template> <nama_karakter>` atau `!character template use <nama_template> <nama_karakter>`, Anda dapat membuat karakter baru lengkap dengan penampilan dan pesan awal dalam sekali perintah.

3. **Melihat Template yang Tersedia** - Gunakan `/character template list` atau `!character template list` untuk melihat semua template yang tersedia dan `/character template info <nama_template>` atau `!character template info <nama_template>` untuk melihat detail lengkap template.

4. **Menambahkan Template Kustom** - Anda dapat mengubah karakter yang sudah ada menjadi template dengan perintah `/character template add <nama_template> <nama_karakter>` atau `!character template add <nama_template> <nama_karakter>`.

5. **Pengelolaan Template** - Template dapat dihapus dengan perintah `/character template delete <nama_template>` atau `!character template delete <nama_template>` jika sudah tidak diperlukan.

Template karakter disimpan dalam format JSON di file `src/data/character_templates.json` dengan struktur berikut:

```json
{
  "nama_template": {
    "name": "Nama Karakter",
    "type": "Tipe Karakter",
    "description": "Deskripsi karakter",
    "appearance": "Deskripsi penampilan karakter",
    "initialMessage": "Pesan awal karakter",
    "personality": "Kepribadian karakter",
    "background": "Latar belakang karakter",
    "relationships": "Hubungan karakter dengan tokoh lain",
    "quirks": "Kebiasaan unik karakter",
    "likes": "Hal-hal yang disukai karakter",
    "dislikes": "Hal-hal yang tidak disukai karakter",
    "goals": "Tujuan karakter",
    "expressionPatterns": {
      "happy": "Cara karakter mengekspresikan kebahagiaan",
      "sad": "Cara karakter mengekspresikan kesedihan",
      "angry": "Cara karakter mengekspresikan kemarahan",
      "nervous": "Cara karakter mengekspresikan kegugupan",
      "surprised": "Cara karakter mengekspresikan keterkejutan",
      "thinking": "Cara karakter mengekspresikan sedang berpikir"
    }
  }
}
```

Untuk memudahkan pembuatan karakter dari awal, disediakan juga template kosong yang dapat diakses dengan perintah `/character template blank` atau `!character template blank`. Template ini berisi struktur lengkap untuk semua atribut karakter yang didukung.

### Contoh Penggunaan

1. Menambahkan karakter baru:
   ```
   /character add nama: "Naruto" tipe: "anime" deskripsi: "Ninja yang ceria dan bersemangat dari Desa Konoha yang bermimpi menjadi Hokage"
   ```
   Atau dengan perintah legacy:
   ```
   !character add "Naruto" "anime" "Ninja yang ceria dan bersemangat dari Desa Konoha yang bermimpi menjadi Hokage"
   ```

2. Mengatur penampilan karakter:
   ```
   /character appearance nama: Naruto penampilan: "penampilan yang menarik dengan rambut pirang jabrik, mata biru cerah, dan tiga garis tanda lahir di masing-masing pipinya yang menyerupai kumis kucing."
   ```
   Atau dengan perintah legacy:
   ```
   !character appearance Naruto "penampilan yang menarik dengan rambut pirang jabrik, mata biru cerah, dan tiga garis tanda lahir di masing-masing pipinya yang menyerupai kumis kucing."
   ```

3. Mengatur pesan awal karakter:
   ```
   /character message nama: Naruto pesan: "hai, aku Naruto Uzumaki! Aku akan menjadi Hokage suatu hari nanti, percayalah!"
   ```
   Atau dengan perintah legacy:
   ```
   !character message Naruto "hai, aku Naruto Uzumaki! Aku akan menjadi Hokage suatu hari nanti, percayalah!"
   ```

4. Mengekspor konfigurasi karakter ke file:
   ```
   /character export nama: Naruto
   ```
   Atau dengan perintah legacy:
   ```
   !character export Naruto
   ```
   Bot akan mengirimkan file JSON dengan konfigurasi karakter.

5. Mengimpor karakter dari file:
   ```
   /import
   ```
   Lampirkan file JSON konfigurasi karakter saat mengirim perintah ini.
   
   Atau dengan perintah legacy:
   ```
   !character import
   ```
   Lampirkan file JSON konfigurasi karakter saat mengirim perintah ini.

6. Berbicara dengan AI:
   ```
   /chat pesan: Bagaimana harimu?
   ```
   Atau dengan perintah legacy:
   ```
   !chat Bagaimana harimu?
   ```

7. Mengatur karakter sebagai default:
   ```
   /character set nama: Naruto
   ```
   Atau dengan perintah legacy:
   ```
   !character set Naruto
   ```

8. Melihat daftar karakter:
   ```
   /character list
   ```
   Atau dengan perintah legacy:
   ```
   !character list
   ```

9. Menggunakan template karakter:
   ```
   /character template list
   ```
   Bot akan menampilkan daftar template karakter yang tersedia.
   
   Atau dengan perintah legacy:
   ```
   !character template list
   ```

10. Membuat karakter baru dari template:
    ```
    /character template use template: naruto nama: MyNaruto
    ```
    Bot akan membuat karakter baru bernama "MyNaruto" dengan semua atribut dari template Naruto.
    
    Atau dengan perintah legacy:
    ```
    !character template use naruto MyNaruto
    ```

## Pemecahan Masalah

### Error Gemini API dan Masalah Kuota

Jika Anda mendapatkan pesan error seperti "quota exceeded" atau "429 Too Many Requests", itu menunjukkan bahwa Anda telah mencapai batas kuota dari API Gemini. Bot ini dirancang untuk menangani masalah tersebut dengan:

1. **Sistem Fallback Otomatis** - Bot akan otomatis mencoba beberapa model alternatif jika model utama mengalami masalah kuota.

2. **Sistem Cooling Period** - Bot akan menandai model yang mencapai batas kuota dan menunggu periode tertentu sebelum mencoba lagi.

3. **Optimasi Token** - Bot telah dikonfigurasi untuk menggunakan token seminimal mungkin untuk menghemat kuota.

#### Meningkatkan Kuota Gemini API:

Jika Anda sering mengalami masalah kuota:

1. **Upgrade ke Gemini API Pro** - Kunjungi [Google AI Studio Pricing](https://ai.google.dev/pricing) untuk informasi tentang paket berbayar yang menawarkan kuota lebih tinggi.

2. **Buat Proyek Cloud Terpisah** - Anda dapat membuat beberapa proyek Google Cloud dengan API key terpisah untuk mendistribusikan penggunaan.

3. **Batasi Penggunaan** - Pertimbangkan untuk membatasi siapa yang dapat menggunakan bot dan di channel mana.

4. **Model Alternatif** - Edit file `src/utils/gemini.js` untuk mengatur model yang lebih hemat kuota sebagai model utama. Model `gemini-1.5-flash` biasanya memiliki kuota lebih tinggi daripada `gemini-1.5-pro`.

### Masalah dengan Perintah Slash

1. **Perintah Slash Tidak Muncul**: Pastikan Anda telah menjalankan `npm run deploy` untuk mendaftarkan perintah ke Discord API dan bot memiliki izin `applications.commands`.

2. **Perintah Slash Error**: Jika perintah slash tidak berfungsi dengan benar, pastikan Anda menggunakan versi discord.js yang mendukung perintah slash (v14 atau lebih tinggi).

3. **Perintah Lama Tidak Hilang**: Jika Anda memperbarui perintah slash tetapi yang lama masih muncul, coba reset aplikasi di Discord Developer Portal atau jalankan perintah untuk menghapus perintah yang tidak digunakan.

4. **Klien ID Tidak Valid**: Periksa apakah `DISCORD_CLIENT_ID` di file `.env` valid dan cocok dengan ID aplikasi Discord Anda.

### Masalah Umum Lainnya

1. **Izin Bot**: Pastikan bot Discord Anda memiliki izin yang diperlukan di server. Bot membutuhkan izin untuk membaca dan mengirim pesan.

2. **Token Bot**: Verifikasi token bot Discord Anda valid dan benar di file `.env`.

3. **Channel ID**: Jika menggunakan fitur auto-respond, pastikan ID channel yang ditentukan valid dan bot memiliki akses ke channel tersebut.

4. **Model Tidak Tersedia**: Jika semua model tidak tersedia, tunggu beberapa menit sebelum mencoba lagi. Bot akan otomatis mencoba tersedia kembali setelah periode cooling.

5. **File Histori Rusak**: Jika terjadi masalah dengan sistem ingatan, coba hapus file di direktori `data/history` dan mulai percakapan baru. Anda juga dapat menggunakan `!memory clear` untuk menghapus ingatan.

## Konfigurasi Lanjutan

File `.env` mendukung konfigurasi tambahan:

```
# Discord Bot Token
DISCORD_TOKEN=token_bot_discord_anda

# Discord Client ID (untuk perintah slash)
DISCORD_CLIENT_ID=application_id_discord_anda

# Gemini API Key
GEMINI_API_KEY=api_key_gemini_anda

# ID Channel untuk penggunaan bot (opsional)
ALLOWED_CHANNEL_IDS=123456789012345678,987654321098765432

# ID Channel untuk auto-respond (bot akan merespon setiap pesan di channel ini tanpa perlu prefix)
AUTO_RESPOND_CHANNEL_ID=123456789012345678

# Prefix untuk perintah bot
BOT_PREFIX=!

# Karakter default untuk AI
DEFAULT_CHARACTER=Naruto Uzumaki,anime,Naruto adalah ninja yang ceria dan bersemangat dari Desa Konoha yang bermimpi menjadi Hokage 