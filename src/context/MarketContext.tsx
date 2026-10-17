'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

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
  wantsProof: boolean;
  proofFee: number;
  total: number;
  status: 'Menunggu Pembayaran' | 'Menunggu Pengiriman' | 'Dikirim' | 'Menunggu Penilaian' | 'Selesai';
  date: string;
  proofImage?: string;
  rating?: number;
};

export type ChatMessage = {
  id: string;
  orderId: string;
  sender: string;
  text: string;
  sentAt: string;
};

type MarketContextValue = {
  user: { username: string } | null;
  setUser: React.Dispatch<React.SetStateAction<{ username: string } | null>>;
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
};

const initialProducts: Product[] = [
  { id: 1, name: 'Awakened Divine Orb', game: 'Path of Exile', category: 'Currency', price: 8500, stock: 250, minBuy: 10, providesProof: true, seller: 'ProTrader_99', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIRrJp6esj1u0KMwZRU7FhkpGxs1PwjJcOUwn4sozPQnBOyZqo9boQJco&s=10', desc: 'Trade via Party Face-to-Face. Siapkan item rare/sampah di inventory.', ratingCount: 0, avgDelivery: '5 Menit' },
  { id: 2, name: 'AK-47 | Redline', game: 'CS2', category: 'Weapon', price: 210000, stock: 5, minBuy: 1, providesProof: true, seller: 'ProTrader_99', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0_qUiulj71diHhEWU2boAkauFAu-cWFUTckUM1tGF2ywNh-2QsZmj-yM&s=10', desc: 'Steam Trade Offer Instant 24/7.', ratingCount: 0, avgDelivery: 'Instan' }
];

const initialOrders: Order[] = [
  {
    id: 'ORD-1001',
    product: initialProducts[0],
    qty: 10,
    buyer: 'PlayerOne',
    wantsProof: false,
    proofFee: 0,
    total: initialProducts[0].price * 10,
    status: 'Dikirim',
    date: 'Hari ini'
  }
];

const PRODUCTS_STORAGE_KEY = 'vexel-products';
const ORDERS_STORAGE_KEY = 'vexel-orders';
const previousDefaultImages: Record<number, string[]> = {
  1: [
    'https://placehold.co/400x300/008bd0/ffffff',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIRrJp6esj1u0KMwZRU7FhkpGxs1PwjJcOUwn4sozPQnBOyZqo9boQJco&s=10'
  ],
  2: [
    'https://placehold.co/400x300/e11d48/ffffff',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0_qUiulj71diHhEWU2boAkauFAu-cWFUTckUM1tGF2ywNh-2QsZmj-yM&s=10'
  ]
};

const isProduct = (value: unknown): value is Product => {
  if (typeof value !== 'object' || value === null) return false;
  const product = value as Record<string, unknown>;
  return typeof product.id === 'number'
    && typeof product.name === 'string'
    && typeof product.game === 'string'
    && typeof product.price === 'number'
    && typeof product.stock === 'number'
    && typeof product.minBuy === 'number'
    && typeof product.image === 'string'
    && typeof product.seller === 'string'
    && typeof product.providesProof === 'boolean'
    && typeof product.category === 'string'
    && typeof product.desc === 'string'
    && typeof product.avgDelivery === 'string';
};

const isOrder = (value: unknown): value is Order => {
  if (typeof value !== 'object' || value === null) return false;
  const order = value as Record<string, unknown>;
  return typeof order.id === 'string'
    && isProduct(order.product)
    && typeof order.qty === 'number'
    && typeof order.buyer === 'string'
    && typeof order.wantsProof === 'boolean'
    && typeof order.proofFee === 'number'
    && typeof order.total === 'number'
    && ['Menunggu Pembayaran', 'Menunggu Pengiriman', 'Dikirim', 'Menunggu Penilaian', 'Selesai'].includes(String(order.status))
    && typeof order.date === 'string'
    && (order.proofImage === undefined || typeof order.proofImage === 'string')
    && (order.rating === undefined || typeof order.rating === 'number');
};

export const MarketContext = createContext<MarketContextValue | null>(null);

export const MarketProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ username: string } | null>({ username: 'ProTrader_99' });
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [productStorageError, setProductStorageError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [orderStorageError, setOrderStorageError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    try {
      const storedProducts = window.localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (storedProducts) {
        const parsedProducts: unknown = JSON.parse(storedProducts);
        if (!Array.isArray(parsedProducts) || !parsedProducts.every(isProduct)) {
          throw new Error('Data produk tersimpan tidak valid.');
        }
        const migratedProducts = parsedProducts.map((storedProduct) => {
          const defaultProduct = initialProducts.find((product) => product.id === storedProduct.id);
          const oldDefaultImages = previousDefaultImages[storedProduct.id] ?? [];
          if (
            defaultProduct &&
            oldDefaultImages.includes(storedProduct.image) &&
            storedProduct.image !== defaultProduct.image
          ) {
            return { ...storedProduct, image: defaultProduct.image };
          }
          return storedProduct;
        });
        setProducts(migratedProducts);
      }
    } catch (error) {
      console.error('Gagal memuat produk tersimpan.', error);
      setProductStorageError('Data barang tersimpan tidak dapat dimuat. Penyimpanan browser mungkin bermasalah.');
    } finally {
      setProductsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!productsLoaded) return;
    try {
      window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      setProductStorageError(null);
    } catch (error) {
      console.error('Gagal menyimpan produk ke penyimpanan browser.', error);
      setProductStorageError('Barang belum tersimpan permanen. Ruang penyimpanan browser mungkin penuh.');
    }
  }, [products, productsLoaded]);

  useEffect(() => {
    try {
      const storedOrders = window.localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        const parsedOrders: unknown = JSON.parse(storedOrders);
        if (!Array.isArray(parsedOrders) || !parsedOrders.every(isOrder)) {
          throw new Error('Data pesanan tersimpan tidak valid.');
        }
        setOrders(parsedOrders);
      }
    } catch (error) {
      console.error('Gagal memuat pesanan tersimpan.', error);
      setOrderStorageError('Riwayat pesanan tidak dapat dimuat dari penyimpanan browser.');
    } finally {
      setOrdersLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!ordersLoaded) return;
    try {
      window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
      setOrderStorageError(null);
    } catch (error) {
      console.error('Gagal menyimpan pesanan ke penyimpanan browser.', error);
      setOrderStorageError('Riwayat pesanan belum tersimpan permanen. Penyimpanan browser mungkin penuh.');
    }
  }, [orders, ordersLoaded]);

  const executeWithLoading = (callback: () => void) => {
    const timer = window.setTimeout(() => {
      callback();
    }, 500);

    return () => window.clearTimeout(timer);
  };

  return (
    <MarketContext.Provider
      value={{
        user,
        setUser,
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
        executeWithLoading
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