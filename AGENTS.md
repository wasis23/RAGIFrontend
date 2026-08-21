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
| `form-validation-reviewer-standard` | `.agent/skills/form_validation_reviewer_standard/SKILL.md` | Diminta merancang, membuat, atau mereview form & validasi input (UI Kit, AsyncSelect Server-Side, Mandatory Zod Validation). |
| `state-management-reviewer-standard` | `.agent/skills/state_management_reviewer_standard/SKILL.md` | Diminta merancang, membuat, atau mereview state management (Zustand, Type-Safe Stores, Persist Middleware). |
| `icon-standard-reviewer` | `.agent/skills/icon_standard_reviewer/SKILL.md` | Diminta merancang, membuat, atau mereview penggunaan ikon (Mandatory Lucide-React Library, Dilarang SVG Mentah & Icon Unstandardized). |
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
1. **Mobile-First Responsive Styling**: Seluruh layout dan halaman WAJIB menggunakan pendekatan mobile-first (`w-full flex-col grid-cols-1 gap-4`) dengan penyesuaian breakpoint responsif (`sm:`, `md:`, `lg:`).
2. **Halaman Detail Terpisah (Separate Detail Page)**: Tampilan Detail data/rincian entitas WAJIB dibuat di **Halaman Terpisah** (route `/[id]` atau `/detail/[id]`) dengan Tombol Kembali Oranye di `PageHeader`. Dilarang menjejalkan detail rumit ke dalam modal kecil.
3. **Desain Form Compact & Elegan**: Form harus dirancang sangat compact, rapi, dan proporsional (grid 1 kolom di mobile, max 2-3 kolom di desktop: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`). Dilarang ada whitespace/margin yang berlebihan.
4. **Atomic Design Architecture**: Wajib memisahkan elemen UI ke `@/components/ui/` (`Button`, `Input`, `Select`, `Modal`, `Drawer`, `DataTable`, `Badge`) dan layout ke `@/components/layout/` (`PageHeader`). Dilarang memakai elemen HTML mentah tanpa style standar.
5. **Mandatory DataTable & Server-Side Pagination**: Halaman list/tabel data WAJIB menggunakan `<DataTable />` dari `@/components/ui/DataTable`. Dilarang memakai tag HTML manual `<table>`. Data WAJIB diambil dari API dengan server-side pagination (`page`, `limit`) dan prop `meta={meta}`.
6. **Sort By & Sort Direction (Default Name/Label)**: WAJIB menyediakan filter pengurutan `sort_by` / `orderBy` (default berbasis `name` / `label` / `id`) dan `sort_dir` / `orderDir` (`asc` / `desc`) dalam layout grid 2 kolom di Drawer filter.
7. **Tombol Filter Outline Biru & Drawer Slide Kanan-ke-Kiri**: Tombol Filter di `PageHeader` WAJIB bertipe outline biru (`variant="outline"` / `btn-outline-blue` / ikon `<Filter size={16} />`). Diklik memunculkan `<Drawer />` dari kanan ke kiri (standard SSO/IAM).
8. **UI & Form Consistency**:
   - Form <= 5 inputs: Gunakan `<Modal />` dengan grid maksimal 2 kolom (`grid grid-cols-1 md:grid-cols-2 gap-4`).
   - Form > 5 inputs: Gunakan Halaman Terpisah dengan Tombol Kembali Oranye (`bg-orange-500 text-white`) di `PageHeader`.
   - Gunakan prop `label` pada `<Input>` / `<Select>` langsung di Drawer.
</RULE[admin_crud_reviewer]>

<RULE[form_validation_reviewer]>
# Form Validation & Input Component Reviewer Policy

## Aturan Wajib Form & Validasi:
1. **Konsistensi UI Kit Input**: Semua elemen input form WAJIB menggunakan komponen UI Kit (`<Input>`, `<Select>`, `<AsyncSelect>`, `<Textarea>`, `<Checkbox>`). Dilarang memakai tag HTML mentah (`<input>`, `<select>`, `<textarea>`).
2. **Server-Side AsyncSelect untuk Data API**: Jika input dropdown mengambil data dari API backend/relasi DB, WAJIB menggunakan `<AsyncSelect />` dari `@/components/ui/AsyncSelect` yang mendukung pencarian & fetching dari server.
3. **Mandatory Strict Zod Validation**: DILARANG KERAS ada form tanpa validasi. Seluruh form WAJIB menggunakan skema validasi Zod (`z.object({...})`) yang di-bind via `react-hook-form` (`zodResolver(schema)`). Error message wajib tampil dalam Bahasa Indonesia di bawah field.
</RULE[form_validation_reviewer]>

<RULE[state_management_reviewer]>
# State Management & Store Reviewer Policy

## Aturan Wajib State Management:
1. **Zustand Global Store**: Seluruh global state WAJIB menggunakan Zustand yang berlokasi di `@/store/` dengan TypeScript interface terpisah untuk State dan Actions.
2. **Local Component State Scoping**: Data transient / tabel spesifik satu halaman DILARANG dimasukkan ke Zustand global store. Wajib dikelola dalam local state (`useState` / React Query).
</RULE[state_management_reviewer]>

<RULE[icon_standard_reviewer]>
# Icon Standard Reviewer Policy

## Aturan Wajib Penggunaan Ikon:
1. **Mandatory Lucide-React**: Seluruh ikon dalam aplikasi WAJIB di-import dan menggunakan pustaka standar `lucide-react` (seperti `<Plus size={16} />`, `<Trash2 size={16} />`, `<Filter size={16} />`).
2. **Dilarang SVG Mentah Inline & Third-Party Unstandardized**: DILARANG KERAS menggunakan tag `<svg>` mentah inline dengan `<path>` panjang jika ikon sudah tersedia di `lucide-react`. DILARANG menggunakan `<i className="fa ...">` atau paket ikon non-standar lainnya.
</RULE[icon_standard_reviewer]>
