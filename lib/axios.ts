import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, TOKEN_KEY, REFRESH_TOKEN_KEY, ROUTES } from '@/lib/constants';
import { getCookie, getCookieDomain, getCurrentDomainContext, getAuthTokenKey } from '@/lib/domain';

// ============================================================
// Axios Instance
// ============================================================
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ============================================================
// Request Interceptor — Inject Bearer Token & X-Environment
// ============================================================
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const ctx = getCurrentDomainContext();
    const tokenKey = getAuthTokenKey(ctx.isDemo, ctx.hostname);

    // 1. Suntikkan header X-Environment jika request berasal dari lingkungan demo
    if (ctx.isDemo && config.headers) {
      config.headers['X-Environment'] = 'demo';
    }

    // 2. Token: COOKIE lintas-subdomain sebagai sumber utama (agar sesi/
    //    impersonasi konsisten antar modul; localStorage bersifat per-origin).
    const token = typeof document !== 'undefined' ? getCookie(tokenKey) : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// Response Interceptor — Auto Refresh Token pada 401
// ============================================================
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  refreshQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  refreshQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Antrikan request yang gagal saat sedang refresh
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        handleLogout();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data.data;

        localStorage.setItem(TOKEN_KEY, access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

        // Sinkronkan cookie lintas-subdomain agar subdomain modul lain
        // memakai token terbaru (bukan token lama dari localStorage).
        if (typeof document !== 'undefined') {
          const domainAttr = getCookieDomain();
          document.cookie = `${TOKEN_KEY}=${access_token}; ${domainAttr}path=/; max-age=86400; SameSite=Lax`;
        }

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        processQueue(null, access_token);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        handleLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function handleLogout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('sso-auth-storage');
  const domainAttr = getCookieDomain();
  document.cookie = `sso_access_token=; ${domainAttr}path=/; max-age=0; SameSite=Lax`;
  document.cookie = `sso_user_role=; ${domainAttr}path=/; max-age=0; SameSite=Lax`;
  document.cookie = 'sso_access_token=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'sso_user_role=; path=/; max-age=0; SameSite=Lax';

  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    const isPublic = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/mfa'].some(
      (p) => currentPath === p || currentPath.startsWith(`${p}/`)
    );
    if (!isPublic && currentPath !== '/') {
      const currentUrl = window.location.pathname + window.location.search;
      window.location.href = `${ROUTES.LOGIN}?redirect=${encodeURIComponent(currentUrl)}`;
      return;
    }
  }

  window.location.href = ROUTES.LOGIN;
}

export default apiClient;
