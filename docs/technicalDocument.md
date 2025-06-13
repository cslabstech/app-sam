# Dokumentasi Teknis & Alur Aplikasi SAMAPP (CRM)

Aplikasi ini digunakan untuk manajemen outlet, kunjungan sales, pendaftaran outlet baru (NOO/LEAD), monitoring, dan pelaporan aktivitas sales di lapangan.

---

## 1. Daftar Screen/Halaman

| Nama Screen                  | Tujuan/Fungsi                                                    | Komponen UI Utama                |
|------------------------------|------------------------------------------------------------------|----------------------------------|
| Login                        | Autentikasi user                                                 | TextInput, Button, ErrorMessage  |
| Home/Dashboard               | Menu utama, ringkasan fitur                                      | Card, MenuButton, SummaryWidget  |
| Register NOO/LEAD            | Form pendaftaran outlet baru, upload & preview foto/video outlet | Form, ImagePicker, VideoPlayer, MapPicker |
| Plan Visit                   | Buat & lihat rencana kunjungan                                   | DatePicker, OutletList, Button   |
| Live Visit (Check-in/out)    | Proses kunjungan, check-in/out, upload foto, laporan             | Map, Camera, Form, Button        |
| Monitoring/Approval          | Monitoring, approval, atau reject NOO/kunjungan                  | List, ApproveButton, RejectModal |
| Detail Outlet                | Detail lengkap outlet                                            | Card, ImageGallery, Map          |
| Detail NOO/LEAD              | Detail pendaftaran outlet baru                                   | Card, StatusBadge, ApproveButton |
| Profile                      | Data user, statistik kunjungan, logout                           | Card, Chart, Button              |
| List Outlet                  | Daftar outlet                                                    | List, SearchBar, Card            |
| List Visit/Log Visit         | Histori kunjungan                                                | List, Filter, Card               |
| Update Foto/Video Outlet     | Update foto/video outlet                                         | ImagePicker, VideoPlayer, Button |
| Map/Location Picker          | Pilih & tampilkan lokasi outlet di peta                          | Map, Marker, Button              |

---

## 2. Alur Navigasi Aplikasi (User Journey)

1. Login → Home
2. Home → Pilih Menu (Register NOO/Plan Visit/Live Visit/Monitoring/Profile)
3. Register NOO/LEAD → Register NOO/LEAD Foto → Submit
4. Plan Visit → Pilih Outlet & Tanggal → Simpan
5. Live Visit → Pilih Outlet → Check-in → Laporan → Check-out
6. Monitoring/Approval → Lihat Daftar → Approve/Reject
7. Profile → Statistik & Logout

---

## 3. Struktur & Jenis Data

### UserModel
```json
{
  "username": "string",
  "namaLengkap": "string",
  "region": "string",
  "cluster": "string",
  "roles": ["sales", "supervisor", "admin"],
  "divisi": "string",
  "badanUsaha": "string",
  "idNotif": "string"
}
```

### OutletModel
```json
{
  "id": "string",
  "kodeOutlet": "string",
  "namaOutlet": "string",
  "alamatOutlet": "string",
  "namaPemilikOutlet": "string",
  "nomerTlpOutlet": "string",
  "potoShopSign": "string",
  "potoDepan": "string",
  "potoKiri": "string",
  "potoKanan": "string",
  "potoKtp": "string",
  "distric": "string",
  "video": "string",
  "limit": "number",
  "region": "string",
  "cluster": "string",
  "divisi": "string",
  "radius": "number",
  "latlong": "string",
  "statusOutlet": "string"
}
```

### NooModel, PlanVisitModel, VisitModel
- Lihat detail pada bagian "Data/Objek" tiap fitur di bawah.

---

## 4. Detail Endpoint API

| Endpoint                  | Method | Tujuan                                    |
|--------------------------|--------|-------------------------------------------|
| /user/login               | POST   | Login user                                |
| /user                     | GET    | Mendapatkan data user                     |
| /logout                   | POST   | Logout user                               |
| /noo, /lead               | POST   | Submit pendaftaran outlet baru            |
| /noo/                     | GET    | List semua NOO                            |
| /noo/confirm              | POST   | Konfirmasi NOO                            |
| /noo/approved             | POST   | Approval NOO                              |
| /noo/reject               | POST   | Reject NOO                                |
| /noo/getbu, /getdiv, ...  | GET    | Data master mapping outlet                |
| /planvisit/               | GET    | List plan visit                           |
| /planvisit/filter/        | GET    | List plan visit per bulan                 |
| /planvisit                | POST   | Tambah plan visit                         |
| /planvisit                | DELETE | Hapus plan visit                          |
| /visit, /visitNoo         | POST   | Submit kunjungan (check-in/out)           |
| /visit                    | GET    | List kunjungan                            |
| /visit/check/             | GET    | Cek status kunjungan outlet               |
| /visit/monitor            | GET    | Monitoring kunjungan harian               |
| /outlet                   | GET    | List outlet                               |
| /outlet/{kode}            | GET    | Detail outlet                             |
| /outlet                   | POST   | Update data outlet                        |

