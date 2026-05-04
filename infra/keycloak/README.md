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
- Web origin: `http://localhost:7011`
- Test user:
  - username: `demo`
  - email: `demo@example.com`
  - first name: `Demo`
  - last name: `User`
  - password: `demo123`

Catatan:

- `Standard flow` dipakai oleh frontend karena flow utamanya adalah `authorization_code`.
- `Direct access grants` dinyalakan hanya agar testing manual token via `curl` lebih mudah di local development.

## 2. Langkah Setup Manual di Keycloak

1. Jalankan Keycloak:

   ```bash
   docker compose up -d keycloak
   ```

2. Buka admin console:

   - URL: `http://localhost:7070`
   - admin username: nilai `KC_BOOTSTRAP_ADMIN_USERNAME`
   - admin password: nilai `KC_BOOTSTRAP_ADMIN_PASSWORD`

3. Buat realm baru:

   - masuk ke realm selector
   - klik `Create realm`
   - isi nama: `demo-realm`

4. Buat client untuk Nuxt:

   - buka menu `Clients`
   - klik `Create client`
   - Client type: `OpenID Connect`
   - Client ID: `nuxt-app`
   - lanjutkan sampai halaman setting
   - set `Client authentication` = `Off`
   - set `Authorization` = `Off`
   - set `Standard flow` = `On`
   - set `Direct access grants` = `On`
   - isi `Valid redirect URIs` = `http://localhost:7011/auth/callback`
   - isi `Web origins` = `http://localhost:7011`
   - simpan

5. Buat user test:

   - buka menu `Users`
   - klik `Add user`
   - username: `demo`
   - email: `demo@example.com`
   - first name: `Demo`
   - last name: `User`
   - simpan

6. Set password user:

   - buka user `demo`
   - masuk tab `Credentials`
   - set password: `demo123`
   - matikan `Temporary`
   - klik `Set password`

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

Aturan sederhananya:

- frontend mengirim `Authorization: Bearer <access_token>`
- backend membaca payload token
- backend mengambil `sub`
- backend memakai `sub` sebagai `user_id`

Contoh mapping sederhana:

```json
{
  "user_id": "sub-dari-keycloak",
  "preferred_username": "demo"
}
```
