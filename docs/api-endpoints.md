# API Endpoints Documentation

Dokumen ini merangkum seluruh endpoint utama beserta penjelasan singkat dan requirement request/response. Semua endpoint menggunakan prefix `/api/`.

---

## Auth & User

| Method | Endpoint           | Deskripsi                | Auth Required | Body Params / Query |
|--------|--------------------|--------------------------|---------------|---------------------|
| POST   | /user/login        | Login user (username/pw) | No            | username, password, version, notif_id |
| POST   | /user/send-otp     | Kirim OTP ke WhatsApp    | No            | phone              |
| POST   | /user/verify-otp   | Verifikasi OTP & login   | No            | phone, otp         |
| GET    | /user              | Get user profile         | Yes           | -                  |
| POST   | /user/logout       | Logout user              | Yes           | -                  |

## Outlet

| Method | Endpoint           | Deskripsi                | Auth Required | Body Params / Query |
|--------|--------------------|--------------------------|---------------|---------------------|
| GET    | /outlet            | List outlet              | Yes           | -                  |
| GET    | /outlet/{id}       | Detail outlet            | Yes           | -                  |
| PUT    | /outlet/{id}       | Update outlet            | Yes           | ...                |

## Visit

| Method | Endpoint           | Deskripsi                | Auth Required | Body Params / Query |
|--------|--------------------|--------------------------|---------------|---------------------|
| GET    | /visit             | List kunjungan           | Yes           | -                  |
| GET    | /visit/{id}        | Detail kunjungan         | Yes           | -                  |
| POST   | /visit             | Tambah kunjungan         | Yes           | ...                |
| PUT    | /visit/{id}        | Update kunjungan         | Yes           | ...                |
| GET    | /visit/check       | Cek kunjungan hari ini   | Yes           | -                  |

## Referensi (Dropdown)

| Method | Endpoint           | Deskripsi                | Auth Required |
|--------|--------------------|--------------------------|---------------|
| GET    | /badanusaha        | List badan usaha         | Yes           |
| GET    | /division          | List division            | Yes           |
| GET    | /region            | List region              | Yes           |
| GET    | /cluster           | List cluster             | Yes           |
| GET    | /role              | List role                | Yes           |

## Plan Visit

| Method | Endpoint           | Deskripsi                | Auth Required |
|--------|--------------------|--------------------------|---------------|
| GET    | /planvisit         | List plan visit          | Yes           |
| POST   | /planvisit         | Tambah plan visit        | Yes           |
| DELETE | /planvisit/{id}    | Hapus plan visit         | Yes           |

## User Management

| Method | Endpoint           | Deskripsi                | Auth Required |
|--------|--------------------|--------------------------|---------------|
| GET    | /users             | List user                | Yes           |
| POST   | /users             | Tambah user              | Yes           |
| GET    | /users/{id}        | Detail user              | Yes           |
| PUT    | /users/{id}        | Update user              | Yes           |
| DELETE | /users/{id}        | Hapus user               | Yes           |

---

### Catatan Penting
- Semua endpoint (kecuali login/send-otp/verify-otp) membutuhkan header Authorization: `Bearer <token>`.
- Response format JSON standar: `{ success, message, data }`.
- Untuk detail validasi dan error handling, lihat kode controller terkait.

---

_Dokumen ini wajib diperbarui jika ada perubahan endpoint._
