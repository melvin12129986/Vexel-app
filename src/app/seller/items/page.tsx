'use client';
import { useMarket, Product } from '@/context/MarketContext';
import { useState } from 'react';
import axiosClient from '@/lib/axiosClient';

export default function SellerItemsPage() {
  const { products, setProducts, productStorageError, user } = useMarket();
  const sellerProducts = products.filter((product) => product.seller === user?.username);
  const [showModal, setShowModal] = useState(false);
  const [imageError, setImageError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  const defaultForm = {
    id: 0,
    name: '',
    game: '',
    category: 'Skin',
    price: '',
    stock: '',
    minBuy: '',
    image: '',
    desc: '',
    avgDelivery: '10 Menit',
    providesProof: false
  };

  const [formData, setFormData] = useState<any>(defaultForm);

  // Upload Gambar ke Supabase Storage via Server API
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setImageError('');

    try {
      const payload = new FormData();
      payload.append('file', file);
      payload.append('bucket', 'product-images');

      const response = await axiosClient.post('/api/upload', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.url) {
        setFormData((current: typeof defaultForm) => ({
          ...current,
          image: response.data.url
        }));
      }
    } catch (error: any) {
      setImageError(
        error?.response?.data?.error ||
          'Gagal mengunggah gambar ke Supabase Storage. Silakan coba lagi.'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const openAddModal = () => {
    setFormData(defaultForm);
    setImageError('');
    setShowModal(true);
  };

  const openEditModal = (item: Product) => {
    setFormData(item);
    setImageError('');
    setShowModal(true);
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Apakah kamu yakin ingin menghapus item ini dari toko?')) return;

    try {
      await axiosClient.delete(`/api/products/${id}`);
      setProducts((current) => current.filter((p: Product) => p.id !== id));
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Gagal menghapus produk.');
    }
  };

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingItem(true);
    setImageError('');

    const payload = {
      name: formData.name,
      game: formData.game,
      category: formData.category,
      price: Number(formData.price),
      stock: Number(formData.stock),
      minBuy: Number(formData.minBuy),
      providesProof: Boolean(formData.providesProof),
      desc: formData.desc,
      avgDelivery: formData.avgDelivery,
      image:
        formData.image ||
        'https://placehold.co/400x300/008bd0/ffffff?text=No+Image'
    };

    try {
      if (formData.id) {
        const response = await axiosClient.put(`/api/products/${formData.id}`, payload);
        const updatedProduct = response.data?.product;
        if (updatedProduct) {
          setProducts((current) =>
            current.map((p: Product) => (p.id === formData.id ? updatedProduct : p))
          );
        }
      } else {
        const response = await axiosClient.post('/api/products', payload);
        const createdProduct = response.data?.product;
        if (createdProduct) {
          setProducts((current) => [createdProduct, ...current]);
        }
      }
      setShowModal(false);
    } catch (error: any) {
      setImageError(
        error?.response?.data?.error || 'Gagal menyimpan produk ke database.'
      );
    } finally {
      setSavingItem(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/90 p-6 rounded-3xl shadow-xl border border-sky-200">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[#008bd0]">Inventaris toko</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-800">Daftar Barang</h2>
          <p className="mt-1 text-sm text-slate-500">Kelola stok, harga, deskripsi, dan estimasi pengiriman produk.</p>
        </div>
        <button onClick={openAddModal} className="bg-[#008bd0] hover:bg-[#0073ad] text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md">
          + Tambah Item Baru
        </button>
      </div>
      {productStorageError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {productStorageError}
        </p>
      )}

      <div className="bg-white/90 rounded-3xl shadow-xl border border-sky-200 overflow-hidden">
        {sellerProducts.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="text-4xl">🛍️</span>
            <p className="mt-3 font-bold text-slate-700">Belum ada barang di tokomu</p>
            <p className="mt-1 text-sm text-slate-500">Tambahkan barang pertama untuk mulai berjualan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-sky-50 text-xs text-slate-500 uppercase font-bold border-b border-sky-100">
                <tr>
                  <th className="p-4">Item & Game</th>
                  <th className="p-4">Stok</th>
                  <th className="p-4">Harga</th>
                  <th className="p-4">Rating & Pengiriman</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100">
                {sellerProducts.map((item: Product) => (
                  <tr key={item.id} className="hover:bg-sky-50/50 transition-colors">
                    <td className="p-4 font-bold flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-sky-200" />
                      <div>
                        <p className="text-slate-800">{item.name}</p>
                        <span className="text-[10px] text-[#008bd0] bg-sky-100 px-2 py-0.5 rounded-full">{item.game}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700">{item.stock} Unit</td>
                    <td className="p-4 text-[#008bd0] font-black">Rp {item.price.toLocaleString('id-ID')}</td>
                    <td className="p-4">
                      {item.ratingCount ? (
                        <p className="text-amber-500 font-bold">★ {item.rating?.toFixed(1)} <span className="text-xs text-slate-500">({item.ratingCount})</span></p>
                      ) : (
                        <p className="text-xs text-slate-400">Belum ada rating</p>
                      )}
                      <p className="text-[10px] text-slate-500">⏱ Rata-rata: {item.avgDelivery || '10 Menit'}</p>
                      <p className="text-[10px] font-semibold text-[#008bd0]">{item.providesProof ? 'Bukti transaksi +5%' : 'Tanpa bukti transaksi'}</p>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button onClick={() => openEditModal(item)} className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm">Edit</button>
                      <button onClick={() => deleteItem(item.id)} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form Tambah / Edit Produk */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl border border-sky-200 max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-sky-100 pb-4">
              <h3 className="text-xl font-black text-[#008bd0]">{formData.id ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="text-2xl font-bold text-slate-400 hover:text-slate-700">&times;</button>
            </div>

            <form onSubmit={saveItem} className="space-y-5">
              {/* Area Upload Gambar ke Supabase Storage */}
              <div className="relative border-2 border-dashed border-sky-300 bg-sky-50 p-6 rounded-2xl text-center hover:bg-sky-100 transition-colors group cursor-pointer overflow-hidden">
                {formData.image ? (
                  <img src={formData.image} alt="Preview produk" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                ) : null}
                <div className="relative z-10">
                  <span className="text-3xl block mb-2">📸</span>
                  <p className="text-sm font-bold text-[#008bd0]">
                    {uploadingImage
                      ? 'Mengunggah ke Supabase Storage...'
                      : 'Klik atau Seret Gambar untuk Upload'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP (Maks. 5MB)</p>
                </div>
                <input
                  type="file"
                  disabled={uploadingImage}
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                  accept="image/*"
                />
              </div>
              {imageError && <p role="alert" className="text-sm font-semibold text-rose-600">{imageError}</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600">Nama Item</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border-2 border-sky-100 focus:border-[#008bd0] rounded-xl outline-none mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Nama Game</label>
                  <input type="text" required value={formData.game} onChange={e => setFormData({ ...formData, game: e.target.value })} className="w-full px-4 py-2 border-2 border-sky-100 focus:border-[#008bd0] rounded-xl outline-none mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Harga Satuan (Rp)</label>
                  <input type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full px-4 py-2 border-2 border-sky-100 focus:border-[#008bd0] rounded-xl outline-none mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600">Stok</label>
                    <input type="number" required value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="w-full px-4 py-2 border-2 border-sky-100 focus:border-[#008bd0] rounded-xl outline-none mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600">Min. Beli</label>
                    <input type="number" required value={formData.minBuy} onChange={e => setFormData({ ...formData, minBuy: e.target.value })} className="w-full px-4 py-2 border-2 border-sky-100 focus:border-[#008bd0] rounded-xl outline-none mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Estimasi Pengiriman (Rata-rata)</label>
                  <input type="text" required placeholder="Contoh: 5 Menit / Instan" value={formData.avgDelivery} onChange={e => setFormData({ ...formData, avgDelivery: e.target.value })} className="w-full px-4 py-2 border-2 border-sky-100 focus:border-[#008bd0] rounded-xl outline-none mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Kategori</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border-2 border-sky-100 focus:border-[#008bd0] rounded-xl outline-none mt-1">
                    <option value="Skin">Skin / Cosmetic</option>
                    <option value="Weapon">Weapon / Equipment</option>
                    <option value="Currency">In-Game Currency</option>
                  </select>
                </div>
                <label className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.providesProof)}
                    onChange={(e) => setFormData({ ...formData, providesProof: e.target.checked })}
                    className="mt-1 h-4 w-4 accent-[#008bd0]"
                  />
                  <span>
                    <span className="block font-bold text-slate-700">Sediakan bukti transaksi</span>
                    <span className="text-slate-500">Pembeli dikenakan biaya bukti sebesar 5% dari harga barang.</span>
                  </span>
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Deskripsi Lengkap & Ketentuan Trade</label>
                <textarea required rows={3} value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} className="w-full px-4 py-2 border-2 border-sky-100 focus:border-[#008bd0] rounded-xl outline-none mt-1" placeholder="Jelaskan cara trade atau ketentuan in-game..."></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all">Batal</button>
                <button
                  type="submit"
                  disabled={savingItem || uploadingImage}
                  className="flex-1 bg-[#008bd0] hover:bg-[#0073ad] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:-translate-y-1"
                >
                  {savingItem ? 'Menyimpan...' : 'Simpan Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}