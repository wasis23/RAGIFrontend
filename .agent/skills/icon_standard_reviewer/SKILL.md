---
name: icon-standard-reviewer
description: Standar Baku Reviewer Penggunaan Ikon (Mandatory Lucide-React Library, Dilarang SVG Mentah & Third-Party Icon Unstandardized).
---

# Icon Standard Reviewer Policy

Dokumen ini merupakan **Standar Penilaian (Reviewer Policy)** untuk penggunaan ikon di seluruh komponen dan halaman frontend:

---

## 1. Wajib Menggunakan Pustaka `lucide-react`
- Seluruh ikon visual di dalam antarmuka aplikasi **WAJIB** di-import dan menggunakan pustaka standar **`lucide-react`**:
  ```tsx
  import { Plus, Trash2, Edit2, Filter, Search, ArrowLeft } from 'lucide-react';

  <Button icon={<Plus size={16} />}>Tambah Data</Button>
  ```

---

## 2. Larangan SVG Mentah & Third-Party Icon Non-Standar
- **DILARANG KERAS** menggunakan tag `<svg>` mentah dengan `<path>` panjang secara inline di dalam file komponen/halaman jika ikon tersebut sudah tersedia di `lucide-react`.
- **DILARANG KERAS** menggunakan tag elemen `<i className="fa fa-...">` (FontAwesome legacy) atau meng-import paket ikon pihak ketiga yang tidak terstandarisasi.
- Pengecualian hanya berlaku untuk logo merek/custom SVG unik yang benar-benar tidak dimiliki oleh pustaka Lucide (diletakkan di folder `public/icons/` atau komponen khusus SVG).

---

## 3. Styling & Ukuran Ikon Konsisten
- Propertisasi ukuran ikon hendaknya proporsional menggunakan prop `size`:
  - Tombol / Input biasa: `size={16}` atau `size={18}`.
  - Avatar / Card Header: `size={20}` atau `size={22}`.
- Warna ikon mengikuti kelas CSS warna atau disesuaikan dengan tema UI Kit.