---

## 5. Contoh Respons API

### Sukses
```json
{
  "status": 200,
  "data": { ... }
}
```
### Error
```json
{
  "status": 400,
  "message": "Field required"
}
```

Status code umum: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)

---

## 6. Parameter API (POST/PUT)

Contoh: Register NOO/LEAD
```json
{
  "namaOutlet": "string" (wajib),
  "alamat": "string" (wajib),
  "foto": "file" (opsional),
  "video": "file" (opsional),
  "latlong": "string" (wajib)
}
```

Setiap endpoint POST/PUT harus dijelaskan field, tipe data, dan status wajib/opsional di dokumentasi API.

---

## 7. Validasi & Error Handling
- Field wajib tidak boleh kosong (misal: namaOutlet, alamat, latlong).
- Format email/nomor telepon harus valid.
- Validasi file (ukuran, tipe gambar/video).
- Error ditampilkan di UI dengan snackbar, alert, atau inline error.
- Error API harus ditangani dan ditampilkan jelas ke user.

---

## 8. Autentikasi & Otorisasi
- Semua endpoint (kecuali login) membutuhkan token autentikasi (JWT atau sejenisnya).
- Role user: sales, supervisor, admin.
- Hak akses:
  - Sales: register NOO, plan visit, live visit, lihat profil.
  - Supervisor: monitoring, approval, reject, lihat semua data.
  - Admin: akses penuh.

---

## 9. State Management
- Data user & token disimpan di local storage/secure storage.
- State global (user, token, plan visit, outlet) dikelola dengan Context API, Redux, atau Zustand.
- Data per screen bisa pakai state lokal (useState/useReducer).

---

## 10. Event & Aksi Pengguna
- Tombol: Login, Submit, Approve, Reject, Logout, Upload Foto/Video.
- Swipe: Refresh list.
- Tap: Pilih outlet, lihat detail.
- Drag: Pilih lokasi di peta.
- Event lain: Validasi otomatis saat input berubah.

---

## 11. Komponen Reusable
- Button (Primary, Secondary)
- Card (Outlet, Visit, NOO)
- Modal (Konfirmasi, Error)
- ListItem (Outlet, Visit)
- ImagePicker, VideoPlayer
- MapPicker
- SearchBar, FilterBar

Komponen reusable diletakkan di folder `components/`.

---

## 12. Catatan Teknis Tambahan
- Minimal Android 7.0+, iOS 12+.
- Integrasi: Google Maps, OneSignal (push notif), Camera, ImagePicker.
- Library wajib: React Native Paper, Axios, Expo Router, react-native-maps, react-native-image-picker.
- Struktur folder mengikuti standar Expo modern (lihat bagian Struktur Folder di atas).
- Penamaan file, variabel, dan komponen mengikuti camelCase/PascalCase.
- Pastikan semua request API menggunakan try-catch dan error handling yang baik.

---

## 13. Struktur Folder Project Expo (Best Practice)

```
app/         // Semua halaman (pages) & routing otomatis
components/  // Komponen UI reusable
constants/   // Nilai tetap/global (warna, dsb)
hooks/       // Custom React hooks
assets/      // Gambar, ikon, font, dsb
```

---

## 14. Routing & Folder app pada Expo Router

Expo Router menggunakan folder `app` sebagai inti sistem routing aplikasi, dengan konsep file-based routing mirip Next.js. Penyesuaian dengan #codebase saat ini:

- **Routing Otomatis:**
  - Setiap file/folder di dalam `app/` otomatis menjadi route (halaman) aplikasi.
  - Contoh: `app/(tabs)/index.tsx` → route utama tab, `app/(tabs)/explore.tsx` → halaman explore.
- **Nested Routes:**
  - Subfolder seperti `(tabs)/` di dalam `app/` membentuk nested route/tab navigation.
  - Contoh: `app/(tabs)/settings/account.tsx` → `/settings/account`.
- **Dynamic Route:**
  - Gunakan format `[param].tsx` untuk route dinamis.
  - Contoh: `app/outlet/[id].tsx` → `/outlet/123`.
- **Catch-all Route:**
  - Gunakan `[...all].tsx` untuk menangani route dinamis multi-segmen jika diperlukan.
- **Layout Khusus:**
  - File `_layout.tsx` digunakan di dalam `app/` dan subfolder seperti `(tabs)/` untuk layout konsisten pada subroute/tab.
- **Best Practice:**
  - Semua halaman/route diletakkan di dalam `app/`.
  - Komponen UI reusable tetap di `components/`.
  - Struktur dan penamaan file/folder mengikuti kebutuhan navigasi aplikasi dan standar Expo Router.

Dengan pendekatan ini, pengelolaan halaman dan navigasi menjadi lebih mudah, terstruktur, dan scalable sesuai standar Expo Router.

---

Dokumentasi ini wajib dibaca sebelum memulai development agar seluruh tim memahami alur, struktur, dan standar aplikasi SAMAPP (CRM).
