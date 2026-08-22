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
  Search,
  RefreshCw,
  BookOpen
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
    'FaGraduationCap': GraduationCap,
    'FaUserGraduate': GraduationCap,
    'FaChalkboardTeacher': Users,
    'FaExchangeAlt': RefreshCw,
    'FaPen': FileText,
    'FaSyncAlt': RefreshCw,
    'FaCloudUploadAlt': RefreshCw,
    'FaDatabase': List,
  };
  const IconComponent = iconMap[iconName] || LayoutDashboard;
  return <IconComponent className="sidebar-item-icon" />;
};

// Menus SIAKAD untuk Mahasiswa (Portal Mahasiswa Mandiri)
const SIAKAD_MAHASISWA_MENUS: Menu[] = [
  { id: 710, parent_id: null, name: 'Dashboard Mahasiswa', url: '/siakad', icon: 'FaChartPie', module: 'siakad', permission_id: null, order_index: 1, is_active: true },
  { id: 711, parent_id: null, name: 'KRS Semester Aktif', url: '/siakad/krs', icon: 'FaClipboardCheck', module: 'siakad', permission_id: null, order_index: 2, is_active: true },
  { id: 712, parent_id: null, name: 'Jadwal Kuliah & RPS', url: '/siakad/perkuliahan/kelas', icon: 'FaCalendarCheck', module: 'siakad', permission_id: null, order_index: 3, is_active: true },
  { id: 713, parent_id: null, name: 'KHS & Transkrip Nilai', url: '/siakad/nilai', icon: 'FaAward', module: 'siakad', permission_id: null, order_index: 4, is_active: true },
  { id: 714, parent_id: null, name: 'Tagihan SPP (SIKEU)', url: '/sikeu/mahasiswa/tagihan', icon: 'FaCreditCard', module: 'siakad', permission_id: null, order_index: 5, is_active: true },
];

// Menus SIAKAD untuk Dosen (Portal Dosen Pengajar / Wali)
const SIAKAD_DOSEN_MENUS: Menu[] = [
  { id: 720, parent_id: null, name: 'Dashboard Dosen', url: '/siakad', icon: 'FaChartPie', module: 'siakad', permission_id: null, order_index: 1, is_active: true },
  { id: 721, parent_id: null, name: 'Jadwal Mengajar & RPS', url: '/siakad/perkuliahan/kelas', icon: 'FaCalendarCheck', module: 'siakad', permission_id: null, order_index: 2, is_active: true },
  { id: 722, parent_id: null, name: 'Bimbingan & Approval KRS', url: '/siakad/krs', icon: 'FaClipboardCheck', module: 'siakad', permission_id: null, order_index: 3, is_active: true },
  { id: 723, parent_id: null, name: 'Input & Rekap Nilai', url: '/siakad/nilai', icon: 'FaPen', module: 'siakad', permission_id: null, order_index: 4, is_active: true },
  { id: 724, parent_id: null, name: 'Mahasiswa Bimbingan', url: '/siakad/civitas/mahasiswa', icon: 'FaUserGraduate', module: 'siakad', permission_id: null, order_index: 5, is_active: true },
  { id: 725, parent_id: null, name: 'Kurikulum & RPS (OBE)', url: '/siakad/obe', icon: 'FaAward', module: 'siakad', permission_id: null, order_index: 6, is_active: true },
];

