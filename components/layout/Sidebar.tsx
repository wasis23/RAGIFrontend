'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  ShieldCheck,
  Shield,
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
  BookOpen,
  Sparkles,
  Database,
  Tags,
  Layers,
  Menu as MenuIcon,
  Sliders,
  Monitor,
  Settings,
  AlertTriangle,
  Coins,
  Tag,
  Share2,
  DoorOpen,
  Handshake,
  Ruler,
  Package,
  Boxes
} from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { SYSTEM_MODULES } from '@/lib/constants';
import { resolveDomainContext } from '@/lib/domain';
import { menuService } from '@/services/menu.service';
import { Menu } from '@/types/menu';

const getIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'FaHome': Home,
    'FaUserPlus': UserPlus,
    'FaChartPie': PieChart,
    'FaUsers': Users,
    'FaUserCheck': UserCheck,
    'FaList': List,
    'FaShieldAlt': Shield,
    'FaShield': Shield,
    'FaFileAlt': FileText,
    'FaClipboardCheck': CheckSquare,
    'FaFileCheck': CheckSquare,
    'FaCreditCard': DollarSign,
    'FaBookOpen': FileText,
    'FaAward': Award,
    'FaLayers': Layers,
    'FaBoxes': Boxes,
    'FaCalendar': Calendar,
    'FaTrophy': Award,
    'FaBriefcase': Briefcase,
    'FaClock': Clock,
    'FaSitemap': Building2,
    'FaMoneyBillWave': DollarSign,
    'FaCalendarCheck': Calendar,
    'FaBuilding': Building2,
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
    'FaDatabase': Database,
    'FaTags': Tags,
    'Database': Database,
    'Tags': Tags,
    'FaSlidersH': Sliders,
    'FaSliders': Sliders,
    'FaBars': MenuIcon,
    'FaMenu': MenuIcon,
    'FaDesktop': Monitor,
    'FaLaptop': Monitor,
    'FaMonitor': Monitor,
    'FaHistory': History,
    'FaCogs': Settings,
    'FaCog': Settings,
    'FaChartBar': PieChart,
    'FaSparkles': Sparkles,
    'FaHourglassHalf': Clock,
    'FaFileSignature': FileText,
    'FaCheckSquare': CheckSquare,
    'FaDollarSign': DollarSign,
    'FaCoins': Coins,
    'FaExclamationTriangle': AlertTriangle,
    'FaTag': Tag,
    'FaShareAlt': Share2,
    'FaDoorOpen': DoorOpen,
    'FaHandshake': Handshake,
    'FaRulerCombined': Ruler,
    'Package': Package,
    'Boxes': Boxes,
    'Layers': Layers,
    'Tag': Tag,
  };
  const IconComponent = iconMap[iconName] || LayoutDashboard;
  return <IconComponent className="sidebar-item-icon" />;
};

// Menus SIAKAD untuk Mahasiswa (Portal Mahasiswa Mandiri)
const SIAKAD_MAHASISWA_MENUS: Menu[] = [
  { id: 710, parent_id: null, name: 'Dashboard Mahasiswa', url: '/siakad', icon: 'FaChartPie', module: 'siakad', permission_id: null, order_index: 1, is_active: true },
  { id: 711, parent_id: null, name: 'KRS Semester Aktif', url: '/siakad/krs', icon: 'FaClipboardCheck', module: 'siakad', permission_id: null, order_index: 2, is_active: true },
  { id: 712, parent_id: null, name: 'Jadwal Kuliah & RPS', url: '/siakad/perkuliahan/kelas', icon: 'FaCalendarCheck', module: 'siakad', permission_id: null, order_index: 3, is_active: true },
  { id: 713, parent_id: null, name: 'Hasil Studi (KHS & Transkrip)', url: '/siakad/hasil-studi', icon: 'FaAward', module: 'siakad', permission_id: null, order_index: 4, is_active: true },
  { id: 714, parent_id: null, name: 'Tagihan SPP (SIKEU)', url: '/sikeu/mahasiswa/tagihan', icon: 'FaCreditCard', module: 'siakad', permission_id: null, order_index: 5, is_active: true },
  { id: 715, parent_id: null, name: 'Biodata PDDIKTI', url: '/siakad/profil', icon: 'FaUser', module: 'siakad', permission_id: null, order_index: 6, is_active: true },
];

// Menus SIAKAD untuk Dosen (Portal Dosen Pengajar / Wali)
const SIAKAD_DOSEN_MENUS: Menu[] = [
  { id: 720, parent_id: null, name: 'Dashboard Dosen', url: '/siakad', icon: 'FaChartPie', module: 'siakad', permission_id: null, order_index: 1, is_active: true },
  { id: 721, parent_id: null, name: 'Jadwal Mengajar & RPS', url: '/siakad/perkuliahan/kelas', icon: 'FaCalendarCheck', module: 'siakad', permission_id: null, order_index: 2, is_active: true },
  { id: 722, parent_id: null, name: 'Bimbingan & Approval KRS', url: '/siakad/krs', icon: 'FaClipboardCheck', module: 'siakad', permission_id: null, order_index: 3, is_active: true },
  { id: 723, parent_id: null, name: 'Input & Rekap Nilai', url: '/siakad/nilai', icon: 'FaPen', module: 'siakad', permission_id: null, order_index: 4, is_active: true },
  { id: 724, parent_id: null, name: 'Mahasiswa Bimbingan', url: '/siakad/civitas/mahasiswa', icon: 'FaUserGraduate', module: 'siakad', permission_id: null, order_index: 5, is_active: true },
  { id: 725, parent_id: null, name: 'CPMK Mata Kuliah', url: '/siakad/obe/cpmk', icon: 'FaList', module: 'siakad', permission_id: null, order_index: 6, is_active: true },
  { id: 726, parent_id: null, name: 'RPS Pembelajaran', url: '/siakad/obe/rps', icon: 'FaFileAlt', module: 'siakad', permission_id: null, order_index: 7, is_active: true },
  { id: 727, parent_id: null, name: 'Bank Soal', url: '/siakad/obe/soal', icon: 'FaBookOpen', module: 'siakad', permission_id: null, order_index: 8, is_active: true },
];

