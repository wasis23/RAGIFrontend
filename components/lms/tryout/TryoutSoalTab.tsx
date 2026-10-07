'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { lmsService } from '@/services/lms.service';
import { siakadService } from '@/services/siakad.service';
import { Plus, Trash2, Lock } from 'lucide-react';
import { extractOptionValue } from './tryoutHelpers';

interface TryoutSoalTabProps {
  quizId: number;
  soal: any[];
  totalSoal: number;
  totalPoin: number;
  totalAttempt: number;
  onChanged: () => void;
}

export default function TryoutSoalTab({ quizId, soal, totalSoal, totalPoin, totalAttempt, onChanged }: TryoutSoalTabProps) {
  const [selectedBankSoal, setSelectedBankSoal] = useState<string>('');
  const [poinSoal, setPoinSoal] = useState<number>(10);
  const [attaching, setAttaching] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ isOpen: boolean; id: number | null }>({
    isOpen: false,
    id: null,
  });
  const [deleting, setDeleting] = useState(false);

  const locked = totalAttempt > 0;

  const handleAttach = async () => {
    if (!selectedBankSoal) return;
    setAttaching(true);
    try {
      await lmsService.attachQuizSoal(quizId, { bank_soal_id: Number(selectedBankSoal), poin: poinSoal });
      toast.success('Soal berhasil dilampirkan');
      setSelectedBankSoal('');
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.errors?.bank_soal_id?.[0] || err.response?.data?.message || 'Gagal melampirkan soal');
    } finally {
      setAttaching(false);
    }
  };

  const handleDetach = async () => {
    if (!deleteTarget.id) return;
    setDeleting(true);
    try {
      await lmsService.detachQuizSoal(deleteTarget.id);
      toast.success('Soal dilepas dari tryout');
      setDeleteTarget({ isOpen: false, id: null });
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.errors?.quiz?.[0] || 'Gagal melepas soal (tryout terkunci attempt?)');
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'urutan',
      label: 'NO',
      align: 'center',
      render: (s) => <span className="text-xs font-bold text-slate-700">{s.urutan ?? '-'}</span>,
    },
    {
      key: 'soal',
      label: 'SOAL',
      render: (s) => (
        <div>
          <span className="text-xs text-slate-800 block line-clamp-2">{s.bank_soal?.pertanyaan || '-'}</span>
          {s.bank_soal?.gambar_path ? <span className="text-2xs text-slate-400">+ gambar</span> : null}
        </div>
      ),
    },
    {
      key: 'tipe',
      label: 'TIPE',
      align: 'center',
      render: (s) => <Badge variant="gray">{s.bank_soal?.tipe_soal || '-'}</Badge>,
    },
    {
      key: 'poin',
      label: 'POIN',
      align: 'center',
      render: (s) => <span className="text-xs font-bold text-slate-800">{s.poin}</span>,
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'right',
      render: (s) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: 'Lepas',
                icon: <Trash2 size={16} />,
                onClick: () => setDeleteTarget({ isOpen: true, id: s.id }),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Daftar Soal ({totalSoal} soal, {Number(totalPoin || 0)} poin)
          </h5>
          {locked && (
            <Badge variant="yellow">
              <Lock size={12} /> Terkunci — {totalAttempt} attempt sudah masuk
            </Badge>
          )}
        </div>
        {locked && (
          <p className="text-2xs text-slate-500">
            Tryout sudah memiliki attempt mahasiswa — perubahan soal dapat ditolak backend.
          </p>
        )}
      </Card>

      <Card className="p-4 space-y-4">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">Lampirkan dari Bank Soal</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <AsyncSelect
              label="Soal Bank Soal"
              placeholder="Cari soal bank soal..."
              value={selectedBankSoal}
              onChange={(val) => setSelectedBankSoal(extractOptionValue(val))}
              loadOptions={async (input) => {
                try {
                  const res: any = await siakadService.getSoalList({ search: input, per_page: 20 } as any);
                  const items = Array.isArray(res.data) ? res.data : res.data?.data || [];
                  return items.map((s: any) => ({
                    value: String(s.id),
                    label: `[${s.tipe_soal}] ${(s.pertanyaan || '').slice(0, 80)}`,
                  }));
                } catch {
                  return [];
                }
              }}
              isClearable
            />
            <a href="/lms/bank-soal/create" className="text-2xs mt-1 inline-block" style={{ color: 'var(--module-primary)' }}>Buat soal baru →</a>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input type="number" label="Poin" min={1} value={poinSoal} onChange={(e) => setPoinSoal(Number(e.target.value))} />
            </div>
            <Button size="sm" icon={<Plus size={16} />} onClick={handleAttach} loading={attaching} disabled={!selectedBankSoal || attaching}>
              Tambah
            </Button>
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={soal}
        meta={{ current_page: 1, last_page: 1, per_page: soal.length || 50, total: totalSoal }}
        onPageChange={() => {}}
        emptyMessage="Belum ada soal. Lampirkan dari bank soal di atas."
      />

      <ConfirmDialog
        isOpen={deleteTarget.isOpen}
        onClose={() => setDeleteTarget({ isOpen: false, id: null })}
        onConfirm={handleDetach}
        isLoading={deleting}
        title="Lepas Soal"
        message={<span>Yakin melepas soal ini dari tryout?</span>}
        confirmText="Lepas"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
