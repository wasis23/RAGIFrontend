#!/bin/bash
#
# Audit 4/8: State Management Standard (deterministik, tanpa AI).
#  - REJECT: file di store/ yang tidak memakai Zustand.

echo "🤖 [Audit 4/8: State Management Standard] Memeriksa staged changes..."

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM -- "store/**/*.ts" "store/*.ts")

if [ -z "$STAGED_FILES" ]; then
    echo "ℹ️ [Audit State Management Standard] Tidak ada perubahan state/store yang di-stage. Skip."
    exit 0
fi

FAILED=0

while IFS= read -r file; do
    [ -f "$file" ] || continue
    if ! grep -q "from 'zustand'" "$file"; then
        echo "❌ [Audit State Management] $file tidak memakai Zustand."
        echo "   💡 Global state WAJIB memakai Zustand di @/store/ dengan interface State dan Actions terpisah."
        FAILED=1
    fi
done <<< "$STAGED_FILES"

if [ $FAILED -ne 0 ]; then
    exit 1
else
    echo "✅ [Audit State Management Standard] PASSED."
    exit 0
fi
