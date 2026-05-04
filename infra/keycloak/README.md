# Setup Keycloak Lokal

Dokumen ini berisi setup Keycloak paling sederhana untuk local development. Fokusnya hanya menyiapkan login dasar agar frontend Nuxt nanti bisa meminta token, lalu backend bisa membaca claim `sub` sebagai `user_id`.

Base URL lokal:

- `http://localhost:7070`

## 1. Konfigurasi Realm, Client, dan User

Gunakan nilai berikut agar konsisten dengan tahap implementasi berikutnya:

- Realm: `demo-realm`
- Client ID: `nuxt-app`
- Client type: `OpenID Connect`
- Access type: `public client`
- Client authentication: `Off`
- Standard flow: `On`
- Direct access grants: `On`
- Valid redirect URI: `http://localhost:7011/auth/callback`
- Valid post logout redirect URI: `http://localhost:7011/login`
- Web origin: `http://localhost:7011`
- Test user:
  - username: `demo`
  - email: `demo@example.com`
  - first name: `Demo`
  - last name: `User`
  - password: `demo123`
- Admin role untuk fitur `/users`:
  - realm role: `app_admin`
- Client backend untuk User Management API:
  - Client ID: `user-api-admin`
  - Client authentication: `On`
  - Service accounts roles: `On`
  - Realm management roles: `view-users`, `query-users`, `manage-users`

Catatan:

- `Standard flow` dipakai oleh frontend karena flow utamanya adalah `authorization_code`.
- `Direct access grants` dinyalakan hanya agar testing manual token via `curl` lebih mudah di local development.

## 2. Langkah Setup Manual di Keycloak

Bagian ini menjelaskan setup dari awal. Ikuti urutannya, karena beberapa langkah bergantung pada langkah sebelumnya. Misalnya role `app_admin` harus dibuat dulu sebelum bisa diberikan ke user, dan client `user-api-admin` harus dibuat dulu sebelum secret-nya bisa disalin ke `.env`.

1. Jalankan Keycloak.

   Dari root project, jalankan:

   ```bash
   docker compose up -d keycloak
   ```

   Setelah command selesai, tunggu beberapa detik sampai Keycloak siap menerima request. Jika halaman belum bisa dibuka, cek status container:

   ```bash
   docker compose ps keycloak
   ```

2. Buka admin console.

   - URL: `http://localhost:7070`
   - admin username: nilai `KC_BOOTSTRAP_ADMIN_USERNAME`
   - admin password: nilai `KC_BOOTSTRAP_ADMIN_PASSWORD`

   Jika mengikuti `.env.example`, credential admin bootstrap default adalah:

   - username: `admin`
   - password: `admin123`

   Akun ini hanya untuk masuk ke Keycloak Admin Console. Akun ini berbeda dari user aplikasi seperti `demo`.

3. Buat realm baru.

   Realm adalah ruang isolasi konfigurasi Keycloak. Di project ini semua user, role, dan client aplikasi disimpan di realm `demo-realm`.

   - masuk ke realm selector
   - klik `Create realm`
   - isi nama: `demo-realm`
   - klik `Create`

   Setelah realm dibuat, pastikan realm aktif di pojok kiri atas adalah `demo-realm`, bukan `master`. Semua langkah berikutnya harus dilakukan di realm `demo-realm`.

4. Buat client untuk Nuxt.

   Client `nuxt-app` mewakili frontend Nuxt. Client ini dibuat sebagai public client karena frontend berjalan di browser dan tidak boleh menyimpan client secret.

   - buka menu `Clients`
   - klik `Create client`
   - Client type: `OpenID Connect`
   - Client ID: `nuxt-app`
   - klik `Next`
   - set `Client authentication` = `Off`
   - set `Authorization` = `Off`
   - klik `Next`
   - set `Standard flow` = `On`
   - set `Direct access grants` = `On`
   - klik `Save`

   Setelah client tersimpan, buka tab `Settings` pada client `nuxt-app`, lalu isi URL berikut:

   - isi `Valid redirect URIs` = `http://localhost:7011/auth/callback`
   - isi `Valid post logout redirect URIs` = `http://localhost:7011/login`
   - isi `Web origins` = `http://localhost:7011`
   - simpan

   Penjelasan singkat:

   - `Valid redirect URIs` adalah alamat callback setelah login berhasil.
   - `Valid post logout redirect URIs` adalah alamat tujuan setelah logout dari Keycloak.
   - `Web origins` mengizinkan browser frontend di port `7011` berinteraksi dengan endpoint Keycloak.
   - `Standard flow` dipakai untuk login browser dengan authorization code.
   - `Direct access grants` hanya membantu testing token manual memakai `curl`.

