#!/bin/bash
#
# Audit 3/8: Form & Input Validation Standard (deterministik, tanpa AI).
#  - REJECT: useForm() tanpa zodResolver (seluruh form WAJIB validasi Zod).

echo "🤖 [Audit 3/8: Form & Input Validation Standard] Memeriksa staged changes..."

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM -- "app/**/*.tsx" "components/**/*.tsx")

if [ -z "$STAGED_FILES" ]; then
    echo "ℹ️ [Audit Form Validation Standard] Tidak ada perubahan komponen form/input yang di-stage. Skip."
    exit 0
fi

FAILED=0

while IFS= read -r file; do
    [ -f "$file" ] || continue
    if grep -q 'useForm(' "$file" && ! grep -q 'zodResolver' "$file"; then
        echo "❌ [Audit Form Validation] useForm() tanpa zodResolver di $file."
        echo "   💡 Seluruh form WAJIB memakai skema Zod (z.object) via zodResolver dengan pesan Bahasa Indonesia."
        FAILED=1
    fi
done <<< "$STAGED_FILES"

if [ $FAILED -ne 0 ]; then
    exit 1
else
    echo "✅ [Audit Form Validation Standard] PASSED."
    exit 0
fi
