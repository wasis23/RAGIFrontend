'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FilePlus,
  Search,
  Filter,
  Eye,
  Edit,
  Send,
  Download,
  BookOpen,
  DollarSign,
  User,
  FlaskConical,
  Shield,
  UserCheck,
  CheckCircle2,
  XCircle,
  Users,
} from 'lucide-react';
import { SippmBadge } from '@/components/sippm/SippmBadge';
import { sippmService } from '@/services/sippm.service';
import { simpegService } from '@/services/simpeg.service';
import { useAuth } from '@/hooks/useAuth';
import type { ProposalKegiatan, StatusProposal, JenisKegiatan } from '@/types/sippm.types';

export default function ProposalListPage() {
  const router = useRouter();
  const { user, hasRole, isAdmin } = useAuth();
  
  // Strict RBAC check (per rbac-refactoring-standard)
  const isLppmAdmin = isAdmin || hasRole('admin_lppm') || hasRole('superadmin');
  
  const [proposals, setProposals] = useState<ProposalKegiatan[]>([]);
  const [dosenList, setDosenList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [jenisFilter, setJenisFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dosenFilter, setDosenFilter] = useState<string>('all');

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const res = await sippmService.getProposals({
        search: search || undefined,
        jenis_kegiatan: jenisFilter !== 'all' ? (jenisFilter as JenisKegiatan) : undefined,
        status: statusFilter !== 'all' ? (statusFilter as StatusProposal) : undefined,
      });

      if (res.data) {
        const items = Array.isArray(res.data) ? res.data : (res.data as any).items || (res.data as any).data || [];
        setProposals(items);
      }
    } catch (err) {
      console.error('Failed to fetch proposals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
    if (isLppmAdmin) {
      simpegService.getPegawaiList({ jenis_pegawai: 'dosen' }).then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
        setDosenList(list);
      }).catch(() => {});
    }
  }, [jenisFilter, statusFilter, isLppmAdmin]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProposals();
  };

  const handleSubmitProposal = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin mengajukan proposal ini? Proposal yang telah diajukan tidak dapat diubah kembali.')) return;
    try {
      await sippmService.submitProposal(id);
      fetchProposals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengajukan proposal');
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Filter based on Role & Selected Dosen
  const displayedProposals = proposals.filter((p) => {
    // 1. Role-based scoping: If Dosen, show only own proposals
    if (!isLppmAdmin) {
      const isMine =
        p.dosen_ketua_id === user?.id ||
        p.ketua?.nip === user?.username ||
        ((user as any)?.nama_lengkap && p.ketua?.nama_lengkap && p.ketua.nama_lengkap.toLowerCase().includes((user as any).nama_lengkap.toLowerCase()));
      if (!isMine) return false;
    }

    // 2. Admin Dosen Filter
    if (isLppmAdmin && dosenFilter !== 'all') {
      const matchesDosen =
        p.dosen_ketua_id === Number(dosenFilter) ||
        p.ketua?.nama_lengkap === dosenFilter;
      if (!matchesDosen) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-sippm">Modul Proposal SIPPM</span>
            {isLppmAdmin ? (
              <span className="badge badge-cyan flex items-center gap-1 font-bold">
                <Shield size={12} /> Access: Admin LPPM (Semua Data Dosen)
              </span>
            ) : (
              <span className="badge badge-blue flex items-center gap-1 font-bold">
                <UserCheck size={12} /> Access: Mode Dosen Pengusul
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Proposal Usulan Riset & PkM
          </h1>
          <p className="text-slate-500 text-sm">
            {isLppmAdmin
              ? 'Panel Admin LPPM untuk mengelola, meninjau, dan memplot reviewer proposal seluruh dosen.'
              : 'Daftar pengajuan proposal usulan hibah penelitian dan pengabdian masyarakat milik Anda.'}
          </p>
        </div>

        {/* Create Proposal Button */}
        <Link href="/sippm/proposal/create" className="btn btn-primary bg-primary-600 hover:bg-primary-700 border-none shadow-sm font-bold">
          <FilePlus size={18} /> Buat Proposal Baru
        </Link>
      </div>

      {/* Filter Card 1 Baris Presisi */}
      <div className="card">
        <div className="card-body p-4 flex flex-col xl:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="input-wrapper w-full xl:flex-1 max-w-lg">
            <span className="input-prefix-icon"><Search size={18} /></span>
            <input
              type="text"
              className="input input-icon-left"
              placeholder="Cari judul proposal / ketua pengusul..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto shrink-0">
            {/* Filter Dosen (Khusus Admin) */}
            {isLppmAdmin && (
              <select
                className="input text-xs w-full sm:w-56 bg-primary-50/50 border-primary-200 font-semibold"
                value={dosenFilter}
                onChange={(e) => setDosenFilter(e.target.value)}
              >
                <option value="all">Semua Dosen Pengusul</option>
                {dosenList.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.nama_lengkap || d.name} ({d.unit_kerja?.nama || 'Dosen'})
                  </option>
                ))}
              </select>
            )}

            {/* Filter Jenis */}
            <select
              className="input text-xs w-full sm:w-48"
              value={jenisFilter}
              onChange={(e) => setJenisFilter(e.target.value)}
            >
              <option value="all">Semua Jenis Kegiatan</option>
              <option value="penelitian">Penelitian</option>
              <option value="pengabdian">Pengabdian Masyarakat</option>
            </select>

            {/* Filter Status */}
            <select
              className="input text-xs w-full sm:w-40"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Diajukan</option>
              <option value="under_review">Dalam Review</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="contracted">Kontrak Hibah</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container bg-white">
        <table className="table">
          <thead>
            <tr>
              <th>Judul Proposal & Skema</th>
              <th>Ketua Pengusul</th>
              <th>Dana Diusulkan</th>
              <th>Status</th>
              <th className="text-right">Aksi {isLppmAdmin ? 'Admin' : 'Dosen'}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-400">Memuat daftar proposal...</td>
              </tr>
            ) : displayedProposals.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FlaskConical size={32} className="text-slate-300" />
                    <span>Tidak ada proposal usulan yang cocok.</span>
                  </div>
                </td>
              </tr>
            ) : (
              displayedProposals.map((item) => (
                <tr key={item.id} className="hover:bg-primary-50/40 transition-colors">
                  <td>
                    <div className="font-bold text-slate-900 line-clamp-1">{item.judul}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="font-medium text-primary-700">{item.skema?.nama_skema || item.skema?.nama || 'Skema Riset'}</span>
                      <span>•</span>
                      <span className="capitalize">{item.rumpun_ilmu}</span>
                    </div>
                  </td>
                  <td>
                    <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <User size={14} className="text-slate-400" />
                      {item.ketua?.nama_lengkap || 'Dosen Pengusul'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.ketua?.nip || 'NIP Verified'}</div>
                  </td>
                  <td className="font-bold text-primary-700 text-sm">
                    {formatRupiah(item.dana_diusulkan ?? item.anggaran_diajukan ?? 0)}
                  </td>
                  <td>
                    <SippmBadge status={item.status} />
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/sippm/proposal/${item.id}`}
                        className="btn btn-ghost btn-sm text-primary-700 hover:bg-primary-50"
                        title="Lihat Detail"
                      >
                        <Eye size={16} /> Detail
                      </Link>

                      {/* Admin-only Plot Reviewer button */}
                      {isLppmAdmin && item.status === 'submitted' && (
                        <Link
                          href={`/sippm/reviewer`}
                          className="btn btn-ghost btn-sm text-purple-700 hover:bg-purple-50 font-semibold"
                          title="Plot Reviewer"
                        >
                          <Users size={14} /> Plot Reviewer
                        </Link>
                      )}

                      {/* Dosen-only Edit & Submit button */}
                      {item.status === 'draft' && (
                        <>
                          <Link
                            href={`/sippm/proposal/${item.id}/edit`}
                            className="btn btn-ghost btn-sm text-amber-700 hover:bg-amber-50"
                            title="Edit Proposal"
                          >
                            <Edit size={16} /> Edit
                          </Link>

                          <button
                            onClick={() => handleSubmitProposal(item.id)}
                            className="btn btn-ghost btn-sm text-blue-600 hover:bg-blue-50"
                            title="Ajukan ke LPPM"
                          >
                            <Send size={16} /> Ajukan
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
