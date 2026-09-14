'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select, type SelectOption } from '@/components/ui/Select';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Save,
  Settings,
  Users,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Globe,
  Server,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/axios';

const SCHEME_OPTIONS: SelectOption[] = [
  { value: 'smtps', label: 'SSL / SMTPS (Port 465)' },
  { value: 'tls', label: 'TLS / STARTTLS (Port 587)' },
  { value: 'none', label: 'Tanpa Enkripsi (Port 25)' },
];

const settingsSchema = z.object({
  default_register_role: z.string().min(1, 'Role pendaftaran wajib dipilih'),
  superadmin_role: z.string().min(1, 'Role superadmin wajib dipilih'),
  google_workspace_domain: z.string().optional(),
  google_workspace_admin_email: z.string().optional(),
  google_workspace_credentials: z.string().optional(),
  mail_host: z.string().min(1, 'Host SMTP wajib diisi'),
  mail_port: z.string().min(1, 'Port SMTP wajib diisi'),
  mail_scheme: z.string().min(1, 'Protokol enkripsi wajib dipilih'),
  mail_username: z.string().optional(),
  mail_password: z.string().optional(),
  mail_from_address: z
    .string()
    .min(1, 'Alamat email pengirim wajib diisi')
    .email('Format email pengirim tidak valid'),
  mail_from_name: z.string().min(1, 'Nama pengirim wajib diisi'),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const defaultValues: SettingsFormValues = {
  default_register_role: 'calon_mhs',
  superadmin_role: 'superadmin',
  google_workspace_domain: 'student.campus.ac.id',
  google_workspace_admin_email: '',
  google_workspace_credentials: '',
  mail_host: 'smtp.gmail.com',
  mail_port: '465',
  mail_scheme: 'smtps',
  mail_username: '',
  mail_password: '',
  mail_from_address: '',
  mail_from_name: 'Sistem Terintegrasi Kampus',
};

export default function SystemSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });

  const loadRolesOptions = async (query: string) => {
    try {
      const res = await apiClient.get('/admin/roles', {
        params: { search: query, limit: 50 },
      });
      const rawRoles = res.data?.data?.data || res.data?.data || [];
      return (Array.isArray(rawRoles) ? rawRoles : []).map((r: any) => ({
        value: r.slug,
        label: `${r.name} (${r.slug})`,
      }));
    } catch {
      return [];
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const settingsRes = await apiClient.get('/admin/system-settings');
      const settingsData = settingsRes.data?.data;

      const loadedValues: SettingsFormValues = {
        default_register_role:
          settingsData?.default_register_role?.value || defaultValues.default_register_role,
        superadmin_role:
          settingsData?.superadmin_role?.value || defaultValues.superadmin_role,
        google_workspace_domain:
          settingsData?.google_workspace_domain?.value ?? defaultValues.google_workspace_domain,
        google_workspace_admin_email:
          settingsData?.google_workspace_admin_email?.value ?? defaultValues.google_workspace_admin_email,
        google_workspace_credentials:
          settingsData?.google_workspace_credentials?.value ?? defaultValues.google_workspace_credentials,
        mail_host: settingsData?.mail_host?.value ?? defaultValues.mail_host,
        mail_port: settingsData?.mail_port?.value
          ? String(settingsData.mail_port.value)
          : defaultValues.mail_port,
        mail_scheme: settingsData?.mail_scheme?.value ?? defaultValues.mail_scheme,
        mail_username: settingsData?.mail_username?.value ?? defaultValues.mail_username,
        mail_password: settingsData?.mail_password?.value ?? defaultValues.mail_password,
        mail_from_address:
          settingsData?.mail_from_address?.value ?? defaultValues.mail_from_address,
        mail_from_name: settingsData?.mail_from_name?.value ?? defaultValues.mail_from_name,
      };

      reset(loadedValues);
    } catch {
      toast.error('Gagal memuat pengaturan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await apiClient.post('/admin/system-settings', {
        settings: [
          { key: 'default_register_role', value: data.default_register_role },
          { key: 'superadmin_role', value: data.superadmin_role },
          { key: 'google_workspace_admin_email', value: data.google_workspace_admin_email || '' },
          { key: 'google_workspace_domain', value: data.google_workspace_domain || '' },
          { key: 'google_workspace_credentials', value: data.google_workspace_credentials || '' },
          { key: 'mail_host', value: data.mail_host },
          { key: 'mail_port', value: String(data.mail_port) },
          { key: 'mail_scheme', value: data.mail_scheme },
          { key: 'mail_username', value: data.mail_username || '' },
          { key: 'mail_password', value: data.mail_password || '' },
          { key: 'mail_from_address', value: data.mail_from_address },
          { key: 'mail_from_name', value: data.mail_from_name },
        ],
      });
      reset(data);
      setSaveSuccess(true);
      toast.success('Konfigurasi sistem berhasil disimpan.');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      toast.error('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Masukkan alamat email tujuan uji coba yang valid.');
      return;
    }
    setIsTestingSmtp(true);
    const formVals = getValues();
    try {
      const res = await apiClient.post('/admin/system-settings/test-smtp', {
        email: testEmail,
        mail_host: formVals.mail_host,
        mail_port: formVals.mail_port,
        mail_scheme: formVals.mail_scheme,
        mail_username: formVals.mail_username,
        mail_password: formVals.mail_password,
        mail_from_address: formVals.mail_from_address,
        mail_from_name: formVals.mail_from_name,
      });
      toast.success(res.data?.message || 'Email uji coba berhasil dikirim!');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Gagal mengirim email uji coba. Periksa koneksi dan kredensial SMTP Anda.';
      toast.error(msg);
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Pengaturan Sistem"
        description="Konfigurasi inti untuk SSO Campus, Server SMTP Email, Otoritas Superadmin, dan mapping role otomatis"
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Settings Grid */}
        <div className="settings-page-grid">
          {/* ── Left: Settings Sections ── */}
          <div className="settings-sections space-y-6">
            {/* Section 1: Server SMTP & Email Notifikasi */}
            <div className="settings-section-card card">
              <div className="settings-section-header">
                <div className="settings-section-icon bg-amber-100 text-amber-700">
                  <Server size={18} />
                </div>
                <div className="settings-section-title-group">
                  <h2 className="settings-section-title">Konfigurasi Server SMTP & Email</h2>
                  <p className="settings-section-desc">
                    Kredensial server surat keluar (SMTP) untuk pengiriman email verifikasi pendaftaran, tautan lupa password, dan notifikasi kampus.
                  </p>
                </div>
              </div>

              <div className="settings-section-divider" />

              <div className="settings-section-body space-y-4">
                {isLoading ? (
                  <div className="settings-loading">
                    <Loader2 size={20} className="animate-spin text-slate-400" />
                    <span className="text-sm text-slate-500">Memuat pengaturan SMTP...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="Host SMTP"
                        placeholder="smtp.gmail.com"
                        error={errors.mail_host?.message}
                        hint="Alamat host server SMTP mailer."
                        {...register('mail_host')}
                      />
                      <Input
                        label="Port SMTP"
                        type="number"
                        placeholder="465"
                        error={errors.mail_port?.message}
                        hint="Port SMTP (465 untuk SSL, 587 untuk TLS)."
                        {...register('mail_port')}
                      />
                      <Controller
                        name="mail_scheme"
                        control={control}
                        render={({ field }) => (
                          <Select
                            label="Protokol Enkripsi"
                            options={SCHEME_OPTIONS}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Pilih protokol..."
                            isClearable={false}
                            error={errors.mail_scheme?.message}
                            hint="Metode enkripsi koneksi mailer."
                          />
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Username SMTP / Email Akun"
                        type="text"
                        placeholder="user@kampus.ac.id"
                        error={errors.mail_username?.message}
                        hint="Username otentikasi login SMTP."
                        {...register('mail_username')}
                      />
                      <Input
                        label="Password / App Password SMTP"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••••••"
                        suffixIcon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        onSuffixClick={() => setShowPassword(!showPassword)}
                        error={errors.mail_password?.message}
                        hint="Password atau Google App Password akun email."
                        {...register('mail_password')}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Alamat Pengirim (From Address)"
                        type="email"
                        placeholder="no-reply@kampus.ac.id"
                        error={errors.mail_from_address?.message}
                        hint="Alamat email yang tertera sebagai pengirim email."
                        {...register('mail_from_address')}
                      />
                      <Input
                        label="Nama Pengirim (From Name)"
                        placeholder="Sistem Terintegrasi Kampus"
                        error={errors.mail_from_name?.message}
                        hint="Nama instansi/sistem yang tampil di inbox penerima."
                        {...register('mail_from_name')}
                      />
                    </div>

                    {/* Sub-Card: Test SMTP Connection */}
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-amber-600" />
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Uji Coba Pengiriman Email (Test SMTP)
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Kirim email percobaan untuk memastikan pengaturan host, port, dan kredensial di atas berfungsi dengan normal sebelum disimpan.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                        <div className="flex-1">
                          <Input
                            label="Email Penerima Uji Coba"
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="nama-anda@domain.com"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          onClick={handleTestSmtp}
                          loading={isTestingSmtp}
                          icon={<Send size={15} />}
                          className="shrink-0 mb-0.5"
                        >
                          {isTestingSmtp ? 'Mengirim...' : 'Kirim Email Uji Coba'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section 2: Registrasi Akun Baru */}
            <div className="settings-section-card card">
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

              <div className="settings-section-body">
                {isLoading ? (
                  <div className="settings-loading">
                    <Loader2 size={20} className="animate-spin text-slate-400" />
                    <span className="text-sm text-slate-500">Memuat pengaturan...</span>
                  </div>
                ) : (
                  <Controller
                    name="default_register_role"
                    control={control}
                    render={({ field }) => (
                      <AsyncSelect
                        label="Default Registration Role"
                        loadOptions={loadRolesOptions}
                        defaultOptions
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Pilih role untuk pendaftar baru..."
                        error={errors.default_register_role?.message}
                        hint="Berdasarkan role yang dipilih, modul yang dapat diakses oleh pendaftar baru akan mengikuti mapping hak akses dari role ini."
                      />
                    )}
                  />
                )}
              </div>
            </div>

            {/* Section 3: Role Superadmin Utama */}
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
                  <Controller
                    name="superadmin_role"
                    control={control}
                    render={({ field }) => (
                      <AsyncSelect
                        label="System Superadmin Role"
                        loadOptions={loadRolesOptions}
                        defaultOptions
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Pilih role superadmin..."
                        error={errors.superadmin_role?.message}
                        hint="Role yang dipilih akan dikenali secara dinamis oleh backend & frontend SSO sebagai Superadmin utama tanpa tergantung nilai hardcode."
                      />
                    )}
                  />
                )}
              </div>
            </div>

            {/* Section 4: Google Workspace */}
            <div className="settings-section-card card">
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
                        placeholder="Misal: student.campus.ac.id"
                        error={errors.google_workspace_domain?.message}
                        hint="Domain untuk alamat email mahasiswa (tanpa @)."
                        {...register('google_workspace_domain')}
                      />
                      <Input
                        label="Admin Email (Impersonation)"
                        placeholder="admin@campus.ac.id"
                        error={errors.google_workspace_admin_email?.message}
                        hint="Email Admin G-Suite utama dengan akses Directory API."
                        {...register('google_workspace_admin_email')}
                      />
                    </div>
                    <Textarea
                      label="Credentials JSON (Service Account)"
                      placeholder='{"type": "service_account", "project_id": "...", ...}'
                      rows={4}
                      error={errors.google_workspace_credentials?.message}
                      hint="Tempel isi file JSON Service Account dari Google Cloud Console."
                      {...register('google_workspace_credentials')}
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
                      type="button"
                      onClick={() => reset()}
                      disabled={isSaving}
                    >
                      Batalkan
                    </Button>
                  )}
                  <Button
                    type="submit"
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
                Konfigurasi ini menentukan perilaku dinamis SSO Campus untuk pengiriman email notifikasi, pendaftaran publik, dan penentuan otoritas Superadmin sistem.
              </p>
              <div className="settings-info-divider" />
              <div className="space-y-3 mt-4 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2">
                  <Server size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Server SMTP:</strong> Mengontrol server keluar untuk pengiriman email lupa password, aktivasi akun, dan notifikasi kampus.</span>
                </div>
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
                type="button"
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
      </form>
    </div>
  );
}
