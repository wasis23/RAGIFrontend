'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Send,
  Download,
  User,
  Users,
  FlaskConical,
  ClipboardCheck,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react';
import { SippmBadge } from '@/components/sippm/SippmBadge';
import { sippmService } from '@/services/sippm.service';
import type { ProposalKegiatan } from '@/types/sippm.types';

export default function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [proposal, setProposal] = useState<ProposalKegiatan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await sippmService.getProposalDetail(Number(resolvedParams.id));
        if (res.data) setProposal(res.data);
      } catch (err) {
        console.error('Failed to load proposal detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [resolvedParams.id]);

  const handleSubmitProposal = async () => {
    if (!proposal || !confirm('Apakah Anda yakin ingin mengajukan proposal ini?')) return;
    try {
      await sippmService.submitProposal(proposal.id);
      router.refresh();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengajukan proposal');
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Memuat detail proposal usulan...</div>;
  }

  if (!proposal) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="text-slate-500 font-medium">Data proposal tidak ditemukan.</div>
        <button onClick={() => router.back()} className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Back Button & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm">
            <ArrowLeft size={18} /> Kembali
          </button>
          <div>
            <div className="flex items-center gap-2">
              <SippmBadge status={proposal.status} />
              <span className="text-xs text-slate-400 font-mono">ID: #{proposal.id}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              {proposal.judul}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {proposal.status === 'draft' && (
            <>
              <Link href={`/sippm/proposal/${proposal.id}/edit`} className="btn btn-secondary btn-sm">
                <Edit size={16} /> Edit
              </Link>
              <button onClick={handleSubmitProposal} className="btn btn-primary btn-sm bg-teal-600 border-none shadow-xs">
                <Send size={16} /> Submit Proposal
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Info Card */}
      <div className="card">
        <div className="card-body grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-slate-400 font-semibold mb-1">SKEMA KEGIATAN</div>
            <div className="font-bold text-teal-800 text-sm flex items-center gap-1.5">
              <FlaskConical size={16} className="text-teal-600" />
              {proposal.skema?.nama_skema || 'Skema Riset'}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400 font-semibold mb-1">RUMPUN ILMU</div>
            <div className="font-bold text-slate-800 text-sm">{proposal.rumpun_ilmu}</div>
          </div>

          <div>
            <div className="text-xs text-slate-400 font-semibold mb-1">DANA DIUSULKAN</div>
            <div className="font-extrabold text-teal-700 text-sm flex items-center gap-1">
              <DollarSign size={16} />
              {formatRupiah(proposal.dana_diusulkan)}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400 font-semibold mb-1">DANA DISETUJUI</div>
            <div className="font-extrabold text-emerald-700 text-sm">
              {proposal.dana_disetujui ? formatRupiah(proposal.dana_disetujui) : 'Belum ditetapkan'}
            </div>
          </div>
        </div>
      </div>

      {/* Abstrak Card */}
      <div className="card">
        <div className="card-header bg-slate-50">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-teal-600" /> Abstrak Usulan
          </h2>
        </div>
        <div className="card-body">
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
            {proposal.abstrak}
          </p>
        </div>
      </div>

      {/* Tim Anggota Card */}
      <div className="card">
        <div className="card-header bg-slate-50">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Users size={18} className="text-teal-600" /> Tim Ketua & Anggota
          </h2>
        </div>
        <div className="card-body space-y-3">
          {/* Ketua */}
          <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-700 text-white font-extrabold flex items-center justify-center text-sm">
                K
              </div>
              <div>
                <div className="font-extrabold text-slate-900 text-sm">
                  {proposal.ketua?.nama_lengkap || 'Ketua Pengusul'}
                </div>
                <div className="text-xs text-teal-700 font-medium">Ketua Tim • NIP: {proposal.ketua?.nip || '-'}</div>
              </div>
            </div>
            <span className="badge badge-sippm">Ketua Pengusul</span>
          </div>

          {/* Anggota */}
          {proposal.anggota && proposal.anggota.length > 0 ? (
            proposal.anggota.map((ang) => (
              <div key={ang.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                    A
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{ang.nama}</div>
                    <div className="text-xs text-slate-500">{ang.tugas || 'Anggota Tim'}</div>
                  </div>
                </div>
                <span className="badge badge-gray capitalize">{(ang.peran || 'anggota').replace(/_/g, ' ')}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400 italic">Belum ada anggota tim terdaftar.</div>
          )}
        </div>
      </div>
    </div>
  );
}
