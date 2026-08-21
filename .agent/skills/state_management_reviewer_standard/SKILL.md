---
name: state-management-reviewer-standard
description: Standar Baku Reviewer State Management & Global Store (Zustand, Type-Safe Store, Persist Middleware, Local State Scoping).
---

# State Management Reviewer Standard (Zustand & Architecture)

Dokumen ini merupakan **Standar Penilaian (Reviewer Policy)** untuk pengelolaan state aplikasi (Global Store & Local State). Setiap pengelolaan state **WAJIB** mematuhi aturan arsitektur berikut:

---

## 1. Arsitektur Global Store Menggunakan Zustand
- Seluruh *Global State Management* **WAJIB** menggunakan **Zustand** dan diletakkan di dalam direktori `@/store/`.
- Setiap store **WAJIB** mendefinisikan *TypeScript Interfaces* terpisah untuk State data dan Actions:
  ```typescript
  interface UiState {
    isSidebarOpen: boolean;
  }
  interface UiActions {
    toggleSidebar: () => void;
  }
  type UiStore = UiState & UiActions;
  ```
- Store yang berjalan di Next.js Client Component **WAJIB** mencantumkan direktif `'use client';` di baris paling atas.

---

## 2. Penggunaan Middleware Persist & Storage Selection
- Gunakan middleware `persist` untuk state yang perlu bertahan setelah page refresh (seperti data autentikasi `authStore` atau pengaturan UI `uiStore`).
- Gunakan `sessionStorage` untuk kredensial auth/sesi aktif dan `localStorage` untuk preferensi pengguna jangka panjang.
- Setiap *persisted store* **WAJIB** menyertakan atribut `name` unik.

---

## 3. Strict Local State Scoping (Pemisahan Responsibilitas)
- Data sementara/spesifik satu halaman yang didapat dari API (seperti daftar baris tabel untuk halaman CRUD) **DILARANG** dimasukkan ke dalam Zustand global store.
- Data spesifik halaman **WAJIB** dikelola menggunakan *Local Component State* (`useState` / React Query) untuk mencegah *memory leak* dan *unnecessary re-renders*.
