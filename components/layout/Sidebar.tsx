'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
  PieChart,
  Search
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
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  
  const { sidebar_open, toggleSidebar } = useUiStore();
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const [ssoPanelOpen, setSsoPanelOpen] = useState(pathname.startsWith('/admin'));
  
  const [dynamicMenus, setDynamicMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine module based on pathname or hostname
  const getModule = () => {
    let mod = 'sso';
    if (pathname.startsWith('/simpeg')) mod = 'simpeg';
    else if (pathname.startsWith('/sippm')) mod = 'sippm';
    else if (pathname.startsWith('/sikeu')) mod = 'sikeu';
    else if (pathname.startsWith('/spmb')) mod = 'spmb';
    else if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.startsWith('spmb.')) mod = 'spmb';
      else if (hostname.startsWith('simpeg.')) mod = 'simpeg';
      else if (hostname.startsWith('sippm.')) mod = 'sippm';
      else if (hostname.startsWith('sikeu.')) mod = 'sikeu';
    }

    if (typeof window !== 'undefined') {
      if (pathname.startsWith('/profile')) {
        const savedMod = localStorage.getItem('last_active_module');
        if (savedMod) return savedMod;
      } else {
        localStorage.setItem('last_active_module', mod);
      }
    }
    return mod;
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
        
        {sidebar_open && (
          <div style={{ padding: '0.75rem 1rem 0.25rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input 
                type="text" 
                placeholder="Cari Menu..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '0.75rem',
                  padding: '0.375rem 0.5rem 0.375rem 2rem',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* SIKEU Static / Fallback Left Sidebar Navigation */}
        {pathname.startsWith('/sikeu') && (() => {
          const sikeuMenus = [
            { name: 'Dashboard Keuangan', url: '/sikeu', icon: LayoutDashboard, section: 'Transaksi & Operasional' },
            { name: 'Portal Kabag Keuangan', url: '/sikeu/kabag', icon: ShieldCheck, section: 'Transaksi & Operasional' },
            { name: 'Payment Gateway API', url: '/sikeu/payment-gateway', icon: Key, section: 'Transaksi & Operasional' },
            { name: 'Tagihan & Semester', url: '/sikeu/tagihan', icon: FileText, section: 'Transaksi & Operasional' },
            { name: 'Kas Unit & Kas Kabag', url: '/sikeu/unit-kas', icon: DollarSign, section: 'Transaksi & Operasional' },
            { name: 'Approval Pimpinan', url: '/sikeu/approval', icon: CheckSquare, section: 'Transaksi & Operasional' },
            { name: 'Dispensasi Pembayaran', url: '/sikeu/dispensasi', icon: User, section: 'Transaksi & Operasional' },
            { name: 'Akuntansi & Jurnal', url: '/sikeu/akuntansi', icon: PieChart, section: 'Transaksi & Operasional' },
            { name: 'Pemasukan Kampus', url: '/sikeu/pemasukan', icon: TrendingUp, section: 'Transaksi & Operasional' },
            { name: 'Pengeluaran Operasional', url: '/sikeu/pengeluaran', icon: Clock, section: 'Transaksi & Operasional' },
            { name: 'Pajak & Potongan', url: '/sikeu/pajak', icon: Award, section: 'Transaksi & Operasional' },
            { name: 'Riwayat Pembayaran', url: '/sikeu/pembayaran', icon: List, section: 'Transaksi & Operasional' },

            // Master SIKEU Keuangan separate menus
            { name: 'Master Komponen Biaya', url: '/sikeu/master?tab=jenis-biaya', icon: Building2, section: 'Master SIKEU Keuangan' },
            { name: 'Master Jalur & Kelas', url: '/sikeu/master?tab=jalur-kelas', icon: Building2, section: 'Master SIKEU Keuangan' },
            { name: 'Tarif Angkatan', url: '/sikeu/master?tab=tarif', icon: Calendar, section: 'Master SIKEU Keuangan' },
            { name: 'Master Beasiswa', url: '/sikeu/master?tab=beasiswa', icon: Award, section: 'Master SIKEU Keuangan' },
            { name: 'Penetapan Tagihan', url: '/sikeu/master?tab=student-types', icon: UserCheck, section: 'Master SIKEU Keuangan' },
            { name: 'Penerima Beasiswa', url: '/sikeu/master?tab=mapping-beasiswa', icon: Users, section: 'Master SIKEU Keuangan' },
            { name: 'Master Unit Kas', url: '/sikeu/master?tab=unit-kas-master', icon: DollarSign, section: 'Master SIKEU Keuangan' },
          ];

          const filteredMenus = sikeuMenus.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
          
          const groups = filteredMenus.reduce((acc, curr) => {
            if (!acc[curr.section]) acc[curr.section] = [];
            acc[curr.section].push(curr);
            return acc;
          }, {} as Record<string, typeof sikeuMenus>);

          return (
            <div className="sidebar-section">
              {Object.entries(groups).map(([sectionName, items]) => (
                <div key={sectionName} style={{ marginBottom: '1rem' }}>
                  {sidebar_open && <div className="sidebar-section-label" style={{ marginBottom: '0.5rem' }}>{sectionName}</div>}
                  {items.map((item, idx) => {
                    const IconComponent = item.icon;
                    let isActive = false;
                    if (item.url.includes('?tab=')) {
                      const itemTab = item.url.split('?tab=')[1];
                      isActive = pathname === '/sikeu/master' && (currentTab === itemTab || (!currentTab && itemTab === 'jenis-biaya'));
                    } else {
                      isActive = pathname === item.url || (item.url !== '/sikeu' && pathname.startsWith(item.url) && !pathname.startsWith('/sikeu/master'));
                    }

                    return (
                      <Link
                        key={idx}
                        href={item.url}
                        className={`sidebar-item ${isActive ? 'active' : ''}`}
                        title={item.name}
                      >
                        <IconComponent className="sidebar-item-icon" />
                        {sidebar_open && <span>{item.name}</span>}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })()}

        {/* Dynamic Menus from Database */}
        {!pathname.startsWith('/sikeu') && (
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
        )}

        {/* Profile & Security Section */}
        <div className="sidebar-section">
          {sidebar_open && <div className="sidebar-section-label">Akun & Keamanan</div>}
          <Link
            href="/profile"
            className={`sidebar-item ${pathname === '/profile' ? 'active' : ''}`}
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
