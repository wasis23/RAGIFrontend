'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, CheckCircle, FileText, Download, Filter, RefreshCw, CheckCircle2, Search, Home, ChevronRight, X } from 'lucide-react';
import { sikeuService } from '@/services/sikeu.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';

export default function TaxReportPage() {
  const [taxData, setTaxData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterJenis, setFilterJenis] = useState<string>('semua');
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [search, setSearch] = useState<string>('');
  const [showFilter, setShowFilter] = useState(false);

  // Temp filter states (di dalam Drawer sebelum Terapkan)
  const [tempJenis, setTempJenis] = useState<string>('semua');
  const [tempStatus, setTempStatus] = useState<string>('semua');

  const [summary, setSummary] = useState({
    total_terutang: 0,
    total_disetor: 0,
    total_keseluruhan: 0,
  });

  // Modal Setor Pajak
  const [isSetorModalOpen, setIsSetorModalOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<any | null>(null);
  const [ntpnInput, setNtpnInput] = useState('');
  const [submittingSetor, setSubmittingSetor] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getPajakList({
        search: search || undefined,
        jenis: filterJenis !== 'semua' ? filterJenis : undefined,
        status: filterStatus !== 'semua' ? filterStatus : undefined,
      });

      if (res.data) {
        setTaxData(Array.isArray(res.data) ? res.data : []);
      }
      if ((res as any).summary) {
        setSummary((res as any).summary);
      }
    } catch (e) {
      console.error('Failed to load tax records', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, [filterJenis, filterStatus]);

  const handleSetorPajak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTax || !ntpnInput.trim()) return;

    try {
      setSubmittingSetor(true);
      await sikeuService.setorPajak(selectedTax.id, { ntpn: ntpnInput.trim() });
      setFeedback(`Penyetoran Pajak ${selectedTax.nomor} dengan NTPN ${ntpnInput.trim()} berhasil dicatat.`);
      setIsSetorModalOpen(false);
      setSelectedTax(null);
      setNtpnInput('');
      fetchTaxes();
    } catch (err: any) {
      alert('Gagal mencatat penyetoran: ' + (err.message || 'Error'));
    } finally {
      setSubmittingSetor(false);
    }
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const hasActiveFilter = filterJenis !== 'semua' || filterStatus !== 'semua';

  const filteredData = taxData.filter((t) => {
    const matchSearch =
      !search ||
      t.nomor?.toLowerCase().includes(search.toLowerCase()) ||
      t.deskripsi?.toLowerCase().includes(search.toLowerCase()) ||
      t.vendor?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Standard SSO PageHeader with integrated Breadcrumbs */}
      <PageHeader
        title="Laporan & Rekapitulasi Pajak Kampus"
        description="Monitoring Pemotongan & Penyetoran Pajak PPh 21, PPh 23, dan PPN 11% Terintegrasi"
        breadcrumb={
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link href="/dashboard" className="flex items-center gap-1 hover:text-primary-600 transition">
              <Home size={13} />
              <span>SSO Dashboard</span>
            </Link>
            <ChevronRight size={12} className="text-slate-400" />
            <Link href="/sikeu" className="hover:text-primary-600 transition">SIKEU</Link>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="text-slate-800 font-semibold">Pajak &amp; Potongan</span>
          </nav>
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<Download size={16} />}
              onClick={() => window.print()}
            >
              Cetak Rekap
            </Button>
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => { setTempJenis(filterJenis); setTempStatus(filterStatus); setShowFilter(true); }}
            >
              Filter
              {hasActiveFilter && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-primary-600 text-white rounded-full">!</span>
              )}
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pajak Terutang</div>
                <div className="text-base font-extrabold text-slate-900 font-mono">{formatRupiah(summary.total_terutang)}</div>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-emerald-600" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sudah Disetor</div>
                <div className="text-base font-extrabold text-slate-900 font-mono">{formatRupiah(summary.total_disetor)}</div>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Keseluruhan</div>
                <div className="text-base font-extrabold text-slate-900 font-mono">{formatRupiah(summary.total_keseluruhan)}</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={18} /> {feedback}
        </div>
      )}

      {/* Tax Table Card */}
      <Card>
        <CardHeader>
          <div>
            <h2 className="font-bold text-slate-900">Daftar Kewajiban Pajak</h2>
            <p className="text-xs text-slate-500">
              {hasActiveFilter && (
                <span className="text-primary-600 font-semibold mr-2">Filter aktif •</span>
              )}
              {filteredData.length} rekord pajak
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search Bar with proper wrapper */}
            <div className="search-input-wrapper">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Cari no. ref, vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-sm input-icon-left input-icon-right text-xs w-56 bg-white"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="input-suffix-icon"
                  title="Hapus pencarian"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              onClick={fetchTaxes}
              disabled={loading}
              className="btn btn-ghost btn-icon btn-sm"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Memuat data pajak...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <FileText size={22} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Tidak Ada Data Pajak</h3>
              <p className="text-xs text-slate-500 mt-1">
                {hasActiveFilter ? 'Tidak ada rekord pajak yang sesuai dengan filter yang diterapkan.' : 'Belum ada kewajiban pajak yang tercatat.'}
              </p>
            </div>
          ) : (
            <div className="table-container border-0 rounded-none">
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Ref Pajak</th>
                    <th>Jenis Pajak</th>
                    <th>Uraian / Vendor</th>
                    <th className="text-right">Nominal</th>
                    <th>Batas Setor</th>
                    <th>NTPN / Bukti</th>
                    <th>Status</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((t) => (
                    <tr key={t.id}>
                      <td className="font-mono font-bold text-amber-700">{t.nomor}</td>
                      <td className="font-bold text-slate-900">{t.jenis}</td>
                      <td>
                        <div className="font-semibold text-slate-800">{t.deskripsi}</div>
                        <div className="text-[10px] text-slate-400">Vendor: {t.vendor} | NPWP: {t.npwp}</div>
                      </td>
                      <td className="text-right font-mono font-extrabold text-slate-900">{formatRupiah(t.nominal)}</td>
                      <td className="font-mono text-slate-600 text-xs">{t.jatuhTempo}</td>
                      <td className="font-mono font-bold text-indigo-700 text-xs">{t.ntpn || '-'}</td>
                      <td>
                        {t.status === 'disetor' ? (
                          <Badge variant="green" dot>Sudah Disetor</Badge>
                        ) : (
                          <Badge variant="red" dot>Terutang</Badge>
                        )}
                      </td>
                      <td className="text-right">
                        {t.status === 'terutang' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedTax(t);
                              setNtpnInput('');
                              setIsSetorModalOpen(true);
                            }}
                          >
                            Input NTPN
                          </Button>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal Input NTPN Penyetoran Pajak */}
      <Modal
        open={isSetorModalOpen && !!selectedTax}
        onClose={() => setIsSetorModalOpen(false)}
        title="Input NTPN / Bukti Penyetoran Pajak"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSetorModalOpen(false)}>Batal</Button>
            <Button variant="primary" disabled={submittingSetor} onClick={handleSetorPajak}>
              {submittingSetor ? 'Menyimpan...' : 'Simpan Bukti Setor'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {selectedTax && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div><span className="font-bold text-slate-600">No. Ref Pajak:</span> <span className="font-mono font-bold text-slate-900">{selectedTax.nomor}</span></div>
              <div><span className="font-bold text-slate-600">Jenis Pajak:</span> <span className="font-bold text-slate-900">{selectedTax.jenis}</span></div>
              <div><span className="font-bold text-slate-600">Nominal Setoran:</span> <span className="font-mono font-extrabold text-amber-700">{formatRupiah(selectedTax.nominal)}</span></div>
            </div>
          )}
          <Input
            label="Nomor Transaksi Penerimaan Negara (NTPN)"
            required
            placeholder="Masukkan kode NTPN resmi (16 karakter)..."
            value={ntpnInput}
            onChange={(e) => setNtpnInput(e.target.value)}
          />
        </div>
      </Modal>

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Pajak & Potongan"
        width="360px"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setTempJenis('semua');
                setTempStatus('semua');
                setFilterJenis('semua');
                setFilterStatus('semua');
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setFilterJenis(tempJenis);
                setFilterStatus(tempStatus);
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="form-group">
            <label className="form-label">Jenis Pajak</label>
            <select
              value={tempJenis}
              onChange={(e) => setTempJenis(e.target.value)}
              className="select w-full"
            >
              <option value="semua">Semua Jenis Pajak</option>
              <option value="pph_21">PPh 21 (Honorarium SDM)</option>
              <option value="pph_23">PPh 23 (Jasa Vendor)</option>
              <option value="ppn_11">PPN 11% (Barang/Jasa)</option>
            </select>
            {tempJenis !== 'semua' && (
              <p className="text-xs text-primary-600 font-semibold mt-1">
                ✓ Filter aktif: <strong>{tempJenis.replace('_', ' ').toUpperCase()}</strong>
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Status Penyetoran</label>
            <select
              value={tempStatus}
              onChange={(e) => setTempStatus(e.target.value)}
              className="select w-full"
            >
              <option value="semua">Semua Status</option>
              <option value="terutang">Terutang (Belum Setor)</option>
              <option value="disetor">Sudah Disetor (Ada NTPN)</option>
            </select>
            {tempStatus !== 'semua' && (
              <p className="text-xs text-primary-600 font-semibold mt-1">
                ✓ Filter aktif: <strong>{tempStatus}</strong>
              </p>
            )}
          </div>

          <hr className="border-t border-slate-200" />

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold">Catatan:</span> Filter akan diterapkan ke data pajak setelah klik &quot;Terapkan&quot;.
          </div>
        </div>
      </Drawer>
    </div>
  );
}
