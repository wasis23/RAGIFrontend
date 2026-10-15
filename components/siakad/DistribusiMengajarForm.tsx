'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { siakadService } from '@/services/siakad.service';

/** Nilai tetap domain: semester akademik 1–8 (bukan entitas master). */
export const SEMESTER_OPTIONS: SelectOption[] = [
  { value: '1', label: 'Semester 1' },
  { value: '2', label: 'Semester 2' },
  { value: '3', label: 'Semester 3' },
  { value: '4', label: 'Semester 4' },
  { value: '5', label: 'Semester 5' },
  { value: '6', label: 'Semester 6' },
  { value: '7', label: 'Semester 7' },
  { value: '8', label: 'Semester 8' },
];

const toId = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export interface DosenAnggotaDetail {
  dosen_id: number;
  dosen_nama?: string;
  dosen_nidn?: string;
  dosen?: any;
  sks: number;
  kelas_ids: number[];
  kelas_list?: string[];
  master_kelas_items?: any[];
}

export const dosenAnggotaDetailSchema = z.object({
  dosen_id: z.number({ message: 'Dosen wajib dipilih' }).min(1, 'Dosen wajib dipilih'),
  dosen_nama: z.string().optional(),
  dosen_nidn: z.string().optional(),
  dosen: z.any().optional(),
  sks: z.number({ message: 'Jumlah SKS wajib diisi' }).min(1, 'Jumlah SKS minimal 1').max(16, 'Jumlah SKS maksimal 16'),
  kelas_ids: z.array(z.number()),
  kelas_list: z.array(z.string()).optional(),
  master_kelas_items: z.array(z.any()).optional(),
});

export const anggotaModalSchema = z.object({
  dosen_id: z.number({ message: 'Dosen wajib dipilih' }).min(1, 'Dosen wajib dipilih'),
  sks: z.number({ message: 'Jumlah SKS wajib diisi' }).min(1, 'Jumlah SKS minimal 1').max(16, 'Jumlah SKS maksimal 16'),
  kelas_ids: z.array(z.number()),
});

export type AnggotaModalFormValues = z.infer<typeof anggotaModalSchema>;

export const distribusiMengajarSchema = z.object({
  tahun_akademik_id: z.number().nullable().optional(),
  kurikulum_id: z.number().nullable().optional(),
  mata_kuliah_id: z.number({ message: 'Mata kuliah wajib dipilih' }).min(1, 'Mata kuliah wajib dipilih'),
  semester: z.number({ message: 'Semester wajib diisi' }).min(1, 'Semester minimal 1').max(8, 'Semester maksimal 8'),
  dosen_koordinator_id: z.number().nullable().optional(),
  dosen_anggota_ids: z.array(z.number()).optional(),
  kelas_ids: z.array(z.number()).optional(),
  dosen_anggota_details: z.array(dosenAnggotaDetailSchema).optional(),
});

export type DistribusiMengajarFormValues = z.infer<typeof distribusiMengajarSchema>;

interface DistribusiMengajarFormProps {
  defaultValues?: Partial<DistribusiMengajarFormValues> & {
    kurikulumOption?: SelectOption | null;
    mataKuliahOption?: (SelectOption & { raw?: any }) | null;
    koordinatorOption?: SelectOption | null;
    anggotaOptions?: (SelectOption & { raw?: any })[];
    kelasOptions?: SelectOption[];
    dosen_anggota_details?: DosenAnggotaDetail[];
    tahunAkademikNama?: string;
  };
  tahunAktifNama?: string;
  onSubmit: (values: DistribusiMengajarFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export const loadKurikulumOptions = async (keyword: string) => {
  const res = await siakadService.getKurikulums({ search: keyword || undefined, per_page: 50 });
  const raw = res.data;
  const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw || []);
  return list.map((k: any) => ({
    value: k.id,
    label: `${k.nama} (${k.tahun_berlaku || k.tahun_mulai || '-'})`,
  }));
};

export const loadMasterKelasOptions = async (keyword: string) => {
  try {
    const res = await siakadService.getMasterKelasList({ search: keyword || undefined, per_page: 50 });
    const raw = res.data;
    const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw || []);
    return list.map((k: any) => ({
      value: k.id,
      label: `${k.nama_kelas}${k.tahun_angkatan ? ` — Angkatan ${k.tahun_angkatan}` : ''}${k.dosen_pa ? ` (PA: ${k.dosen_pa.nama_lengkap})` : ''}`,
    }));
  } catch {
    return [];
  }
};