// Menus SIAKAD untuk Administrator / BAAK
const SIAKAD_ADMIN_MENUS: Menu[] = [
  { id: 701, parent_id: null, name: 'Dashboard Akademik', url: '/siakad', icon: 'FaGraduationCap', module: 'siakad', permission_id: null, order_index: 1, is_active: true },
  { 
    id: 702, parent_id: null, name: 'MASTER DATA', url: '#master_siakad', icon: 'FaDatabase', module: 'siakad', permission_id: null, order_index: 2, is_active: true,
    children: [
      { id: 7021, parent_id: 702, name: 'Fakultas & Prodi', url: '/siakad/master/fakultas', icon: 'FaBuilding', module: 'siakad', permission_id: null, order_index: 1, is_active: true },
      { id: 7022, parent_id: 702, name: 'Kurikulum', url: '/siakad/master/kurikulum', icon: 'FaBookOpen', module: 'siakad', permission_id: null, order_index: 2, is_active: true },
      { id: 7023, parent_id: 702, name: 'Mata Kuliah', url: '/siakad/master/matakuliah', icon: 'FaList', module: 'siakad', permission_id: null, order_index: 3, is_active: true },
    ]
  },
  {
    id: 703, parent_id: null, name: 'CIVITAS AKADEMIKA', url: '#civitas_siakad', icon: 'FaUsers', module: 'siakad', permission_id: null, order_index: 3, is_active: true,
    children: [
      { id: 7031, parent_id: 703, name: 'Mahasiswa', url: '/siakad/civitas/mahasiswa', icon: 'FaUserGraduate', module: 'siakad', permission_id: null, order_index: 1, is_active: true },
      { id: 7032, parent_id: 703, name: 'Konversi Transfer', url: '/siakad/civitas/konversi', icon: 'FaExchangeAlt', module: 'siakad', permission_id: null, order_index: 2, is_active: true },
      { id: 7033, parent_id: 703, name: 'Dosen', url: '/siakad/civitas/dosen', icon: 'FaChalkboardTeacher', module: 'siakad', permission_id: null, order_index: 3, is_active: true },
    ]
  },
  {
    id: 704, parent_id: null, name: 'PERKULIAHAN & OBE', url: '#perkuliahan_siakad', icon: 'FaCalendarCheck', module: 'siakad', permission_id: null, order_index: 4, is_active: true,
    children: [
      { id: 7041, parent_id: 704, name: 'Kelas & Jadwal', url: '/siakad/perkuliahan/kelas', icon: 'FaCalendarCheck', module: 'siakad', permission_id: null, order_index: 1, is_active: true },
      { id: 7042, parent_id: 704, name: 'KRS Mahasiswa', url: '/siakad/krs', icon: 'FaClipboardCheck', module: 'siakad', permission_id: null, order_index: 2, is_active: true },
      { id: 7043, parent_id: 704, name: 'Input Nilai OBE', url: '/siakad/nilai', icon: 'FaPen', module: 'siakad', permission_id: null, order_index: 3, is_active: true },
      { id: 7044, parent_id: 704, name: 'Kurikulum & RPS (OBE)', url: '/siakad/obe', icon: 'FaAward', module: 'siakad', permission_id: null, order_index: 4, is_active: true },
    ]
  },
  {
    id: 705, parent_id: null, name: 'INTEGRASI DIKTI', url: '#feeder_siakad', icon: 'FaSyncAlt', module: 'siakad', permission_id: null, order_index: 5, is_active: true,
    children: [
      { id: 7051, parent_id: 705, name: 'Sync Neo Feeder', url: '/siakad/feeder-sync', icon: 'FaCloudUploadAlt', module: 'siakad', permission_id: null, order_index: 1, is_active: true },
    ]
  }
];

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
  { id: 804, parent_id: null, name: 'Hasil Seleksi', url: '/spmb/seleksi', icon: 'FaTrophy', module: 'spmb', permission_id: null, order_index: 4, is_active: true },
];

