#!/bin/bash

echo "🤖 [Audit 8/8: Fast Build & TypeCheck Standard] Memeriksa integritas TypeScript & sintaks..."

if [ -n "$DIFF_TARGET" ]; then
    STAGED_FILES=$(git diff "$DIFF_TARGET" --name-only -- "*.ts" "*.tsx")
else
    STAGED_FILES=$(git diff --cached --name-only -- "*.ts" "*.tsx")
fi

if [ -z "$STAGED_FILES" ]; then
    echo "ℹ️ [Audit Fast Build & TypeCheck] Tidak ada file TypeScript (.ts/.tsx) yang diuji. Skip."
    exit 0
fi

echo "🔍 Menjalankan Fast TypeScript Verification (tsc --noEmit)..."

TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ [Audit Fast Build & TypeCheck] TYPECHECK GAGAL!"
    echo "================================ DETAIL KESALAHAN TYPESCRIPT ========================"
    echo "$TSC_OUTPUT" | head -n 50
    echo "===================================================================================="
    echo "💡 Ditemukan kesalahan tipe data/sintaks TypeScript. Harap perbaiki sebelum commit."
    exit 1
else
    echo "✅ [Audit Fast Build & TypeCheck] PASSED (0 kesalahan tipe data/sintaks)."
    exit 0
fi
