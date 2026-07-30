---
name: api-integration-standard
description: Standar komunikasi HTTP, pembuatan service API, dan definisi Typescript (SSO Campus).
---

# API Integration Standard (SSO Campus)

Proyek ini telah memiliki konfigurasi pemanggilan API (Axios) tersentralisasi dan arsitektur yang dikategorikan berdasarkan *Service Layer*.

## Aturan Wajib

1. **Gunakan Instance apiClient**
   - Dilarang keras memanggil API secara langsung menggunakan `axios.get()` murni atau `fetch()`.
   - Wajib melakukan `import apiClient from '@/lib/axios';` di dalam *service*.
   - `apiClient` sudah dilengkapi interceptor untuk mengirim `Bearer token`, me-refresh token secara otomatis, dan _error handling_.

2. **Gunakan Service Pattern**
   - Semua fungsi pemanggilan API harus diletakkan di dalam folder `services/`.
   - Buat satu objek *service* per entitas, misal `authService`, `adminService`, atau `userService`.
   - JANGAN melakukan pemanggilan `apiClient` secara langsung dari dalam Komponen UI atau Store. Komponen harus memanggil metode dari *service*.

3. **Definisikan Interface secara Strict di `types/`**
   - Selalu buat tipe data/interface untuk **Request Payload** dan **Response Data**.
   - Letakkan tipe data tersebut di dalam folder `types/` (contoh: `types/auth.types.ts`).
   - Gunakan _Generic Response_ `ApiResponse<T>` dari `types/api.types.ts` untuk respons yang dibungkus dengan `{ status, message, data }`.

## Contoh yang BENAR

1. **Membuat Type (`types/user.types.ts`)**
```typescript
export interface UserData {
  id: number;
  name: string;
  email: string;
}
```

2. **Membuat Service (`services/user.service.ts`)**
```typescript
import apiClient from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { UserData } from '@/types/user.types';

export const userService = {
  getProfile: async (): Promise<ApiResponse<UserData>> => {
    const { data } = await apiClient.get<ApiResponse<UserData>>('/users/profile');
    return data;
  },
};
```

3. **Memanggil di Komponen atau Hook (`app/profile/page.tsx`)**
```tsx
import { useEffect, useState } from 'react';
import { userService } from '@/services/user.service';
import type { UserData } from '@/types/user.types';

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    userService.getProfile().then(res => setUser(res.data));
  }, []);
  // ...
}
```

## Contoh yang SALAH (Dilarang)

```tsx
// SALAH: Dilarang keras melakukan fetch langsung di dalam komponen!
export default function BadProfile() {
  useEffect(() => {
    // ❌ Jangan gunakan axios atau fetch langsung, token tidak akan terkirim!
    axios.get('http://localhost:8000/api/users/profile', {
      headers: { Authorization: `Bearer ${localStorage.getItem('sso_access_token')}` }
    }).then(...)
  }, []);
}
```
