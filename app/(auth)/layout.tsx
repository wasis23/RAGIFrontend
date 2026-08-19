import type { Metadata } from 'next';
import { Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Autentikasi - SSO Campus',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* ── Left Panel: Form (45-50%) ── */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col px-6 sm:px-12 lg:px-16 xl:px-24 py-8 lg:py-10 min-h-screen relative">
        {/* Top Logo */}
        <div className="flex items-center gap-3 mb-auto">
          <div className="w-9 h-9 flex items-center justify-center bg-blue-600 rounded-lg shadow-sm text-white">
            <Layers size={20} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">SSO Campus</span>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex flex-col justify-center w-full max-w-[420px] mx-auto py-12 lg:py-20">
          {children}
        </div>
        
        {/* Footer spacer */}
        <div className="mt-auto text-xs font-medium text-slate-400 text-center lg:text-left">
          &copy; {new Date().getFullYear()} SSO Campus. All rights reserved.
        </div>
      </div>

      {/* ── Right Panel: Visual (50-60%) ── */}
      <div className="hidden lg:flex flex-1 relative bg-[#0B0F19] items-end p-16 overflow-hidden">
        {/* Abstract background elements (Futuristic/Subtle) */}
        <div className="absolute inset-0 bg-[url('/auth-bg.png')] bg-cover bg-center opacity-30 mix-blend-luminosity" />
        
        {/* Deep blue/purple glowing orbs for tech feel */}
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute top-[40%] -left-[20%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[100px]" />
        <div className="absolute bottom-0 right-[10%] w-[70%] h-[50%] rounded-full bg-indigo-600/20 blur-[140px]" />
        
        {/* Overlay gradient to ensure dark bottom for text */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent opacity-80" />
        
        {/* Branding inside visual panel (Bottom Right) */}
        <div className="relative z-10 ml-auto flex items-center gap-4 bg-white/5 backdrop-blur-md px-6 py-5 rounded-2xl border border-white/10 shadow-2xl">
          <div className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-xl text-white ring-1 ring-white/20">
            <Layers size={22} strokeWidth={2} />
          </div>
          <div>
            <div className="text-white font-semibold tracking-wide text-lg leading-tight">SSO Campus</div>
            <div className="text-slate-400 text-sm font-medium mt-0.5">Enterprise Identity Platform</div>
          </div>
        </div>
      </div>
    </div>
  );
}
