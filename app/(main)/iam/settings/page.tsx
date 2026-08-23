'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { KeyRound, Mail, Globe } from 'lucide-react';

interface GoogleWorkspaceSettings {
  adminEmail: string;
  domain: string;
  credentials: string;
}
import { Save, Settings, Users, CheckCircle2, Loader2, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
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
  const [superadminRole, setSuperadminRole] = useState('superadmin');
  const [originalSuperadminRole, setOriginalSuperadminRole] = useState('superadmin');
  
  // Google Workspace Settings
  const [gWorkspaceAdmin, setGWorkspaceAdmin] = useState('');
  const [originalGWorkspaceAdmin, setOriginalGWorkspaceAdmin] = useState('');
  const [gWorkspaceDomain, setGWorkspaceDomain] = useState('student.campus.ac.id');
  const [originalGWorkspaceDomain, setOriginalGWorkspaceDomain] = useState('student.campus.ac.id');
  const [gWorkspaceCredentials, setGWorkspaceCredentials] = useState('');
  const [originalGWorkspaceCredentials, setOriginalGWorkspaceCredentials] = useState('');

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
      if (settingsData?.superadmin_role?.value) {
        setSuperadminRole(settingsData.superadmin_role.value);
        setOriginalSuperadminRole(settingsData.superadmin_role.value);
      }
      if (settingsData?.google_workspace_admin_email?.value) {
        setGWorkspaceAdmin(settingsData.google_workspace_admin_email.value);
        setOriginalGWorkspaceAdmin(settingsData.google_workspace_admin_email.value);
      }
      if (settingsData?.google_workspace_domain?.value) {
        setGWorkspaceDomain(settingsData.google_workspace_domain.value);
        setOriginalGWorkspaceDomain(settingsData.google_workspace_domain.value);
      }
      if (settingsData?.google_workspace_credentials?.value) {
        setGWorkspaceCredentials(settingsData.google_workspace_credentials.value);
        setOriginalGWorkspaceCredentials(settingsData.google_workspace_credentials.value);
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
        settings: [
          { key: 'default_register_role', value: defaultRole },
          { key: 'superadmin_role', value: superadminRole },
          { key: 'google_workspace_admin_email', value: gWorkspaceAdmin },
          { key: 'google_workspace_domain', value: gWorkspaceDomain },
          { key: 'google_workspace_credentials', value: gWorkspaceCredentials },
        ],
      });
      setOriginalRole(defaultRole);
      setOriginalSuperadminRole(superadminRole);
      setOriginalGWorkspaceAdmin(gWorkspaceAdmin);
      setOriginalGWorkspaceDomain(gWorkspaceDomain);
      setOriginalGWorkspaceCredentials(gWorkspaceCredentials);
      setSaveSuccess(true);
      toast.success('Konfigurasi sistem berhasil disimpan.');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      toast.error('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty = 
    defaultRole !== originalRole || 
    superadminRole !== originalSuperadminRole ||
    gWorkspaceAdmin !== originalGWorkspaceAdmin ||
    gWorkspaceDomain !== originalGWorkspaceDomain ||
    gWorkspaceCredentials !== originalGWorkspaceCredentials;
  const selectedRole = roles.find((r) => r.slug === defaultRole);
  const selectedSuperadminRole = roles.find((r) => r.slug === superadminRole);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Pengaturan Sistem"
        description="Konfigurasi inti untuk SSO Campus, Otoritas Superadmin, dan mapping role otomatis"
      />

      {/* Settings Grid */}
      <div className="settings-page-grid">

        {/* ── Left: Settings Sections ── */}
        <div className="settings-sections space-y-6">

          {/* Section 1: Registrasi Akun Baru */}
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
          </div>

          {/* Section 2: Role Superadmin Utama */}
          <div className="settings-section-card card">
            <div className="settings-section-header">
              <div className="settings-section-icon bg-indigo-50 text-indigo-600">
                <ShieldAlert size={18} />
              </div>
              <div className="settings-section-title-group">
                <h2 className="settings-section-title">Otoritas Role Superadmin (Sistem)</h2>
                <p className="settings-section-desc">
                  Tentukan Role yang bertindak sebagai Superadmin utama di sistem. Sistem akan secara dinamis memberikan hak akses penuh tanpa batas ke semua modul bagi pengguna dengan role ini.
                </p>
              </div>
            </div>

            <div className="settings-section-divider" />

            <div className="settings-section-body">
              {isLoading ? (
                <div className="settings-loading">
                  <Loader2 size={20} className="animate-spin text-slate-400" />
                  <span className="text-sm text-slate-500">Memuat pengaturan...</span>
                </div>
              ) : (
                <Select
                  label="System Superadmin Role"
                  options={roles.map((r): SelectOption => ({
                    value: r.slug,
                    label: `${r.name} (${r.slug})`,
                  }))}
                  value={superadminRole}
                  onChange={(val: string) => {
                    setSuperadminRole(val);
                    setSaveSuccess(false);
                  }}
                  placeholder="Pilih role superadmin..."
                  isClearable={false}
                  hint="Role yang dipilih akan dikenali secara dinamis oleh backend & frontend SSO sebagai Superadmin utama tanpa tergantung nilai hardcode."
                />
              )}

              {!isLoading && selectedSuperadminRole && (
                <div className="settings-role-preview bg-indigo-50/70 border-indigo-200">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                  <span className="settings-role-preview-label font-bold text-indigo-900">Role Superadmin Aktif:</span>
                  <span className="settings-role-preview-value text-indigo-700">{selectedSuperadminRole.name}</span>
                  {selectedSuperadminRole.description && (
                    <span className="settings-role-preview-desc text-indigo-600">— {selectedSuperadminRole.description}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Google Workspace */}
          <div className="settings-section-card card">
            {/* Section Header */}
            <div className="settings-section-header">
              <div className="settings-section-icon bg-green-100 text-green-700">
                <Globe size={18} />
              </div>
              <div className="settings-section-title-group">
                <h2 className="settings-section-title">Integrasi Google Workspace</h2>
                <p className="settings-section-desc">
                  Konfigurasi Domain-Wide Delegation API untuk otomatisasi pembuatan email kampus mahasiswa (G-Suite).
                </p>
              </div>
            </div>

            <div className="settings-section-divider" />

            {/* Setting Field */}
            <div className="settings-section-body space-y-4">
              {isLoading ? (
                <div className="settings-loading">
                  <Loader2 size={20} className="animate-spin text-slate-400" />
                  <span className="text-sm text-slate-500">Memuat pengaturan...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Domain Kampus"
                      value={gWorkspaceDomain}
                      onChange={(e) => setGWorkspaceDomain(e.target.value)}
                      placeholder="Misal: student.campus.ac.id"
                      hint="Domain untuk alamat email mahasiswa (tanpa @)."
                    />
                    <Input
                      label="Admin Email (Impersonation)"
                      value={gWorkspaceAdmin}
                      onChange={(e) => setGWorkspaceAdmin(e.target.value)}
                      placeholder="admin@campus.ac.id"
                      hint="Email Admin G-Suite utama dengan akses Directory API."
                    />
                  </div>
                  <Textarea
                    label="Credentials JSON (Service Account)"
                    value={gWorkspaceCredentials}
                    onChange={(e) => setGWorkspaceCredentials(e.target.value)}
                    placeholder='{"type": "service_account", "project_id": "...", ...}'
                    rows={4}
                    hint="Tempel isi file JSON Service Account dari Google Cloud Console."
                  />
                </>
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
                    onClick={() => {
                      setDefaultRole(originalRole);
                      setSuperadminRole(originalSuperadminRole);
                      setGWorkspaceAdmin(originalGWorkspaceAdmin);
                      setGWorkspaceDomain(originalGWorkspaceDomain);
                      setGWorkspaceCredentials(originalGWorkspaceCredentials);
                      setSaveSuccess(false);
                    }}
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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tentang Konfigurasi SSO</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Konfigurasi ini menentukan perilaku dinamis SSO Campus untuk pendaftaran publik dan penentuan otoritas Superadmin sistem.
            </p>
            <div className="settings-info-divider" />
            <div className="space-y-3 mt-4 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2">
                <Users size={14} className="text-primary-600 shrink-0 mt-0.5" />
                <span><strong>Default Register Role:</strong> Role otomatis saat user baru melakukan registrasi mandiri.</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>Superadmin Role:</strong> Role yang dikonfigurasi sebagai pemegang akses penuh tanpa batas ke seluruh modul sistem.</span>
              </div>
            </div>
            <button
              onClick={fetchData}
              className="settings-refresh-btn mt-4"
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
