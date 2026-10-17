'use client';
import { useMarket } from '@/context/MarketContext';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export default function OrderChatPage() {
  const { id } = useParams<{ id: string }>();
  const { orders, user, chatMessages, setChatMessages } = useMarket();
  const [messageText, setMessageText] = useState('');
  const order = orders.find((item) => item.id === id);

  if (!order) {
    return <p className="rounded-2xl border border-sky-100 bg-white/90 p-5 text-slate-500">Pesanan untuk chat ini tidak ditemukan.</p>;
  }

  const isParticipant = user?.username === order.buyer || user?.username === order.product.seller;
  if (!isParticipant) {
    return <p className="rounded-2xl border border-rose-200 bg-white/90 p-5 text-rose-600">Anda tidak memiliki akses ke percakapan ini.</p>;
  }

  const messages = chatMessages.filter((message) => message.orderId === order.id);
  const otherParty = user?.username === order.buyer ? order.product.seller : order.buyer;

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = messageText.trim();
    if (!text || !user) return;

    setChatMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        orderId: order.id,
        sender: user.username,
        text,
        sentAt: new Date().toISOString()
      }
    ]);
    setMessageText('');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/chat" className="inline-block text-sm font-bold text-[#008bd0]">← Kembali ke daftar chat</Link>
      <header className="rounded-3xl border border-sky-200 bg-white/90 p-5 shadow-lg">
        <h2 className="text-xl font-bold text-slate-800">Chat dengan {otherParty}</h2>
        <p className="text-sm text-slate-500">{order.product.name} • {order.id} • {order.status}</p>
      </header>

      <section className="flex min-h-72 flex-col gap-3 rounded-3xl border border-sky-200 bg-white/90 p-5 shadow-lg" aria-live="polite">
        {messages.length === 0 ? (
          <p className="m-auto text-sm text-slate-500">Belum ada pesan. Mulai percakapan mengenai pesanan ini.</p>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender === user?.username;
            return (
              <div key={message.id} className={`max-w-[85%] rounded-2xl px-4 py-3 ${isOwnMessage ? 'ml-auto bg-[#008bd0] text-white' : 'bg-sky-50 text-slate-800'}`}>
                <p className="mb-1 text-xs font-bold opacity-75">{message.sender}</p>
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                <time className="mt-1 block text-right text-[10px] opacity-70">
                  {new Date(message.sentAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            );
          })
        )}
      </section>

      <form onSubmit={sendMessage} className="flex gap-2 rounded-2xl border border-sky-200 bg-white/90 p-3 shadow-lg">
        <input
          type="text"
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          placeholder="Tulis pesan..."
          maxLength={1000}
          className="min-w-0 flex-1 rounded-xl border border-sky-200 px-4 py-3 outline-none focus:border-[#008bd0]"
        />
        <button type="submit" disabled={!messageText.trim()} className="rounded-xl bg-[#008bd0] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
          Kirim
        </button>
      </form>
    </div>
  );
}
