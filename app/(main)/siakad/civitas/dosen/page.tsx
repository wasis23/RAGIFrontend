'use client';

import { useState, useEffect } from 'react';
import { UserCheck, Plus, Filter, Edit2, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { siakadService } from '@/services/siakad.service';
import { simpegService } from '@/services/simpeg.service';
import toast from 'react-hot-toast';

export default function DosenPage() {
  const [fullList, setFullList] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pencarian + pagination ala Biodata (1 halaman, tidak menumpuk semua data)
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterJabatan, setFilterJabatan] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDosen, setEditingDosen] = useState<any | null>(null);
  const [form, setForm] = useState({
    program_studi_id: 1,
    jabatan_akademik: 'Lektor',
  });
  const [saving, setSaving] = useState(false);

  const fetchProdis = async () => {
    try {
      const res = await siakadService.getProdi();
      if (res.data) setProdis(res.data);
    } catch (err) {}
  };

  // LIVE dari SIMPEG: sumber utama = simpeg_pegawai (jenis_pegawai=dosen).
  // siakad_dosen hanya dipakai sebagai pelengkap atribut akademik (homebase prodi, jabatan).
  // Seluruh data ditarik lalu difilter + paginasi di klien agar pencarian & filter konsisten.
  const fetchDosens = async () => {
    try {
      setLoading(true);
      const akadRes = await siakadService.getDosens({ per_page: 500 }).catch(() => null);
      const akadList: any[] = akadRes?.data || [];
      const map: Record<string, any> = {};
      akadList.forEach((d: any) => {
        if (d.pegawai_id) map[`pegawai:${d.pegawai_id}`] = d;
        if (d.nidn) map[`nidn:${d.nidn}`] = d;
        if (d.nip) map[`nip:${d.nip}`] = d;
      });

      // Tarik semua halaman pegawai dosen (per 100) agar filter/paginasi konsisten
      const pegAll: any[] = [];
      let pg = 1;
      for (;;) {
        const res: any = await simpegService.getPegawaiList({ jenis_pegawai: 'dosen', per_page: 100, page: pg });
        const payload = res?.data;
        const items: any[] = Array.isArray(payload) ? payload : payload?.data || [];
        const total: number = Array.isArray(payload) ? items.length : payload?.total || items.length;
        pegAll.push(...items);
        if (pegAll.length >= total || items.length === 0 || pg >= 20) break;
        pg += 1;
      }

      setFullList(
        pegAll.map((p: any) => {
          const akad = map[`pegawai:${p.id}`] || (p.nidn && map[`nidn:${p.nidn}`]) || (p.nip && map[`nip:${p.nip}`]) || null;
          return {
            ...p,
            siakad_id: akad?.id || null,
            program_studi: akad?.program_studi || null,
            program_studi_id: akad?.program_studi_id || null,
            jabatan_akademik: akad?.jabatan_akademik || p.jabatan_terakhir || 'Tenaga Pendidik',
            homebase_status: akad ? 'terpetakan' : 'belum_terpetakan',
          };
        })
      );
    } catch (err: any) {
      toast.error('Gagal memuat data dosen dari SIMPEG');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdis();
    fetchDosens();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = fullList.filter((d: any) => {
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const hay = `${d.nama_lengkap || ''} ${d.nidn || ''} ${d.nip || ''} ${d.nuptk || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filterProdi && String(d.program_studi_id) !== String(filterProdi)) return false;
    if (filterJabatan && d.jabatan_akademik !== filterJabatan) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageData = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const meta = {
    current_page: safePage,
    last_page: totalPages,
    per_page: PER_PAGE,
    total: filtered.length,
    from: filtered.length === 0 ? 0 : (safePage - 1) * PER_PAGE + 1,
    to: Math.min(safePage * PER_PAGE, filtered.length),
  };

  // Atur atribut akademik (homebase + jabatan) — data kepegawaian tetap milik SIMPEG.
  const handleOpenModal = (item?: any) => {
    if (!item) return;
    setEditingDosen(item);
    setForm({
      program_studi_id: item.program_studi_id || prodis[0]?.id || 1,
      jabatan_akademik: item.jabatan_akademik || 'Lektor',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDosen) return;
    try {
      setSaving(true);
      if (editingDosen.siakad_id) {
        await siakadService.updateDosen(editingDosen.siakad_id, {
          nama_lengkap: editingDosen.nama_lengkap,
          program_studi_id: form.program_studi_id,
          jabatan_akademik: form.jabatan_akademik,
        });
      } else {
        await siakadService.createDosen({
          nama_lengkap: editingDosen.nama_lengkap,
          nidn: editingDosen.nidn,
          nip: editingDosen.nip,
          program_studi_id: form.program_studi_id,
          jabatan_akademik: form.jabatan_akademik,
        });
      }
      toast.success('Atribut akademik dosen berhasil disimpan');
      setIsModalOpen(false);
      fetchDosens();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal menyimpan atribut akademik');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'nidn',
      label: 'NIDN / NUPTK / NIP',
      render: (row) => {
        let displayValue = '-';
        let label = '';

        if (row.nidn) {
          displayValue = row.nidn;
          label = 'NIDN';
        } else if (row.nuptk) {
          displayValue = row.nuptk;
          label = 'NUPTK';
        } else if (row.nip) {
          displayValue = row.nip;
          label = 'NIP';
        }

        return (
          <div>
            <span className="font-mono font-bold text-slate-900 text-xs block">
              {displayValue}
            </span>
            {label && (
              <span className="text-2xs text-slate-400 font-mono block">{label}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'nama_lengkap',
      label: 'NAMA LENGKAP & GELAR',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-sm block">{row.nama_gelar || row.nama_lengkap}</span>
          <div className="flex items-center gap-2 mt-0.5">
            {row.nip && (
              <span className="text-2xs text-slate-400 font-mono">NIP: {row.nip}</span>
            )}
            {row.agama && (
              <span className="text-2xs text-slate-500">• {row.agama}</span>
            )}
            {row.jenis_kelamin && (
              <span className="text-2xs text-slate-500">• {row.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'program_studi',
      label: 'HOMEBASE PRODI',
      render: (row) => (
        <div>
          <span className="text-xs font-medium text-slate-700 block">
            {row.program_studi?.nama || <span className="text-amber-600 italic">Belum dipetakan</span>}
          </span>
          {row.homebase_status === 'belum_terpetakan' && (
            <span className="text-2xs text-amber-600 font-bold">Perlu atur homebase</span>
          )}
        </div>
      ),
    },
    {
      key: 'jabatan_akademik',
      label: 'JABATAN AKADEMIK',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-800">
          {row.jabatan_akademik || 'Tenaga Pendidik'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS SIMPEG',
      align: 'center',
      render: (row) => (
        <Badge variant={row.status === 'aktif' || row.is_active ? 'green' : 'gray'}>
          {row.status || (row.is_active ? 'Aktif' : 'Tidak Aktif')}
        </Badge>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Atur Homebase & Jabatan',
                icon: <Edit2 size={14} />,
                onClick: () => handleOpenModal(row),
              },
              {
                label: 'Kelola di SIMPEG →',
                icon: <Edit2 size={14} />,
                onClick: () => (window.location.href = `/simpeg/pegawai/${row.id}`),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Direktori Dosen (Live SIMPEG)"
        description="Sumber utama data kepegawaian dari SIMPEG. SIAKAD hanya melengkapi homebase prodi & jabatan akademik."
        breadcrumbs={[
          { label: 'Portal SSO', href: '/dashboard' },
          { label: 'SIAKAD', href: '/siakad' },
          { label: 'Dosen' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => (window.location.href = '/simpeg/pegawai')}
            >
              Kelola di SIMPEG
            </Button>
          </div>
        }
      />

      <div className="card p-4 flex items-center justify-between gap-3 text-xs bg-emerald-50/60 border-emerald-200 text-emerald-900">
        <div className="flex items-center gap-2.5">
          <UserCheck className="text-emerald-600 shrink-0" size={18} />
          <span>
            <strong>Live dari SIMPEG:</strong> tambah/nonaktif dosen dilakukan di SIMPEG dan otomatis tampil di sini. Tombol aksi hanya mengatur Homebase Prodi & Jabatan Akademik (atribut SIAKAD).
          </span>
        </div>
      </div>

      {/* Pencarian langsung ala Biodata — 1 baris, tidak menumpuk semua data */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <Input
            label="Cari Dosen (NIDN / NIP / Nama)"
            placeholder="Ketik NIDN atau nama... (otomatis mencari)"
            prefixIcon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select
            label="Homebase Prodi"
            placeholder="Semua Prodi"
            options={prodis.map((p) => ({ value: p.id, label: p.nama }))}
            value={filterProdi || ''}
            onChange={(v: any) => {
              setFilterProdi(String(v || ''));
              setPage(1);
            }}
            isClearable
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={pageData}
        isLoading={loading}
        meta={meta}
        onPageChange={setPage}
        emptyMessage="Tidak ada dosen ditemukan. Coba kata kunci lain."
      />

      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Dosen"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterJabatan('');
                setPage(1);
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowFilter(false)}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <div>
            <label className="label">Jabatan Fungsional Akademik</label>
            <select
              value={filterJabatan}
              onChange={(e) => {
                setFilterJabatan(e.target.value);
                setPage(1);
              }}
              className="select w-full"
            >
              <option value="">Semua Jabatan</option>
              <option value="Tenaga Pengajar">Tenaga Pengajar</option>
              <option value="Asisten Ahli">Asisten Ahli</option>
              <option value="Lektor">Lektor</option>
              <option value="Lektor Kepala">Lektor Kepala</option>
              <option value="Guru Besar">Guru Besar (Profesor)</option>
            </select>
          </div>
        </div>
      </Drawer>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Atur Homebase & Jabatan Akademik"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Atribut'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 p-3 bg-slate-50 border rounded-xl text-xs">
            <span className="text-slate-500 block">Dosen (dari SIMPEG, read-only)</span>
            <strong className="text-slate-900">{editingDosen?.nama_lengkap}</strong>
            <span className="font-mono text-2xs text-slate-500 block">NIDN: {editingDosen?.nidn || '-'} • NIP: {editingDosen?.nip || '-'}</span>
          </div>

          <div>
            <label className="label">Homebase Prodi *</label>
            <select
              value={form.program_studi_id}
              onChange={(e) => setForm({ ...form, program_studi_id: parseInt(e.target.value) })}
              className="select w-full"
            >
              {prodis.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Jabatan Akademik</label>
            <select
              value={form.jabatan_akademik}
              onChange={(e) => setForm({ ...form, jabatan_akademik: e.target.value })}
              className="select w-full"
            >
              <option value="Tenaga Pengajar">Tenaga Pengajar</option>
              <option value="Asisten Ahli">Asisten Ahli</option>
              <option value="Lektor">Lektor</option>
              <option value="Lektor Kepala">Lektor Kepala</option>
              <option value="Guru Besar">Guru Besar</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
