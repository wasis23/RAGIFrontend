#!/bin/bash
PROMPT_FILE=$(mktemp)
cat << 'PROMPT' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Spacing, Margin, Padding & Layout Alignment Standard.
Periksa Git Diff berikut HANYA terhadap Aturan Spacing & Layout Alignment:

Aturan Spacing, Margin & Padding:
1. SKALA SPACING STANDAR:
   - Penataan jarak WAJIB menggunakan skala standar Tailwind/Design System (\`p-2\` s.d \`p-6\`, \`m-2\` s.d \`m-6\`, \`gap-2\` s.d \`gap-6\`, \`space-y-4\` s.d \`space-y-6\`).
   - DILARANG HARDBOUND/ARBITRARY PIXEL SPACING seperti \`m-[37px]\`, \`p-[19px]\`, \`gap-[13px]\`, \`mt-[42px]\`, \`px-[55px]\`, \`py-[33px]\`.

2. COMPACT & PROPORSIONAL CARD PADDING:
   - Wadah utama (Card, Modal, Drawer, Table Container) wajib efisien (\`p-4\` atau \`p-6\` di desktop, \`p-3\` atau \`p-4\` di mobile).
   - DILARANG OVERSIZED PADDING seperti \`p-16\`, \`p-20\`, \`px-24\` yang membuang area layar.

3. KONSISTENSI GAP FLEX/GRID & ALIGNMENT:
   - Jarak antarelemen di container flexbox/grid wajib menggunakan \`gap-*\` (misal \`gap-4\` / \`gap-6\`).
   - DILARANG mencampur \`gap\` dengan inline margin manual (\`mt-*\`, \`mb-*\`, \`ml-*\`, \`mr-*\`) di elemen turunan flexbox/grid yang dapat merusak alignment.

4. OUTER SECTION SPACING:
   - Jarak vertikal antar section/card utama halaman wajib rapi dengan \`space-y-4\` / \`space-y-6\` atau \`mb-4\` / \`mb-6\`.
   - Dilarang menggunakan margin negatif acak (seperti \`-mt-20\`) tanpa kebutuhan overlay UI khusus.

Git Diff yang di-stage:
\`\`\`diff
PROMPT
git diff --cached -- "app/**" "components/**" "styles/**" >> "$PROMPT_FILE"
cat << 'PROMPT' >> "$PROMPT_FILE"
\`\`\`
Jawab HANYA salah satu:
- PASSED jika kode bersih dan memenuhi Spacing, Margin & Padding Standard.
- REJECTED: [detail alasan pelanggaran] jika ditemukan penggunaan arbitrary pixel spacing / oversized padding / layout misalignment.
PROMPT
agy --print "$(cat "$PROMPT_FILE")"
rm -f "$PROMPT_FILE"
