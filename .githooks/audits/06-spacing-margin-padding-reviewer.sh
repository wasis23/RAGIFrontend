#!/bin/bash
#
# Audit 6/8: Spacing, Margin & Padding Standard (deterministik, tanpa AI).
#  - REJECT: spacing arbitrary pixel (m-[37px], p-[19px], gap-[13px], ...).
#  - REJECT: padding wadah oversized (p-12/16/20/24, px-/py-/pt-/pb-/pl-/pr- sekelasnya).

echo "🤖 [Audit 6/8: Spacing, Margin & Padding Standard] Memeriksa staged changes..."

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM -- "app/**/*.tsx" "components/**/*.tsx")

if [ -z "$STAGED_FILES" ]; then
    echo "ℹ️ [Audit Spacing Standard] Tidak ada perubahan komponen/halaman yang di-stage. Skip."
    exit 0
fi

FAILED=0

while IFS= read -r file; do
    ADDED=$(git diff --cached -- "$file" | grep '^+' | grep -v '^+++' | sed 's^+^^')
    [ -z "$ADDED" ] && continue

    ARB_HIT=$(echo "$ADDED" | grep -nP '(^|[^a-zA-Z0-9_-])(p|m|gap|mt|mb|ml|mr|mx|my|px|py|pt|pb|pl|pr|space-x|space-y)-\[' | head -n 3)
    if [ -n "$ARB_HIT" ]; then
        echo "❌ [Audit Spacing Standard] Spacing arbitrary pixel di $file:"
        echo "$ARB_HIT" | sed 's/^/    /'
        echo "   💡 WAJIB skala standar (p-2..p-6, m-2..m-6, gap-2..gap-6, space-y-4/6). Dilarang m-[37px], gap-[13px], dsb."
        FAILED=1
    fi

    BIG_HIT=$(echo "$ADDED" | grep -nP '(^|[^a-zA-Z0-9_-])(p|px|py|pt|pb|pl|pr)-(12|16|20|24)([^0-9]|$)' | head -n 3)
    if [ -n "$BIG_HIT" ]; then
        echo "❌ [Audit Spacing Standard] Padding wadah oversized di $file:"
        echo "$BIG_HIT" | sed 's/^/    /'
        echo "   💡 Card/container WAJIB compact (p-3/p-4 mobile, p-4/p-6 desktop). Dilarang p-12/p-16/p-20/px-24."
        FAILED=1
    fi
done <<< "$STAGED_FILES"

if [ $FAILED -ne 0 ]; then
    exit 1
else
    echo "✅ [Audit Spacing Standard] PASSED."
    exit 0
fi
