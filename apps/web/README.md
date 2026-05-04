# Web App

Nuxt 3 minimal untuk login dasar ke Keycloak.

Route yang tersedia pada tahap ini:

- `GET /login`
- `GET /`
- `GET /auth/callback`
- `GET /profile`
- `GET /products`
- `GET /transactions`

## Menjalankan App

1. Pastikan file root `.env` sudah ada dan berisi `PRODUCT_API_BASE_URL`, `TRANSACTION_API_BASE_URL`, `KEYCLOAK_BASE_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`, dan `KEYCLOAK_REDIRECT_URI`.
2. Masuk ke folder `apps/web`.
3. Jalankan `npm install`.
4. Jalankan `npm run dev`.
5. Buka `http://localhost:7011/login`.

Nuxt akan membaca env `PRODUCT_API_BASE_URL`, `TRANSACTION_API_BASE_URL`, dan `KEYCLOAK_*` yang sama langsung dari root `.env`.

## Flow Manual Test

1. Buka `/login` dan pastikan tombol `Login with Keycloak` tampil.
2. Klik tombol login dan pastikan browser redirect ke authorization endpoint Keycloak.
3. Login dengan user `demo`.
4. Pastikan Keycloak redirect ke `/auth/callback?code=...`.
5. Pastikan callback menukar code ke token lalu redirect ke `/profile`.
6. Pastikan `/profile` menampilkan `user_id` dan `preferred_username`.
7. Pastikan menu global tampil dengan link `Profile`, `Products`, dan `Order / Transaksi`.
8. Klik `Products` dan pastikan masuk ke `/products`, lalu list product bisa dimuat dari Product API.
9. Isi form lalu submit dan pastikan product baru muncul di list.
10. Klik `Order / Transaksi` dan pastikan masuk ke `/transactions`, lalu list transaction bisa dimuat dari Transaction API.
11. Isi form transaction dengan `product_id` valid lalu submit dan pastikan transaction baru muncul di list.
12. Pastikan hasil submit menampilkan `created_by`.
13. Hapus cookie `access_token`, refresh halaman, dan pastikan menu global tidak tampil.

## Negative Check

1. Buka `/profile` tanpa cookie token dan pastikan tampil `Belum login.`
2. Buka `/auth/callback` tanpa query `code` dan pastikan tampil error sederhana.
3. Ubah cookie `access_token` menjadi token rusak dan pastikan `/profile` menampilkan `Token tidak valid.`
4. Buka `/products` tanpa cookie token dan pastikan tampil `unauthorized`.
5. Buka `/transactions` tanpa cookie token dan pastikan tampil `unauthorized`.