// Menus SIAKAD untuk Administrator / BAAK
const SIAKAD_ADMIN_MENUS: Menu[] = [
  { id: 701, parent_id: null, name: 'Dashboard Akademik', url: '/siakad', icon: 'FaGraduationCap', module: 'siakad', permission_id: null, order_index: 1, is_active: true },
  {
    id: 703, parent_id: null, name: 'CIVITAS AKADEMIKA', url: '#civitas_siakad', icon: 'FaUsers', module: 'siakad', permission_id: null, order_index: 2, is_active: true,
    children: [
      { id: 7031, parent_id: 703, name: 'Mahasiswa & Plotting PA', url: '/siakad/civitas/mahasiswa', icon: 'FaUserGraduate', module: 'siakad', permission_id: null, order_index: 1, is_active: true },
      { id: 7032, parent_id: 703, name: 'Konversi Transfer', url: '/siakad/civitas/konversi', icon: 'FaExchangeAlt', module: 'siakad', permission_id: null, order_index: 2, is_active: true },
      { id: 7033, parent_id: 703, name: 'Dosen Pengajar', url: '/siakad/civitas/dosen', icon: 'FaChalkboardTeacher', module: 'siakad', permission_id: null, order_index: 3, is_active: true },
      { id: 7034, parent_id: 703, name: 'Biodata Mahasiswa', url: '/siakad/civitas/biodata', icon: 'FaUser', module: 'siakad', permission_id: null, order_index: 4, is_active: true },
      { id: 7035, parent_id: 703, name: 'Penerima Beasiswa', url: '/siakad/civitas/beasiswa', icon: 'FaAward', module: 'siakad', permission_id: null, order_index: 5, is_active: true },
    ]
  },
  { 
    id: 702, parent_id: null, name: 'MASTER AKADEMIK (BAAK)', url: '#master_siakad', icon: 'FaDatabase', module: 'siakad', permission_id: null, order_index: 3, is_active: true,
    children: [
      { id: 7020, parent_id: 702, name: 'Tahun Akademik', url: '/siakad/master/tahun-akademik', icon: 'FaCalendarCheck', module: 'siakad', permission_id: null, order_index: 0, is_active: true },
      { id: 7021, parent_id: 702, name: 'Fakultas & Prodi', url: '/siakad/master/fakultas', icon: 'FaBuilding', module: 'siakad', permission_id: null, order_index: 1, is_active: true },
      { id: 7022, parent_id: 702, name: 'Kurikulum OBE', url: '/siakad/master/kurikulum', icon: 'FaBookOpen', module: 'siakad', permission_id: null, order_index: 2, is_active: true },
      { id: 7023, parent_id: 702, name: 'Mata Kuliah', url: '/siakad/master/matakuliah', icon: 'FaList', module: 'siakad', permission_id: null, order_index: 3, is_active: true },
      { id: 7024, parent_id: 702, name: 'Skala Nilai', url: '/siakad/master/skala-nilai', icon: 'FaAward', module: 'siakad', permission_id: null, order_index: 4, is_active: true },
      { id: 7025, parent_id: 702, name: 'Konfigurasi Penilaian & OBE', url: '/siakad/master/konfigurasi-penilaian', icon: 'FaSlidersH', module: 'siakad', permission_id: null, order_index: 5, is_active: true },
      { id: 7026, parent_id: 702, name: 'Master Referensi', url: '/siakad/master/referensi', icon: 'FaDatabase', module: 'siakad', permission_id: null, order_index: 6, is_active: true },
      { id: 7027, parent_id: 702, name: 'Master Tipe Referensi', url: '/siakad/master/tipe-referensi', icon: 'FaTags', module: 'siakad', permission_id: null, order_index: 7, is_active: true },
    ]
  },
  {
    id: 704, parent_id: null, name: 'PERKULIAHAN & OBE', url: '#perkuliahan_siakad', icon: 'FaCalendarCheck', module: 'siakad', permission_id: null, order_index: 4, is_active: true,
    children: [
      { id: 7041, parent_id: 704, name: 'Kelas & Jadwal', url: '/siakad/perkuliahan/kelas', icon: 'FaCalendarCheck', module: 'siakad', permission_id: null, order_index: 1, is_active: true },
      { id: 7042, parent_id: 704, name: 'KRS Mahasiswa', url: '/siakad/krs', icon: 'FaClipboardCheck', module: 'siakad', permission_id: null, order_index: 2, is_active: true },
      { id: 7043, parent_id: 704, name: 'Input Nilai OBE', url: '/siakad/nilai', icon: 'FaPen', module: 'siakad', permission_id: null, order_index: 3, is_active: true },
      { id: 7044, parent_id: 704, name: 'Pemantauan OBE', url: '/siakad/obe', icon: 'FaChartBar', module: 'siakad', permission_id: null, order_index: 4, is_active: true },
      { id: 7045, parent_id: 704, name: 'CPL & Kurikulum', url: '/siakad/obe/cpl', icon: 'FaAward', module: 'siakad', permission_id: null, order_index: 5, is_active: true },
      { id: 7046, parent_id: 704, name: 'CPMK Mata Kuliah', url: '/siakad/obe/cpmk', icon: 'FaList', module: 'siakad', permission_id: null, order_index: 6, is_active: true },
      { id: 7047, parent_id: 704, name: 'RPS & Verifikasi', url: '/siakad/obe/rps', icon: 'FaFileAlt', module: 'siakad', permission_id: null, order_index: 7, is_active: true },
      { id: 7048, parent_id: 704, name: 'Ketertiban Dosen Nilai', url: '/siakad/obe/kepatuhan', icon: 'FaUserCheck', module: 'siakad', permission_id: null, order_index: 8, is_active: true },
    ]
  },
  {
    id: 705, parent_id: null, name: 'INTEGRASI DIKTI', url: '#feeder_siakad', icon: 'FaSyncAlt', module: 'siakad', permission_id: null, order_index: 5, is_active: true,
    children: [
      { id: 7051, parent_id: 705, name: 'Sync Neo Feeder', url: '/siakad/feeder-sync', icon: 'FaCloudUploadAlt', module: 'siakad', permission_id: null, order_index: 1, is_active: true },
    ]
  },
  { id: 706, parent_id: null, name: 'Panduan & Alur SIAKAD', url: '/siakad/panduan', icon: 'FaBookOpen', module: 'siakad', permission_id: null, order_index: 6, is_active: true },
];

