'use client';
import { useState, useEffect } from 'react';
import { orders as ordersApi, type Order } from '@/lib/api';

export default function Orders() {
    const [orderList, setOrderList] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        ordersApi.getAll()
            .then(setOrderList)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Parse the description string "Product x2, Other x1" into line items
    const parseDescription = (description: string) => {
        if (!description) return [];
        return description.split(',').map(part => {
            const trimmed = part.trim();
            const match = trimmed.match(/^(.+?)\s+x(\d+)$/);
            if (match) {
                return { name: match[1], quantity: parseInt(match[2], 10) };
            }
            return { name: trimmed, quantity: 1 };
        });
    };

    return (
        <div className="animate-in">
            <div className="mb-6">
                <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                >
                    Order History
                </h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                    {orderList.length > 0
                        ? `${orderList.length} order${orderList.length !== 1 ? 's' : ''} on record`
                        : 'Your completed orders will appear here'
                    }
                </p>
            </div>

            <div className="card-flat overflow-hidden">
                {loading ? (
                    <div className="text-center py-16 text-[var(--text-muted)]">Loading orders…</div>
                ) : orderList.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-4xl mb-3 opacity-30">📋</div>
                        <p className="text-[var(--text-muted)] text-sm">No orders found. Process your first sale from the POS page.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {orderList.map((order, index) => (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className="flex items-center justify-between p-5 hover:bg-[var(--bg-base)] transition cursor-pointer group"
                                style={{ animationDelay: `${index * 40}ms` }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-bold text-xs">
                                        #{order.id}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm text-[var(--text-primary)]">{order.description}</div>
                                        <div className="text-xs text-[var(--text-muted)] mt-0.5">
                                            {order.quantity} item{order.quantity !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="font-bold text-[var(--accent)]">${(order.totalPrice ?? 0).toFixed(2)}</div>
                                        {(order.remainingAmount ?? 0) > 0 && (
                                            <div className="text-xs text-[var(--danger)] mt-0.5">
                                                ${(order.remainingAmount ?? 0).toFixed(2)} remaining
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                                        View ›
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Order Detail Modal ─────────────────────────── */}
            {selectedOrder && (
                <div
                    className="modal-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setSelectedOrder(null);
                    }}
                >
                    <div className="card p-0 max-w-md w-full mx-4 overflow-hidden animate-in">
                        {/* Header */}
                        <div className="px-6 py-5 bg-[var(--bg-muted)] border-b border-[var(--border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-bold text-xs">
                                    #{selectedOrder.id}
                                </div>
                                <div>
                                    <h3
                                        className="font-bold text-[var(--text-primary)] text-lg"
                                        style={{ fontFamily: 'Playfair Display, serif' }}
                                    >
                                        Order Details
                                    </h3>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        {selectedOrder.quantity} item{selectedOrder.quantity !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Items breakdown */}
                        <div className="px-6 py-4">
                            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Items</p>
                            <div className="space-y-2">
                                {parseDescription(selectedOrder.description).map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-bold text-xs">
                                                {item.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium text-[var(--text-primary)]">{item.name}</span>
                                        </div>
                                        <span className="text-sm text-[var(--text-secondary)] font-semibold">
                                            x{item.quantity}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment summary */}
                        <div className="px-6 pb-5">
                            <div className="border-t border-[var(--border)] pt-4 space-y-2.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-secondary)]">Total Price</span>
                                    <span className="font-bold text-[var(--text-primary)]">${(selectedOrder.totalPrice ?? 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-secondary)]">Paid Amount</span>
                                    <span className="font-medium text-[var(--success)]">${(selectedOrder.paidAmount ?? 0).toFixed(2)}</span>
                                </div>
                                {(selectedOrder.remainingAmount ?? 0) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--text-secondary)]">Remaining</span>
                                        <span className="font-medium text-[var(--danger)]">${(selectedOrder.remainingAmount ?? 0).toFixed(2)}</span>
                                    </div>
                                )}

                                {/* Status badge */}
                                <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                                    <span className="text-sm text-[var(--text-secondary)]">Status</span>
                                    {(selectedOrder.remainingAmount ?? 0) > 0 ? (
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-[var(--danger)] border border-red-200">
                                            Partially Paid
                                        </span>
                                    ) : (
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-[var(--success)] border border-green-200">
                                            Paid in Full
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-5">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="btn btn-ghost w-full py-2.5"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}