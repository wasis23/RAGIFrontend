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
    'FaBuilding': Building2,
    'FaBoxes': List,
    'FaWrench': Activity,
    'FaShoppingCart': CheckSquare,
  };
  const IconComponent = iconMap[iconName] || LayoutDashboard;
  return <IconComponent className="sidebar-item-icon" />;
};

const SINAPRA_FALLBACK_MENUS: Menu[] = [
  { id: 901, parent_id: null, name: 'Gedung & Ruangan', url: '/sinapra/gedung-ruangan', icon: 'FaBuilding', module: 'sinapra', permission_id: null, order_index: 1, is_active: true },
  { id: 902, parent_id: null, name: 'Inventaris Aset', url: '/sinapra/aset', icon: 'FaBoxes', module: 'sinapra', permission_id: null, order_index: 2, is_active: true },
  { id: 903, parent_id: null, name: 'Peminjaman', url: '/sinapra/peminjaman', icon: 'FaCalendarCheck', module: 'sinapra', permission_id: null, order_index: 3, is_active: true },
  { id: 904, parent_id: null, name: 'Maintenance', url: '/sinapra/maintenance', icon: 'FaWrench', module: 'sinapra', permission_id: null, order_index: 4, is_active: true },
  { id: 905, parent_id: null, name: 'Pengadaan Barang', url: '/sinapra/pengadaan', icon: 'FaShoppingCart', module: 'sinapra', permission_id: null, order_index: 5, is_active: true },
];

