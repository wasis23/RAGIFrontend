'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { menuService } from '@/services/menu.service';
import { moduleService } from '@/services/module.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { AsyncSelect } from '@/components/ui/AsyncSelect';

const menuFormSchema = z.object({
  name: z.string().min(1, 'Nama menu wajib diisi').max(100, 'Nama menu maksimal 100 karakter'),
  url: z.string().min(1, 'URL route wajib diisi'),
  icon: z.string().optional(),
  module: z.string().min(1, 'Modul aplikasi wajib dipilih'),
  parent_id: z.number().nullable().optional(),
  order_index: z.number().min(0, 'Urutan minimal 0'),
  is_active: z.boolean(),
});

type MenuFormValues = z.infer<typeof menuFormSchema>;

export default function CreateMenuPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moduleObj, setModuleObj] = useState<{ value: string; label: string } | null>(null);
  const [parentObj, setParentObj] = useState<{ value: string; label: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      name: '',
      url: '',
      icon: '',
      module: '',
      parent_id: null,
      order_index: 0,
      is_active: true,
    },
  });

  const selectedModule = watch('module');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const modulesData = await moduleService.getAllModules();
        if (modulesData.length > 0) {
          const initialModule = modulesData[0];
          setModuleObj({ value: initialModule.code, label: initialModule.name.toUpperCase() });
          setValue('module', initialModule.code);
        }
      } catch {
        toast.error('Gagal memuat modul');
      }
    };
    fetchInitialData();
  }, [setValue]);

  const loadModuleOptions = async (query: string) => {
    try {
      const modulesData = await moduleService.getAllModules();
      const filtered = modulesData.filter(
        (m) => m.name.toLowerCase().includes(query.toLowerCase()) || m.code.toLowerCase().includes(query.toLowerCase())
      );
      return filtered.map((m) => ({ value: m.code, label: m.name.toUpperCase() }));
    } catch {
      return [];
    }
  };

  const loadParentMenuOptions = async (query: string) => {
    if (!selectedModule) return [];
    try {
      const data = await menuService.getAllMenus(selectedModule);
      const filtered = data.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));
      return filtered.map((pm) => ({ value: pm.id.toString(), label: pm.name }));
    } catch {
      return [];
    }
  };

  const handleModuleSelectChange = (selected: any) => {
    setModuleObj(selected);
    const code = selected ? selected.value : '';
    setValue('module', code);
    setParentObj(null);
    setValue('parent_id', null);
  };

  const handleParentSelectChange = (selected: any) => {
    setParentObj(selected);
    setValue('parent_id', selected && selected.value ? parseInt(selected.value, 10) : null);
  };

  const onSaveMenu = async (values: MenuFormValues) => {
    setIsSubmitting(true);
    try {
      await menuService.createMenu(values as any);
      toast.success('Menu berhasil ditambahkan');
      router.push('/admin/menus');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan menu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader
        title="Tambah Menu Baru"
        description="Buat menu navigasi baru untuk sistem ekosistem universitas"
        action={
          <Button
            variant="warning"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/admin/menus')}
          >
            Kembali ke Daftar Menu
          </Button>
        }
      />

      <div className="card p-6 border border-slate-200 shadow-xs">
        <form onSubmit={handleSubmit(onSaveMenu)} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Input
              label="Nama Menu"
              required
              placeholder="Contoh: Pengaturan"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="URL Route"
              required
              placeholder="Contoh: /admin/settings atau #kategori"
              error={errors.url?.message}
              hint="Gunakan awalan # (contoh: #master) untuk judul grup"
              {...register('url')}
            />

            <Input
              label="Icon (Lucide Icon)"
              placeholder="Contoh: Home"
              error={errors.icon?.message}
              hint="Nama ikon Lucide React (cth: LayoutGrid)"
              {...register('icon')}
            />

            <AsyncSelect
              label="Modul Aplikasi"
              required
              value={moduleObj}
              onChange={handleModuleSelectChange}
              loadOptions={loadModuleOptions}
              placeholder="Cari modul..."
              error={errors.module?.message}
            />

            <Input
              label="Urutan (Order Index)"
              type="number"
              error={errors.order_index?.message}
              {...register('order_index', { valueAsNumber: true })}
            />

            <AsyncSelect
              label="Kategori / Parent Menu"
              key={selectedModule}
              value={parentObj}
              onChange={handleParentSelectChange}
              loadOptions={loadParentMenuOptions}
              placeholder="Pilih menu induk (opsional)..."
              isClearable
            />

            <div className="lg:col-span-3 pt-2">
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="Langsung Aktifkan Menu Ini"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <Button variant="secondary" onClick={() => router.push('/admin/menus')} disabled={isSubmitting}>
              Batal
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting} icon={isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Menu'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
