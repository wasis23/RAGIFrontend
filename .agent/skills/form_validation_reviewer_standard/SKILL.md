---
name: form-validation-reviewer-standard
description: Standar Baku Reviewer Form & Input Validation (UI Kit Input Consistency, Server-Side AsyncSelect API, Mandatory Strict Zod Validation).
---

# Form Validation & Input Component Reviewer Standard

Dokumen ini merupakan **Standar Penilaian (Reviewer Policy)** untuk pengolahan form, komponen input, dan validasi data pada antarmuka aplikasi. Setiap form yang dibuat **WAJIB** mematuhi 3 Aturan Utama berikut:

---

## 1. Konsistensi Komponen Input (UI Kit Standard)
- Semua elemen input form **WAJIB** menggunakan komponen buatan terpusat dari UI Kit (`@/components/ui/`):
  - `<Input>` (`components/ui/Input.tsx`) untuk teks, angka, tanggal, email, password.
  - `<Textarea>` (`components/ui/Textarea.tsx`) untuk teks panjang/multiline.
  - `<Select>` (`components/ui/Select.tsx`) untuk pilihan statis/opsi sedikit.
  - `<AsyncSelect>` (`components/ui/AsyncSelect.tsx`) untuk pilihan data API.
  - `<Checkbox>` (`components/ui/Checkbox.tsx`) untuk input boolean.
- **DILARANG KERAS** menggunakan tag HTML mentah seperti `<input>`, `<select>`, atau `<textarea>` langsung tanpa style bawaan atau wrapper UI kit.

---

## 2. Mandatory Server-Side AsyncSelect untuk Data API
- Apabila pilihan/dropdown mengambil data dari API atau database backend (seperti data User, Role, Pegawai, Mata Kuliah, dsb.), **WAJIB** menggunakan komponen **`<AsyncSelect />`** (`@/components/ui/AsyncSelect.tsx`).
- Komponen harus mendukung pencarian dan *fetching* data berbasis server (*server-side search & pagination*) seiring user mengetikkan kata kunci.
- **DILARANG** me-render ratusan/ribuan data relasi API ke dalam tag `<select>` statis atau `<Select>` biasa yang membebankan browser.

---

## 3. Validasi Ketat Wajib Menggunakan Zod & React Hook Form
- **DILARANG KERAS** membuat form tanpa validasi atau memvalidasi manual dengan banyak pengkondisian `if (val === '')`.
- Seluruh form **WAJIB** memiliki skema validasi ketat menggunakan **Zod** (`z.object({...})`) yang dihubungkan ke **React Hook Form** via `zodResolver(schema)`:
  ```tsx
  import { useForm } from 'react-hook-form';
  import { zodResolver } from '@hookform/resolvers/zod';
  import { z } from 'zod';

  const formSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi'),
    email: z.string().email('Format email tidak valid'),
  });

  type FormValues = z.infer<typeof formSchema>;
  ```
- Pesan kesalahan (*error message*) validasi wajib ditampilkan dalam Bahasa Indonesia yang jelas tepat di bawah komponen input terkait (`errors.field.message`).
- Tombol Submit **WAJIB** menampilkan indikator loading (`loading={isSubmitting}`) dan dalam posisi *disabled* saat proses pengiriman data sedang berlangsung.
