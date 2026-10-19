'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react';
import axiosClient from '@/lib/axiosClient';
import { getSupabaseBrowserClient, isSupabaseClientConfigured } from '@/lib/supabaseClient';
import { mapDbChatToChatMessage } from '@/lib/mappers';

export type Product = {
  id: number;
  name: string;
  game: string;
  price: number;
  stock: number;
  minBuy: number;
  image: string;
  seller: string;
  providesProof: boolean;
  category: string;
  desc: string;
  rating?: number;
  ratingCount?: number;
  avgDelivery: string;
};

export type Order = {
  id: string;
  product: Product;
  qty: number;
  buyer: string;
  inGameNickname?: string;
  wantsProof: boolean;
  subtotal: number;
  serviceFee: number;
  proofFee: number;
  voucherCode?: string;
  voucherDiscount: number;
  total: number;
  sellerEarning: number;
  status:
    | 'Menunggu Pembayaran'
    | 'Menunggu Pengiriman'
    | 'Dikirim'
    | 'Menunggu Penilaian'
    | 'Selesai';
  date: string;
  proofImage?: string;
  rating?: number;
  snapToken?: string;
};

export type ChatMessage = {
  id: string;
  orderId: string;
  sender: string;
  text: string;
  sentAt: string;
};

export type UserProfile = {
  id?: string;
  username: string;
  email?: string;
};

type MarketContextValue = {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  userLoaded: boolean;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  productStorageError: string | null;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  orderStorageError: string | null;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  selectedQty: number;
  setSelectedQty: React.Dispatch<React.SetStateAction<number>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  executeWithLoading: (callback: () => void) => void;
  refreshProducts: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshChatMessages: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const MarketContext = createContext<MarketContextValue | null>(null);

export const MarketProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productStorageError, setProductStorageError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStorageError, setOrderStorageError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const refreshProducts = useCallback(async () => {
    try {
      const response = await axiosClient.get('/api/products');
      if (Array.isArray(response.data?.products)) {
        setProducts(response.data.products);
        setProductStorageError(null);
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.message ||
        'Gagal memuat data produk dari server.';
      setProductStorageError(msg);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }
    try {
      const response = await axiosClient.get('/api/orders');
      if (Array.isArray(response.data?.orders)) {
        setOrders(response.data.orders);
        setOrderStorageError(null);
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.message ||
        'Gagal memuat data pesanan dari server.';
      setOrderStorageError(msg);
    }
  }, [user]);

  const refreshChatMessages = useCallback(async () => {
    if (!user) {
      setChatMessages([]);
      return;
    }
    try {
      const response = await axiosClient.get('/api/chat');
      if (Array.isArray(response.data?.messages)) {
        setChatMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Gagal memuat pesan chat dari server.', error);
    }
  }, [user]);

  // 1. Muat sesi autentikasi dari Supabase Auth
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setUserLoaded(true);
      return;
    }

    let isMounted = true;

    const loadCurrentSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          if (isMounted) setUser(null);
          return;
        }
        const meRes = await axiosClient.get('/api/auth/me');
        if (isMounted && meRes.data?.user) {
          setUser(meRes.data.user);
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setUserLoaded(true);
      }
    };

    loadCurrentSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        if (isMounted) {
          setUser(null);
          setOrders([]);
          setChatMessages([]);
        }
        return;
      }

      try {
        const meRes = await axiosClient.get('/api/auth/me');
        if (isMounted && meRes.data?.user) {
          setUser(meRes.data.user);
        }
      } catch {
        // Abaikan jika sesi sedang transisi
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. Muat katalog produk dari server
  useEffect(() => {
    if (!isSupabaseClientConfigured()) {
      setProductStorageError(
        'Konfigurasi Supabase belum diatur di .env.local. Silakan isi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY.'
      );
      return;
    }
    refreshProducts();
  }, [refreshProducts]);

  // 3. Muat pesanan & chat setiap kali user login berubah
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setChatMessages([]);
      return;
    }
    refreshOrders();
    refreshChatMessages();
  }, [user, refreshOrders, refreshChatMessages]);

  // 4. Langganan Realtime untuk chat_messages & orders dari Supabase
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return;

    const channel = supabase
      .channel(`vexel-realtime-${user.username}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const incoming = mapDbChatToChatMessage(payload.new);
          setChatMessages((current) => {
            if (current.some((msg) => msg.id === incoming.id)) return current;
            return [...current, incoming];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          refreshOrders();
          refreshProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshOrders, refreshProducts]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setOrders([]);
    setChatMessages([]);
  }, []);

  const executeWithLoading = (callback: () => void) => {
    const timer = window.setTimeout(() => {
      callback();
    }, 300);

    return () => window.clearTimeout(timer);
  };

  return (
    <MarketContext.Provider
      value={{
        user,
        setUser,
        userLoaded,
        products,
        setProducts,
        productStorageError,
        orders,
        setOrders,
        orderStorageError,
        chatMessages,
        setChatMessages,
        selectedQty,
        setSelectedQty,
        searchQuery,
        setSearchQuery,
        executeWithLoading,
        refreshProducts,
        refreshOrders,
        refreshChatMessages,
        signOut
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => {
  const context = useContext(MarketContext);

  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }

  return context;
};