// Fallback menus untuk setiap modul
const IAM_FALLBACK_MENUS: Menu[] = [
  { id: 101, parent_id: null, name: 'Dashboard Utama', url: '/dashboard', icon: 'FaHome', module: 'sso', permission_id: null, order_index: 1, is_active: true },
  {
    id: 102, parent_id: null, name: 'MANAJEMEN PENGGUNA', url: '#users_section', icon: 'FaUsers', module: 'sso', permission_id: null, order_index: 2, is_active: true,
    children: [
      { id: 1021, parent_id: 102, name: 'Pengguna Portal', url: '/admin/users', icon: 'FaUsers', module: 'sso', permission_id: null, order_index: 1, is_active: true },
      { id: 1022, parent_id: 102, name: 'Plotting User Role', url: '/admin/user-roles', icon: 'FaUserCheck', module: 'sso', permission_id: null, order_index: 2, is_active: true },
    ]
  },
  {
    id: 103, parent_id: null, name: 'ROLE & HAK AKSES', url: '#roles_section', icon: 'FaShieldAlt', module: 'sso', permission_id: null, order_index: 3, is_active: true,
    children: [
      { id: 1031, parent_id: 103, name: 'Master Role', url: '/admin/roles', icon: 'FaShieldAlt', module: 'sso', permission_id: null, order_index: 1, is_active: true },
      { id: 1032, parent_id: 103, name: 'Hak Akses (Permissions)', url: '/admin/permissions', icon: 'FaKey', module: 'sso', permission_id: null, order_index: 2, is_active: true },
      { id: 1033, parent_id: 103, name: 'Plotting Role Permission', url: '/admin/role-permissions', icon: 'FaClipboardCheck', module: 'sso', permission_id: null, order_index: 3, is_active: true },
      { id: 1034, parent_id: 103, name: 'Plotting Role Menu', url: '/admin/role-menus', icon: 'FaSlidersH', module: 'sso', permission_id: null, order_index: 4, is_active: true },
    ]
  },
  {
    id: 104, parent_id: null, name: 'MODUL & NAVIGASI', url: '#modules_section', icon: 'FaLayers', module: 'sso', permission_id: null, order_index: 4, is_active: true,
    children: [
      { id: 1041, parent_id: 104, name: 'Master Modul', url: '/admin/modules', icon: 'FaLayers', module: 'sso', permission_id: null, order_index: 1, is_active: true },
      { id: 1042, parent_id: 104, name: 'Master Menu', url: '/admin/menus', icon: 'FaBars', module: 'sso', permission_id: null, order_index: 2, is_active: true },
    ]
  },
  {
    id: 105, parent_id: null, name: 'DATA REFERENSI', url: '#referensi_section', icon: 'FaDatabase', module: 'sso', permission_id: null, order_index: 5, is_active: true,
    children: [
      { id: 1051, parent_id: 105, name: 'Master Data Referensi', url: '/admin/master-referensi', icon: 'FaDatabase', module: 'sso', permission_id: null, order_index: 1, is_active: true },
      { id: 1052, parent_id: 105, name: 'Master Tipe Referensi', url: '/admin/master-tipe-referensi', icon: 'FaTags', module: 'sso', permission_id: null, order_index: 2, is_active: true },
    ]
  },
  {
    id: 106, parent_id: null, name: 'LOG & AUDIT', url: '#audit_section', icon: 'FaHistory', module: 'sso', permission_id: null, order_index: 6, is_active: true,
    children: [
      { id: 1061, parent_id: 106, name: 'Sesi Login Aktif', url: '/admin/sessions', icon: 'FaDesktop', module: 'sso', permission_id: null, order_index: 1, is_active: true },
      { id: 1062, parent_id: 106, name: 'Audit Log Aktivitas', url: '/admin/audit-logs', icon: 'FaHistory', module: 'sso', permission_id: null, order_index: 2, is_active: true },
      { id: 1063, parent_id: 106, name: 'Pengaturan Sistem', url: '/admin/settings', icon: 'FaCogs', module: 'sso', permission_id: null, order_index: 3, is_active: true },
    ]
  },
  {
    id: 107, parent_id: null, name: 'AKUN & KEAMANAN', url: '#akun_keamanan', icon: 'FaShieldCheck', module: 'sso', permission_id: null, order_index: 999, is_active: true,
    children: [
      { id: 1071, parent_id: 107, name: 'Profil Saya', url: '/profile', icon: 'FaUser', module: 'sso', permission_id: null, order_index: 1, is_active: true },
      { id: 1072, parent_id: 107, name: 'Sesi Perangkat', url: '/profile/sessions', icon: 'FaSmartphone', module: 'sso', permission_id: null, order_index: 2, is_active: true },
      { id: 1073, parent_id: 107, name: 'Autentikasi 2FA', url: '/profile/mfa', icon: 'FaShieldCheck', module: 'sso', permission_id: null, order_index: 3, is_active: true },
    ]
  },
];

