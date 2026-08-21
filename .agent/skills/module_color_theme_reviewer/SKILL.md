---
name: module-color-theme-reviewer
description: Standar Baku Reviewer & Auditor Keselarasan Warna Primary Modul (Module Primary Color & Theme Dynamic Binding).
---

# Module Primary Color & Theme Reviewer Policy

Dokumen ini merupakan **Standar Penilaian (Reviewer Policy)** untuk memastikan seluruh modul aplikasi dan menu di dalamnya menggunakan dan secara dinamis menyesuaikan diri dengan **Primary Color** yang disetting pada Master Modul:

---

## 1. Dynamic Module Primary Color Binding
- Setiap modul (seperti SIMPEG, SIPPM, SPMB, SIKEU, SINAPRA, SIAKAD) dan seluruh menu di dalamnya **WAJIB** secara dinamis terikat dengan nilai `primary_color` dari entitas modul di database.
- Penggunaan warna aksen utama modul hendaknya menggunakan CSS variable terpusat (misal `var(--module-primary)` / `primary_color` dari API) atau dynamic inline style:
  ```tsx
  <div style={{ '--module-primary': currentModule?.primary_color || '#3b82f6' } as React.CSSProperties}>
  ```

---

## 2. Dynamic Active Menu & Accent Styling
- Indikator **menu aktif** di sidebar/navigation, border aksen, badge modul, serta button utama di dalam halaman modul **WAJIB** merefleksikan `primary_color` dari modul yang sedang dibuka.
- Dilarang memaksa (hardcode) warna biru bawaan (`bg-blue-600` / `#3b82f6`) untuk modul yang memiliki identitas warna primary berbeda (seperti SIPPM yang menggunakan Teal `#0d9488` atau SIMPEG yang menggunakan Indigo `#4f46e5`).

---

## 3. Larangan Hardcode Warna Statis Per Modul
- **DILARANG KERAS** mengetikkan nilai warna Hex atau class Tailwind statis secara terpisah di komponen menu jika modul tersebut seharusnya mengambil `primary_color` dari database master modul.
- Seluruh pengubahan warna modul cukup dilakukan melalui antarmuka **Master Modul (`/admin/modules`)**, dan seluruh menu modul akan otomatis mengikuti warna primary tersebut.
