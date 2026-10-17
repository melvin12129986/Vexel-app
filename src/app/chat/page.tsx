'use client';
import { useMarket } from '@/context/MarketContext';
import Link from 'next/link';

export default function ChatListPage() {
  const { orders, user, chatMessages } = useMarket();
  const conversations = orders.filter(
    (order) => order.buyer === user?.username || order.product.seller === user?.username
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">💬 Chat</h2>
        <p className="text-sm text-slate-500">Percakapan dengan pembeli atau penjual berdasarkan pesanan.</p>
      </div>
      {conversations.length === 0 ? (
        <p className="rounded-2xl border border-sky-100 bg-white/90 p-5 text-slate-500">Belum ada percakapan. Chat tersedia setelah ada pesanan.</p>
      ) : (
        conversations.map((order) => {
          const lastMessage = chatMessages.filter((message) => message.orderId === order.id).at(-1);
          const otherParty = order.buyer === user?.username ? order.product.seller : order.buyer;

          return (
            <Link
              key={order.id}
              href={`/chat/${order.id}`}
              className="flex items-center gap-4 rounded-3xl border border-sky-200 bg-white/90 p-5 shadow-lg transition hover:border-[#008bd0]"
            >
              <img src={order.product.image} alt={order.product.name} className="h-14 w-14 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800">{otherParty}</p>
                <p className="text-xs text-slate-500">{order.product.name} • {order.id}</p>
                <p className="truncate text-sm text-slate-600">{lastMessage?.text ?? 'Mulai percakapan mengenai pesanan ini'}</p>
              </div>
              <span className="rounded bg-sky-100 px-2 py-1 text-xs font-bold text-[#008bd0]">{order.status}</span>
            </Link>
          );
        })
      )}
    </div>
  );
}
