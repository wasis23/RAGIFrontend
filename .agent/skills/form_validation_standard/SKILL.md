---
name: form-validation-standard
description: Standar pembuatan Form dan Validasi menggunakan React Hook Form dan Zod (SSO Campus).
---

# Form Validation Standard (SSO Campus)

Proyek ini menggunakan **React Hook Form (RHF)** dikombinasikan dengan **Zod** untuk validasi skema form. 

## Aturan Wajib

1. **Selalu Gunakan Zod untuk Skema**
   - JANGAN pernah memvalidasi form secara manual menggunakan banyak `if (input === '')` state di React.
   - Buat skema *Zod* di luar komponen untuk mencegah *re-render* yang tidak perlu.
   - Gunakan pesan *error* Zod dalam bahasa Indonesia (contoh: `min(1, 'Email wajib diisi')`).

2. **Gunakan React Hook Form**
   - Bind input HTML dengan fungsi `register` dari RHF.
   - Gunakan `handleSubmit` untuk *submit handler*.
   - Jika membuat komponen Custom Input/Select, gunakan `Controller` dari RHF atau pass `ref` menggunakan `forwardRef`.

3. **Styling Error Form**
   - Form input yang mengalami *error* harus diberikan styling merah (contoh di `globals.css`: class `input-error`).
   - Tampilkan pesan *error* validasi tepat di bawah input (contoh: `<span className="form-error">{errors.email.message}</span>`).

4. **Tombol Loading**
   - Saat sedang melakukan pengiriman form (*submitting/is_loading*), tombol Submit harus berstatus `disabled` dan idealnya menampilkan spinner. Gunakan komponen `Button` dengan properti `loading={is_loading}`.

## Contoh yang BENAR

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';

// 1. Definisikan Skema Zod
const mySchema = z.object({
  email: z.string().email('Format email tidak valid').min(1, 'Email wajib diisi'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

type MyFormValues = z.infer<typeof mySchema>;

export default function MyForm() {
  const [isLoading, setIsLoading] = useState(false);
  
  // 2. Inisialisasi React Hook Form
  const { register, handleSubmit, formState: { errors } } = useForm<MyFormValues>({
    resolver: zodResolver(mySchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: MyFormValues) => {
    setIsLoading(true);
    // ... panggil service API ...
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input 
        label="Email" 
        type="email" 
        error={errors.email?.message} 
        {...register('email')} 
      />

      <Input 
        label="Password" 
        type="password" 
        error={errors.password?.message} 
        {...register('password')} 
      />

      <Button type="submit" loading={isLoading}>
        Kirim Data
      </Button>
    </form>
  );
}
```
