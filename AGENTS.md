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

## Aturan Wajib
1. **BACA** SKILL.md yang relevan sebelum mulai coding. Jangan asumsikan — baca dulu.
2. **PATUHI SEMUA** ketentuan di dalam SKILL.md tanpa pengecualian.
3. **JANGAN** menyimpang dari standar yang sudah ditetapkan di skill tanpa persetujuan eksplisit dari user.
</RULE[agent_skills]>