const SINAPRA_FALLBACK_MENUS: Menu[] = [
  { id: 901, parent_id: null, name: 'Gedung & Ruangan', url: '/sinapra/gedung-ruangan', icon: 'FaBuilding', module: 'sinapra', permission_id: null, order_index: 1, is_active: true },
  { id: 902, parent_id: null, name: 'Inventaris Aset', url: '/sinapra/aset', icon: 'FaBoxes', module: 'sinapra', permission_id: null, order_index: 2, is_active: true },
  { id: 903, parent_id: null, name: 'Peminjaman', url: '/sinapra/peminjaman', icon: 'FaCalendarCheck', module: 'sinapra', permission_id: null, order_index: 3, is_active: true },
  { id: 904, parent_id: null, name: 'Maintenance', url: '/sinapra/maintenance', icon: 'FaWrench', module: 'sinapra', permission_id: null, order_index: 4, is_active: true },
  { id: 905, parent_id: null, name: 'Pengadaan Barang', url: '/sinapra/pengadaan', icon: 'FaShoppingCart', module: 'sinapra', permission_id: null, order_index: 5, is_active: true },
  { id: 906, parent_id: null, name: 'Laboratorium & BHP', url: '/sinapra/laboratorium', icon: 'FaFlask', module: 'sinapra', permission_id: null, order_index: 6, is_active: true },
  { id: 907, parent_id: null, name: 'Audit & Mutasi', url: '/sinapra/audit-mutasi', icon: 'FaClipboardCheck', module: 'sinapra', permission_id: null, order_index: 7, is_active: true },
  { id: 908, parent_id: null, name: 'Kalender Ruangan', url: '/sinapra/kalender', icon: 'FaCalendarAlt', module: 'sinapra', permission_id: null, order_index: 8, is_active: true },
  {
    id: 910,
    parent_id: null,
    name: 'MASTER DATA',
    url: '#master_sinapra',
    icon: 'Database',
    module: 'sinapra',
    permission_id: null,
    order_index: 9,
    is_active: true,
    children: [
      { id: 9101, parent_id: 910, name: 'Master Kategori Aset', url: '/sinapra/master/kategori-aset', icon: 'FaTags', module: 'sinapra', permission_id: null, order_index: 1, is_active: true },
      { id: 9102, parent_id: 910, name: 'Master Tipe Ruangan', url: '/sinapra/master/tipe-ruangan', icon: 'FaDoorOpen', module: 'sinapra', permission_id: null, order_index: 2, is_active: true },
      { id: 9103, parent_id: 910, name: 'Master Vendor & Rekanan', url: '/sinapra/master/vendor', icon: 'Briefcase', module: 'sinapra', permission_id: null, order_index: 3, is_active: true },
      { id: 9104, parent_id: 910, name: 'Master Kategori BHP Lab', url: '/sinapra/master/kategori-bhp', icon: 'Package', module: 'sinapra', permission_id: null, order_index: 4, is_active: true },
      { id: 9105, parent_id: 910, name: 'Master Satuan Barang', url: '/sinapra/master/satuan', icon: 'Tag', module: 'sinapra', permission_id: null, order_index: 5, is_active: true },
      { id: 9106, parent_id: 910, name: 'Master Referensi Status & Kondisi', url: '/sinapra/master/referensi', icon: 'Database', module: 'sinapra', permission_id: null, order_index: 6, is_active: true },
    ],
  },
];

const SPMB_STUDENT_FALLBACK_MENUS: Menu[] = [
  { id: 801, parent_id: null, name: 'Dashboard SPMB', url: '/spmb', icon: 'FaChartPie', module: 'spmb', permission_id: null, order_index: 1, is_active: true },
  { id: 802, parent_id: null, name: 'Formulir Registrasi', url: '/spmb/registrasi', icon: 'FaPen', module: 'spmb', permission_id: null, order_index: 2, is_active: true },
  { id: 803, parent_id: null, name: 'Pendaftaran Mahasiswa Baru', url: '/spmb/pendaftaran', icon: 'FaUserPlus', module: 'spmb', permission_id: null, order_index: 3, is_active: true },
  { id: 804, parent_id: null, name: 'Verifikasi Daftar Ulang', url: '/spmb/daftar-ulang', icon: 'FaClipboardCheck', module: 'spmb', permission_id: null, order_index: 4, is_active: true },
];

