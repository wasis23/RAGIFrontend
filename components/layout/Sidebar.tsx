'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  ShieldCheck,
  Smartphone,
  Users,
  ShieldAlert,
  Key,
  Lock,
  UserCheck,
  Activity,
  History,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  Building2,
  Briefcase,
  Contact,
  Award,
  FileText,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  CheckSquare,
  List,
  Home,
  UserPlus,
  PieChart
} from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { SYSTEM_MODULES } from '@/lib/constants';
import { menuService } from '@/services/menu.service';
import { Menu } from '@/types/menu';

// Helper to map DB string icons to Lucide components
const getIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'FaHome': Home,
    'FaUserPlus': UserPlus,
    'FaChartPie': PieChart,
    'FaUsers': Users,
    'FaList': List,
    'FaShieldAlt': ShieldAlert,
  };
  const IconComponent = iconMap[iconName] || LayoutDashboard;
  return <IconComponent className="sidebar-item-icon" />;
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebar_open, toggleSidebar } = useUiStore();
  const { user, isAdmin } = useAuth();
  const [simpegOpen, setSimpegOpen] = useState(pathname.startsWith('/simpeg'));
  const [adminOpen, setAdminOpen] = useState(pathname.startsWith('/admin'));
  
  const [dynamicMenus, setDynamicMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine module based on hostname
  // We can roughly guess it from window.location in client component
  const getModule = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.startsWith('spmb.')) return 'SPMB';
    }
    return 'sso';
  };

  useEffect(() => {
    if (user) {
      const fetchMenus = async () => {
        try {
          const menus = await menuService.getMyMenus(getModule());
          setDynamicMenus(menus);
        } catch (error) {
          console.error("Failed to load menus", error);
        } finally {
          setLoading(false);
        }
      };
      fetchMenus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const isMainActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <aside className={`sidebar ${sidebar_open ? '' : 'sidebar-collapsed'}`}>
      {/* Brand */}
      <div className="sidebar-brand" style={{ justifyContent: sidebar_open ? 'space-between' : 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="sidebar-logo">
            <GraduationCap size={22} color="white" />
          </div>
          {sidebar_open && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                SSO Campus
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>
                Auth Center v1.0
              </div>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="btn btn-ghost btn-icon btn-sm hide-mobile"
          style={{ color: 'rgba(255,255,255,0.5)', padding: 4 }}
          title={sidebar_open ? 'Sembunyikan Sidebar' : 'Tampilkan Sidebar'}
        >
          {sidebar_open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        
        {/* Dynamic Menus from Database */}
        <div className="sidebar-section">
          {sidebar_open && <div className="sidebar-section-label">Menu Utama</div>}
          
          {loading ? (
            <div style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)' }}>Loading menus...</div>
          ) : (
            dynamicMenus.map((menu) => (
              <div key={menu.id}>
                <Link
                  href={menu.url}
                  className={`sidebar-item ${isMainActive(menu.url) ? 'active' : ''}`}
                  title={menu.name}
                >
                  {getIcon(menu.icon)}
                  {sidebar_open && <span>{menu.name}</span>}
                </Link>
                {menu.children && menu.children.length > 0 && sidebar_open && (
                  <div style={{ paddingLeft: '1rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                    {menu.children.map(child => (
                      <Link
                        key={child.id}
                        href={child.url}
                        className={`sidebar-item ${isMainActive(child.url) ? 'active' : ''}`}
                        title={child.name}
                        style={{ padding: '0.35rem 0.75rem', minHeight: '32px' }}
                      >
                        {getIcon(child.icon)}
                        <span>{child.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Profile & Security Section */}
        <div className="sidebar-section">
          {sidebar_open && <div className="sidebar-section-label">Akun & Keamanan</div>}
          <Link
            href="/profile"
            className={`sidebar-item ${isMainActive('/profile') && !isMainActive('/profile/') ? 'active' : ''}`}
            title="Profil Saya"
          >
            <User className="sidebar-item-icon" />
            {sidebar_open && <span>Profil Saya</span>}
          </Link>
          <Link
            href="/profile/sessions"
            className={`sidebar-item ${isMainActive('/profile/sessions') ? 'active' : ''}`}
            title="Sesi Aktif"
          >
            <Smartphone className="sidebar-item-icon" />
            {sidebar_open && <span>Sesi Perangkat</span>}
          </Link>
          <Link
            href="/profile/mfa"
            className={`sidebar-item ${isMainActive('/profile/mfa') ? 'active' : ''}`}
            title="2FA / MFA"
          >
            <ShieldCheck className="sidebar-item-icon" />
            {sidebar_open && <span>Autentikasi 2FA</span>}
          </Link>
        </div>

        {/* Admin Section (Conditional & Collapsible) */}
        {isAdmin && (
          <div className="sidebar-section">
            {sidebar_open && (
              <button
                type="button"
                onClick={() => setAdminOpen(!adminOpen)}
                className="sidebar-section-label"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#f87171',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  transition: 'background 0.2s ease',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                  Admin Panel
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    transform: adminOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
            )}

            {(adminOpen || !sidebar_open) && (
              <>
                <Link
                  href="/admin/users"
                  className={`sidebar-item ${isMainActive('/admin/users') ? 'active' : ''}`}
                  title="Manajemen User"
                >
                  <Users className="sidebar-item-icon" />
                  {sidebar_open && <span>User</span>}
                </Link>
                <Link
                  href="/admin/roles"
                  className={`sidebar-item ${isMainActive('/admin/roles') ? 'active' : ''}`}
                  title="Manajemen Role"
                >
                  <ShieldAlert className="sidebar-item-icon" />
                  {sidebar_open && <span>Role Akses</span>}
                </Link>
                <Link
                  href="/admin/permissions"
                  className={`sidebar-item ${isMainActive('/admin/permissions') ? 'active' : ''}`}
                  title="Manajemen Permission"
                >
                  <Key className="sidebar-item-icon" />
                  {sidebar_open && <span>Permission Akses</span>}
                </Link>
                <Link
                  href="/admin/role-permissions"
                  className={`sidebar-item ${isMainActive('/admin/role-permissions') ? 'active' : ''}`}
                  title="Role & Permission"
                >
                  <Lock className="sidebar-item-icon" />
                  {sidebar_open && <span>Role ↔ Permission</span>}
                </Link>
                <Link
                  href="/admin/user-roles"
                  className={`sidebar-item ${isMainActive('/admin/user-roles') ? 'active' : ''}`}
                  title="User & Role"
                >
                  <UserCheck className="sidebar-item-icon" />
                  {sidebar_open && <span>User ↔ Role</span>}
                </Link>
                <Link
                  href="/admin/sessions"
                  className={`sidebar-item ${isMainActive('/admin/sessions') ? 'active' : ''}`}
                  title="Monitor Sesi"
                >
                  <Activity className="sidebar-item-icon" />
                  {sidebar_open && <span>Monitor Sesi</span>}
                </Link>
                <Link
                  href="/admin/audit-logs"
                  className={`sidebar-item ${isMainActive('/admin/audit-logs') ? 'active' : ''}`}
                  title="Audit Logs"
                >
                  <History className="sidebar-item-icon" />
                  {sidebar_open && <span>Audit Logs</span>}
                </Link>
              </>
            )}
          </div>
        )}

        {/* SIMPEG Section (Collapsible) */}
        <div className="sidebar-section">
          {sidebar_open && (
            <button
              type="button"
              onClick={() => setSimpegOpen(!simpegOpen)}
              className="sidebar-section-label"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#a5b4fc',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                transition: 'background 0.2s ease',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                SIMPEG (Kepegawaian)
              </span>
              <ChevronDown
                size={16}
                style={{
                  transform: simpegOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>
          )}

          {(simpegOpen || !sidebar_open) && (
            <>
              <Link
                href="/simpeg"
                className={`sidebar-item ${isMainActive('/simpeg') ? 'active' : ''}`}
                title="Dashboard SIMPEG"
              >
                <Contact className="sidebar-item-icon" style={{ color: '#818cf8' }} />
                {sidebar_open && <span>Dashboard SIMPEG</span>}
              </Link>
              <Link
                href="/simpeg/unit-kerja"
                className={`sidebar-item ${isMainActive('/simpeg/unit-kerja') ? 'active' : ''}`}
                title="Unit Kerja"
              >
                <Building2 className="sidebar-item-icon" style={{ color: '#818cf8' }} />
                {sidebar_open && <span>Unit Kerja</span>}
              </Link>
              <Link
                href="/simpeg/jabatan"
                className={`sidebar-item ${isMainActive('/simpeg/jabatan') ? 'active' : ''}`}
                title="Jabatan & Jafung"
              >
                <Briefcase className="sidebar-item-icon" style={{ color: '#818cf8' }} />
                {sidebar_open && <span>Jabatan & Jafung</span>}
              </Link>
              <Link
                href="/simpeg/pegawai"
                className={`sidebar-item ${isMainActive('/simpeg/pegawai') ? 'active' : ''}`}
                title="Data Pegawai"
              >
                <Users className="sidebar-item-icon" style={{ color: '#818cf8' }} />
                {sidebar_open && <span>Data Pegawai</span>}
              </Link>
              <Link
                href="/simpeg/dokumen"
                className={`sidebar-item ${isMainActive('/simpeg/dokumen') ? 'active' : ''}`}
                title="Dokumen E-File"
              >
                <FileText className="sidebar-item-icon" style={{ color: '#818cf8' }} />
                {sidebar_open && <span>Dokumen E-File</span>}
              </Link>
              <Link
                href="/simpeg/cuti"
                className={`sidebar-item ${isMainActive('/simpeg/cuti') ? 'active' : ''}`}
                title="Pengajuan Cuti"
              >
                <Calendar className="sidebar-item-icon" style={{ color: '#818cf8' }} />
                {sidebar_open && <span>Pengajuan Cuti</span>}
              </Link>
              <Link
                href="/simpeg/presensi"
                className={`sidebar-item ${isMainActive('/simpeg/presensi') ? 'active' : ''}`}
                title="Absensi & Presensi"
              >
                <Clock className="sidebar-item-icon" style={{ color: '#818cf8' }} />
                {sidebar_open && <span>Absensi & Presensi</span>}
              </Link>
              <Link
                href="/simpeg/payroll"
                className={`sidebar-item ${isMainActive('/simpeg/payroll') ? 'active' : ''}`}
                title="Slip Gaji & Payroll"
              >
                <DollarSign className="sidebar-item-icon" style={{ color: '#818cf8' }} />
                {sidebar_open && <span>Slip Gaji & Payroll</span>}
              </Link>
              <Link
                href="/simpeg/usulan-jafung"
                className={`sidebar-item ${isMainActive('/simpeg/usulan-jafung') ? 'active' : ''}`}
                title="Usulan Jafung (KUM)"
              >
                <TrendingUp className="sidebar-item-icon" style={{ color: '#818cf8' }} />
                {sidebar_open && <span>Usulan Jafung (KUM)</span>}
              </Link>
              <Link
                href="/simpeg/kinerja"
                className={`sidebar-item ${isMainActive('/simpeg/kinerja') ? 'active' : ''}`}
                title="Penilaian Kinerja BKD"
              >
                <CheckSquare className="sidebar-item-icon" style={{ color: '#818cf8' }} />
                {sidebar_open && <span>Kinerja SKP & BKD</span>}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Footer Info */}
      {sidebar_open && user && (
        <div className="sidebar-footer">
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <div className="avatar avatar-sm">
              {user.username ? user.username.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.username}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                {user.user_type}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
