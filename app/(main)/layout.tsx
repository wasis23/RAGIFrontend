'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useUiStore } from '@/store/uiStore';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { sidebar_open } = useUiStore();

  return (
    <div className={`main-layout ${sidebar_open ? '' : 'sidebar-collapsed'}`}>
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar />
        <main style={{ flex: 1, padding: '2rem', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
