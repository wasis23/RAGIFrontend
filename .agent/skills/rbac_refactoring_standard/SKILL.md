---
name: rbac-refactoring-standard
description: Standar refaktor untuk memastikan kode frontend menggunakan sistem Role-Based Access Control (RBAC) murni berbasis role dan permission, tanpa atribut user_type statis.
---

# Standar Refaktor RBAC Frontend (Next.js)

Skill ini wajib digunakan setiap kali Anda (AI) melakukan refaktorisasi UI, penambahan halaman baru, atau modifikasi logika autentikasi. Sistem saat ini secara eksklusif menggunakan **Role-Based Access Control (RBAC)** dan telah **menghilangkan** kolom/atribut `user_type` di seluruh arsitektur.

## 1. Otorisasi (Authorization)
- **DILARANG KERAS** menggunakan `user.user_type` atau tipe bawaan lainnya (misalnya `mahasiswa`, `dosen`, `admin`) di kondisi UI/kode manapun.
- **GUNAKAN** hook `useAuth()` yang menyediakan fungsi pembantu seperti `hasRole(roleSlug)` dan `hasPermission(permissionSlug)`.
- Contoh:
  ```tsx
  // SALAH (JANGAN DILAKUKAN)
  if (user.user_type === 'admin') { ... }

  // BENAR
  const { hasRole, hasPermission } = useAuth();
  if (hasRole('admin')) { ... }
  ```

## 2. Definisi Tipe (Typescript)
- Jangan pernah mendefinisikan interface `User` (seperti di `types/auth.types.ts`) dengan kolom `user_type`.
- Selalu andalkan relasi `.roles` (array dari objek `Role`) untuk mengekstrak informasi peran dan jabatan pengguna.

## 3. Komponen UI (Badge, Label, Tabel, dsb.)
- Saat menampilkan peran/status pengguna, selalu ekstrak namanya dari array peran, misalnya `user.roles?.[0]?.name` atau `user.roles?.[0]?.role?.name`.
- Jangan mencoba meniru atau melempar properti *hardcode* tipe _user_ (seperti `UserTypeBadge` yang bergantung pada tipe statis) ke dalam komponen UI.

## 4. Keadaan State Global & Middleware
- Jika bekerja dengan middleware atau memanipulasi _cookie_, jangan pernah menyertakan `sso_user_type`. Ambil dan sinkronkan hanya informasi akses (token) dan relasi role slug yang relevan.
