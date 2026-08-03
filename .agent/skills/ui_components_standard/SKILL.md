---
name: ui-components-standard
description: Standar pembuatan dan penggunaan UI Component serta styling di Next.js App Router (SSO Campus).
---

# UI Components & Styling Standard (SSO Campus)

Proyek ini **TIDAK** menggunakan pendekatan utility-first Tailwind murni (seperti `bg-blue-600 text-white px-4 py-2 rounded-lg` di setiap elemen). Proyek ini menggunakan **Custom Design System** yang didefinisikan di `app/globals.css`.

## Aturan Wajib

1. **Gunakan Utility Classes dari Design System**
   - **JANGAN** pernah menuliskan utility Tailwind yang panjang pada elemen HTML.
   - **GUNAKAN** class bawaan yang sudah dirancang seperti:
     - Tombol: `className="btn btn-primary"`, `className="btn btn-secondary btn-sm"`, `className="btn-icon"`
     - Form & Input: `className="form-group"`, `className="form-label"`, `className="input"`, `className="input-wrapper"`
     - Layouting/Wadah: `className="card"`, `className="card-header"`, `className="card-body"`, `className="table-container"`, `className="table"`
     - Label/Status: `className="badge badge-blue"`, `className="badge badge-green badge-dot"`

2. **Tailwind Class Hanya Untuk Layout / Override**
   - Tailwind class (seperti `flex`, `grid`, `gap-2`, `mt-4`) HANYA boleh digunakan untuk mengatur tata letak, margin, padding, atau jika suatu komponen benar-benar membutuhkan *override* spesifik yang tidak ada di `globals.css`.

3. **Struktur Folder Komponen**
   - Komponen UI yang dapat digunakan berulang (seperti `Button`, `Input`, `Modal`) diletakkan di `components/ui/`.
   - Komponen struktur (seperti `Sidebar`, `Header`) diletakkan di `components/layout/`.

4. **Penggunaan Icons**
   - Gunakan selalu pustaka **`lucide-react`** untuk semua ikon, kecuali SVG custom yang benar-benar tidak tersedia di Lucide.

5. **Penggunaan Form UI Kit (Konsistensi Input)**
   - Semua elemen *form* **WAJIB** menggunakan komponen buatan yang tersedia di `components/ui/`.
   - Gunakan `<Input>` (`components/ui/Input.tsx`) untuk text, number, date, dsb.
   - Gunakan `<Textarea>` (`components/ui/Textarea.tsx`) untuk teks multi-baris.
   - Gunakan `<Checkbox>` (`components/ui/Checkbox.tsx`) untuk input boolean.
   - **WAJIB: Gunakan `<Select>` dan `<AsyncSelect>` untuk Dropdown!**
     - **Jangan pernah menggunakan tag `<select>` mentah** karena merusak standar desain dan tidak memiliki *search*.
     - Untuk data statis atau jumlah opsi yang sedikit, gunakan **`<Select>`** dari `components/ui/Select.tsx`. Komponen ini berbasis `react-select` sehingga mendukung pencarian ketikan bawaan dan memiliki UI modern. (Contoh prop: `options={[{value: 'id', label: 'Nama'}]}`)
     - Untuk data relasi dari API atau data dengan jumlah sangat banyak, wajib menggunakan **`<AsyncSelect>`** dari `components/ui/AsyncSelect.tsx`. Komponen ini secara cerdas melakukan *fetch* data dari backend seiring dengan *user* mengetikkan pencarian. (Contoh prop: `loadOptions={loadRoleOptions}`)

## Contoh yang BENAR

```tsx
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SearchForm() {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="font-bold">Pencarian Data</h2>
      </div>
      <div className="card-body flex gap-4">
        <div className="form-group flex-1">
          <div className="input-wrapper">
            <span className="input-prefix-icon"><Search size={18} /></span>
            <input type="text" className="input input-icon-left" placeholder="Cari..." />
          </div>
        </div>
        <Button variant="primary" icon={<Search size={16} />}>Cari</Button>
      </div>
    </div>
  );
}
```

## Contoh yang SALAH (Dilarang)

```tsx
// SALAH: Terlalu banyak inline Tailwind, tidak memanfaatkan globals.css
export default function BadComponent() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="p-5 border-b border-slate-200">
         <h2 className="text-lg font-bold text-slate-900">Header</h2>
      </div>
      <div className="p-6">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2">
           Simpan
        </button>
      </div>
    </div>
  );
}
```
