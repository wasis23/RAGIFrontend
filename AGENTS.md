<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<RULE[agent_skills]>
# Agent Directive: Selalu Periksa dan Gunakan Skill yang Relevan

Sebelum mengeksekusi tugas apapun, Anda WAJIB memeriksa daftar skill di bawah ini dan membaca SKILL.md yang relevan menggunakan `view_file` sebelum mulai coding.

## Daftar Skill Frontend yang Tersedia

| Skill | Path | Aktifkan Ketika |
| --- | --- | --- |
| `ui-components-standard` | `.agent/skills/ui_components_standard/SKILL.md` | Diminta membuat atau memodifikasi komponen UI, styling, layouting. |
| `api-integration-standard` | `.agent/skills/api_integration_standard/SKILL.md` | Menghubungkan API, membuat service baru, HTTP request. |
| `state-management-standard` | `.agent/skills/state_management_standard/SKILL.md` | Membuat atau mengubah global state menggunakan Zustand. |
| `form-validation-standard` | `.agent/skills/form_validation_standard/SKILL.md` | Membuat form baru atau menambahkan validasi input. |
| `nextjs-routing-standard` | `.agent/skills/nextjs_routing_standard/SKILL.md` | Membuat halaman/route baru, middleware, atau server/client components. |
| `crud-ui-standard` | `.agent/skills/crud_ui_standard/SKILL.md` | Diminta membuat halaman/form CRUD, dengan aturan form terpisah (> 5 input) dan layout grid yang rapi. |
| `admin-crud-reviewer-standard` | `.agent/skills/admin_crud_reviewer_standard/SKILL.md` | Diminta merancang, membuat, atau mereview halaman Admin CRUD (Atomic Design, DataTable, Pagination, Sorting, Filter Drawer). |
| `rbac-refactoring-standard` | `.agent/skills/rbac_refactoring_standard/SKILL.md` | Melakukan refaktor komponen, perbaikan UI, atau mendesain pengecekan akses (RBAC) tanpa mengandalkan tipe user statis. |
| `module-management-standard`| `../RAGIBackend/.agent/skills/module_management_standard/SKILL.md` | Merancang, menambah, atau memodifikasi modul aplikasi (Master Modul) di ekosistem kampus terintegrasi. |

## Aturan Wajib
1. **BACA** SKILL.md yang relevan sebelum mulai coding. Jangan asumsikan — baca dulu.
2. **PATUHI SEMUA** ketentuan di dalam SKILL.md tanpa pengecualian.
3. **JANGAN** menyimpang dari standar yang sudah ditetapkan di skill tanpa persetujuan eksplisit dari user.
</RULE[agent_skills]>

<RULE[github_push]>
# Git Push Policy
Agent **DILARANG KERAS** melakukan eksekusi perintah `git push` secara otomatis setelah menyelesaikan tugas atau setelah melakukan commit. Perintah `git push` HANYA boleh dieksekusi jika User memintanya secara eksplisit (misalnya: "push ke github").
</RULE[github_push]>

<RULE[no_hardcode_definition]>
# Zero Hardcode & Dynamic Entity Reference Policy

## Definisi Hardcode
Hardcode adalah suatu metode atau cara pengambilan data, pengiriman data, atau pengaturan data dengan **menyebutkan/mengetik nama atau label string secara langsung** (misalnya menyebutkan `'spmb'`, `'sikeu'`, atau string nama spesifik lainnya) alih-alih merujuk pada identitas entitas database.

## Aturan Pengkodean
1. **Minimal Hardcode**: Sistem yang baik harus meminimalkan hardcode hingga 0%.
2. **Referensi ID Wajib**: Seluruh relasi, filter, dan query wajib menggunakan **referensi ID entitas** (seperti `module.id`, `jenis_biaya.id`, dsb.) yang diambil dari database, bukan berupa label string atau hardcode nama.
</RULE[no_hardcode_definition]>

<RULE[admin_crud_reviewer]>
# Admin CRUD & Table Reviewer Policy

## Aturan Wajib Halaman Admin CRUD:
1. **Atomic Design Architecture**: Wajib memisahkan elemen UI ke `@/components/ui/` (`Button`, `Input`, `Select`, `Modal`, `Drawer`, `DataTable`, `Badge`) dan layout ke `@/components/layout/` (`PageHeader`). Dilarang memakai elemen HTML mentah tanpa style standar.
2. **Mandatory DataTable & Server-Side Pagination**: Halaman list/tabel data WAJIB menggunakan `<DataTable />` dari `@/components/ui/DataTable`. Dilarang memakai tag HTML manual `<table>`. Data WAJIB diambil dari API dengan server-side pagination (`page`, `limit`) dan prop `meta={meta}`.
3. **Sort By & Sort Direction (Default Name/Label)**: WAJIB menyediakan filter pengurutan `sort_by` / `orderBy` (default berbasis `name` / `label` / `id`) dan `sort_dir` / `orderDir` (`asc` / `desc`) dalam layout grid 2 kolom di Drawer filter.
4. **Tombol Filter Outline Biru & Drawer Slide Kanan-ke-Kiri**: Tombol Filter di `PageHeader` WAJIB bertipe outline biru (`variant="outline"` / `btn-outline-blue` / ikon `<Filter size={16} />`). Diklik memunculkan `<Drawer />` dari kanan ke kiri (standard SSO/IAM).
5. **UI & Form Consistency**:
   - Form <= 5 inputs: Gunakan `<Modal />` dengan grid maksimal 2 kolom (`grid grid-cols-1 md:grid-cols-2 gap-4`).
   - Form > 5 inputs: Gunakan Halaman Terpisah dengan Tombol Kembali Oranye (`bg-orange-500 text-white`) di `PageHeader`.
   - Gunakan prop `label` pada `<Input>` / `<Select>` langsung di Drawer.
</RULE[admin_crud_reviewer]>

