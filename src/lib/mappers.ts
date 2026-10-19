import type { Product, Order, ChatMessage } from '@/context/MarketContext';

export function mapDbProductToProduct(row: Record<string, any>): Product {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    game: String(row.game ?? ''),
    category: String(row.category ?? 'Skin'),
    price: Number(row.price ?? 0),
    stock: Number(row.stock ?? 0),
    minBuy: Number(row.min_buy ?? row.minBuy ?? 1),
    image: String(row.image ?? ''),
    seller: String(row.seller ?? ''),
    providesProof: Boolean(row.provides_proof ?? row.providesProof ?? false),
    desc: String(row.desc ?? ''),
    rating: row.rating !== null && row.rating !== undefined ? Number(row.rating) : undefined,
    ratingCount: Number(row.rating_count ?? row.ratingCount ?? 0),
    avgDelivery: String(row.avg_delivery ?? row.avgDelivery ?? '10 Menit')
  };
}

export function mapDbOrderToOrder(row: Record<string, any>): Order {
  const snapshot =
    typeof row.product_snapshot === 'object' && row.product_snapshot !== null
      ? mapDbProductToProduct(row.product_snapshot)
      : {
          id: Number(row.product_id ?? 0),
          name: 'Item',
          game: '-',
          category: 'Skin',
          price: 0,
          stock: 0,
          minBuy: 1,
          image: 'https://placehold.co/400x300/008bd0/ffffff?text=Vexel',
          seller: String(row.seller ?? ''),
          providesProof: false,
          desc: '',
          ratingCount: 0,
          avgDelivery: '10 Menit'
        };

  const subtotal = Number(row.subtotal ?? snapshot.price * Number(row.qty ?? 1));
  const serviceFee = Number(row.service_fee ?? Math.round(subtotal * 0.04));
  const proofFee = Number(row.proof_fee ?? 0);
  const voucherDiscount = Number(row.voucher_discount ?? 0);
  const total = Number(row.total ?? subtotal - voucherDiscount + serviceFee + proofFee);
  const sellerEarning = Number(row.seller_earning ?? subtotal + proofFee);

  return {
    id: String(row.id),
    product: snapshot,
    qty: Number(row.qty ?? 1),
    buyer: String(row.buyer ?? ''),
    inGameNickname: String(row.in_game_nickname ?? ''),
    wantsProof: Boolean(row.wants_proof ?? false),
    subtotal,
    serviceFee,
    proofFee,
    voucherCode: row.voucher_code ? String(row.voucher_code) : undefined,
    voucherDiscount,
    total,
    sellerEarning,
    status: row.status as Order['status'],
    date: String(row.date ?? 'Hari ini'),
    proofImage: row.proof_image ? String(row.proof_image) : undefined,
    rating: row.rating !== null && row.rating !== undefined ? Number(row.rating) : undefined,
    snapToken: row.snap_token ? String(row.snap_token) : undefined
  };
}

export function mapDbChatToChatMessage(row: Record<string, any>): ChatMessage {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    sender: String(row.sender),
    text: String(row.text),
    sentAt: String(row.sent_at)
  };
}
