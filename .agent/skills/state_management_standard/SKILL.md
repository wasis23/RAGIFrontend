---
name: state-management-standard
description: Standar penggunaan Zustand untuk Global State Management di Next.js (SSO Campus).
---

# State Management Standard (SSO Campus)

Proyek ini menggunakan **Zustand** sebagai state manager global. Semua state diletakkan di dalam folder `store/`.

## Aturan Wajib

1. **Gunakan Typescript Interfaces**
   - JANGAN pernah membuat *store* tanpa mendefinisikan *interface* untuk *state* dan *actions*.
   - Pisahkan *interface* state data (di dalam `types/`) dan *interface* action (di dalam file store).

2. **Pola Pembuatan Store**
   - Gunakan `create<StoreType>()(...)` agar type-safe.
   - Semua *store* di dalam proyek Next.js App Router yang bersifat klien harus memiliki direktif `'use client';` di baris paling atas.

3. **Gunakan Middleware Persist secara Bijak**
   - Jika state perlu dipertahankan setelah *refresh* (seperti `authStore` untuk *session* atau `uiStore` untuk preferensi tema/sidebar), gunakan *middleware* `persist`.
   - Secara default, gunakan `sessionStorage` untuk keamanan auth, atau `localStorage` untuk preferensi pengguna yang panjang.
   - Selalu berikan atribut `name` yang spesifik pada `persist`.

4. **Jangan Simpan Data Sekali Pakai**
   - Data spesifik halaman yang didapat dari API (contoh: daftar user di satu tabel) tidak perlu dimasukkan ke Zustand kecuali jika diakses oleh halaman/komponen lain. Gunakan *local state* `useState` atau React Query.

## Contoh yang BENAR

```typescript
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. Definisikan State
interface UiState {
  isSidebarOpen: boolean;
}

// 2. Definisikan Actions
interface UiActions {
  toggleSidebar: () => void;
  setSidebar: (isOpen: boolean) => void;
}

type UiStore = UiState & UiActions;

// 3. Buat Store dengan Persist
export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      isSidebarOpen: true, // initial state
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebar: (isOpen) => set({ isSidebarOpen: isOpen }),
    }),
    {
      name: 'sso-ui-storage', // nama unik di storage
      storage: createJSONStorage(() => localStorage), // gunakan localStorage
    }
  )
);
```

## Pemanggilan di Komponen
```tsx
'use client';
import { useUiStore } from '@/store/uiStore';

export function Sidebar() {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <aside className={isSidebarOpen ? 'w-64' : 'w-16'}>
       <button onClick={toggleSidebar}>Toggle</button>
    </aside>
  );
}
```
