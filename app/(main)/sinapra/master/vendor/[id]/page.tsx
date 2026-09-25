'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit2,
  Building2,
  Phone,
  Mail,
  User,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { sinapraService } from '@/services/sinapra.service';
import type { MasterVendor } from '@/types/sinapra.types';

export default function DetailMasterVendorPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const [vendor, setVendor] = useState<MasterVendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const res: any = await sinapraService.getMasterVendorDetail(id);
        setVendor(res?.data || null);
      } catch {
        toast.error('Gagal mengambil rincian data vendor');
        router.push('/sinapra/master/vendor');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id, router]);

  const getJenisRekananBadge = (jenis?: string) => {
    switch (jenis) {
      case 'laboratorium_kalibrasi':
        return <Badge variant="info">Laboratorium Kalibrasi</Badge>;
      case 'penyedia_barang':
        return <Badge variant="success">Penyedia Barang</Badge>;
      case 'jasa_maintenance':
        return <Badge variant="warning">Jasa Maintenance</Badge>;
      case 'kontraktor':
        return <Badge variant="secondary">Kontraktor</Badge>;
      default:
        return <Badge variant="secondary">Umum</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-4">
        <PageHeader title="Detail Vendor / Rekanan" />
        <div className="flex justify-center p-4 md:p-6 bg-white rounded-lg border border-slate-200">
          <p className="text-xs text-slate-500">Memuat rincian vendor...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex w-full flex-col gap-4">
        <PageHeader title="Detail Vendor / Rekanan" />
        <div className="p-4 md:p-6 bg-white rounded-lg border border-slate-200">
          <p className="text-xs text-rose-500">Data rekanan tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title={`Detail Rekanan: ${vendor.nama}`}
        description={`Informasi lengkap data rekanan ${vendor.kode}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.push('/sinapra/master/vendor')}
              style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}
            >
              Kembali
            </Button>
            <Button
              icon={<Edit2 size={16} />}
              onClick={() => router.push(`/sinapra/master/vendor/${vendor.id}/edit`)}
              style={{ background: 'var(--module-primary)' }}
            >
              Edit Data
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kolom 1: Profil Ringkas */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Building2 size={24} />
            </div>
            <div>
              <span className="font-mono text-2xs font-semibold text-slate-500 uppercase">
                {vendor.kode}
              </span>
              <h2 className="text-sm font-bold text-slate-800">{vendor.nama}</h2>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-2xs font-medium text-slate-500 uppercase">Jenis Rekanan</p>
              <div>{getJenisRekananBadge(vendor.jenis_rekanan)}</div>
            </div>

            <div>
              <p className="text-2xs font-medium text-slate-500 uppercase">Status Operasional</p>
              <div>
                <Badge variant={vendor.is_active ? 'success' : 'secondary'}>
                  {vendor.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-2xs font-medium text-slate-500 uppercase">Nomor Urutan</p>
              <p className="text-xs font-semibold text-slate-700">{vendor.urutan}</p>
            </div>
          </div>
        </div>

        {/* Kolom 2: Kontak & PIC */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <User size={16} /> Narahubung & Kontak
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-2xs font-medium text-slate-500 uppercase">Nama PIC</p>
              <p className="text-xs font-semibold text-slate-800">{vendor.pic_nama || '-'}</p>
            </div>

            <div>
              <p className="text-2xs font-medium text-slate-500 uppercase">Nomor HP / WhatsApp</p>
              <p className="text-xs text-slate-800 flex items-center gap-2">
                <Phone size={16} className="text-slate-400 shrink-0" />
                <span>{vendor.pic_kontak || '-'}</span>
              </p>
            </div>

            <div>
              <p className="text-2xs font-medium text-slate-500 uppercase">Telepon Kantor</p>
              <p className="text-xs text-slate-800 flex items-center gap-2">
                <Phone size={16} className="text-slate-400 shrink-0" />
                <span>{vendor.telepon || '-'}</span>
              </p>
            </div>

            <div>
              <p className="text-2xs font-medium text-slate-500 uppercase">Email Resmi</p>
              <p className="text-xs text-slate-800 flex items-center gap-2">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <span>{vendor.email || '-'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Kolom 3: Legalitas & Alamat */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <FileText size={16} /> Legalitas & Domisili
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-2xs font-medium text-slate-500 uppercase">Nomor NPWP</p>
              <p className="text-xs font-mono font-semibold text-slate-800">
                {vendor.nomor_npwp || '-'}
              </p>
            </div>

            <div>
              <p className="text-2xs font-medium text-slate-500 uppercase">Alamat Kantor / Bengkel</p>
              <p className="text-xs text-slate-700 flex items-start gap-2">
                <MapPin size={16} className="text-slate-400 shrink-0" />
                <span>{vendor.alamat || 'Alamat belum dilengkapi.'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
