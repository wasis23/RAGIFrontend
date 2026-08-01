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

const getIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'FaHome': Home,
    'FaUserPlus': UserPlus,
    'FaChartPie': PieChart,
    'FaUsers': Users,
    'FaList': List,
    'FaShieldAlt': ShieldAlert,
    'FaFileAlt': FileText,
    'FaClipboardCheck': CheckSquare,
    'FaFileCheck': CheckSquare,
    'FaCreditCard': DollarSign,
    'FaBookOpen': FileText,
    'FaAward': Award,
    'FaLayers': List,
    'FaCalendar': Calendar,
    'FaTrophy': Award,
    'FaBriefcase': Briefcase,
    'FaClock': Clock,
    'FaSitemap': Building2,
    'FaMoneyBillWave': DollarSign,
    'FaCalendarCheck': Calendar,
  };
  const IconComponent = iconMap[iconName] || LayoutDashboard;
  return <IconComponent className="sidebar-item-icon" />;
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebar_open, toggleSidebar } = useUiStore();
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const [ssoPanelOpen, setSsoPanelOpen] = useState(pathname.startsWith('/admin'));
  
  const [dynamicMenus, setDynamicMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine module based on pathname or hostname
  const getModule = () => {
    if (pathname.startsWith('/simpeg')) return 'simpeg';
    if (pathname.startsWith('/sippm')) return 'sippm';
    if (pathname.startsWith('/spmb')) return 'spmb';
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.startsWith('spmb.')) return 'spmb';
      if (hostname.startsWith('simpeg.')) return 'simpeg';
      if (hostname.startsWith('sippm.')) return 'sippm';
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
  }, [user, pathname]);

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
            dynamicMenus.map((menu) => {
              if (menu.url.startsWith('#')) {
                return (
                  <div key={menu.id}>
                    <div style={{ marginTop: '1rem', marginBottom: '0.25rem', paddingLeft: '0.75rem', fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {sidebar_open && menu.name}
                    </div>
                    {menu.children && menu.children.length > 0 && (
                      <>
                        {menu.children.map(child => (
                          <Link
                            key={child.id}
                            href={child.url}
                            className={`sidebar-item ${isMainActive(child.url) ? 'active' : ''}`}
                            title={child.name}
                          >
                            {getIcon(child.icon)}
                            {sidebar_open && <span>{child.name}</span>}
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                );
              }

              return (
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
              );
            })
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
                {user.roles?.[0]?.name || user.roles?.[0]?.role?.name || 'User'}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
