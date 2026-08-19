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
      <div 
        className="sidebar-brand" 
        style={{ 
          justifyContent: sidebar_open ? 'space-between' : 'center',
          cursor: sidebar_open ? 'default' : 'pointer',
          padding: sidebar_open ? '1.25rem 1.5rem' : '1.25rem 0'
        }}
        onClick={!sidebar_open ? toggleSidebar : undefined}
        title={!sidebar_open ? 'Tampilkan Sidebar' : undefined}
      >
        <div className="sidebar-brand-inner">
          <div className="sidebar-logo">
            <GraduationCap size={22} color="white" />
          </div>
          {sidebar_open && (
            <div>
              <div className="sidebar-brand-text">SSO Campus</div>
              <div className="sidebar-brand-sub">Auth Center v1.0</div>
            </div>
          )}
        </div>
        {sidebar_open && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
            className="btn btn-ghost btn-icon btn-sm hide-mobile sidebar-toggle"
            title="Sembunyikan Sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        
        {sidebar_open && (
          <div className="sidebar-search">
            <div className="sidebar-search-wrap">
              <Search size={14} className="sidebar-search-icon" />
              <input 
                type="text" 
                placeholder="Cari Menu..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sidebar-search-input"
              />
            </div>
          </div>
        )}

        {/* SIKEU Static / Fallback Left Sidebar Navigation */}
        {pathname.startsWith('/sikeu') && (() => {
          const sikeuMenus = [
            // 1. Transaksi Pembayaran Mahasiswa
            { name: 'Tagihan & Semester', url: '/sikeu/tagihan', icon: FileText, section: 'Transaksi Pembayaran Mahasiswa' },
            { name: 'Dispensasi Pembayaran', url: '/sikeu/dispensasi', icon: User, section: 'Transaksi Pembayaran Mahasiswa' },
            { name: 'Riwayat Pembayaran', url: '/sikeu/pembayaran', icon: List, section: 'Transaksi Pembayaran Mahasiswa' },

            // 2. Master SIKEU Keuangan
            { name: 'Master Komponen Biaya', url: '/sikeu/master?tab=jenis-biaya', icon: Building2, section: 'Master SIKEU Keuangan' },
            { name: 'Master Jalur & Kelas', url: '/sikeu/master?tab=jalur-kelas', icon: Building2, section: 'Master SIKEU Keuangan' },
            { name: 'Tarif Angkatan', url: '/sikeu/master?tab=tarif', icon: Calendar, section: 'Master SIKEU Keuangan' },
            { name: 'Master Beasiswa', url: '/sikeu/master?tab=beasiswa', icon: Award, section: 'Master SIKEU Keuangan' },
            { name: 'Penetapan Tagihan', url: '/sikeu/master?tab=student-types', icon: UserCheck, section: 'Master SIKEU Keuangan' },
            { name: 'Penerima Beasiswa', url: '/sikeu/master?tab=mapping-beasiswa', icon: Users, section: 'Master SIKEU Keuangan' },
            { name: 'Master Unit Kas', url: '/sikeu/master?tab=unit-kas-master', icon: DollarSign, section: 'Master SIKEU Keuangan' },

            // 3. Transaksi Akuntansi & Operasional
            { name: 'Kas Unit & Kas Kabag', url: '/sikeu/unit-kas', icon: DollarSign, section: 'Transaksi Akuntansi & Operasional' },
            { name: 'Akuntansi & Jurnal', url: '/sikeu/akuntansi', icon: PieChart, section: 'Transaksi Akuntansi & Operasional' },
            { name: 'Pemasukan Kampus', url: '/sikeu/pemasukan', icon: TrendingUp, section: 'Transaksi Akuntansi & Operasional' },
            { name: 'Pengeluaran Operasional', url: '/sikeu/pengeluaran', icon: Clock, section: 'Transaksi Akuntansi & Operasional' },
            { name: 'Pajak & Potongan', url: '/sikeu/pajak', icon: Award, section: 'Transaksi Akuntansi & Operasional' },

            // 4. Portal & Pengaturan Keuangan
            { name: 'Dashboard Keuangan', url: '/sikeu', icon: LayoutDashboard, section: 'Portal & Pengaturan Keuangan' },
            { name: 'Portal Kabag Keuangan', url: '/sikeu/kabag', icon: ShieldCheck, section: 'Portal & Pengaturan Keuangan' },
            { name: 'Approval Pimpinan', url: '/sikeu/approval', icon: CheckSquare, section: 'Portal & Pengaturan Keuangan' },
            { name: 'Payment Gateway API', url: '/sikeu/payment-gateway', icon: Key, section: 'Portal & Pengaturan Keuangan' },
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
                <div key={sectionName} className="sidebar-group">
                  {sidebar_open && <div className="sidebar-section-label">{sectionName}</div>}
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
              <div className="sidebar-loading">Loading menus...</div>
            ) : (
              dynamicMenus.map((menu) => {
                if (menu.url.startsWith('#')) {
                  return (
                    <div key={menu.id}>
                      <div className="sidebar-group-title">
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
                      <div className="sidebar-submenu">
                        {menu.children.map(child => (
                          <Link
                            key={child.id}
                            href={child.url}
                            className={`sidebar-item sidebar-submenu-item ${isMainActive(child.url) ? 'active' : ''}`}
                            title={child.name}
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
          <div className="sidebar-user-card">
            <div className="avatar avatar-sm">
              {user.username ? user.username.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.username}</div>
              <div className="sidebar-user-role">{user.roles?.[0]?.name || user.roles?.[0]?.role?.name || 'User'}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