const SPMB_STUDENT_FALLBACK_MENUS: Menu[] = [
  { id: 801, parent_id: null, name: 'Dashboard SPMB', url: '/spmb/dashboard', icon: 'FaChartPie', module: 'spmb', permission_id: null, order_index: 1, is_active: true },
  { id: 802, parent_id: null, name: 'Formulir Registrasi', url: '/spmb/registrasi', icon: 'FaUserPlus', module: 'spmb', permission_id: null, order_index: 2, is_active: true },
  { id: 803, parent_id: null, name: 'Kartu & Jadwal Ujian', url: '/spmb/ujian', icon: 'FaFileAlt', module: 'spmb', permission_id: null, order_index: 3, is_active: true },
  { id: 804, parent_id: null, name: 'Hasil Seleksi', url: '/spmb/seleksi', icon: 'FaTrophy', module: 'spmb', permission_id: null, order_index: 4, is_active: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  
  const { sidebar_open, toggleSidebar } = useUiStore();
  const { user, isSuperAdmin, isAdmin } = useAuth();

  const userRoleSlugs = (user?.roles || []).map((r: any) =>
    (typeof r === 'string' ? r : r.slug || r.name || '').toLowerCase()
  );

  const isPanitiaAdmin =
    isSuperAdmin ||
    isAdmin ||
    userRoleSlugs.some((slug) =>
      ['admin', 'superadmin', 'super-admin', 'admin_spmb', 'panitia_spmb', 'operator_spmb', 'admin_iam'].includes(slug)
    );

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
    else if (pathname.startsWith('/sinapra')) mod = 'sinapra';
    else if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.startsWith('spmb.')) mod = 'spmb';
      else if (hostname.startsWith('simpeg.')) mod = 'simpeg';
      else if (hostname.startsWith('sippm.')) mod = 'sippm';
      else if (hostname.startsWith('sikeu.')) mod = 'sikeu';
      else if (hostname.startsWith('sinapra.')) mod = 'sinapra';
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
          const mod = getModule();
          const menus = await menuService.getMyMenus(mod);
          if (menus && menus.length > 0) {
            setDynamicMenus(menus);
          } else if (mod === 'spmb' && !isPanitiaAdmin) {
            setDynamicMenus(SPMB_STUDENT_FALLBACK_MENUS);
          } else if (mod === 'sinapra') {
            setDynamicMenus(SINAPRA_FALLBACK_MENUS);
          } else {
            setDynamicMenus([]);
          }
        } catch (error) {
          console.error("Failed to load menus", error);
          if (getModule() === 'spmb' && !isPanitiaAdmin) {
            setDynamicMenus(SPMB_STUDENT_FALLBACK_MENUS);
          } else if (getModule() === 'sinapra') {
            setDynamicMenus(SINAPRA_FALLBACK_MENUS);
          }
        } finally {
          setLoading(false);
        }
      };
      fetchMenus();
    } else {
      if (getModule() === 'spmb' && !isPanitiaAdmin) {
        setDynamicMenus(SPMB_STUDENT_FALLBACK_MENUS);
      } else if (getModule() === 'sinapra') {
        setDynamicMenus(SINAPRA_FALLBACK_MENUS);
      }
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

        {/* SIKEU Navigation Sidebar */}
        {pathname.startsWith('/sikeu') && (() => {
          const sikeuMenus = [
            // 1. Dashboard & Portal Overview
            { name: 'Dashboard Keuangan', url: '/sikeu', icon: LayoutDashboard, section: 'Overview Keuangan' },
            { name: 'Portal Kabag Keuangan', url: '/sikeu/kabag', icon: ShieldCheck, section: 'Overview Keuangan' },
            { name: 'Approval Pimpinan', url: '/sikeu/approval', icon: CheckSquare, section: 'Overview Keuangan' },

            // 2. Master Data Keuangan
            { name: 'Master Biaya', url: '/sikeu/master', icon: Building2, section: 'Master Data Keuangan' },
            { name: 'Kas Unit & Rekening', url: '/sikeu/unit-kas', icon: DollarSign, section: 'Master Data Keuangan' },
            { name: 'Payment Gateway', url: '/sikeu/payment-gateway', icon: Key, section: 'Master Data Keuangan' },

            // 3. Transaksi Pembayaran Mahasiswa
            { name: 'Tagihan & Invoice', url: '/sikeu/tagihan', icon: FileText, section: 'Pembayaran Mahasiswa' },
            { name: 'Histori Pembayaran', url: '/sikeu/pembayaran', icon: List, section: 'Pembayaran Mahasiswa' },
            { name: 'Dispensasi Pembayaran', url: '/sikeu/dispensasi', icon: User, section: 'Pembayaran Mahasiswa' },

            // 4. Pengeluaran & Akuntansi
            { name: 'Pengeluaran Operasional', url: '/sikeu/pengeluaran', icon: Clock, section: 'Pengeluaran & Akuntansi' },
            { name: 'Pemasukan Non-Akademik', url: '/sikeu/pemasukan', icon: TrendingUp, section: 'Pengeluaran & Akuntansi' },
            { name: 'Akuntansi & Jurnal', url: '/sikeu/akuntansi', icon: PieChart, section: 'Pengeluaran & Akuntansi' },
            { name: 'Pajak & Potongan', url: '/sikeu/pajak', icon: Award, section: 'Pengeluaran & Akuntansi' },
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
                    const isActive = item.url === '/sikeu'
                      ? pathname === '/sikeu'
                      : pathname === item.url || pathname.startsWith(item.url + '/');

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
        {!pathname.startsWith('/sikeu') && (() => {
          const filterMenuChildren = (children?: Menu[]) => {
            if (!children) return [];
            if (!searchQuery) return children;
            return children.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
          };

          // Deduplicate menus by normalized URL or Name
          const uniqueDynamicMenus: Menu[] = [];
          const seenKeys = new Set<string>();

          for (const menu of dynamicMenus) {
            const normalizedUrl = menu.url.replace(/\/$/, '');
            const key = menu.url.startsWith('#')
              ? `header|${menu.name.toLowerCase().trim()}`
              : `link|${menu.name.toLowerCase().trim()}|${normalizedUrl.replace('/dashboard', '')}`;
            
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              uniqueDynamicMenus.push(menu);
            }
          }

          const activeDynamicMenus = uniqueDynamicMenus.filter(menu => {
            if (menu.url.startsWith('#')) {
              return filterMenuChildren(menu.children).length > 0;
            }
            if (!searchQuery) return true;
            return menu.name.toLowerCase().includes(searchQuery.toLowerCase()) || filterMenuChildren(menu.children).length > 0;
          });

          if (!loading && activeDynamicMenus.length === 0) {
            return null;
          }

          return (
            <div className="sidebar-section">
              {sidebar_open && <div className="sidebar-section-label">Menu Utama</div>}
              
              {loading ? (
                <div className="sidebar-loading">Loading menus...</div>
              ) : (
                activeDynamicMenus.map((menu) => {
                  if (menu.url.startsWith('#')) {
                    const validChildren = filterMenuChildren(menu.children);
                    if (validChildren.length === 0) return null;

                    return (
                      <div key={menu.id}>
                        <div className="sidebar-group-title">
                          {sidebar_open && menu.name}
                        </div>
                        {validChildren.map(child => (
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
                      </div>
                    );
                  }

                  const validSubChildren = filterMenuChildren(menu.children);

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
                      {validSubChildren.length > 0 && sidebar_open && (
                        <div className="sidebar-submenu">
                          {validSubChildren.map(child => (
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
          );
        })()}

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
