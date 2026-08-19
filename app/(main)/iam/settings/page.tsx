'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Save, Settings, Users, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/axios';

interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export default function SystemSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [defaultRole, setDefaultRole] = useState('calon_mhs');
  const [originalRole, setOriginalRole] = useState('calon_mhs');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, settingsRes] = await Promise.all([
        apiClient.get('/admin/roles'),
        apiClient.get('/admin/system-settings'),
      ]);

      const rawRoles: Role[] = rolesRes.data?.data?.data || rolesRes.data?.data || [];
      setRoles(Array.isArray(rawRoles) ? rawRoles : []);

      const settingsData = settingsRes.data?.data;
      if (settingsData?.default_register_role?.value) {
        setDefaultRole(settingsData.default_register_role.value);
        setOriginalRole(settingsData.default_register_role.value);
      }
    } catch {
      toast.error('Gagal memuat pengaturan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await apiClient.post('/admin/system-settings', {
        settings: [{ key: 'default_register_role', value: defaultRole }],
      });
      setOriginalRole(defaultRole);
      setSaveSuccess(true);
      toast.success('Konfigurasi berhasil disimpan.');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      toast.error('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty = defaultRole !== originalRole;
  const selectedRole = roles.find((r) => r.slug === defaultRole);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Pengaturan Sistem"
        description="Konfigurasi inti untuk SSO Campus dan mapping role otomatis"
      />

      {/* Settings Grid */}
      <div className="settings-page-grid">

        {/* ── Left: Settings Sections ── */}
        <div className="settings-sections">

          {/* Section: Registrasi Akun Baru */}
          <div className="settings-section-card card">
            {/* Section Header */}
            <div className="settings-section-header">
              <div className="settings-section-icon">
                <Users size={18} />
              </div>
              <div className="settings-section-title-group">
                <h2 className="settings-section-title">Registrasi Akun Baru</h2>
                <p className="settings-section-desc">
                  Pilih Role yang akan otomatis diberikan kepada pengguna saat membuat akun baru melalui halaman Register.
                </p>
              </div>
            </div>

            <div className="settings-section-divider" />

            {/* Setting Field */}
            <div className="settings-section-body">
              {isLoading ? (
                <div className="settings-loading">
                  <Loader2 size={20} className="animate-spin text-slate-400" />
                  <span className="text-sm text-slate-500">Memuat pengaturan...</span>
                </div>
              ) : (
                <Select
                  label="Default Registration Role"
                  options={roles.map((r): SelectOption => ({
                    value: r.slug,
                    label: `${r.name} (${r.slug})`,
                  }))}
                  value={defaultRole}
                  onChange={(val: string) => {
                    setDefaultRole(val);
                    setSaveSuccess(false);
                  }}
                  placeholder="Pilih role untuk pendaftar baru..."
                  isClearable={false}
                  hint="Berdasarkan role yang dipilih, modul yang dapat diakses oleh pendaftar baru akan mengikuti mapping hak akses dari role ini."
                />
              )}

              {/* Selected Role Preview */}
              {!isLoading && selectedRole && (
                <div className="settings-role-preview">
                  <div className="settings-role-preview-dot" />
                  <span className="settings-role-preview-label">Role aktif:</span>
                  <span className="settings-role-preview-value">{selectedRole.name}</span>
                  {selectedRole.description && (
                    <span className="settings-role-preview-desc">— {selectedRole.description}</span>
                  )}
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="settings-section-footer">
              <div className="settings-footer-left">
                {saveSuccess && (
                  <span className="settings-save-success">
                    <CheckCircle2 size={14} />
                    Konfigurasi berhasil disimpan
                  </span>
                )}
                {isDirty && !saveSuccess && (
                  <span className="settings-unsaved-hint">
                    Ada perubahan yang belum disimpan
                  </span>
                )}
              </div>

              <div className="settings-footer-actions">
                {isDirty && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setDefaultRole(originalRole); setSaveSuccess(false); }}
                    disabled={isSaving}
                  >
                    Batalkan
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={isSaving || isLoading || !isDirty}
                  icon={isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </Button>
              </div>
            </div>
          </div>

        </div>

        {/* ── Right: Info Panel (Desktop only) ── */}
        <aside className="settings-info-panel">
          <div className="settings-info-card card card-body">
            <div className="flex items-center gap-2 mb-3">
              <Settings size={15} className="text-primary-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tentang Pengaturan Ini</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Pengaturan ini menentukan role default yang akan disematkan secara otomatis kepada setiap pengguna yang baru mendaftar melalui halaman registrasi publik.
            </p>
            <div className="settings-info-divider" />
            <p className="text-sm text-slate-600 leading-relaxed mt-4">
              Setelah role dipilih, seluruh izin (permissions) yang terikat pada role tersebut akan menentukan modul apa saja yang dapat diakses oleh pendaftar baru di Dashboard SSO.
            </p>
            <button
              onClick={fetchData}
              className="settings-refresh-btn"
              title="Muat ulang pengaturan"
            >
              <RefreshCw size={13} />
              Muat ulang
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
