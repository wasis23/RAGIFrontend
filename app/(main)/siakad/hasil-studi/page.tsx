'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Award, BookOpen, Target, Filter, Printer, Eye, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { siakadService } from '@/services/siakad.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

type SubTab = 'khs' | 'transkrip' | 'portofolio';

export default function HasilStudiPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const userRoles = user?.roles?.map((r: any) => (typeof r === 'string' ? r : r.slug)) || [];
  const isMahasiswa = userRoles.includes('mahasiswa');

  const [subTab, setSubTab] = useState<SubTab>('khs');
  const [tahunAkademiks, setTahunAkademiks] = useState<any[]>([]);
  const [selectedTaId, setSelectedTaId] = useState<number | null>(null);

  // Direktori (admin/dosen)
  const [directory, setDirectory] = useState<any[]>([]);
  const [selectedMhs, setSelectedMhs] = useState<any | null>(null);
  const [loadingDir, setLoadingDir] = useState(false);
  const [searchMhs, setSearchMhs] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [prodis, setProdis] = useState<any[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  // Data detail
  const [nilaiList, setNilaiList] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loadingNilai, setLoadingNilai] = useState(false);
  const [transkrip, setTranskrip] = useState<any | null>(null);
  const [loadingTrx, setLoadingTrx] = useState(false);
  const [porto, setPorto] = useState<any | null>(null);
  const [loadingPorto, setLoadingPorto] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const activeMhsId = isMahasiswa ? undefined : selectedMhs?.id;

  useEffect(() => {
    siakadService.getTahunAkademiks().then((res) => {
      if (res.data?.length) {
        setTahunAkademiks(res.data);
        const aktif = res.data.find((t: any) => t.is_active) || res.data[0];
        setSelectedTaId(aktif.id);
      }
    });
    siakadService.getProdi().then((res) => res.data && setProdis(res.data));
  }, []);

  useEffect(() => {
    if (!isMahasiswa && !selectedMhs) fetchDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchMhs, filterProdi, selectedMhs]);

  useEffect(() => {
    if (isMahasiswa || selectedMhs) {
      fetchNilai();
      fetchTranskrip();
      fetchPorto();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaId, selectedMhs]);

  const fetchDirectory = async () => {
    try {
      setLoadingDir(true);
      const res = await siakadService.getMahasiswas({
        search: searchMhs || undefined,
        program_studi_id: filterProdi || undefined,
        per_page: 15,
      });
      if (res.data) setDirectory(res.data);
    } finally {
      setLoadingDir(false);
    }
  };

  const fetchNilai = async () => {
    try {
      setLoadingNilai(true);
      const res = await siakadService.getNilai({
        tahun_akademik_id: selectedTaId || undefined,
        mahasiswa_id: activeMhsId,
      });
      if (res.data) setNilaiList(res.data);
      if ((res as any).summary) {
        setSummary((res as any).summary);
        if (!selectedMhs && (res as any).summary?.mahasiswa) setSelectedMhs((res as any).summary.mahasiswa);
      }
    } catch {
      toast.error('Gagal memuat KHS semester');
    } finally {
      setLoadingNilai(false);
    }
  };

  const fetchTranskrip = async () => {
    try {
      setLoadingTrx(true);
      const res = await siakadService.getTranskrip(activeMhsId ? { mahasiswa_id: activeMhsId } : undefined);
      if (res.data) {
        setTranskrip(res.data);
        if (!selectedMhs && res.data?.mahasiswa) setSelectedMhs(res.data.mahasiswa);
      }
    } catch {
      toast.error('Gagal memuat transkrip');
    } finally {
      setLoadingTrx(false);
    }
  };

  const fetchPorto = async () => {
    try {
      setLoadingPorto(true);
      const res = await siakadService.getMahasiswaPortofolioObe(activeMhsId);
      if (res.data) setPorto(res.data);
    } catch {
      setPorto(null);
    } finally {
      setLoadingPorto(false);
    }
  };

  const mhs = summary?.mahasiswa || transkrip?.mahasiswa || porto?.mahasiswa || selectedMhs;
  const selectedTa = tahunAkademiks.find((t) => t.id === selectedTaId);

  const dirColumns: ColumnDef<any>[] = [
    {
      key: 'nim',
      label: 'NIM & NAMA',
      render: (m) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{m.nama_lengkap}</span>
          <span className="font-mono text-2xs text-slate-500">{m.nim}</span>
        </div>
      ),
    },
    {
      key: 'prodi',
      label: 'PROGRAM STUDI',
      render: (m) => <span className="text-xs text-slate-700">{m.program_studi?.nama || '-'}</span>,
    },
    {
      key: 'ipk',
      label: 'IPK',
      align: 'center',
      render: (m) => <span className="font-mono font-bold text-xs">{Number(m.ipk || 0).toFixed(2)}</span>,
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (m) => (
        <Button variant="primary" className="text-2xs py-1.5 px-3 h-auto font-bold" icon={<Eye size={13} />} onClick={() => setSelectedMhs(m)}>
          Buka Hasil Studi →
        </Button>
      ),
    },
  ];

  const khsColumns: ColumnDef<any>[] = [
    {
      key: 'mk',
      label: 'KODE & MATA KULIAH',
      render: (row) => {
        const mk = row.krs_detail?.kelas?.mata_kuliah;
        return (
          <div>
            <span className="font-bold text-slate-900 block text-xs">{mk?.nama || 'Mata Kuliah'}</span>
            <span className="font-mono text-2xs text-slate-400">{mk?.kode_mk || 'MK'}</span>
          </div>
        );
      },
    },
    {
      key: 'sks',
      label: 'SKS',
      align: 'center',
      render: (row) => <span className="font-mono font-bold text-xs">{row.krs_detail?.kelas?.mata_kuliah?.total_sks || 0}</span>,
    },
    {
      key: 'angka',
      label: 'ANGKA',
      align: 'center',
      render: (row) => <span className="font-mono font-black text-xs">{Number(row.nilai_akhir || 0).toFixed(2)}</span>,
    },
    {
      key: 'huruf',
      label: 'HURUF',
      align: 'center',
      render: (row) => <Badge variant={row.nilai_huruf === 'A' || row.nilai_huruf === 'A-' ? 'green' : row.nilai_huruf?.startsWith('B') ? 'blue' : 'amber'}>{row.nilai_huruf || '-'}</Badge>,
    },
    {
      key: 'mutu',
      label: 'MUTU',
      align: 'center',
      render: (row) => <span className="font-mono font-bold text-emerald-700 text-xs">{Number(row.bobot_mutu || 0).toFixed(2)}</span>,
    },
    {
      key: 'kxm',
      label: 'SKS × MUTU',
      align: 'center',
      render: (row) => {
        const sks = row.krs_detail?.kelas?.mata_kuliah?.total_sks || 0;
        return <span className="font-mono font-black text-xs">{(Number(row.bobot_mutu || 0) * sks).toFixed(2)}</span>;
      },
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      render: (row) => (
        <Badge variant={row.is_final ? 'green' : 'gray'} className="text-2xs font-bold">
          {row.is_final ? 'Final' : 'Draft'}
        </Badge>
      ),
    },
  ];

  // KHS = nilai FINAL periode ini saja; IPS/SKS dihitung live dari baris tampil
  // agar angka tabel selalu cocok dengan ringkasan (draft tidak ikut hitung).
  const khsFinalRows = nilaiList.filter((n: any) => n.is_final);
  const khsDraftCount = nilaiList.length - khsFinalRows.length;
  const khsLive = khsFinalRows.reduce(
    (acc: any, n: any) => {
      const sks = Number(n.krs_detail?.kelas?.mata_kuliah?.total_sks || 0);
      acc.sks += sks;
      acc.mutu += Number(n.bobot_mutu || 0) * sks;
      return acc;
    },
    { sks: 0, mutu: 0 }
  );
  const khsLiveIps = khsLive.sks > 0 ? khsLive.mutu / khsLive.sks : 0;

  const trxColumns: ColumnDef<any>[] = [
    {
      key: 'mk',
      label: 'KODE & MATA KULIAH',
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{item.nama_mk}</span>
          <span className="font-mono text-2xs text-slate-400">{item.kode_mk}</span>
        </div>
      ),
    },
    {
      key: 'smt',
      label: 'SEMESTER',
      render: (item) => (
        <Badge variant={item.is_transfer ? 'purple' : 'blue'} className="text-2xs font-bold">{item.semester_label}</Badge>
      ),
    },
    {
      key: 'sks',
      label: 'SKS',
      align: 'center',
      render: (item) => <span className="font-mono font-bold text-xs">{item.sks}</span>,
    },
    {
      key: 'huruf',
      label: 'NILAI',
      align: 'center',
      render: (item) => <Badge variant="green">{item.nilai_huruf}</Badge>,
    },
    {
      key: 'kxm',
      label: 'SKS × MUTU',
      align: 'center',
      render: (item) => <span className="font-mono font-black text-xs">{Number(item.mutu_x_sks).toFixed(2)}</span>,
    },
  ];

  const portoMkColumns: ColumnDef<any>[] = [
    {
      key: 'mk',
      label: 'MATA KULIAH & SEMESTER',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{row.nama_mk}</span>
          <span className="text-2xs text-slate-500">{row.kode_mk} • {row.semester_label} • {row.sks} SKS</span>
        </div>
      ),
    },
    {
      key: 'nilai',
      label: 'NILAI',
      align: 'center',
      render: (row) => (
        <span className="font-mono font-bold text-xs">{row.nilai_huruf || '-'} ({row.nilai_akhir != null ? Number(row.nilai_akhir).toFixed(1) : '-'})</span>
      ),
    },
    {
      key: 'cpmk',
      label: 'CAPAIAN CPMK',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.cpmk_scores || []).length === 0 && <span className="text-2xs text-slate-400 italic">Belum dinilai</span>}
          {(row.cpmk_scores || []).map((c: any) => (
            <span key={c.cpmk_id} className={`text-2xs font-bold px-2 py-0.5 rounded border ${c.is_tercapai ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
              {c.kode_cpmk}: {Number(c.skor).toFixed(1)}
            </span>
          ))}
        </div>
      ),
    },
  ];

  const tabBtn = (key: SubTab, label: string, icon: React.ReactNode) => (
    <button
      key={key}
      onClick={() => setSubTab(key)}
      className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 transition -mb-px cursor-pointer ${
        subTab === key ? 'border-primary-600 text-primary-600 bg-primary-50/40 rounded-t-xl' : 'border-transparent text-slate-500 hover:text-slate-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={isMahasiswa ? 'Hasil Studi Saya' : 'Hasil Studi Mahasiswa'}
        description="KHS per semester, transkrip kumulatif, dan portofolio capaian CPL/CPMK dalam satu profil mahasiswa."
        breadcrumbs={[{ label: 'Portal SSO', href: '/dashboard' }, { label: 'SIAKAD', href: '/siakad' }, { label: 'Hasil Studi' }]}
        action={
          <div className="flex items-center gap-2">
            {!isMahasiswa && !selectedMhs && (
              <Button variant="outline" icon={<Filter size={15} />} className="font-bold text-xs min-h-[38px]" onClick={() => setShowFilter(true)}>
                Filter
              </Button>
            )}
            {!isMahasiswa && selectedMhs && (
              <Button variant="outline" icon={<ArrowLeft size={15} />} className="font-bold text-xs min-h-[38px]" onClick={() => { setSelectedMhs(null); setNilaiList([]); setTranskrip(null); setPorto(null); }}>
                Ganti Mahasiswa
              </Button>
            )}
            {(isMahasiswa || selectedMhs) && (
              <Button variant="primary" icon={<Printer size={15} />} className="font-bold text-xs min-h-[38px]" onClick={() => setIsPrintOpen(true)}>
                Cetak
              </Button>
            )}
          </div>
        }
      />

      {!isMahasiswa && !selectedMhs ? (
        <div className="space-y-4">
          <DataTable columns={dirColumns} data={directory} isLoading={loadingDir} emptyMessage="Pilih mahasiswa untuk melihat hasil studinya." />
          <Drawer open={showFilter} onClose={() => setShowFilter(false)} title="Filter Mahasiswa">
            <div className="flex flex-col gap-5">
              <Input label="Pencarian" placeholder="Cari NIM / nama..." value={searchMhs} onChange={(e) => setSearchMhs(e.target.value)} />
              <Select label="Program Studi" placeholder="Semua Prodi" options={prodis.map((p) => ({ value: p.id, label: p.nama }))} value={filterProdi || ''} onChange={(v: any) => setFilterProdi(String(v || ''))} isClearable />
            </div>
          </Drawer>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-primary-900 text-white rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="badge badge-yellow text-2xs font-bold uppercase">Profil Hasil Studi</span>
              <h2 className="text-lg font-black mt-1">{mhs?.nama_lengkap} <span className="font-mono text-sm font-bold text-primary-200">({mhs?.nim})</span></h2>
              <p className="text-xs text-primary-200">{mhs?.program_studi?.nama} • Angkatan {mhs?.angkatan || '-'} • IPK {Number(summary?.ipk ?? transkrip?.ringkasan?.ipk ?? mhs?.ipk ?? 0).toFixed(2)}</p>
            </div>
            <Select
              label=""
              placeholder="Periode KHS..."
              options={tahunAkademiks.map((t) => ({ value: t.id, label: `${t.nama}${t.is_active ? ' — Aktif' : ''}` }))}
              value={selectedTaId || ''}
              onChange={(v: any) => setSelectedTaId(Number(v))}
            />
          </div>

          <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
            {tabBtn('khs', `KHS Semester${selectedTa ? ` (${selectedTa.nama})` : ''}`, <BookOpen size={16} />)}
            {tabBtn('transkrip', 'Transkrip Kumulatif', <Award size={16} />)}
            {tabBtn('portofolio', 'Portofolio Capaian (CPL/CPMK)', <Target size={16} />)}
          </div>

          {subTab === 'khs' && (
            <div className="space-y-4">
              {khsDraftCount > 0 && (
                <p className="text-2xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  {khsDraftCount} nilai masih Draft (belum dipublikasikan dosen) dan tidak ikut hitung IPS.
                </p>
              )}
              <DataTable columns={khsColumns} data={khsFinalRows} isLoading={loadingNilai} emptyMessage="Belum ada nilai final pada semester ini." />
              <div className="bg-white border rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-600">Total SKS Semester (final): <strong className="font-mono">{khsLive.sks} SKS</strong> dari {khsFinalRows.length} MK</span>
                <span className="text-xs font-bold">IPS {selectedTa ? `(${selectedTa.nama})` : ''}: <strong className="font-mono text-primary-700 bg-primary-50 px-4 py-1.5 rounded-xl border">{khsLiveIps.toFixed(2)}</strong></span>
              </div>
            </div>
          )}

          {subTab === 'transkrip' && (
            <div className="space-y-4">
              <DataTable columns={trxColumns} data={transkrip?.items || []} isLoading={loadingTrx} emptyMessage="Belum ada transkrip." />
              {transkrip?.ringkasan && (
                <div className="bg-white border rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs text-slate-600">SKS Lulus: <strong className="font-mono">{transkrip.ringkasan.total_sks_lulus}</strong> • {transkrip.ringkasan.predikat}</span>
                  <span className="text-xs font-bold">IPK: <strong className="font-mono text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-xl border">{transkrip.ringkasan.ipk}</strong></span>
                </div>
              )}
            </div>
          )}

          {subTab === 'portofolio' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(porto?.cpl_summary || []).map((cpl: any) => {
                  const score = Number(cpl.skor_rata_rata || 0);
                  return (
                    <div key={cpl.cpl_id} className="bg-white border rounded-2xl p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="badge badge-purple font-mono font-black text-xs">{cpl.kode_cpl}</span>
                        <span className="text-sm font-black font-mono text-primary-700">{score}%</span>
                      </div>
                      <p className="text-xs text-slate-700">{cpl.deskripsi}</p>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${score >= 65 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, score)}%` }} />
                      </div>
                      <p className="text-2xs text-slate-500">Status: <strong>{cpl.status}</strong> • Diukur pada {cpl.total_mata_kuliah_diukur || 0} MK</p>
                    </div>
                  );
                })}
              </div>
              <div className="bg-white border rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-extrabold">Rincian MK & Capaian CPMK per Semester</h3>
                <DataTable columns={portoMkColumns} data={porto?.mk_details || []} isLoading={loadingPorto} emptyMessage="Belum ada MK yang dinilai." />
              </div>
            </div>
          )}
        </div>
      )}

      {isPrintOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 print:p-0 print:static print:bg-white">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 max-h-[95vh] overflow-y-auto space-y-4 print:max-w-none print:shadow-none print:max-h-none">
            <div className="flex items-center justify-between border-b pb-3 print:hidden">
              <span className="text-xs font-bold">Cetak Hasil Studi — {mhs?.nama_lengkap} ({mhs?.nim})</span>
              <div className="flex gap-2">
                <Button variant="primary" icon={<Printer size={15} />} className="text-xs font-bold" onClick={() => window.print()}>Cetak (PDF)</Button>
                <Button variant="outline" className="text-xs" onClick={() => setIsPrintOpen(false)}>Tutup</Button>
              </div>
            </div>
            <div className="space-y-4 text-xs text-slate-900">
              <h2 className="font-black uppercase">Transkrip Akademik — {mhs?.program_studi?.nama}</h2>
              <p>Nama: <strong>{mhs?.nama_lengkap}</strong> • NIM: <strong className="font-mono">{mhs?.nim}</strong> • IPK: <strong className="font-mono">{transkrip?.ringkasan?.ipk}</strong> • SKS Lulus: <strong>{transkrip?.ringkasan?.total_sks_lulus}</strong></p>
              <table className="w-full text-left border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300">
                  <tr><th className="py-2 px-3">Kode</th><th className="py-2 px-3">Mata Kuliah</th><th className="py-2 px-3 text-center">SKS</th><th className="py-2 px-3 text-center">Nilai</th><th className="py-2 px-3 text-center">SKS×Mutu</th></tr>
                </thead>
                <tbody className="divide-y">
                  {(transkrip?.items || []).map((it: any, i: number) => (
                    <tr key={i}><td className="py-1.5 px-3 font-mono">{it.kode_mk}</td><td className="py-1.5 px-3">{it.nama_mk}</td><td className="py-1.5 px-3 text-center">{it.sks}</td><td className="py-1.5 px-3 text-center font-bold">{it.nilai_huruf}</td><td className="py-1.5 px-3 text-center font-mono">{Number(it.mutu_x_sks).toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
