---
name: nextjs-routing-standard
description: Standar penggunaan Next.js App Router, Route Groups, Server & Client Components (SSO Campus).
---

# Next.js Routing & App Router Standard (SSO Campus)

Proyek ini menggunakan **Next.js App Router** terbaru. Oleh karena itu, *routing* dan arsitektur komponen sangat dipengaruhi oleh standar terbaru React (RSC - React Server Components).

## Aturan Wajib

1. **Arsitektur Multi-Tenant (Subdomain Routing)**
   - Proyek ini dirancang untuk melayani banyak subdomain dari satu *codebase*.
   - **WAJIB** memisahkan aplikasi ke dalam folder root level `app/[nama_aplikasi]`. Saat ini terdapat `app/main` (untuk SIAKAD/SSO) dan `app/spmb`.
   - Logika penentuan *routing* berada mutlak di dalam **`middleware.ts`** menggunakan `NextResponse.rewrite` yang mengecek `hostname`. Jangan melakukan *rewrite* berdasarkan URL secara manual di sisi *client*.

2. **Gunakan Route Groups**
   - Di dalam folder tiap aplikasi (contoh: `app/main/`), gunakan _route groups_ (folder dengan tanda kurung) untuk mengelompokkan layout.
   - Folder `app/main/(auth)` untuk halaman publik/autentikasi (`/login`, `/forgot-password`).
   - Folder `app/main/(main)` untuk halaman terproteksi setelah login (`/dashboard`, `/profile`).

3. **Gunakan `middleware.ts` untuk Proteksi Route**
   - Proteksi sesi tidak dilakukan dengan mengecek _cookie_ di setiap *layout* atau *page*.
   - **Gunakan `middleware.ts`** di _root_ proyek untuk mengatur blokir *redirect* jika belum login.

4. **Server Components vs Client Components**
   - Secara bawaan, semua file `.tsx` di Next.js App Router adalah **Server Components**.
   - Tambahkan arahan `'use client';` di bagian teratas *file* **HANYA JIKA** komponen tersebut membutuhkan:
     - React Hooks (`useState`, `useEffect`).
     - Interaksi *event listener* (`onClick`, `onChange`).
     - Penggunaan Zustand store (`useAuthStore`).
     - Penggunaan browser API (`window`, `localStorage`).
   - Sedapat mungkin, pindahkan logika yang butuh `'use client'` ke komponen kecil (seperti `Form.tsx` atau `Button.tsx`) lalu *import* ke Server Component yang membungkusnya.

5. **Metode Navigasi**
   - Gunakan komponen `<Link href="...">` bawaan Next.js untuk navigasi antar halaman agar menggunakan *client-side routing* (lebih cepat, tanpa *full reload*).
   - Gunakan hook `useRouter` dari `next/navigation` jika butuh *redirect* secara programatis, BUKAN dari `next/router`.

## Contoh yang BENAR

**Page (`app/(main)/dashboard/page.tsx`)**
```tsx
import Link from 'next/link';

// Secara default ini adalah Server Component
export default function DashboardPage() {
  return (
    <div className="page-container">
      <h1>Dashboard</h1>
      <Link href="/profile" className="btn btn-primary mt-4">
        Lihat Profil
      </Link>
    </div>
  );
}
```

## Contoh yang SALAH (Dilarang)

```tsx
// SALAH: Jangan gunakan 'use client' jika hanya me-render HTML statis
'use client';
import Link from 'next/link';

export default function StaticPage() {
  return <div>Halaman Statis</div>;
}
```
