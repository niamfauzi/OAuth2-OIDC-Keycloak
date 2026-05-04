# Changelog

Catatan perubahan dokumentasi dan tahapan project agar mudah dilanjutkan ke tahap berikutnya.

## 2026-05-04 - Tahap 11

Ditambahkan prompt Tahap 11 untuk opsi kedua user management:

- menambahkan rencana service baru `apps/user-api/`
- User Management API bertanggung jawab untuk list, create, dan update user melalui Keycloak Admin API
- frontend menambahkan halaman `/users` untuk admin sederhana
- akses user management dibatasi role `app_admin`
- credential Keycloak Admin API hanya boleh disimpan di backend, bukan di Nuxt
- Product API dan Transaction API tetap tidak dicampur dengan concern user management

File terkait:

- `docs/prompt/Tahap 11 — User Management API dengan Keycloak Admin API.txt`

Implementasi Tahap 11:

- menambahkan service baru `apps/user-api/` dengan Bun + Elysia
- menambahkan endpoint `GET /health`, `GET /users`, `POST /users`, dan `PUT /users/:id`
- User Management API memvalidasi bearer token lewat JWKS Keycloak
- akses endpoint `/users` dibatasi untuk realm role `app_admin`
- User Management API mengambil admin token Keycloak lewat client credentials
- User Management API memanggil Keycloak Admin API dari server-side untuk list, create, dan update user
- menambahkan halaman Nuxt `/users` untuk list, create, dan update user sederhana
- menampilkan menu `Users` hanya untuk user login dengan role `app_admin`
- menambahkan env `USER_API_PORT`, `USER_API_BASE_URL`, dan `KEYCLOAK_ADMIN_*`
- menambahkan command `make install-user` dan `make run-user`
- menambahkan dokumentasi setup Keycloak service account untuk role `view-users`, `query-users`, dan `manage-users`
- verifikasi: `npm run build` untuk Nuxt berhasil, `bun build` untuk User API berhasil, dan `GET /health` User API mengembalikan `{"ok":true,"service":"user-api"}`

Catatan keamanan Tahap 11:

- credential admin Keycloak hanya dibaca oleh User Management API dari env backend
- Nuxt tidak menyimpan atau mengekspos credential admin Keycloak
- password user baru dikirim ke Keycloak sebagai temporary credential dan tidak disimpan di PostgreSQL aplikasi

## 2026-05-04 - Tahap 10

Ditambahkan prompt Tahap 10 untuk penyempurnaan Nuxt web app:

- menambahkan tombol logout sederhana pada web app
- mengubah input `product_id` di halaman `/transactions` menjadi select option dari data Product API
- menghitung `total_price` otomatis dari `selected_product.price * qty`
- menjaga endpoint backend, schema database, dan flow login tetap sama

File terkait:

- `docs/prompt/Tahap 10 — Penyempurnaan Web App logout dan transaksi.txt`

Implementasi Tahap 10 pada web app:

- menambahkan tombol `Logout` pada header global ketika user sudah login
- menghapus cookie `access_token` saat logout dan redirect ke `/login`
- mengambil reference product dari Product API pada halaman `/transactions`
- mengganti input manual `product_id` menjadi select product
- membuat `total_price` otomatis dari harga product terpilih dikali `qty`

## Tahap 1 sampai Tahap 9

Dokumen prompt tahap awal sudah tersedia di `docs/prompt/`:

- Tahap 1: bootstrap struktur project
- Tahap 2: setup Keycloak dasar
- Tahap 3: login dasar Nuxt ke Keycloak
- Tahap 4: Product API dengan Bun + Elysia + auth
- Tahap 5: Transaction API dengan Go + auth
- Tahap 6: schema PostgreSQL minimal
- Tahap 7: Nuxt consume Product API
- Tahap 8: Nuxt consume Transaction API
- Tahap 9: review end-to-end flow sederhana

Catatan arsitektur utama tetap mengacu ke:

- `docs/SIMPLE_ARCHITECTURE_GUIDE.md`
