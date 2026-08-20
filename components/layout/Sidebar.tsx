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
    'FaUser': User,
    'FaSmartphone': Smartphone,
    'FaShieldCheck': ShieldCheck,
    'FaLock': Lock,
    'FaKey': Key,
  };
  const IconComponent = iconMap[iconName] || LayoutDashboard;
  return <IconComponent className="sidebar-item-icon" />;
};

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  
  const { sidebar_open, toggleSidebar } = useUiStore();
  const { user } = useAuth();

  const [ssoPanelOpen, setSsoPanelOpen] = useState(pathname.startsWith('/admin'));
  
  const [dynamicMenus, setDynamicMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine module based on pathname or hostname dynamically without hardcoding
  const getModule = () => {
    let mod = 'sso';
    
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      if (parts.length > 2 && parts[0] !== 'www') {
        mod = parts[0];
      }
    }

    const firstSegment = pathname.split('/')[1];
    if (firstSegment && firstSegment !== 'profile' && firstSegment !== 'admin' && firstSegment !== 'dashboard') {
      mod = firstSegment;
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
          setDynamicMenus(menus || []);
        } catch (error) {
          console.error("Failed to load menus", error);
          setDynamicMenus([]);
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

        {/* Dynamic Menus from Database (for all modules including SIKEU) */}
        {(() => {
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
