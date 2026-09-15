#!/bin/bash
#
# Audit 5/8: Icon Standard (deterministik, tanpa AI).
#  - REJECT: tag <svg> mentah inline di komponen/halaman.
#  - REJECT: ikon FontAwesome (fa-*) atau paket ikon non-standar.

echo "🤖 [Audit 5/8: Icon Standard] Memeriksa staged changes..."

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM -- "app/**/*.tsx" "components/**/*.tsx")

if [ -z "$STAGED_FILES" ]; then
    echo "ℹ️ [Audit Icon Standard] Tidak ada perubahan komponen/halaman yang di-stage. Skip."
    exit 0
fi

FAILED=0

while IFS= read -r file; do
    ADDED=$(git diff --cached -- "$file" | grep '^+' | grep -v '^+++' | sed 's^+^^')
    [ -z "$ADDED" ] && continue

    SVG_HIT=$(echo "$ADDED" | grep -nP '<svg[\s>]' | head -n 3)
    if [ -n "$SVG_HIT" ]; then
        echo "❌ [Audit Icon Standard] Tag <svg> mentah di $file:"
        echo "$SVG_HIT" | sed 's/^/    /'
        echo "   💡 Seluruh ikon WAJIB memakai lucide-react (pengecualian hanya logo custom di public/icons/)."
        FAILED=1
    fi

    FA_HIT=$(echo "$ADDED" | grep -nP 'fa-[a-z-]+|font-?awesome' | head -n 3)
    if [ -n "$FA_HIT" ]; then
        echo "❌ [Audit Icon Standard] Ikon non-standar (FontAwesome) di $file:"
        echo "$FA_HIT" | sed 's/^/    /'
        echo "   💡 DILARANG <i className=\"fa ...\"> atau paket ikon pihak ketiga. Pakai lucide-react."
        FAILED=1
    fi
done <<< "$STAGED_FILES"

if [ $FAILED -ne 0 ]; then
    exit 1
else
    echo "✅ [Audit Icon Standard] PASSED."
    exit 0
fi