5. Buat user test.

   User `demo` dipakai untuk login ke aplikasi Nuxt. User ini berbeda dari admin bootstrap Keycloak.

   - buka menu `Users`
   - klik `Add user`
   - username: `demo`
   - email: `demo@example.com`
   - first name: `Demo`
   - last name: `User`
   - pastikan `Enabled` = `On`
   - klik `Create`

6. Set password user.

   User yang baru dibuat belum bisa login sampai password dibuat.

   - buka user `demo`
   - masuk tab `Credentials`
   - klik `Set password`
   - isi password: `demo123`
   - isi password confirmation: `demo123`
   - matikan `Temporary`
   - klik `Set password`

   `Temporary` dimatikan untuk user `demo` agar user ini bisa langsung login tanpa dipaksa mengganti password. Untuk user yang dibuat dari halaman `/users`, password dibuat temporary supaya user baru mengganti password saat login pertama.

7. Buat role admin aplikasi.

   Role `app_admin` adalah role sederhana untuk membedakan user biasa dan user yang boleh membuka fitur User Management di `/users`.

   - buka menu `Realm roles`
   - klik `Create role`
   - isi role name: `app_admin`
   - simpan

   Role ini dibuat sebagai realm role agar mudah dibaca dari token pada claim `realm_access.roles`.

8. Assign role `app_admin` ke user admin aplikasi.

   Agar user `demo` bisa membuka menu `Users`, role `app_admin` harus diberikan ke user tersebut.

   - buka menu `Users`
   - pilih user yang akan mengakses `/users`, misalnya `demo`
   - buka tab `Role mapping`
   - klik `Assign role`
   - ubah filter ke `Filter by realm roles` jika role belum terlihat
   - pilih `app_admin`
   - klik `Assign`

   Setelah role diberikan, logout dari aplikasi lalu login ulang agar access token baru berisi role `app_admin`.

9. Buat confidential client untuk User Management API.

   Client `user-api-admin` dipakai oleh backend `apps/user-api` untuk memanggil Keycloak Admin API. Client ini tidak dipakai untuk login browser.

   - buka menu `Clients`
   - klik `Create client`
   - Client type: `OpenID Connect`
   - Client ID: `user-api-admin`
   - klik `Next`
   - aktifkan `Client authentication`
   - klik `Next`
   - aktifkan `Service accounts roles`
   - klik `Save`

   Setelah client tersimpan:

   - buka tab `Credentials`
   - salin nilai `Client secret`
   - masukkan ke root `.env` sebagai `KEYCLOAK_ADMIN_CLIENT_SECRET`
   - pastikan `.env` juga berisi `KEYCLOAK_ADMIN_CLIENT_ID=user-api-admin`

   Secret ini hanya boleh dipakai backend. Jangan memasukkan secret ini ke Nuxt runtime config public atau kode frontend.

10. Beri permission admin user ke service account.

   Service account adalah identitas server-side milik client `user-api-admin`. Permission ini membuat User Management API boleh list, create, dan update user melalui Keycloak Admin API.

   - dari client `user-api-admin`, buka tab `Service account roles`
   - klik `Assign role`
   - ubah filter ke `Filter by clients`
   - cari atau pilih client role dari `realm-management`
   - pilih role `view-users`, `query-users`, dan `manage-users`
   - klik `Assign`

   Fungsi role:

   - `view-users`: mengizinkan melihat detail user
   - `query-users`: mengizinkan mencari dan list user
   - `manage-users`: mengizinkan create dan update user

11. Lengkapi env untuk User Management API.

   Pastikan root `.env` memiliki nilai berikut:

   ```env
   USER_API_PORT=7014
   USER_API_BASE_URL=http://localhost:7014
   KEYCLOAK_BASE_URL=http://localhost:7070
   KEYCLOAK_REALM=demo-realm
   KEYCLOAK_ADMIN_CLIENT_ID=user-api-admin
   KEYCLOAK_ADMIN_CLIENT_SECRET=isi-dengan-client-secret-dari-keycloak
   ```

   `KEYCLOAK_ADMIN_USERNAME` dan `KEYCLOAK_ADMIN_PASSWORD` tidak dipakai oleh implementasi default karena User Management API memakai client credentials.