export const loadMataKuliahOptions = async (keyword: string, kurikulumId?: number | null) => {
  const res = await siakadService.getMataKuliahs({
    search: keyword || undefined,
    kurikulum_id: kurikulumId || undefined,
    per_page: 50,
  });
  const raw = res.data;
  const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw || []);
  return list.map((m: any) => ({
    value: m.id,
    label: `${m.kode_mk} — ${m.nama}`,
    raw: m,
  }));
};

export const loadDosenOptions = async (keyword: string) => {
  const res = await siakadService.getDosens({ search: keyword || undefined, per_page: 50, is_active: true });
  const raw = res.data;
  const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw || []);
  return list.map((d: any) => ({
    value: d.id,
    label: `${d.nama_lengkap} — NIDN ${d.nidn || d.nik || d.nip || '-'}`,
    raw: d,
  }));
};

export function DistribusiMengajarForm({
  defaultValues,
  tahunAktifNama,
  onSubmit,
  onCancel,
  submitLabel = 'Simpan',
}: DistribusiMengajarFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DistribusiMengajarFormValues>({
    resolver: zodResolver(distribusiMengajarSchema),
    defaultValues: {
      tahun_akademik_id: null,
      kurikulum_id: null,
      mata_kuliah_id: 0,
      semester: 1,
      dosen_koordinator_id: null,
      dosen_anggota_ids: [],
      kelas_ids: [],
      dosen_anggota_details: [],
      ...defaultValues,
    },
  });

  const [selectedMk, setSelectedMk] = useState<any | null>(
    (defaultValues?.mataKuliahOption as any)?.raw || null
  );

  // List of dosen anggota details for editable table
  const [details, setDetails] = useState<DosenAnggotaDetail[]>(
    defaultValues?.dosen_anggota_details || []
  );

  // Modal State & Form for Tambah / Edit Dosen Anggota
  const [modalOpen, setModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [modalDosenOption, setModalDosenOption] = useState<any | null>(null);
  const [modalKelasOptions, setModalKelasOptions] = useState<SelectOption[]>([]);
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);

  const modalForm = useForm<AnggotaModalFormValues>({
    resolver: zodResolver(anggotaModalSchema),
    defaultValues: {
      dosen_id: 0,
      sks: 1,
      kelas_ids: [],
    },
  });

  useEffect(() => {
    if (defaultValues?.mataKuliahOption) {
      setSelectedMk((defaultValues.mataKuliahOption as any).raw || null);
    }
  }, [defaultValues?.mataKuliahOption]);

  useEffect(() => {
    if (defaultValues?.dosen_anggota_details && defaultValues.dosen_anggota_details.length > 0) {
      setDetails(defaultValues.dosen_anggota_details);
    } else if (defaultValues?.anggotaOptions && defaultValues.anggotaOptions.length > 0) {
      const syn: DosenAnggotaDetail[] = defaultValues.anggotaOptions.map((opt) => ({
        dosen_id: Number(opt.value),
        dosen_nama: (opt as any)?.raw?.nama_lengkap || opt.label.split(' — ')[0],
        dosen_nidn: (opt as any)?.raw?.nidn || '',
        dosen: (opt as any)?.raw || null,
        sks: selectedMk?.total_sks || 1,
        kelas_ids: defaultValues?.kelas_ids || [],
        kelas_list: defaultValues?.kelasOptions?.map((k) => k.label.split(' — ')[0]) || [],
      }));
      setDetails(syn);
    }
  }, [
    defaultValues?.dosen_anggota_details,
    defaultValues?.anggotaOptions,
    defaultValues?.kelasOptions,
    defaultValues?.kelas_ids,
    selectedMk?.total_sks,
  ]);

  // Cascading: daftar MK difilter berdasarkan kurikulum yang dipilih.
  const selectedKurikulumId = watch('kurikulum_id');
  const prevKurikulumRef = useRef<number | null | undefined>(defaultValues?.kurikulum_id ?? null);

  useEffect(() => {
    // Jika kurikulum berubah dari pilihan sebelumnya, reset mata_kuliah_id
    if (prevKurikulumRef.current !== undefined && prevKurikulumRef.current !== selectedKurikulumId) {
      setValue('mata_kuliah_id', 0);
      setSelectedMk(null);
    }
    prevKurikulumRef.current = selectedKurikulumId;
  }, [selectedKurikulumId, setValue]);

  const handleOpenAddModal = () => {
    setEditIndex(null);
    setModalDosenOption(null);
    setModalKelasOptions([]);
    const defaultSks = selectedMk?.total_sks ? Number(selectedMk.total_sks) : 1;
    modalForm.reset({
      dosen_id: 0,
      sks: defaultSks > 0 ? defaultSks : 1,
      kelas_ids: [],
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (idx: number) => {
    const item = details[idx];
    if (!item) return;
    setEditIndex(idx);
    setModalDosenOption({
      value: item.dosen_id,
      label: item.dosen?.nama_lengkap || item.dosen_nama
        ? `${item.dosen?.nama_lengkap || item.dosen_nama}${item.dosen?.nidn || item.dosen_nidn ? ` — NIDN ${item.dosen?.nidn || item.dosen_nidn}` : ''}`
        : `Dosen ID ${item.dosen_id}`,
      raw: item.dosen,
    });
    setModalKelasOptions(
      (item.kelas_ids || []).map((kid, kIdx) => ({
        value: kid,
        label: item.kelas_list?.[kIdx] || `Kelas ID ${kid}`,
      }))
    );
    modalForm.reset({
      dosen_id: item.dosen_id,
      sks: item.sks || (selectedMk?.total_sks ? Number(selectedMk.total_sks) : 1),
      kelas_ids: item.kelas_ids || [],
    });
    setModalOpen(true);
  };

  const handleDeleteMember = (idx: number) => {
    const next = details.filter((_, i) => i !== idx);
    setDetails(next);
    setValue('dosen_anggota_details', next);
    setValue('dosen_anggota_ids', next.map((d) => d.dosen_id));
  };

  const handleSaveMember = (values: AnggotaModalFormValues) => {
    const dosenId = values.dosen_id;
    if (editIndex === null && details.some((d) => d.dosen_id === dosenId)) {
      modalForm.setError('dosen_id', {
        type: 'manual',
        message: 'Dosen ini sudah ada dalam daftar anggota',
      });
      return;
    }

    const kIds = values.kelas_ids || [];
    const kNames = modalKelasOptions.map((k) => k.label.split(' — ')[0].trim());

    const newItem: DosenAnggotaDetail = {
      dosen_id: dosenId,
      dosen_nama: modalDosenOption?.raw?.nama_lengkap || modalDosenOption?.label?.split(' — ')[0] || `Dosen ID ${dosenId}`,
      dosen_nidn: modalDosenOption?.raw?.nidn || '',
      dosen: modalDosenOption?.raw || null,
      sks: values.sks,
      kelas_ids: kIds,
      kelas_list: kNames,
      master_kelas_items: modalKelasOptions.map((k) => ({ id: Number(k.value), nama_kelas: k.label })),
    };

    let next: DosenAnggotaDetail[];
    if (editIndex !== null) {
      next = [...details];
      next[editIndex] = newItem;
    } else {
      next = [...details, newItem];
    }

    setDetails(next);
    setValue('dosen_anggota_details', next);
    setValue('dosen_anggota_ids', next.map((d) => d.dosen_id));
    setModalOpen(false);
  };

  const handleFormSubmit = async (values: DistribusiMengajarFormValues) => {
    const finalValues: DistribusiMengajarFormValues = {
      ...values,
      dosen_anggota_details: details,
      dosen_anggota_ids: details.map((d) => d.dosen_id),
      kelas_ids: Array.from(new Set([
        ...(values.kelas_ids || []),
        ...details.flatMap((d) => d.kelas_ids || []),
      ])),
    };
    await onSubmit(finalValues);
  };

  const memberColumns: ColumnDef<DosenAnggotaDetail>[] = [
    {
      key: 'dosen',
      label: 'DOSEN ANGGOTA',
      render: (item) => (
        <div>
          <span className="block text-xs font-bold text-slate-800">
            {item.dosen?.nama_lengkap || item.dosen_nama || `Dosen ID ${item.dosen_id}`}
          </span>
          {(item.dosen?.nidn || item.dosen_nidn) && (
            <span className="font-mono text-2xs text-slate-400 block">
              NIDN: {item.dosen?.nidn || item.dosen_nidn}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'sks',
      label: 'SKS',
      align: 'center',
      render: (item) => (
        <span className="font-mono font-bold text-slate-700 text-xs">
          {item.sks !== undefined && item.sks !== null ? `${item.sks} SKS` : '-'}
        </span>
      ),
    },
    {
      key: 'kelas',
      label: 'KELAS',
      render: (item) => {
        const kList = item.kelas_list && item.kelas_list.length > 0 ? item.kelas_list : [];
        return kList.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {kList.map((kName, kIdx) => (
              <span
                key={kIdx}
                className="px-1.5 py-0.5 rounded text-2xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                {kName}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-slate-400 italic text-2xs">-</span>
        );
      },
    },
    {
      key: 'aksi',
      label: 'AKSI',
      align: 'center',
      render: (_, idx) => (
        <div className="flex justify-center">
          <DropdownMenu
            items={[
              {
                label: 'Ubah',
                icon: <Edit2 size={14} />,
                onClick: () => handleOpenEditModal(idx),
              },
              {
                label: 'Hapus',
                icon: <Trash2 size={14} />,
                variant: 'danger',
                onClick: () => setConfirmDeleteIdx(idx),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input label="Tahun Akademik" value={defaultValues?.tahunAkademikNama || tahunAktifNama || '-'} disabled />
          </div>

          <Controller
            name="kurikulum_id"
            control={control}
            render={({ field }) => (
              <AsyncSelect
                label="Kurikulum"
                placeholder="Cari kurikulum..."
                loadOptions={loadKurikulumOptions}
                defaultOptions={defaultValues?.kurikulumOption ? [defaultValues.kurikulumOption] : true}
                value={field.value || null}
                onChange={(opt: any) => field.onChange(toId(opt?.value))}
                isClearable
                error={errors.kurikulum_id?.message}
              />
            )}
          />

          <Controller
            name="mata_kuliah_id"
            control={control}
            render={({ field }) => (
              <AsyncSelect
                key={`mk-${selectedKurikulumId || 'all'}`}
                label="Mata Kuliah"
                placeholder={selectedKurikulumId ? 'Cari kode / nama MK...' : 'Pilih kurikulum terlebih dahulu...'}
                loadOptions={(keyword: string) => loadMataKuliahOptions(keyword, toId(selectedKurikulumId))}
                defaultOptions={defaultValues?.mataKuliahOption ? [defaultValues.mataKuliahOption] : true}
                value={field.value || null}
                onChange={(opt: any) => {
                  field.onChange(Number(opt?.value) || 0);
                  setSelectedMk(opt?.raw || null);
                  const semAnjuran = Number(opt?.raw?.semester_anjuran);
                  if (Number.isFinite(semAnjuran) && semAnjuran >= 1 && semAnjuran <= 8) {
                    setValue('semester', semAnjuran);
                  }
                }}
                error={errors.mata_kuliah_id?.message}
              />
            )}
          />

          <Controller
            name="semester"
            control={control}
            render={({ field }) => (
              <Select
                label="Untuk Semester"
                required
                hint="Pastikan mata kuliah ini untuk semester berapa"
                options={SEMESTER_OPTIONS}
                value={String(field.value || '1')}
                onChange={(val: any) => field.onChange(Number(val))}
                error={errors.semester?.message}
              />
            )}
          />

          <Controller
            name="dosen_koordinator_id"
            control={control}
            render={({ field }) => (
              <AsyncSelect
                label="Dosen Koordinator"
                placeholder="Cari nama / NIDN dosen..."
                loadOptions={loadDosenOptions}
                defaultOptions={defaultValues?.koordinatorOption ? [defaultValues.koordinatorOption] : true}
                value={field.value || null}
                onChange={(opt: any) => field.onChange(toId(opt?.value))}
                isClearable
                error={errors.dosen_koordinator_id?.message}
              />
            )}
          />

          {/* Tabel Dosen Anggota | SKS | Kelas (Editable Table) */}
          <div className="md:col-span-2 space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Dosen Anggota
                </h4>
                <p className="text-2xs text-slate-500">
                  Daftar penugasan dosen anggota, beban SKS, dan kelas perkuliahan.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Plus size={14} />}
                onClick={handleOpenAddModal}
                className="text-xs border-[var(--module-primary)] text-[var(--module-primary)] hover:bg-[var(--module-primary-subtle)]"
              >
                Tambah Dosen Anggota
              </Button>
            </div>

            <DataTable
              columns={memberColumns}
              data={details}
              emptyMessage="Belum ada dosen anggota. Klik tombol '+ Tambah Dosen Anggota' untuk menambahkan."
            />
          </div>
        </div>

        {/* Sinkronisasi semester anjuran MK: simpan manual via hidden register */}
        <input type="hidden" {...register('mata_kuliah_id', { valueAsNumber: true })} />

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : submitLabel}
          </Button>
        </div>
      </form>

      {/* Popup / Modal Tambah & Ubah Dosen Anggota */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editIndex !== null ? 'Ubah Dosen Anggota' : 'Tambah Dosen Anggota'}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="button" variant="primary" onClick={modalForm.handleSubmit(handleSaveMember)}>
              {editIndex !== null ? 'Simpan Perubahan' : 'Tambahkan'}
            </Button>
          </div>
        }
      >
        <form onSubmit={modalForm.handleSubmit(handleSaveMember)} className="space-y-4 py-1">
          <Controller
            name="dosen_id"
            control={modalForm.control}
            render={({ field }) => (
              <AsyncSelect
                label="Dosen"
                required
                placeholder="Cari berdasarkan nama / NIDN..."
                loadOptions={loadDosenOptions}
                defaultOptions={modalDosenOption ? [modalDosenOption] : true}
                value={field.value && field.value > 0 ? field.value : null}
                onChange={(opt: any) => {
                  setModalDosenOption(opt || null);
                  field.onChange(Number(opt?.value) || 0);
                }}
                error={modalForm.formState.errors.dosen_id?.message}
              />
            )}
          />

          <Controller
            name="sks"
            control={modalForm.control}
            render={({ field }) => (
              <Input
                label="Jumlah SKS"
                type="number"
                required
                min={1}
                max={16}
                value={field.value ?? 1}
                onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                hint={selectedMk?.total_sks ? `Total SKS Mata Kuliah: ${selectedMk.total_sks} SKS` : undefined}
                error={modalForm.formState.errors.sks?.message}
              />
            )}
          />

          <Controller
            name="kelas_ids"
            control={modalForm.control}
            render={({ field }) => (
              <AsyncSelect
                label="Kelas"
                placeholder="Pilih kelas yang diampu..."
                loadOptions={loadMasterKelasOptions}
                defaultOptions={modalKelasOptions.length > 0 ? modalKelasOptions : true}
                value={field.value || []}
                onChange={(opts: any) => {
                  const arr: SelectOption[] = Array.isArray(opts) ? opts : opts ? [opts] : [];
                  setModalKelasOptions(arr);
                  field.onChange(arr.map((k) => Number(k.value)).filter(Boolean));
                }}
                isMulti
                isClearable
                hint="Pilih satu atau lebih kelas untuk dosen anggota ini"
                error={modalForm.formState.errors.kelas_ids?.message}
              />
            )}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDeleteIdx !== null}
        onClose={() => setConfirmDeleteIdx(null)}
        onConfirm={() => {
          if (confirmDeleteIdx !== null) {
            handleDeleteMember(confirmDeleteIdx);
            setConfirmDeleteIdx(null);
          }
        }}
        title="Hapus Dosen Anggota"
        message="Apakah Anda yakin ingin menghapus dosen anggota ini dari penugasan mata kuliah?"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </>
  );
}
