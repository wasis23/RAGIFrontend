---
name: spacing-standard-reviewer
description: Standar Baku Reviewer Spacing, Margin, Padding & Layout Alignment (Strict Standard Scale, No Arbitrary Pixel Units, Compact Card Padding, Grid Gap Consistency).
---

# Spacing, Margin & Padding Standard Reviewer Policy

Dokumen ini merupakan **Standar Penilaian (Reviewer Policy)** untuk penggunaan spacing, margin, padding, dan alignment layout di seluruh komponen dan halaman frontend:

---

## 1. Skala Spacing Standar (Standard Spacing Scale)
- Seluruh penataan jarak (spacing) **WAJIB** menggunakan skala standar Tailwind / Design System bawaan:
  - Padding: `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-6` (24px).
  - Margin: `m-2`, `m-4`, `m-6`, `my-4`, `mx-auto`, `mt-4`, `mb-6`.
  - Gap: `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `gap-6` (24px).
  - Vertical/Horizontal Stack: `space-y-4`, `space-y-6`, `space-x-4`.
- **DILARANG KERAS ARBITRARY / HARDBOUND PIXEL SPACING**:
  - Dilarang menuliskan nilai pixel acak/arbitrer seperti `m-[37px]`, `p-[19px]`, `gap-[13px]`, `mt-[42px]`, `px-[55px]`, `py-[33px]`.
  - Semua jarak wajib merujuk pada token/skala standar agar ritme visual antarhalaman selaras.

---

## 2. Card & Container Padding Proporsional & Compact
- Wadah utama (Card, Modal, Drawer, Table Container, Page Wrapper) harus compact dan efisien:
  - Mobile / Dense view: `p-3` (12px) atau `p-4` (16px).
  - Desktop view: `p-4` (16px) atau `p-6` (24px).
- **DILARANG OVERSIZED PADDING**:
  - Dilarang menggunakan padding wadah yang berlebihan (seperti `p-12`, `p-16`, `p-20`, `px-24`) yang membuat konten terlalu renggang, tertekan di tengah, dan membuang area layar.

---

## 3. Konsistensi Gap Flex/Grid & Alignment
- Penataan jarak antarelemen turunan di dalam flexbox / grid **WAJIB** menggunakan `gap-*` (misal `gap-4` untuk grid form 2 kolom, `gap-2` untuk grup tombol).
- **DILARANG MISALIGNMENT / MIXING MARGIN**:
  - Dilarang mencampur prop `gap` pada kontainer dengan margin manual (`mt-*`, `mb-*`, `ml-*`, `mr-*`) di elemen turunan langsung flexbox/grid yang dapat mematahkan keselarasan alignment.

---

## 4. Outer Section & Layout Flow
- Jarak vertikal antar section atau card utama dalam satu halaman **WAJIB** konsisten menggunakan `space-y-4` / `space-y-6` atau `mb-4` / `mb-6`.
- Dilarang menggunakan margin negatif acak (seperti `-mt-20` atau `-mb-16`) kecuali untuk komponen overlay yang terdesain secara khusus (misal avatar profil yang menumpuk banner).