12. Restart service aplikasi setelah konfigurasi berubah.

   Jika Nuxt atau User Management API sudah berjalan sebelum perubahan Keycloak atau `.env`, restart service terkait:

   ```bash
   make run-user
   make run-web
   ```

   Untuk role `app_admin`, user juga perlu logout lalu login ulang supaya token baru membawa role tersebut.

Setelah langkah ini selesai, Keycloak siap dipakai untuk login browser dan testing token manual.

Penting untuk local setup ini:

- isi `email`, `first name`, dan `last name` pada user `demo`
- jika field ini belum diisi, Anda bisa menemui error `invalid_grant` dengan pesan `Account is not fully set up`

## 3. Daftar Auth Endpoint

Endpoint utama yang dipakai:

- Authorization endpoint
  - `GET /realms/{realm}/protocol/openid-connect/auth`
  - contoh lokal:
    - `http://localhost:7070/realms/demo-realm/protocol/openid-connect/auth`
- Token endpoint
  - `POST /realms/{realm}/protocol/openid-connect/token`
  - contoh lokal:
    - `http://localhost:7070/realms/demo-realm/protocol/openid-connect/token`

Endpoint tambahan yang berguna untuk melihat metadata OIDC:

- `GET /realms/{realm}/.well-known/openid-configuration`

## 4. Contoh Request Auth

Frontend Nuxt nantinya memakai authorization endpoint berikut:

```http
GET /realms/demo-realm/protocol/openid-connect/auth
```

Parameter minimal:

- `client_id=nuxt-app`
- `redirect_uri=http://localhost:7011/auth/callback`
- `response_type=code`
- `scope=openid`

Contoh URL lengkap:

```text
http://localhost:7070/realms/demo-realm/protocol/openid-connect/auth?client_id=nuxt-app&redirect_uri=http%3A%2F%2Flocalhost%3A7011%2Fauth%2Fcallback&response_type=code&scope=openid
```

Alur sederhananya:

1. user dibawa ke halaman login Keycloak
2. user login dengan akun `demo`
3. Keycloak redirect ke `http://localhost:7011/auth/callback?code=...`
4. frontend menukar `code` ke token lewat token endpoint

## 5. Contoh Request Token

Untuk testing manual paling mudah di local development, gunakan `grant_type=password`.

Contoh `curl`:

```bash
curl -X POST http://localhost:7070/realms/demo-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=nuxt-app" \
  -d "username=demo" \
  -d "password=demo123" \
  -d "scope=openid"
```

Flow yang benar-benar dipakai frontend tetap `authorization_code`, bukan password grant.

Contoh request token untuk frontend setelah menerima `code`:

```bash
curl -X POST http://localhost:7070/realms/demo-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=nuxt-app" \
  -d "code=AUTH_CODE_DARI_CALLBACK" \
  -d "redirect_uri=http://localhost:7011/auth/callback"
```

Ringkasnya:

- testing manual lokal: `password`
- flow frontend sebenarnya: `authorization_code`

## 6. Contoh Response Token

Contoh response minimal:

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "id_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 300
}
```

Contoh payload access token yang relevan:

```json
{
  "sub": "user-id-dari-keycloak",
  "preferred_username": "demo",
  "realm_access": {
    "roles": ["app_admin"]
  },
  "exp": 1234567890
}
```

Penjelasan singkat:

- `sub` adalah ID user dari Keycloak
- `preferred_username` membantu menampilkan nama user
- `exp` menunjukkan waktu expired token

## 7. Claim yang Dipakai Backend

Backend Product API dan Transaction API cukup fokus pada claim berikut:

- `sub`
  - dipakai sebagai `user_id`
  - nilai ini yang nanti disimpan ke field seperti `created_by`
- `preferred_username`
  - opsional untuk debugging atau tampilan profile
- `exp`
  - opsional untuk melihat masa berlaku token
- `realm_access.roles`
  - dipakai User Management API untuk validasi role `app_admin`

Aturan sederhananya:

- frontend mengirim `Authorization: Bearer <access_token>`
- backend membaca payload token
- backend mengambil `sub`
- backend memakai `sub` sebagai `user_id`
- User Management API juga memvalidasi signature token lewat JWKS Keycloak dan memastikan role `app_admin`

Contoh mapping sederhana:

```json
{
  "user_id": "sub-dari-keycloak",
  "preferred_username": "demo"
}
```