const SIMPEG_FALLBACK_MENUS: Menu[] = [
  { id: 501, parent_id: null, name: 'Dashboard SIMPEG', url: '/simpeg', icon: 'FaChartPie', module: 'simpeg', permission_id: null, order_index: 1, is_active: true },
  {
    id: 503, parent_id: null, name: 'MANAJEMEN KEPEGAWAIAN', url: '#kepegawaian_simpeg', icon: 'FaUsers', module: 'simpeg', permission_id: null, order_index: 2, is_active: true,
    children: [
      { id: 5031, parent_id: 503, name: 'Data Pegawai', url: '/simpeg/pegawai', icon: 'FaUsers', module: 'simpeg', permission_id: null, order_index: 1, is_active: true },
      { id: 5032, parent_id: 503, name: 'E-File & Dokumen', url: '/simpeg/dokumen', icon: 'FaFileAlt', module: 'simpeg', permission_id: null, order_index: 2, is_active: true },
    ]
  },
  {
    id: 504, parent_id: null, name: 'LAYANAN & KINERJA', url: '#layanan_simpeg', icon: 'FaClipboardCheck', module: 'simpeg', permission_id: null, order_index: 3, is_active: true,
    children: [
      { id: 5041, parent_id: 504, name: 'Presensi & Absensi', url: '/simpeg/presensi', icon: 'FaClock', module: 'simpeg', permission_id: null, order_index: 1, is_active: true },
      { id: 5042, parent_id: 504, name: 'Pengajuan Cuti', url: '/simpeg/cuti', icon: 'FaCalendar', module: 'simpeg', permission_id: null, order_index: 2, is_active: true },
      { id: 5043, parent_id: 504, name: 'Payroll & Slip Gaji', url: '/simpeg/payroll', icon: 'FaMoneyBillWave', module: 'simpeg', permission_id: null, order_index: 3, is_active: true },
      { id: 5044, parent_id: 504, name: 'Usulan Jafung (KUM)', url: '/simpeg/usulan-jafung', icon: 'FaAward', module: 'simpeg', permission_id: null, order_index: 4, is_active: true },
      { id: 5045, parent_id: 504, name: 'Evaluasi Kinerja SKP', url: '/simpeg/kinerja', icon: 'FaChartPie', module: 'simpeg', permission_id: null, order_index: 5, is_active: true },
    ]
  },
  {
    id: 502, parent_id: null, name: 'MASTER DATA SDM', url: '#master_simpeg', icon: 'FaDatabase', module: 'simpeg', permission_id: null, order_index: 4, is_active: true,
    children: [
      { id: 5021, parent_id: 502, name: 'Unit Kerja', url: '/simpeg/unit-kerja', icon: 'FaSitemap', module: 'simpeg', permission_id: null, order_index: 1, is_active: true },
      { id: 5022, parent_id: 502, name: 'Jabatan & Jafung', url: '/simpeg/jabatan', icon: 'FaBriefcase', module: 'simpeg', permission_id: null, order_index: 2, is_active: true },
    ]
  },
];

