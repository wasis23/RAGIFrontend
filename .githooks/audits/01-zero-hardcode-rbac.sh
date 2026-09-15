#!/bin/bash
#
# Audit 1/8: Zero Hardcode & RBAC (deterministik, tanpa AI).
# Memeriksa baris baru (+) pada tsx/ts yang di-stage terhadap:
#  1. Opsi dropdown statis HURUF KAPITAL (mis. value: 'REGULER').
#     Pengecualian: boolean, placeholder 'Semua ...', opsi struktural lowercase.
#  2. Akses user_type / userType statis.
#  3. Perbandingan string nama modul/role dalam logika (==, ===, !=, !==).
#
# Cakupan: app/, components/, lib/, hooks/.

echo "🤖 [Audit 1/8: Zero Hardcode & RBAC] Memeriksa staged changes..."

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM -- "app/**/*.tsx" "app/*.tsx" "app/**/*.ts" "app/*.ts" "components/**/*.tsx" "components/*.tsx" "lib/*.ts" "hooks/*.ts")

if [ -z "$STAGED_FILES" ]; then
    echo "ℹ️ [Audit Zero Hardcode & RBAC] Tidak ada file frontend yang di-stage. Skip."
    exit 0
fi

FAILED=0

while IFS= read -r file; do
    ADDED=$(git diff --cached -- "$file" | grep '^+' | grep -v '^+++' | sed 's^+^^')
    [ -z "$ADDED" ] && continue

    # 1. Nilai opsi statis huruf kapital.
    CAPS_HIT=$(echo "$ADDED" | grep -nP "value:\s*['\"][A-Z0-9_]{2,}['\"]" | head -n 3)
    if [ -n "$CAPS_HIT" ]; then
        echo "❌ [Audit Zero Hardcode] Opsi dropdown statis (huruf kapital) di $file:"
        echo "$CAPS_HIT" | sed 's/^/    /'
        echo "   💡 Opsi master WAJIB diambil dinamis dari API tabel referensi (AsyncSelect), bukan array literal."
        FAILED=1
    fi

    # 2. Akses user_type statis.
    USERTYPE_HIT=$(echo "$ADDED" | grep -nP '\buser_type\b|\buserType\b' | head -n 3)
    if [ -n "$USERTYPE_HIT" ]; then
        echo "❌ [Audit Zero Hardcode] Akses user_type statis di $file:"
        echo "$USERTYPE_HIT" | sed 's/^/    /'
        echo "   💡 Otorisasi WAJIB via hook RBAC (hasRole/hasPermission), bukan user_type."
        FAILED=1
    fi

    # 3. Perbandingan nama modul/role dalam logika.
    SLUG_HIT=$(echo "$ADDED" | grep -nP '(==|===|!=|!==)' | grep -P "'(spmb|sikeu|siakad|simpeg|sinapra|sippm|lms|upm|admin|superadmin|mahasiswa|dosen|tendik|calon_mhs)'" | head -n 3)
    if [ -n "$SLUG_HIT" ]; then
        echo "❌ [Audit Zero Hardcode] Hardcode nama modul/role dalam logika di $file:"
        echo "$SLUG_HIT" | sed 's/^/    /'
        echo "   💡 Relasi/filter WAJIB memakai referensi ID entitas dari database."
        FAILED=1
    fi
done <<< "$STAGED_FILES"

if [ $FAILED -ne 0 ]; then
    exit 1
else
    echo "✅ [Audit Zero Hardcode & RBAC] PASSED."
    exit 0
fi
