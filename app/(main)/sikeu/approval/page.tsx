'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  AlertCircle,
  FileText,
  User
} from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { TagihanMahasiswa, DispensasiTagihan } from '@/types/sikeu.types';

export default function SikeuApprovalPage() {
  const [pendingTagihan, setPendingTagihan] = useState<TagihanMahasiswa[]>([]);
  const [pendingDispensasi, setPendingDispensasi] = useState<DispensasiTagihan[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalAction, setModalAction] = useState<{
    type: 'tagihan' | 'dispensasi';
    action: 'approve' | 'reject';
    id: number;
    title: string;
  } | null>(null);

  const [catatan, setCatatan] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getPendingApprovals();
      if (res.data) {
        setPendingTagihan(res.data.tagihan_pending || []);
        setPendingDispensasi(res.data.dispensasi_pending || []);
      }
    } catch (err) {
      console.error('Failed to load pending approvals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmAction = async () => {
    if (!modalAction) return;
    setProcessing(true);
    try {
      if (modalAction.type === 'tagihan') {
        if (modalAction.action === 'approve') {
          await sikeuService.approveTagihan(modalAction.id, catatan);
        } else {
          await sikeuService.rejectTagihan(modalAction.id, catatan);
        }
      } else {
        if (modalAction.action === 'approve') {
          await sikeuService.approveDispensasi(modalAction.id, catatan);
        } else {
          await sikeuService.rejectDispensasi(modalAction.id, catatan);
        }
      }
      setModalAction(null);
      setCatatan('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses keputusan approval');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/sikeu" className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-jakarta">Portal Approval Pimpinan</h1>
            <p className="text-xs text-gray-500">Persetujuan Tagihan Eksternal & Permohonan Dispensasi Keuangan Mahasiswa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1">
            <Clock size={14} /> Pending: {pendingTagihan.length + pendingDispensasi.length} Pengajuan
          </span>
        </div>
      </div>

      {/* Tab 1: Tagihan Eksternal Pending Approval */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <FileText size={18} className="text-indigo-600" /> Pengajuan Tagihan Lintas Sistem ({pendingTagihan.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-6 text-gray-400">Loading antrean approval...</div>
        ) : pendingTagihan.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">No. Tagihan</th>
                  <th className="px-4 py-3">ID Mahasiswa</th>
                  <th className="px-4 py-3">Sistem Asal</th>
                  <th className="px-4 py-3 text-right">Total Tagihan</th>
                  <th className="px-4 py-3">Jatuh Tempo</th>
                  <th className="px-4 py-3 text-center">Aksi Keputusan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingTagihan.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-medium text-indigo-600">{t.nomor_tagihan}</td>
                    <td className="px-4 py-3">Mahasiswa #{t.mahasiswa_id}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded">
                        {t.source_system}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      Rp {Number(t.total_bayar).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3">{t.jatuh_tempo || '-'}</td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        onClick={() => setModalAction({ type: 'tagihan', action: 'approve', id: t.id, title: `Approve Tagihan ${t.nomor_tagihan}` })}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium inline-flex items-center gap-1 transition"
                      >
                        <CheckCircle size={14} /> Setujui
                      </button>
                      <button
                        onClick={() => setModalAction({ type: 'tagihan', action: 'reject', id: t.id, title: `Tolak Tagihan ${t.nomor_tagihan}` })}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium inline-flex items-center gap-1 transition"
                      >
                        <XCircle size={14} /> Tolak
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm">
            Tidak ada antrean approval tagihan eksternal.
          </div>
        )}
      </div>

      {/* Tab 2: Dispensasi Pembayaran Pending Approval */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <User size={18} className="text-amber-600" /> Permohonan Dispensasi Pembayaran ({pendingDispensasi.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-6 text-gray-400">Loading antrean dispensasi...</div>
        ) : pendingDispensasi.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Mahasiswa</th>
                  <th className="px-4 py-3">Tipe Dispensasi</th>
                  <th className="px-4 py-3">Alasan Permohonan</th>
                  <th className="px-4 py-3">Jatuh Tempo Baru</th>
                  <th className="px-4 py-3 text-center">Aksi Keputusan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingDispensasi.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">Mahasiswa #{d.mahasiswa_id}</td>
                    <td className="px-4 py-3 capitalize">
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded">
                        {d.tipe_dispensasi.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">{d.alasan}</td>
                    <td className="px-4 py-3">{d.jatuh_tempo_baru || '-'}</td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        onClick={() => setModalAction({ type: 'dispensasi', action: 'approve', id: d.id, title: `Approve Dispensasi Mhs #${d.mahasiswa_id}` })}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium inline-flex items-center gap-1 transition"
                      >
                        <CheckCircle size={14} /> Setujui
                      </button>
                      <button
                        onClick={() => setModalAction({ type: 'dispensasi', action: 'reject', id: d.id, title: `Tolak Dispensasi Mhs #${d.mahasiswa_id}` })}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium inline-flex items-center gap-1 transition"
                      >
                        <XCircle size={14} /> Tolak
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm">
            Tidak ada permohonan dispensasi yang menunggu approval.
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {modalAction && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">{modalAction.title}</h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Catatan Pimpinan (Opsional)</label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Masukkan catatan/instruksi persetujuan..."
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setModalAction(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={processing}
                className={`px-4 py-2 text-white text-xs font-medium rounded-lg transition ${
                  modalAction.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {processing ? 'Memproses...' : modalAction.action === 'approve' ? 'Konfirmasi Approve' : 'Konfirmasi Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
