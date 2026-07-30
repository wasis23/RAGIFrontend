import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autentikasi - SSO Campus',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout" style={{ minHeight: '100vh' }}>
      {/* ── Left Panel: Form ── */}
      <div className="auth-form-panel">
        {/* Top Logo */}
        <div className="auth-form-logo">
          <div className="auth-logo-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="auth-logo-name">SSO Campus</span>
        </div>

        {/* Form Content */}
        <div className="auth-form-content">
          {children}
        </div>
      </div>

      {/* ── Right Panel: Visual ── */}
      <div className="auth-visual-panel">
        <div className="auth-visual-overlay" />
        <div className="auth-visual-logo">
          <div className="auth-visual-logo-mark">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="auth-visual-logo-text">SSO Campus</span>
        </div>
      </div>
    </div>
  );
}