const SPMB_FALLBACK_MENUS: Menu[] = [
  { id: 801, parent_id: null, name: 'Dashboard SPMB', url: '/spmb', icon: 'FaChartPie', module: 'spmb', permission_id: null, order_index: 1, is_active: true },
  {
    id: 802, parent_id: null, name: 'ADMISI & PENDAFTARAN', url: '#admisi_spmb', icon: 'FaUserCheck', module: 'spmb', permission_id: null, order_index: 2, is_active: true,
    children: [
      { id: 8022, parent_id: 802, name: 'Pendaftaran Mahasiswa Baru', url: '/spmb/pendaftaran', icon: 'FaUserPlus', module: 'spmb', permission_id: null, order_index: 1, is_active: true },
      { id: 8023, parent_id: 802, name: 'Verifikasi Daftar Ulang', url: '/spmb/daftar-ulang', icon: 'FaClipboardCheck', module: 'spmb', permission_id: null, order_index: 2, is_active: true },
      { id: 8024, parent_id: 802, name: 'Registrasi Online', url: '/spmb/registrasi', icon: 'FaPen', module: 'spmb', permission_id: null, order_index: 3, is_active: true },
    ]
  },
  {
    id: 803, parent_id: null, name: 'MASTER DATA SPMB', url: '#master_spmb', icon: 'FaDatabase', module: 'spmb', permission_id: null, order_index: 3, is_active: true,
    children: [
      { id: 8031, parent_id: 803, name: 'Jalur Masuk', url: '/spmb/master/jalur', icon: 'FaCogs', module: 'spmb', permission_id: null, order_index: 1, is_active: true },
      { id: 8032, parent_id: 803, name: 'Tipe Jalur Masuk', url: '/spmb/master/tipe-jalur', icon: 'FaTags', module: 'spmb', permission_id: null, order_index: 2, is_active: true },
      { id: 8033, parent_id: 803, name: 'Gelombang Penerimaan', url: '/spmb/master/gelombang', icon: 'FaCalendar', module: 'spmb', permission_id: null, order_index: 3, is_active: true },
      { id: 8034, parent_id: 803, name: 'Kuota Program Studi', url: '/spmb/master/kuota', icon: 'FaChartPie', module: 'spmb', permission_id: null, order_index: 4, is_active: true },
      { id: 8035, parent_id: 803, name: 'Persyaratan Berkas', url: '/spmb/master/berkas-requirement', icon: 'FaFileAlt', module: 'spmb', permission_id: null, order_index: 5, is_active: true },
      { id: 8036, parent_id: 803, name: 'Master Biaya SPMB', url: '/spmb/master/biaya', icon: 'FaCoins', module: 'spmb', permission_id: null, order_index: 6, is_active: true },
      { id: 8037, parent_id: 803, name: 'Komponen Biaya', url: '/spmb/master/komponen-biaya', icon: 'FaTag', module: 'spmb', permission_id: null, order_index: 7, is_active: true },
      { id: 8038, parent_id: 803, name: 'Master Data Referensi', url: '/spmb/master/referensi', icon: 'FaDatabase', module: 'spmb', permission_id: null, order_index: 8, is_active: true },
      { id: 8039, parent_id: 803, name: 'Master Tipe Referensi', url: '/spmb/master/tipe-referensi', icon: 'FaLayers', module: 'spmb', permission_id: null, order_index: 9, is_active: true },
    ]
  },
  {
    id: 804, parent_id: null, name: 'LAPORAN & STATISTIK', url: '#laporan_spmb', icon: 'FaChartBar', module: 'spmb', permission_id: null, order_index: 4, is_active: true,
    children: [
      { id: 8041, parent_id: 804, name: 'Statistik Pendaftaran', url: '/spmb/laporan/statistik', icon: 'FaChartBar', module: 'spmb', permission_id: null, order_index: 1, is_active: true },
      { id: 8042, parent_id: 804, name: 'Laporan Referral', url: '/spmb/laporan/referral', icon: 'FaShareAlt', module: 'spmb', permission_id: null, order_index: 2, is_active: true },
    ]
  },
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
      { id: 5042, parent_id: 504, name: 'Cuti & Izin Kerja', url: '/simpeg/cuti', icon: 'FaCalendar', module: 'simpeg', permission_id: null, order_index: 2, is_active: true },
      { id: 5043, parent_id: 504, name: 'Payroll & Slip Gaji', url: '/simpeg/payroll', icon: 'FaMoneyBillWave', module: 'simpeg', permission_id: null, order_index: 3, is_active: true },
      { id: 5044, parent_id: 504, name: 'Usulan Jafung (KUM)', url: '/simpeg/usulan-jafung', icon: 'FaAward', module: 'simpeg', permission_id: null, order_index: 4, is_active: true },
      { id: 5045, parent_id: 504, name: 'Evaluasi Kinerja SKP', url: '/simpeg/kinerja', icon: 'FaChartPie', module: 'simpeg', permission_id: null, order_index: 5, is_active: true },
      { id: 5046, parent_id: 504, name: 'Kompetensi & Pelatihan', url: '/simpeg/kompetensi', icon: 'FaGraduationCap', module: 'simpeg', permission_id: null, order_index: 6, is_active: true },
      { id: 5047, parent_id: 504, name: 'Surat Tugas & LPJ', url: '/simpeg/surat-tugas', icon: 'FaBriefcase', module: 'simpeg', permission_id: null, order_index: 7, is_active: true },
      { id: 5049, parent_id: 504, name: 'Arsip SK Pegawai', url: '/simpeg/sk-pegawai', icon: 'FaFileSignature', module: 'simpeg', permission_id: null, order_index: 8, is_active: true },
    ]
  },
  {
    id: 502, parent_id: null, name: 'MASTER DATA SDM', url: '#master_simpeg', icon: 'FaDatabase', module: 'simpeg', permission_id: null, order_index: 4, is_active: true,
    children: [
      { id: 5021, parent_id: 502, name: 'Unit Kerja', url: '/simpeg/unit-kerja', icon: 'FaSitemap', module: 'simpeg', permission_id: null, order_index: 1, is_active: true },
      { id: 5022, parent_id: 502, name: 'Jabatan & Jafung', url: '/simpeg/jabatan', icon: 'FaBriefcase', module: 'simpeg', permission_id: null, order_index: 2, is_active: true },
      { id: 5023, parent_id: 502, name: 'Regulasi Cuti & Izin', url: '/simpeg/master/jenis-cuti', icon: 'FaCalendarCheck', module: 'simpeg', permission_id: null, order_index: 3, is_active: true },
      { id: 5028, parent_id: 502, name: 'Master Kompetensi', url: '/simpeg/master/kompetensi', icon: 'FaGraduationCap', module: 'simpeg', permission_id: null, order_index: 4, is_active: true },
      { id: 5029, parent_id: 502, name: 'Master Kategori SK', url: '/simpeg/master/kategori-sk', icon: 'FaFileSignature', module: 'simpeg', permission_id: null, order_index: 5, is_active: true },
      { id: 5024, parent_id: 502, name: 'Master Komponen Gaji', url: '/simpeg/payroll/komponen', icon: 'FaMoneyBillWave', module: 'simpeg', permission_id: null, order_index: 6, is_active: true },
      { id: 5025, parent_id: 502, name: 'Pengaturan Presensi', url: '/simpeg/master/presensi', icon: 'FaClock', module: 'simpeg', permission_id: null, order_index: 7, is_active: true },
      { id: 5026, parent_id: 502, name: 'Master Referensi', url: '/simpeg/master/referensi', icon: 'FaDatabase', module: 'simpeg', permission_id: null, order_index: 8, is_active: true },
      { id: 5027, parent_id: 502, name: 'Master Tipe Referensi', url: '/simpeg/master/tipe-referensi', icon: 'FaTags', module: 'simpeg', permission_id: null, order_index: 9, is_active: true },
    ]
  },
];

