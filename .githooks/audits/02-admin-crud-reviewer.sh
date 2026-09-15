#!/bin/bash
#
# Audit 2/8: Admin CRUD Standard (deterministik, tanpa AI).
#  - REJECT: tag HTML mentah <table>/<select>/<textarea>/<input> di halaman.
#  - REJECT: dialog native browser confirm()/alert()/prompt().
#  - WARN: tag <button> mentah (disarankan komponen Button dari UI Kit).

echo "🤖 [Audit 2/8: Admin CRUD Standard] Memeriksa staged changes..."

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM -- "app/**/*.tsx" "components/**/*.tsx")

if [ -z "$STAGED_FILES" ]; then
    echo "ℹ️ [Audit Admin CRUD Standard] Tidak ada perubahan pada file admin/CRUD yang di-stage. Skip."
    exit 0
fi

FAILED=0

while IFS= read -r file; do
    ADDED=$(git diff --cached -- "$file" | grep '^+' | grep -v '^+++' | sed 's^+^^')
    [ -z "$ADDED" ] && continue

    # Tag HTML mentah (Atomic Design: wajib UI Kit).
    RAW_HIT=$(echo "$ADDED" | grep -nP '<(table|select|textarea|input)[\s>]' | head -n 3)
    if [ -n "$RAW_HIT" ]; then
        echo "❌ [Audit Admin CRUD] Tag HTML mentah di $file:"
        echo "$RAW_HIT" | sed 's/^/    /'
        echo "   💡 WAJIB memakai UI Kit (@/components/ui): DataTable, Select/AsyncSelect, Textarea, Input."
        FAILED=1
    fi

    # Dialog native browser.
    NATIVE_HIT=$(echo "$ADDED" | grep -nP '(^|[^a-zA-Z])(confirm|alert|prompt)\s*\(' | grep -vP 'confirmText|onConfirm|cancelText' | head -n 3)
    if [ -n "$NATIVE_HIT" ]; then
        echo "❌ [Audit Admin CRUD] Dialog native browser di $file:"
        echo "$NATIVE_HIT" | sed 's/^/    /'
        echo "   💡 WAJIB memakai <ConfirmDialog /> atau <Modal />, bukan confirm()/alert()/prompt()."
        FAILED=1
    fi

    # Tombol mentah: peringatan saja.
    BTN_HIT=$(echo "$ADDED" | grep -nP '<button[\s>]' | head -n 3)
    if [ -n "$BTN_HIT" ]; then
        echo "⚠️ [Audit Admin CRUD] Tag <button> mentah di $file (disarankan <Button /> dari UI Kit):"
        echo "$BTN_HIT" | sed 's/^/    /'
    fi
done <<< "$STAGED_FILES"

if [ $FAILED -ne 0 ]; then
    exit 1
else
    echo "✅ [Audit Admin CRUD Standard] PASSED."
    exit 0
fi
