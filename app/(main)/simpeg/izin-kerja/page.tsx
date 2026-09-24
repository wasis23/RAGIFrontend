"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function IzinKerjaRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/simpeg/cuti?tab=izin-kerja");
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center text-sm text-slate-500">
      Mengalihkan ke halaman Pengajuan Cuti &amp; Izin Kerja...
    </div>
  );
}
