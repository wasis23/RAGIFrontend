'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { sinapraService } from '@/services/sinapra.service';
import { referensiService } from '@/services/referensi.service';
import type { StockOpname, StockOpnameItem } from '@/types/sinapra.types';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  Building2,
  User,
  Calendar,
  ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';

const itemEditSchema = z.object({
  status_keberadaan: z.enum(['sesuai', 'tidak_ditemukan', 'rusak', 'tertukar'], {
    message: 'Status keberadaan barang wajib dipilih',
  }),
  kondisi_fisik: z.enum(['baik', 'rusak_ringan', 'rusak_berat'], {
    message: 'Kondisi fisik barang wajib dipilih',
  }),
  catatan: z.string().optional(),
});

type ItemEditFormData = z.infer<typeof itemEditSchema>;

export default function StockOpnameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const opnameId = Number(params?.id);

  const [opname, setOpname] = useState<StockOpname | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<StockOpnameItem | null>(null);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const [keberadaanOptions, setKeberadaanOptions] = useState<{ value: string; label: string }[]>([]);
  const [kondisiOptions, setKondisiOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [kebRes, konRes] = await Promise.all([
          referensiService.getAll({ modul: 'sinapra', tipe: 'status_keberadaan_aset' }),
          referensiService.getAll({ modul: 'sinapra', tipe: 'kondisi_aset' }),
        ]);
        setKeberadaanOptions((kebRes || []).map((r) => ({ value: r.kode || String(r.id), label: r.nama })));
        setKondisiOptions((konRes || []).map((r) => ({ value: r.kode || String(r.id), label: r.nama })));
      } catch {
        setKeberadaanOptions([]);
        setKondisiOptions([]);
      }
    };
    fetchReferences();
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!opnameId || isNaN(opnameId)) return;
    try {
      setLoading(true);
      const res = await sinapraService.getStockOpnameDetail(opnameId);
      if (res?.data) {
        setOpname(res.data);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat detail stock opname');
    } finally {
      setLoading(false);
    }
  }, [opnameId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const {
    register: registerItemEdit,
    handleSubmit: handleItemEditSubmit,
    setValue: setItemEditValue,
    watch: watchItemEdit,
    formState: { errors: itemErrors, isSubmitting: isItemSubmitting },
  } = useForm<ItemEditFormData>({
    resolver: zodResolver(itemEditSchema),
    defaultValues: {
      status_keberadaan: 'sesuai',
      kondisi_fisik: 'baik',
      catatan: '',
    },
  });

  const onUpdateItemSubmit = async (data: ItemEditFormData) => {
    if (!editingItem || !opname) return;
    try {
      await sinapraService.updateStockOpnameItem(opname.id, editingItem.id, data);
      toast.success('Pemeriksaan fisik item berhasil dicatat');
      setEditingItem(null);
      fetchDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui item opname');
    }
  };

  const handleFinishOpname = async () => {
    if (!opname) return;
    try {
      setIsFinishing(true);
      await sinapraService.finishStockOpname(opname.id);
      toast.success('Sesi stock opname berhasil diselesaikan dan aset telah disinkronkan!');
      setIsFinishDialogOpen(false);
      fetchDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyelesaikan sesi stock opname');
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      <PageHeader
        title={`Checklist Fisik: ${opname?.kode_opname || 'Memuat...'}`}
        description="Pemeriksaan fisik aset ruangan, verifikasi ketersediaan di lokasi, dan sinkronisasi kondisi inventaris"
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/sinapra/audit-mutasi')}
            style={{
              borderColor: 'var(--module-primary)',
              color: 'var(--module-primary)',
            }}
          >
            Kembali
          </Button>
        }
      />

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center text-xs text-slate-500">
          Memuat rincian sesi audit...
        </div>
      ) : !opname ? (
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center text-xs text-red-500">
          Data sesi audit tidak ditemukan.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card Ringkasan Sesi */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{opname.kode_opname}</span>
                  {opname.status === 'selesai' ? (
                    <Badge variant="success">
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 size={12} /> Selesai Disinkron
                      </span>
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      <span className="inline-flex items-center gap-2">
                        <AlertCircle size={12} /> Sedang Berlangsung
                      </span>
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500">{opname.catatan || 'Tidak ada catatan tambahan'}</p>
              </div>

              {opname.status === 'berlangsung' && (
                <Button
                  variant="outline"
                  icon={<CheckCircle2 size={16} />}
                  onClick={() => setIsFinishDialogOpen(true)}
                  style={{
                    borderColor: 'var(--module-primary)',
                    color: 'var(--module-primary)',
                  }}
                >
                  Selesaikan & Sinkron Aset
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-slate-400" />
                <div>
                  <span className="text-slate-400 block text-2xs">LOKASI RUANGAN / LAB</span>
                  <span className="font-semibold text-slate-800">{opname.ruangan?.nama || '-'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                <div>
                  <span className="text-slate-400 block text-2xs">PETUGAS AUDITOR</span>
                  <span className="font-semibold text-slate-800">{opname.petugas?.name || '-'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <div>
                  <span className="text-slate-400 block text-2xs">PERIODE AUDIT</span>
                  <span className="font-semibold text-slate-800">
                    {opname.tanggal_mulai} s.d {opname.tanggal_selesai || 'Sekarang'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Verifikasi Item Fisik */}
          {editingItem && (
            <div
              className="rounded-xl border p-4 sm:p-6 space-y-4"
              style={{
                background: 'var(--module-primary-subtle)',
                borderColor: 'var(--module-primary)',
              }}
            >
              <div className="flex items-center gap-2">
                <ClipboardList size={16} style={{ color: 'var(--module-primary)' }} />
                <h4 className="text-xs font-semibold" style={{ color: 'var(--module-primary)' }}>
                  Pemeriksaan Fisik: {editingItem.aset?.nama} ({editingItem.aset?.kode_aset})
                </h4>
              </div>

              <form onSubmit={handleItemEditSubmit(onUpdateItemSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Status Keberadaan Barang *"
                    options={keberadaanOptions}
                    value={watchItemEdit('status_keberadaan')}
                    onChange={(e) => setItemEditValue('status_keberadaan', e.target.value as any, { shouldValidate: true })}
                    error={itemErrors.status_keberadaan?.message}
                  />

                  <Select
                    label="Kondisi Fisik Barang *"
                    options={kondisiOptions}
                    value={watchItemEdit('kondisi_fisik')}
                    onChange={(e) => setItemEditValue('kondisi_fisik', e.target.value as any, { shouldValidate: true })}
                    error={itemErrors.kondisi_fisik?.message}
                  />
                </div>

                <Textarea
                  label="Catatan Temuan Fisik"
                  placeholder="Rincian kerusakan, kelengkapan komponen, atau nomor seri..."
                  rows={2}
                  error={itemErrors.catatan?.message}
                  {...registerItemEdit('catatan')}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingItem(null)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    icon={<Save size={16} />}
                    loading={isItemSubmitting}
                    disabled={isItemSubmitting}
                  >
                    Simpan Temuan
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Daftar Aset Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-700">
              Daftar Barang & Instrumen Fisik Ruangan ({opname.items?.length || 0} Item)
            </h3>

            {(opname.items || []).length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Tidak ada aset yang terdaftar di ruangan ini saat sesi audit dibuka.
              </div>
            ) : (
              <div className="space-y-4">
                {(opname.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                  >
                    <div>
                      <p className="font-semibold text-xs text-slate-900">{item.aset?.nama}</p>
                      <p className="text-2xs text-slate-500">
                        Kode: {item.aset?.kode_aset} | Kondisi Fisik:{' '}
                        <strong className="font-medium text-slate-700">{item.kondisi_fisik}</strong> | Keberadaan:{' '}
                        <strong className="font-medium text-slate-700">{item.status_keberadaan}</strong>
                      </p>
                      {item.catatan && <p className="text-2xs text-slate-500">Catatan: {item.catatan}</p>}
                    </div>

                    {opname.status === 'berlangsung' && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingItem(item);
                          setItemEditValue('status_keberadaan', item.status_keberadaan);
                          setItemEditValue('kondisi_fisik', item.kondisi_fisik);
                          setItemEditValue('catatan', item.catatan || '');
                        }}
                      >
                        Periksa Fisik
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Dialog Selesaikan Stock Opname */}
      <ConfirmDialog
        isOpen={isFinishDialogOpen}
        title="Tutup Sesi Audit & Sinkronkan Kondisi Aset?"
        message="Setelah sesi ditutup, seluruh kondisi fisik dan keberadaan aset hasil audit akan langsung disinkronkan ke master inventaris ruangan secara permanen."
        confirmText="Ya, Selesaikan & Sinkronkan"
        cancelText="Batal"
        isLoading={isFinishing}
        onConfirm={handleFinishOpname}
        onClose={() => setIsFinishDialogOpen(false)}
      />
    </div>
  );
}