const SIKEU_FALLBACK_MENUS: Menu[] = [
  { id: 601, parent_id: null, name: 'Dashboard Keuangan', url: '/sikeu', icon: 'FaChartPie', module: 'sikeu', permission_id: null, order_index: 1, is_active: true },
  {
    id: 6015, parent_id: null, name: 'PEMBAYARAN MAHASISWA', url: '#pembayaran_mhs_sikeu', icon: 'FaCreditCard', module: 'sikeu', permission_id: null, order_index: 2, is_active: true,
    children: [
      { id: 60151, parent_id: 6015, name: 'Pengaturan Tarif', url: '/sikeu/pembayaran-mahasiswa/tarif', icon: 'FaDollarSign', module: 'sikeu', permission_id: null, order_index: 1, is_active: true },
      { id: 60152, parent_id: 6015, name: 'Input Tagihan', url: '/sikeu/pembayaran-mahasiswa/tagihan', icon: 'FaFileInvoiceDollar', module: 'sikeu', permission_id: null, order_index: 2, is_active: true },
      { id: 60156, parent_id: 6015, name: 'Bayar Kasir Loket', url: '/sikeu/pembayaran-mahasiswa/bayar', icon: 'FaCashRegister', module: 'sikeu', permission_id: null, order_index: 3, is_active: true },
      { id: 60153, parent_id: 6015, name: 'Potongan Mahasiswa', url: '/sikeu/pembayaran-mahasiswa/potongan', icon: 'FaPercent', module: 'sikeu', permission_id: null, order_index: 4, is_active: true },
      { id: 60154, parent_id: 6015, name: 'Piutang Mahasiswa', url: '/sikeu/piutang', icon: 'FaExclamationTriangle', module: 'sikeu', permission_id: null, order_index: 5, is_active: true },
      { id: 60155, parent_id: 6015, name: 'Dispensasi Pembayaran', url: '/sikeu/dispensasi', icon: 'FaClipboardCheck', module: 'sikeu', permission_id: null, order_index: 6, is_active: true },
    ]
  },
  {
    id: 605, parent_id: null, name: 'OPERASIONAL PENGELUARAN', url: '#pengeluaran_sikeu', icon: 'FaMoneyBillWave', module: 'sikeu', permission_id: null, order_index: 3, is_active: true,
    children: [
      { id: 60299, parent_id: 605, name: 'Kas Kecil', url: '/sikeu/kas-kecil', icon: 'FaCoins', module: 'sikeu', permission_id: null, order_index: 0, is_active: true },
      { id: 6029, parent_id: 605, name: 'Pengajuan Operasional', url: '/sikeu/pengajuan', icon: 'FaFileAlt', module: 'sikeu', permission_id: null, order_index: 1, is_active: true },
      { id: 6024, parent_id: 605, name: 'Pengeluaran Kas', url: '/sikeu/pengeluaran', icon: 'FaList', module: 'sikeu', permission_id: null, order_index: 1, is_active: true },
      { id: 6023, parent_id: 605, name: 'Pemasukan Kas Non-Akademik', url: '/sikeu/pemasukan', icon: 'FaList', module: 'sikeu', permission_id: null, order_index: 2, is_active: true },
      { id: 6026, parent_id: 605, name: 'Approval Pimpinan', url: '/sikeu/approval', icon: 'FaShieldCheck', module: 'sikeu', permission_id: null, order_index: 3, is_active: true },
      { id: 6028, parent_id: 605, name: 'Pajak & Perpajakan', url: '/sikeu/pajak', icon: 'FaFileAlt', module: 'sikeu', permission_id: null, order_index: 4, is_active: true },
    ]
  },
  {
    id: 603, parent_id: null, name: 'AKUNTANSI & LAPORAN', url: '#akuntansi_sikeu', icon: 'FaBookOpen', module: 'sikeu', permission_id: null, order_index: 4, is_active: true,
    children: [
      { id: 6031, parent_id: 603, name: 'Jurnal Umum', url: '/sikeu/akuntansi/jurnal', icon: 'FaFileAlt', module: 'sikeu', permission_id: null, order_index: 1, is_active: true },
      { id: 6032, parent_id: 603, name: 'Buku Besar', url: '/sikeu/akuntansi/buku-besar', icon: 'FaBookOpen', module: 'sikeu', permission_id: null, order_index: 2, is_active: true },
      { id: 6033, parent_id: 603, name: 'Chart of Accounts (COA)', url: '/sikeu/akuntansi/coa', icon: 'FaList', module: 'sikeu', permission_id: null, order_index: 3, is_active: true },
      { id: 6034, parent_id: 603, name: 'Laporan Keuangan', url: '/sikeu/akuntansi/laporan', icon: 'FaChartPie', module: 'sikeu', permission_id: null, order_index: 4, is_active: true },
      { id: 6035, parent_id: 603, name: 'Pengaturan Akuntansi', url: '/sikeu/akuntansi/pengaturan', icon: 'FaCog', module: 'sikeu', permission_id: null, order_index: 5, is_active: true },
    ]
  },
  { 
    id: 604, parent_id: null, name: 'MASTER KEUANGAN GLOBAL', url: '#master_sikeu', icon: 'FaDatabase', module: 'sikeu', permission_id: null, order_index: 5, is_active: true,
    children: [
      { id: 6042, parent_id: 604, name: 'Katalog Komponen Biaya', url: '/sikeu/master', icon: 'FaBuilding', module: 'sikeu', permission_id: null, order_index: 1, is_active: true },
      { id: 6043, parent_id: 604, name: 'Unit Kas & Rekening Bank', url: '/sikeu/unit-kas', icon: 'FaBuilding', module: 'sikeu', permission_id: null, order_index: 2, is_active: true },
      { id: 6041, parent_id: 604, name: 'Master Tarif Gaji Pegawai', url: '/sikeu/master/gaji-pegawai', icon: 'FaMoneyBillWave', module: 'sikeu', permission_id: null, order_index: 3, is_active: true },
      { id: 6027, parent_id: 604, name: 'Payment Gateway Bank', url: '/sikeu/payment-gateway', icon: 'FaCreditCard', module: 'sikeu', permission_id: null, order_index: 4, is_active: true },
      { id: 6044, parent_id: 604, name: 'Master Referensi', url: '/sikeu/master/referensi', icon: 'FaDatabase', module: 'sikeu', permission_id: null, order_index: 5, is_active: true },
      { id: 6045, parent_id: 604, name: 'Master Tipe Referensi', url: '/sikeu/master/tipe-referensi', icon: 'FaTags', module: 'sikeu', permission_id: null, order_index: 6, is_active: true },
    ]
  },
  { id: 606, parent_id: null, name: 'Panduan & Alur SIKEU', url: '/sikeu/panduan', icon: 'FaBookOpen', module: 'sikeu', permission_id: null, order_index: 6, is_active: true },
];

const SIKEU_PETUGAS_KAS_KECIL_MENUS: Menu[] = [
  { id: 6801, parent_id: null, name: 'Dashboard Keuangan', url: '/sikeu', icon: 'FaChartPie', module: 'sikeu', permission_id: null, order_index: 1, is_active: true },
  {
    id: 6802, parent_id: null, name: 'OPERASIONAL PENGELUARAN', url: '#pengeluaran_sikeu', icon: 'FaMoneyBillWave', module: 'sikeu', permission_id: null, order_index: 2, is_active: true,
    children: [
      { id: 68021, parent_id: 6802, name: 'Kas Kecil', url: '/sikeu/kas-kecil', icon: 'FaCoins', module: 'sikeu', permission_id: null, order_index: 1, is_active: true },
    ]
  },
];

const SIKEU_MAHASISWA_MENUS: Menu[] = [
  { id: 691, parent_id: null, name: 'Dashboard Keuangan', url: '/sikeu', icon: 'FaChartPie', module: 'sikeu', permission_id: null, order_index: 1, is_active: true },
  { id: 692, parent_id: null, name: 'Tagihan & Pembayaran SPP', url: '/sikeu/mahasiswa/tagihan', icon: 'FaCreditCard', module: 'sikeu', permission_id: null, order_index: 2, is_active: true },
  { id: 694, parent_id: null, name: 'Panduan Pembayaran', url: '/sikeu/panduan', icon: 'FaBookOpen', module: 'sikeu', permission_id: null, order_index: 4, is_active: true },
];