const SIKEU_FALLBACK_MENUS: Menu[] = [
  { id: 601, parent_id: null, name: 'Dashboard Keuangan', url: '/sikeu', icon: 'FaChartPie', module: 'sikeu', permission_id: null, order_index: 1, is_active: true },
  {
    id: 602, parent_id: null, name: 'OPERASIONAL KEUANGAN', url: '#operasional_sikeu', icon: 'FaCreditCard', module: 'sikeu', permission_id: null, order_index: 2, is_active: true,
    children: [
      { id: 6021, parent_id: 602, name: 'Tagihan SPP & UKT', url: '/sikeu/tagihan', icon: 'FaCreditCard', module: 'sikeu', permission_id: null, order_index: 1, is_active: true },
      { id: 6022, parent_id: 602, name: 'Pembayaran SPP', url: '/sikeu/pembayaran', icon: 'FaMoneyBillWave', module: 'sikeu', permission_id: null, order_index: 2, is_active: true },
      { id: 6023, parent_id: 602, name: 'Pemasukan Kas', url: '/sikeu/pemasukan', icon: 'FaList', module: 'sikeu', permission_id: null, order_index: 3, is_active: true },
      { id: 6024, parent_id: 602, name: 'Pengeluaran Kas', url: '/sikeu/pengeluaran', icon: 'FaList', module: 'sikeu', permission_id: null, order_index: 4, is_active: true },
      { id: 6025, parent_id: 602, name: 'Dispensasi Pembayaran', url: '/sikeu/dispensasi', icon: 'FaClipboardCheck', module: 'sikeu', permission_id: null, order_index: 5, is_active: true },
      { id: 6026, parent_id: 602, name: 'Approval Pimpinan', url: '/sikeu/approval', icon: 'FaShieldCheck', module: 'sikeu', permission_id: null, order_index: 6, is_active: true },
      { id: 6027, parent_id: 602, name: 'Payment Gateway', url: '/sikeu/payment-gateway', icon: 'FaCreditCard', module: 'sikeu', permission_id: null, order_index: 7, is_active: true },
      { id: 6028, parent_id: 602, name: 'Pajak & Perpajakan', url: '/sikeu/pajak', icon: 'FaFileAlt', module: 'sikeu', permission_id: null, order_index: 8, is_active: true },
    ]
  },
  {
    id: 603, parent_id: null, name: 'AKUNTANSI & LAPORAN', url: '#akuntansi_sikeu', icon: 'FaBookOpen', module: 'sikeu', permission_id: null, order_index: 3, is_active: true,
    children: [
      { id: 6031, parent_id: 603, name: 'Jurnal Umum', url: '/sikeu/akuntansi/jurnal', icon: 'FaFileAlt', module: 'sikeu', permission_id: null, order_index: 1, is_active: true },
      { id: 6032, parent_id: 603, name: 'Buku Besar', url: '/sikeu/akuntansi/buku-besar', icon: 'FaBookOpen', module: 'sikeu', permission_id: null, order_index: 2, is_active: true },
      { id: 6033, parent_id: 603, name: 'Chart of Accounts (COA)', url: '/sikeu/akuntansi/coa', icon: 'FaList', module: 'sikeu', permission_id: null, order_index: 3, is_active: true },
      { id: 6034, parent_id: 603, name: 'Laporan Keuangan', url: '/sikeu/akuntansi/laporan', icon: 'FaChartPie', module: 'sikeu', permission_id: null, order_index: 4, is_active: true },
    ]
  },
  { 
    id: 604, parent_id: null, name: 'MASTER KEUANGAN', url: '#master_sikeu', icon: 'FaDatabase', module: 'sikeu', permission_id: null, order_index: 4, is_active: true,
    children: [
      { id: 6041, parent_id: 604, name: 'Master Tarif Gaji Pegawai', url: '/sikeu/master/gaji-pegawai', icon: 'FaMoneyBillWave', module: 'sikeu', permission_id: null, order_index: 1, is_active: true },
      { id: 6042, parent_id: 604, name: 'Master Biaya & Tarif', url: '/sikeu/master', icon: 'FaBuilding', module: 'sikeu', permission_id: null, order_index: 2, is_active: true },
      { id: 6043, parent_id: 604, name: 'Unit Kas & Rekening', url: '/sikeu/unit-kas', icon: 'FaBuilding', module: 'sikeu', permission_id: null, order_index: 3, is_active: true },
    ]
  },
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

  const isMahasiswaRole = userRoleSlugs.includes('mahasiswa') && !isSuperAdmin && !isAdmin;
  const isDosenRole = userRoleSlugs.includes('dosen') && !isSuperAdmin && !isAdmin;

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

  // Determine module based on pathname or hostname dynamically without hardcoding
  const getModule = () => {
    let mod = 'sso';
    if (pathname.startsWith('/simpeg')) mod = 'simpeg';
    else if (pathname.startsWith('/sippm')) mod = 'sippm';
    else if (pathname.startsWith('/sikeu')) mod = 'sikeu';
    else if (pathname.startsWith('/spmb')) mod = 'spmb';
    else if (pathname.startsWith('/sinapra')) mod = 'sinapra';
    else if (pathname.startsWith('/siakad')) mod = 'siakad';
    else if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.startsWith('spmb.')) mod = 'spmb';
      else if (hostname.startsWith('simpeg.')) mod = 'simpeg';
      else if (hostname.startsWith('sippm.')) mod = 'sippm';
      else if (hostname.startsWith('sikeu.')) mod = 'sikeu';
      else if (hostname.startsWith('sinapra.')) mod = 'sinapra';
      else if (hostname.startsWith('siakad.')) mod = 'siakad';
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
          } else if (mod === 'simpeg') {
            setDynamicMenus(SIMPEG_FALLBACK_MENUS);
          } else if (mod === 'sikeu') {
            setDynamicMenus(SIKEU_FALLBACK_MENUS);
          } else if (mod === 'spmb' && !isPanitiaAdmin) {
            setDynamicMenus(SPMB_STUDENT_FALLBACK_MENUS);
          } else if (mod === 'sinapra') {
            setDynamicMenus(SINAPRA_FALLBACK_MENUS);
          } else if (mod === 'siakad') {
            if (isMahasiswaRole) {
              setDynamicMenus(SIAKAD_MAHASISWA_MENUS);
            } else if (isDosenRole) {
              setDynamicMenus(SIAKAD_DOSEN_MENUS);
            } else {
              setDynamicMenus(SIAKAD_ADMIN_MENUS);
            }
          } else {
            setDynamicMenus([]);
          }
        } catch (error) {
          console.error("Failed to load menus", error);
          const mod = getModule();
          if (mod === 'simpeg') {
            setDynamicMenus(SIMPEG_FALLBACK_MENUS);
          } else if (mod === 'sikeu') {
            setDynamicMenus(SIKEU_FALLBACK_MENUS);
          } else if (mod === 'spmb' && !isPanitiaAdmin) {
            setDynamicMenus(SPMB_STUDENT_FALLBACK_MENUS);
          } else if (mod === 'sinapra') {
            setDynamicMenus(SINAPRA_FALLBACK_MENUS);
          } else if (mod === 'siakad') {
            if (isMahasiswaRole) {
              setDynamicMenus(SIAKAD_MAHASISWA_MENUS);
            } else if (isDosenRole) {
              setDynamicMenus(SIAKAD_DOSEN_MENUS);
            } else {
              setDynamicMenus(SIAKAD_ADMIN_MENUS);
            }
          }
        } finally {
          setLoading(false);
        }
      };
      fetchMenus();
    } else {
      const mod = getModule();
      if (mod === 'simpeg') {
        setDynamicMenus(SIMPEG_FALLBACK_MENUS);
      } else if (mod === 'sikeu') {
        setDynamicMenus(SIKEU_FALLBACK_MENUS);
      } else if (mod === 'spmb' && !isPanitiaAdmin) {
        setDynamicMenus(SPMB_STUDENT_FALLBACK_MENUS);
      } else if (mod === 'sinapra') {
        setDynamicMenus(SINAPRA_FALLBACK_MENUS);
      } else if (mod === 'siakad') {
        setDynamicMenus(SIAKAD_ADMIN_MENUS);
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
              <div className="sidebar-brand-sub">
                {isMahasiswaRole ? 'Portal Mahasiswa' : isDosenRole ? 'Portal Dosen' : 'SIAKAD Utama'}
              </div>
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

        {/* Dynamic Menus from Database / Fallback */}
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

          // Sort menus by order_index from database
          const sortedDynamicMenus = [...activeDynamicMenus].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

          if (!loading && sortedDynamicMenus.length === 0) {
            return null;
          }

          return (
            <div className="sidebar-section">
              {sidebar_open && (
                <div className="sidebar-section-label">
                  {isMahasiswaRole ? 'Portal Akademik Mahasiswa' : isDosenRole ? 'Portal Akademik Dosen' : 'Menu Utama'}
                </div>
              )}
              
              {loading ? (
                <div className="sidebar-loading">Loading menus...</div>
              ) : (
                sortedDynamicMenus.map((menu) => {
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
