'use client';

import { useEffect, useState } from 'react';
import { menuService } from '@/services/menu.service';
import { moduleService, AppModule } from '@/services/module.service';
import { Menu } from '@/types/menu';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  List,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Filter
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

type FlattenedMenu = Menu & { level: number };

export default function AdminMenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [appModules, setAppModules] = useState<AppModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>('sso');
  const router = useRouter();

  // Filter States
  const [showFilter, setShowFilter] = useState(false);
  const [filterName, setFilterName] = useState<string>('');
  const [appliedFilterName, setAppliedFilterName] = useState<string>('');

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const data = await menuService.getAllMenus(selectedModule);
      setMenus(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const modulesData = await moduleService.getAllModules();
        setAppModules(modulesData);
        // default select to first active module if sso is not available
        if (modulesData.length > 0 && !modulesData.find(m => m.code === 'sso')) {
          setSelectedModule(modulesData[0].code);
        }
      } catch (err) {
        console.error('Failed to fetch modules');
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedModule) {
      fetchMenus();
    }
  }, [selectedModule]);

  const handleToggle = async (id: number, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      await menuService.toggleMenuStatus(id);
      toast.success(`Menu berhasil di${currentStatus ? 'nonaktifkan' : 'aktifkan'}`);
      fetchMenus(); // Refresh to ensure sync
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengubah status menu');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus menu "${name}" secara permanen?`)) {
      try {
        await menuService.deleteMenu(id);
        toast.success('Menu berhasil dihapus');
        fetchMenus();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Gagal menghapus menu');
      }
    }
  };

  const openCreateModal = () => {
    router.push('/admin/menus/create');
  };

  const openEditModal = (menu: Menu) => {
    router.push(`/admin/menus/${menu.id}/edit`);
  };

  // Helper to flatten menu tree for DataTable
  const flattenMenus = (menuList: Menu[], level = 0): FlattenedMenu[] => {
    let result: FlattenedMenu[] = [];
    menuList.forEach(m => {
      result.push({ ...m, level });
      if (m.children && m.children.length > 0) {
        result = result.concat(flattenMenus(m.children, level + 1));
      }
    });
    return result;
  };

  const allFlattenedMenus = flattenMenus(menus);
  
  const filteredFlattenedMenus = allFlattenedMenus.filter(m => {
    if (!appliedFilterName) return true;
    const lowerQ = appliedFilterName.toLowerCase();
    return m.name.toLowerCase().includes(lowerQ) || (m.url && m.url.toLowerCase().includes(lowerQ));
  });

  const columns: ColumnDef<FlattenedMenu>[] = [
    { key: 'name', label: 'Nama Menu', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: `${row.level * 1.5}rem` }}>
        {row.level > 0 && <span style={{ color: 'var(--gray-400)' }}>↳</span>}
        <span style={{ fontWeight: row.level === 0 ? 700 : 500, color: row.level === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {row.name}
        </span>
      </div>
    )},
    { key: 'url', label: 'URL', render: (row) => (
      <code style={{ background: 'var(--gray-100)', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.8125rem' }}>
        {row.url}
      </code>
    )},
    { key: 'icon', label: 'Icon', render: (row) => (
      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{row.icon || '-'}</span>
    )},
    { key: 'is_active', label: 'Status', render: (row) => (
      row.is_active ? (
        <span className="badge badge-green"><CheckCircle2 size={12} style={{ marginRight: '0.25rem' }}/> Aktif</span>
      ) : (
        <span className="badge badge-red"><XCircle size={12} style={{ marginRight: '0.25rem' }}/> Nonaktif</span>
      )
    )},
    { key: 'aksi', label: 'Aksi', align: 'right', render: (row) => (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <Button
          variant={row.is_active ? 'outline-danger' : 'outline'}
          size="sm"
          icon={togglingId === row.id ? <RefreshCw size={14} className="animate-spin" /> : (row.is_active ? <XCircle size={14} /> : <CheckCircle2 size={14} />)}
          onClick={() => handleToggle(row.id, row.is_active)}
          disabled={togglingId === row.id}
        >
          {row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={<Pencil size={14} />}
          onClick={() => openEditModal(row)}
        />
        <Button
          variant="outline-danger"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={() => handleDelete(row.id, row.name)}
        />
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Manajemen Menu"
        description="Mengelola menu navigasi dan status aktif/nonaktifnya untuk setiap modul."
        action={
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ width: 220 }}>
              <Select
                value={appModules.find(m => m.code === selectedModule) ? { value: selectedModule, label: `Modul: ${appModules.find(m => m.code === selectedModule)?.name.toUpperCase()}` } : null}
                onChange={(v: any) => setSelectedModule(v?.value || 'sso')}
                options={appModules.map(m => ({ value: m.code, label: `Modul: ${m.name.toUpperCase()}` }))}
                menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
              />
            </div>
            <Button 
              style={{ backgroundColor: '#f97316', color: '#fff', border: 'none' }} 
              icon={<Filter size={16} />} 
              onClick={() => setShowFilter(true)}
            >
              Filter
            </Button>
            <Button variant="secondary" icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />} onClick={fetchMenus} disabled={loading}>
              Refresh
            </Button>
            <Button icon={<Plus size={16} />} onClick={openCreateModal}>
              Tambah Menu
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={filteredFlattenedMenus}
        isLoading={loading}
      />

      {/* Filter Drawer */}
      <Drawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Menu"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button 
              variant="secondary" 
              onClick={() => {
                setFilterName('');
                setAppliedFilterName('');
                setShowFilter(false);
              }}
            >
              Reset
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                setAppliedFilterName(filterName);
                setShowFilter(false);
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input 
            label="Cari Menu"
            placeholder="Ketik nama atau URL menu..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
        </div>
      </Drawer>
    </div>
  );
}
