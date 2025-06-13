# API Documentation for Mobile Developer

---

## Authentication

### Login
- **Endpoint:** `POST /api/user/login`
- **Request Body:**
  ```json
  {
    "version": "1.0.3",
    "username": "string",
    "password": "string",
    "notif_id": "string"
  }
  ```
- **Response Sukses:**
  ```json
  {
    "meta": { "code": 200, "status": "success", "message": "Authenticated" },
    "data": {
      "access_token": "...",
      "token_type": "Bearer",
      "user": { /* lihat Format User di bawah */ }
    }
  }
  ```
- **Response Gagal:**
  ```json
  {
    "meta": { "code": 422, "status": "error", "message": "Invalid Input" },
    "data": {
      "errors": { "username": ["The username field is required."] },
      "message": "Periksa kembali data yang Anda masukkan."
    }
  }
  ```

### Logout
- **Endpoint:** `POST /api/user/logout`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
  ```json
  {
    "meta": { "code": 200, "status": "success", "message": "Token Revoked" },
    "data": { "message": "Anda telah berhasil keluar dari aplikasi" }
  }
  ```

---

## User

### Get Profile
- **Endpoint:** `GET /api/user`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
  ```json
  {
    "meta": { "code": 200, "status": "success", "message": "Fetch profile success" },
    "data": {
      "user": { /* lihat Format User di bawah */ },
      "message": "Data profil pengguna berhasil diambil"
    }
  }
  ```
- **Format User:**
  ```json
  {
    "username": "string",
    "nama_lengkap": "string",
    "region": { "id": 1, "name": "..." },
    "cluster": { "id": 1, "name": "..." },
    "role": { "id": 1, "name": "..." },
    "divisi": { "id": 1, "name": "..." },
    "badanusaha": { "id": 1, "name": "..." },
    "id_notif": "string"
  }
  ```

---

## Visit

### List Visit
- **Endpoint:** `GET /api/visit`
- **Headers:** `Authorization: Bearer {token}`
- **Query Params (opsional):**
  - `search` — Cari berdasarkan nama/kode outlet (string)
  - `filters[date]` — Filter tanggal visit (format: YYYY-MM-DD)
  - `filters[month]` — Filter bulan visit (format: MM atau 1-12)
  - `filters[tipe_visit]` — Filter tipe visit (string atau array)
  - `per_page` — Jumlah data per halaman (default: 20)
  - `page` — Nomor halaman (default: 1)
  - `sort_column` — Kolom untuk sorting (`tanggal_visit`, `check_in_time`, `check_out_time`, `tipe_visit`, `durasi_visit`)
  - `sort_direction` — Arah sorting (`asc` atau `desc`, default: `desc`)
- **Response:**
  ```json
  {
    "meta": {
      "code": 200,
      "status": "success",
      "message": "Data visit berhasil diambil",
      "current_page": 1,
      "last_page": 2,
      "total": 20,
      "per_page": 10
    },
    "data": [
      {
        "id": 1,
        "tanggal_visit": "2025-05-17",
        "tipe_visit": "PLANNED",
        "check_in_time": "08:00:00",
        "check_out_time": "09:00:00",
        "durasi_visit": 60,
        "outlet": { /* ... */ },
        "user": { /* ... */ }
      }
    ]
  }
  ```

### Detail Visit
- **Endpoint:** `GET /api/visit/{id}`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
  ```json
  {
    "meta": { "code": 200, "status": "success", "message": "Detail visit success" },
    "data": {
      "id": 1,
      "outlet_id": 2,
      // ...data visit lainnya
    }
  }
  ```

### Buat Visit (Check-in)
- **Endpoint:** `POST /api/visit`
- **Headers:** `Authorization: Bearer {token}`
- **Request Body (multipart/form-data):**
  - `kode_outlet` (wajib)
  - `picture_visit` (wajib, file image jpg/jpeg/png)
  - `latlong_in` (wajib, string)
  - `tipe_visit` (wajib, string)
- **Response:**
  ```json
  {
    "meta": { "code": 200, "status": "success", "message": "Berhasil check-in" },
    "data": {
      "visit": { /* ... */ }
    }
  }
  ```

### Update Visit (Check-out)
- **Endpoint:** `PUT /api/visit/{id}`
- **Headers:** `Authorization: Bearer {token}`
- **Request Body (multipart/form-data):**
  - `latlong_out` (wajib)
  - `laporan_visit` (wajib)
  - `picture_visit` (wajib, file image jpg/jpeg/png)
  - `transaksi` (wajib)
- **Response:**
  ```json
  {
    "meta": { "code": 200, "status": "success", "message": "Berhasil check-out" },
    "data": { /* ... */ }
  }
  ```

### Cek Status Visit
- **Endpoint:** `GET /api/visit/check`
- **Headers:** `Authorization: Bearer {token}`
- **Query Params:**
  - `kode_outlet` (wajib)
- **Response:**
  ```json
  {
    "meta": { "code": 200, "status": "success", "message": "..." },
    "data": {
      "checked_in": true,
      "checked_out": false,
      // ...data lain jika ada
    }
  }
  ```

### Monitor Visit
- **Endpoint:** `GET /api/visit/monitor`
- **Headers:** `Authorization: Bearer {token}`
- **Query Params (opsional):**
  - `date` (format: YYYY-MM-DD, default: hari ini)
- **Response:**
  ```json
  {
    "meta": { "code": 200, "status": "success", "message": "Fetch monitoring visit success" },
    "data": [ /* array visit sesuai role user */ ]
  }
  ```

---

## Plan Visit

### List Plan Visit
- **Endpoint:** `GET /api/planvisit`
- **Headers:** `Authorization: Bearer {token}`
- **Query Params (opsional):**
  - `search`, `month`, `date`, `outlet`, `per_page`, `page`
- **Response:**
  ```json
  {
    "meta": {
      "code": 200,
      "status": "success",
      "message": "Fetch plan visit success",
    },
    "data": [
      { "id": 1, "outlet_id": 2, "tanggal_visit": "2024-06-01", /* ... */ }
    ]
  }
  ```

### Tambah Plan Visit
- **Endpoint:** `POST /api/planvisit`
- **Headers:** `Authorization: Bearer {token}`
- **Request Body:**
  - `kode_outlet` (wajib)
  - `tanggal_visit` (wajib, format: YYYY-MM-DD, harus >= hari ini, validasi H-3 atau minggu berjalan sesuai divisi)
- **Response:**
  ```json
  {
    "meta": { "code": 200, "status": "success", "message": "Plan visit berhasil ditambahkan" },
    "data": { /* data plan visit */ }
  }
  ```

### Hapus Plan Visit
- **Endpoint:** `DELETE /api/planvisit/{id}`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
  ```json
  {
    "meta": { "code": 200, "status": "success", "message": "Plan visit berhasil dihapus" },
    "data": null
  }
  ```

---

## Catatan Umum
- Semua endpoint (kecuali login) membutuhkan header:  
  `Authorization: Bearer {token}`
- Format tanggal selalu `YYYY-MM-DD`.
- Untuk filter array (misal `filters[tipe_visit]`), gunakan format array di query string:  
  `filters[tipe_visit][]=PLANNED&filters[tipe_visit][]=EXTRACALL`