const SIPPM_FALLBACK_MENUS: Menu[] = [
  { id: 401, parent_id: null, name: 'Dashboard SIPPM', url: '/sippm', icon: 'FaChartPie', module: 'sippm', permission_id: null, order_index: 1, is_active: true },
  {
    id: 402, parent_id: null, name: 'MANAJEMEN PROPOSAL', url: '#proposal_sippm', icon: 'FaFileAlt', module: 'sippm', permission_id: null, order_index: 2, is_active: true,
    children: [
      { id: 4021, parent_id: 402, name: 'Daftar Proposal', url: '/sippm/proposal', icon: 'FaFileAlt', module: 'sippm', permission_id: null, order_index: 1, is_active: true },
      { id: 4022, parent_id: 402, name: 'Kontrak Penelitian', url: '/sippm/kontrak', icon: 'FaClipboardCheck', module: 'sippm', permission_id: null, order_index: 2, is_active: true },
      { id: 4023, parent_id: 402, name: 'Pencairan Dana', url: '/sippm/pencairan', icon: 'FaCreditCard', module: 'sippm', permission_id: null, order_index: 3, is_active: true },
      { id: 4024, parent_id: 402, name: 'Pengumuman Hibah', url: '/sippm/pengumuman', icon: 'FaAward', module: 'sippm', permission_id: null, order_index: 4, is_active: true },
    ]
  },
  {
    id: 403, parent_id: null, name: 'LUARAN & STANDAR IKU', url: '#luaran_sippm', icon: 'FaAward', module: 'sippm', permission_id: null, order_index: 3, is_active: true,
    children: [
      { id: 4031, parent_id: 403, name: 'Luaran Publikasi', url: '/sippm/luaran/publikasi', icon: 'FaBookOpen', module: 'sippm', permission_id: null, order_index: 1, is_active: true },
      { id: 4032, parent_id: 403, name: 'Luaran HKI & Paten', url: '/sippm/luaran/hki', icon: 'FaAward', module: 'sippm', permission_id: null, order_index: 2, is_active: true },
      { id: 4033, parent_id: 403, name: 'Standar IKU 5', url: '/sippm/iku5-standards', icon: 'FaChartPie', module: 'sippm', permission_id: null, order_index: 3, is_active: true },
    ]
  },
  {
    id: 404, parent_id: null, name: 'REVIEWER & PRODI', url: '#reviewer_sippm', icon: 'FaUsers', module: 'sippm', permission_id: null, order_index: 4, is_active: true,
    children: [
      { id: 4041, parent_id: 404, name: 'Evaluasi Reviewer', url: '/sippm/reviewer', icon: 'FaClipboardCheck', module: 'sippm', permission_id: null, order_index: 1, is_active: true },
      { id: 4042, parent_id: 404, name: 'Laporan Prodi', url: '/sippm/prodi', icon: 'FaBuilding', module: 'sippm', permission_id: null, order_index: 2, is_active: true },
    ]
  },
  {
    id: 405, parent_id: null, name: 'MASTER DATA SIPPM', url: '#master_sippm', icon: 'FaDatabase', module: 'sippm', permission_id: null, order_index: 5, is_active: true,
    children: [
      { id: 4051, parent_id: 405, name: 'Periode Hibah', url: '/sippm/periode', icon: 'FaCalendar', module: 'sippm', permission_id: null, order_index: 1, is_active: true },
      { id: 4052, parent_id: 405, name: 'Skema Penelitian', url: '/sippm/skema', icon: 'FaList', module: 'sippm', permission_id: null, order_index: 2, is_active: true },
      { id: 4053, parent_id: 405, name: 'Rubrik Penilaian', url: '/sippm/rubrik', icon: 'FaCheckSquare', module: 'sippm', permission_id: null, order_index: 3, is_active: true },
    ]
  },
];

const FALLBACK_MENUS_REGISTRY: Record<string, (opts: { isMahasiswa: boolean; isDosen: boolean; isPanitia: boolean; isPetugas: boolean }) => Menu[]> = {
  sso: () => IAM_FALLBACK_MENUS,
  iam: () => IAM_FALLBACK_MENUS,
  simpeg: () => SIMPEG_FALLBACK_MENUS,
  sippm: () => SIPPM_FALLBACK_MENUS,
  sikeu: ({ isMahasiswa, isPetugas }) => (isPetugas ? SIKEU_PETUGAS_KAS_KECIL_MENUS : isMahasiswa ? SIKEU_MAHASISWA_MENUS : SIKEU_FALLBACK_MENUS),
  sinapra: () => SINAPRA_FALLBACK_MENUS,
  spmb: ({ isPanitia }) => (!isPanitia ? SPMB_STUDENT_FALLBACK_MENUS : SPMB_FALLBACK_MENUS),
  siakad: ({ isMahasiswa, isDosen }) => {
    if (isMahasiswa) return SIAKAD_MAHASISWA_MENUS;
    if (isDosen) return SIAKAD_DOSEN_MENUS;
    return SIAKAD_ADMIN_MENUS;
  },
};

