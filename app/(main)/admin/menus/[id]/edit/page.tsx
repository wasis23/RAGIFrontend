'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { menuService } from '@/services/menu.service';
import { moduleService } from '@/services/module.service';
import { Menu } from '@/types/menu';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Skeleton } from '@/components/ui/Skeleton';
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

export default function EditMenuPage() {
  const router = useRouter();
  const params = useParams();
  const menuId = parseInt(params.id as string, 10);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [moduleObj, setModuleObj] = useState<{ value: string; label: string } | null>(null);
  const [parentObj, setParentObj] = useState<{ value: string; label: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
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
    if (isNaN(menuId)) {
      toast.error('ID Menu tidak valid');
      router.push('/admin/menus');
      return;
    }

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const modulesData = await moduleService.getAllModules();

        let foundMenu: Menu | null = null;
        for (const mod of modulesData) {
          const allMenusInModule = await menuService.getAllMenus(mod.code);
          const findMenuInTree = (menusList: Menu[], id: number): Menu | null => {
            for (const m of menusList) {
              if (m.id === id) return m;
              if (m.children) {
                const found = findMenuInTree(m.children, id);
                if (found) return found;
              }
            }
            return null;
          };
          foundMenu = findMenuInTree(allMenusInModule, menuId);
          if (foundMenu) break;
        }

        if (foundMenu) {
          reset({
            name: foundMenu.name,
            url: foundMenu.url,
            icon: foundMenu.icon || '',
            module: foundMenu.module,
            parent_id: foundMenu.parent_id,
            order_index: foundMenu.order_index,
            is_active: foundMenu.is_active,
          });

          const matchedMod = modulesData.find((m) => m.code === foundMenu?.module);
          if (matchedMod) {
            setModuleObj({ value: matchedMod.code, label: matchedMod.name.toUpperCase() });
          }

          if (foundMenu.parent_id) {
            const parentsData = await menuService.getAllMenus(foundMenu.module);
            const parentMenu = parentsData.find((pm) => pm.id === foundMenu?.parent_id);
            if (parentMenu) {
              setParentObj({ value: parentMenu.id.toString(), label: parentMenu.name });
            }
          }
        } else {
          toast.error('Data menu tidak ditemukan');
          router.push('/admin/menus');
        }
      } catch {
        toast.error('Gagal memuat data menu');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [menuId, reset, router]);

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
      const filtered = data.filter((m) => m.id !== menuId && m.name.toLowerCase().includes(query.toLowerCase()));
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
      await menuService.updateMenu(menuId, values as any);
      toast.success('Menu berhasil diperbarui');
      router.push('/admin/menus');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat memperbarui menu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in flex flex-col gap-6">
        <Skeleton className="w-1/3 h-10 rounded-xl" />
        <div className="card p-6 flex flex-col gap-4">
          <Skeleton className="w-full h-12 rounded" />
          <Skeleton className="w-full h-12 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader
        title="Edit Menu Navigasi"
        description="Perbarui informasi menu navigasi ekosistem kampus"
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
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="URL Route"
              required
              error={errors.url?.message}
              {...register('url')}
            />

            <Input
              label="Icon (Lucide Icon)"
              error={errors.icon?.message}
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
                    label="Aktifkan Menu Ini"
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
