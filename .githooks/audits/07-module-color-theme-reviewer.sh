#!/bin/bash
#
# Audit 7/8: Module Primary Color & Theme Standard (deterministik, tanpa AI).
#  - REJECT: hardcode warna biru bawaan (bg-blue-600, #3b82f6, dsb.) di halaman
#    modul. Warna aksen WAJIB mengikuti primary_color modul dari database
#    (token primary-*, CSS var --module-primary, atau theme context).

echo "🤖 [Audit 7/8: Module Primary Color & Theme Standard] Memeriksa staged changes..."

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM -- "app/(main)/**/*.tsx" "components/**/*.tsx")

if [ -z "$STAGED_FILES" ]; then
    echo "ℹ️ [Audit Module Color Theme Standard] Tidak ada perubahan komponen/halaman yang di-stage. Skip."
    exit 0
fi

# Pola di-escape agar aman di semua shell
PATTERN='bg-blue-600|bg-blue-700|text-blue-600|border-blue-600|#3b82f6|#2563eb'

FAILED=0

while IFS= read -r file; do
    ADDED=$(git diff --cached -- "$file" | grep '^+' | grep -v '^+++')
    [ -z "$ADDED" ] && continue

    COLOR_HIT=$(echo "$ADDED" | grep -n -E "$PATTERN" | sed 's^+^^' | head -n 3)
    if [ -n "$COLOR_HIT" ]; then
        echo "❌ [Audit Module Color Theme] Hardcode warna biru statis di $file:"
        echo "$COLOR_HIT" | sed 's/^/    /'
        echo "   💡 Aksen modul WAJIB dinamis mengikuti primary_color dari master modul, bukan bg-blue-600/#3b82f6."
        FAILED=1
    fi
done <<< "$STAGED_FILES"

if [ $FAILED -ne 0 ]; then
    exit 1
else
    echo "✅ [Audit Module Color Theme Standard] PASSED."
    exit 0
fi