const getFallbackMenusForModule = (
  mod: string,
  opts: { isMahasiswa: boolean; isDosen: boolean; isPanitia: boolean; isPetugas: boolean }
): Menu[] => {
  const handler = FALLBACK_MENUS_REGISTRY[mod];
  return handler ? handler(opts) : [];
};

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
  const isDosenRole = (userRoleSlugs.includes('dosen') || userRoleSlugs.includes('kaprodi') || userRoleSlugs.includes('wakil_prodi')) && !isSuperAdmin && !isAdmin;

  const isPetugasKasKecilRole =
    (userRoleSlugs.includes('petugas_kas_kecil') ||
      userRoleSlugs.includes('petugas_kaskecil') ||
      userRoleSlugs.includes('petugas kas kecil')) &&
    !isSuperAdmin &&
    !isAdmin;

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
    if (typeof window !== 'undefined') {
      const ctx = resolveDomainContext(window.location.hostname);
      if (ctx.isModule && ctx.moduleSlug) return ctx.moduleSlug;
    }
    let mod = 'sso';
    if (pathname.startsWith('/simpeg')) mod = 'simpeg';
    else if (pathname.startsWith('/sippm')) mod = 'sippm';
    else if (pathname.startsWith('/sikeu')) mod = 'sikeu';
    else if (pathname.startsWith('/spmb')) mod = 'spmb';
    else if (pathname.startsWith('/sinapra')) mod = 'sinapra';
    else if (pathname.startsWith('/siakad')) mod = 'siakad';

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
          let menus = await menuService.getMyMenus(mod);
          // Pastikan menu tagihan portal mahasiswa (/sikeu/mahasiswa/tagihan) disembunyikan untuk non-mahasiswa
          if (isMahasiswaRole && mod === 'sikeu') {
            menus = SIKEU_MAHASISWA_MENUS;
          } else if (!isMahasiswaRole) {
            menus = menus
              .filter((m) => m.url !== '/sikeu/mahasiswa/tagihan')
              .map((m) => ({
                ...m,
                children: m.children?.filter((c) => c.url !== '/sikeu/mahasiswa/tagihan'),
              }));
          }
          // Hormati hasil plotting role-menu: array kosong berarti tidak ada menu
          // yang di-plot untuk user, sehingga tidak boleh jatuh ke fallback hardcoded.
          setDynamicMenus(menus);
        } catch (error) {
          console.error("Failed to load menus", error);
          const mod = getModule();
          setDynamicMenus(getFallbackMenusForModule(mod, { isMahasiswa: isMahasiswaRole, isDosen: isDosenRole, isPanitia: isPanitiaAdmin, isPetugas: isPetugasKasKecilRole }));
        } finally {
          setLoading(false);
        }
      };
      fetchMenus();
    } else {
      const mod = getModule();
      setDynamicMenus(getFallbackMenusForModule(mod, { isMahasiswa: isMahasiswaRole, isDosen: isDosenRole, isPanitia: isPanitiaAdmin, isPetugas: isPetugasKasKecilRole }));
      setLoading(false);
    }
  }, [user, pathname]);

  // Satu-satunya URL menu yang boleh aktif: exact match menang, lalu prefix TERPANJANG.
  // Mencegah dua menu beda fitur menyala bersamaan (mis. /siakad/obe + /siakad/obe/cpl).
  const computeActiveUrl = (menus: Menu[]): string | null => {
    const moduleRoots = [
      '/siakad', '/sikeu', '/simpeg', '/spmb', '/sinapra', '/sippm', '/admin', '/dashboard',
      '/sikeu/master', '/siakad/master', '/simpeg/master',
    ];
    let best: string | null = null;
    const consider = (url: string) => {
      if (!url || url.startsWith('#')) return;
      if (moduleRoots.includes(url)) {
        if (pathname === url && (!best || best.length < url.length)) best = url;
        return;
      }
      if (pathname !== url && !pathname.startsWith(url + '/')) return;
      if (!best || best.length < url.length) best = url;
    };
    menus.forEach((m) => {
      consider(m.url);
      m.children?.forEach((c) => consider(c.url));
    });
    return best;
  };

  // ID pemenang tunggal: exact > prefix terpanjang; anak grup > menu atas bila URL sama.
  const computeActiveId = (menus: Menu[]): string | number | null => {
    const moduleRoots = [
      '/siakad', '/sikeu', '/simpeg', '/spmb', '/sinapra', '/sippm', '/admin', '/dashboard',
      '/sikeu/master', '/siakad/master', '/simpeg/master',
    ];
    let bestId: string | number | null = null;
    let bestScore: [number, number, number] | null = null;
    const consider = (url: string, id: string | number, depth: number) => {
      if (!url || url.startsWith('#')) return;
      let exact = false;
      if (moduleRoots.includes(url)) {
        if (pathname !== url) return;
        exact = true;
      } else if (pathname === url) {
        exact = true;
      } else if (!pathname.startsWith(url + '/')) {
        return;
      }
      const score: [number, number, number] = [exact ? 1 : 0, url.length, depth];
      const better =
        !bestScore ||
        score[0] > bestScore[0] ||
        (score[0] === bestScore[0] && (score[1] > bestScore[1] || (score[1] === bestScore[1] && score[2] > bestScore[2])));
      if (better) {
        bestScore = score;
        bestId = id;
      }
    };
    menus.forEach((m) => {
      consider(m.url, m.id, 0);
      m.children?.forEach((c) => consider(c.url, c.id, 1));
    });
    return bestId;
  };

  const activeMenuUrl = computeActiveUrl(dynamicMenus);
  const activeMenuId = computeActiveId(dynamicMenus);

  const isMainActive = (path: string, id?: string | number) => {
    if (!path || path.startsWith('#')) return false;
    if (activeMenuId !== null && id !== undefined) return activeMenuId === id;
    if (activeMenuUrl) return activeMenuUrl === path;
    if (pathname === path) return true;

    const isModuleRoot = [
      '/siakad', '/sikeu', '/simpeg', '/spmb', '/sinapra', '/sippm', '/admin', '/dashboard',
      '/sikeu/master', '/siakad/master', '/simpeg/master'
    ].includes(path);
    if (isModuleRoot) {
      return pathname === path;
    }

    if (pathname.startsWith(path + '/')) {
      // Check if there is another menu in dynamicMenus that matches pathname more specifically
      const hasSpecificMatch = dynamicMenus.some((m) => {
        if (m.url !== path && (m.url === pathname || (m.url.length > path.length && pathname.startsWith(m.url + '/')))) return true;
        if (m.children?.some((c) => c.url !== path && (c.url === pathname || (c.url.length > path.length && pathname.startsWith(c.url + '/'))))) return true;
        return false;
      });
      return !hasSpecificMatch;
    }

    return false;
  };

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
                            className={`sidebar-item ${isMainActive(child.url, child.id) ? 'active' : ''}`}
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
                        className={`sidebar-item ${isMainActive(menu.url, menu.id) ? 'active' : ''}`}
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
                              className={`sidebar-item sidebar-submenu-item ${isMainActive(child.url, child.id) ? 'active' : ''}`}
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
              {(user.name || user.nama_lengkap || user.username)
                ? (user.name || user.nama_lengkap || user.username).slice(0, 2).toUpperCase()
                : 'US'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name || user.nama_lengkap || user.username}</div>
              <div className="sidebar-user-role">{user.roles?.[0]?.name || user.roles?.[0]?.role?.name || 'User'}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
