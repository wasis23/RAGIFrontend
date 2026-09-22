'use client';

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Landmark, RefreshCw } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { SectionTitle } from '../atoms/SectionTitle';
import { sikeuService } from '@/services/sikeu.service';

interface RekeningRow {
  id: number;
  nama_kas: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  status: boolean;
}

const emptyForm = { nama_kas: '', bank_name: 'BNI', bank_account_number: '', bank_account_name: '', status: true };

export const RekeningManualSection: React.FC = () => {
  const [rows, setRows] = useState<RekeningRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RekeningRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<RekeningRow | null>(null);
  const [removing, setRemoving] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sikeuService.getUnitKasList();
      const list = (Array.isArray(res.data) ? res.data : []).filter(
        (u: any) => u.kanal === 'bank_manual'
      );
      setRows(list);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat rekening manual.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (row: RekeningRow) => {
    setEditing(row);
    setForm({
      nama_kas: row.nama_kas || '',
      bank_name: row.bank_name || 'BNI',
      bank_account_number: row.bank_account_number || '',
      bank_account_name: row.bank_account_name || '',
      status: !!row.status,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nama_kas.trim()) {
      toast.error('Nama kas wajib diisi.');
      return;
    }
    if (!['BNI', 'BSN'].includes(form.bank_name)) {
      toast.error('Bank hanya BNI atau BSN.');
      return;
    }
    if (!form.bank_account_number.trim() || !form.bank_account_name.trim()) {
      toast.error('Nomor rekening dan atas nama wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nama_kas: form.nama_kas.trim(),
        kanal: 'bank_manual',
        bank_name: form.bank_name,
        bank_account_number: form.bank_account_number.trim(),
        bank_account_name: form.bank_account_name.trim(),
        status: form.status,
      };
      if (editing) {
        await sikeuService.updateUnitKas(editing.id, payload);
        toast.success('Rekening manual diperbarui.');
      } else {
        await sikeuService.storeUnitKas(payload);
        toast.success('Rekening manual ditambahkan.');
      }
      setShowForm(false);
      fetchRows();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan rekening.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setRemoving(true);
    try {
      await sikeuService.deleteUnitKas(deleting.id);
      toast.success('Rekening manual dihapus.');
      setDeleting(null);
      fetchRows();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus rekening.');
    } finally {
      setRemoving(false);
    }
  };

  const columns: ColumnDef<RekeningRow>[] = [
    {
      key: 'bank',
      label: 'Bank',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 font-extrabold text-xs text-slate-900">
          <Landmark size={14} className="text-indigo-600" /> {row.bank_name || '-'}
        </span>
      ),
    },
    {
      key: 'rekening',
      label: 'Nomor / Atas Nama',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-xs text-slate-900">{row.bank_account_number || '-'}</span>
          <span className="text-2xs text-slate-500 block">a.n. {row.bank_account_name || '-'}</span>
          <span className="text-2xs text-slate-400 block">{row.nama_kas}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Tampil ke Mhs',
      render: (row) => (
        <span className={`badge font-bold text-2xs ${row.status ? 'badge-green' : 'badge-gray'}`}>
          {row.status ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors"
            title="Ubah rekening"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => setDeleting(row)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
            title="Hapus rekening"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-xl space-y-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          number="2"
          title="REKENING MANUAL TRANSFER (BNI / BSN)"
          description="Daftar rekening yang tampil ke mahasiswa. Bisa lebih dari 1 bank; nonaktifkan bila sementara tidak dipakai."
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={fetchRows}
            className="text-xs font-bold"
          >
            Muat Ulang
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={openAdd}
            className="text-xs font-bold"
          >
            Tambah Rekening
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={loading}
        emptyMessage="Belum ada rekening manual. Tambahkan BNI / BSN agar mahasiswa bisa transfer manual."
      />

      <Modal
        isOpen={showForm}
        onClose={() => !saving && setShowForm(false)}
        title={editing ? 'Ubah Rekening Manual' : 'Tambah Rekening Manual'}
      >
        <div className="space-y-4">
          <Input
            label="Nama Kas *"
            placeholder="Contoh: Rekening BNI Kampus"
            value={form.nama_kas}
            onChange={(e) => setForm((p) => ({ ...p, nama_kas: e.target.value }))}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Bank *"
              options={[
                { value: 'BNI', label: 'BNI' },
                { value: 'BSN', label: 'BSN (BTN Syariah)' },
              ]}
              value={form.bank_name}
              onChange={(val) => setForm((p) => ({ ...p, bank_name: String(val || 'BNI') }))}
            />
            <Input
              label="Nomor Rekening *"
              placeholder="Contoh: 1234567890"
              value={form.bank_account_number}
              onChange={(e) => setForm((p) => ({ ...p, bank_account_number: e.target.value }))}
              className="font-mono"
            />
          </div>
          <Input
            label="Atas Nama Rekening *"
            placeholder="Contoh: Universitas SSO Campus"
            value={form.bank_account_name}
            onChange={(e) => setForm((p) => ({ ...p, bank_account_name: e.target.value }))}
          />
          <ToggleSwitch
            id="rekening-manual-status"
            checked={form.status}
            onChange={(val) => setForm((p) => ({ ...p, status: val }))}
            label="Tampilkan ke mahasiswa"
            description="Nonaktif = disembunyikan dari pilihan transfer manual"
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} disabled={saving}>
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} className="font-bold">
              {saving ? 'Menyimpan...' : 'Simpan Rekening'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => !removing && setDeleting(null)}
        onConfirm={handleDelete}
        title="Hapus Rekening Manual"
        message={`Hapus ${deleting?.bank_name} ${deleting?.bank_account_number}? Mahasiswa tidak lagi melihat rekening ini.`}
        isLoading={removing}
      />
    </div>
  );
};
