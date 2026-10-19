import axios from 'axios';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
          return config;
        }
      }

      const fallbackToken = localStorage.getItem('jwt_token');
      if (fallbackToken && config.headers) {
        config.headers.Authorization = `Bearer ${fallbackToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        localStorage.removeItem('jwt_token');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;