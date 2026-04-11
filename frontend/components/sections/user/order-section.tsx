'use client';
import { useState, useEffect, useMemo } from 'react';
import { orders as ordersApi, type Order } from '@/lib/api';

// ── Helpers ──────────────────────────────────────────────
function toLocalDateStr(iso: string | undefined): string {
    if (!iso) return 'Unknown';
    return new Date(iso).toLocaleDateString('en-CA'); // YYYY-MM-DD
}

function formatDateHeading(dateStr: string): string {
    if (dateStr === 'Unknown') return 'Unknown Date';
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (d.getTime() === today.getTime()) return 'Today';
    if (d.getTime() === yesterday.getTime()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(iso: string | undefined): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function todayStr(): string {
    return new Date().toLocaleDateString('en-CA');
}

// ── Component ────────────────────────────────────────────
export default function Orders() {
    const [orderList, setOrderList] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Date filter
    const [filterMode, setFilterMode] = useState<'today' | 'custom'>('today');
    const [dateFrom, setDateFrom] = useState(todayStr());
    const [dateTo, setDateTo] = useState(todayStr());

    useEffect(() => {
        ordersApi.getAll()
            .then(setOrderList)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Filter orders by date range
    const filteredOrders = useMemo(() => {
        const from = filterMode === 'today' ? todayStr() : dateFrom;
        const to = filterMode === 'today' ? todayStr() : dateTo;
        return orderList.filter(o => {
            const d = toLocalDateStr(o.createdAt);
            return d >= from && d <= to;
        });
    }, [orderList, filterMode, dateFrom, dateTo]);

    // Group by day, newest first
    const groupedOrders = useMemo(() => {
        const groups: Record<string, Order[]> = {};
        filteredOrders.forEach(o => {
            const key = toLocalDateStr(o.createdAt);
            if (!groups[key]) groups[key] = [];
            groups[key].push(o);
        });
        return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
    }, [filteredOrders]);

    // Totals for the active filter
    const totals = useMemo(() => {
        const totalRevenue = filteredOrders.reduce((s, o) => s + (o.totalPrice ?? 0), 0);
        const totalItems = filteredOrders.reduce((s, o) => s + (o.quantity ?? 0), 0);
        return { totalRevenue, totalItems, orderCount: filteredOrders.length };
    }, [filteredOrders]);

    const filterLabel = useMemo(() => {
        if (filterMode === 'today') return 'Today';
        if (dateFrom === dateTo) return formatDateHeading(dateFrom);
        return `${dateFrom} → ${dateTo}`;
    }, [filterMode, dateFrom, dateTo]);

    const parseDescription = (description: string) => {
        if (!description) return [];
        return description.split(',').map(part => {
            const trimmed = part.trim();
            const match = trimmed.match(/^(.+?)\s+x(\d+)$/);
            if (match) return { name: match[1], quantity: parseInt(match[2], 10) };
            return { name: trimmed, quantity: 1 };
        });
    };

    return (
        <div className="animate-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Order History
                </h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                    {filterLabel} · {totals.orderCount} order{totals.orderCount !== 1 ? 's' : ''}
                </p>
            </div>

            {/* ── Date Filter ────────────────────────────── */}
            <div className="card-flat p-4 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Period</p>
                    <button
                        onClick={() => setFilterMode('today')}
                        className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                            filterMode === 'today'
                                ? 'text-white bg-[var(--accent)] shadow-sm'
                                : 'text-[var(--text-secondary)] bg-[var(--bg-muted)] hover:bg-[var(--border)]'
                        }`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setFilterMode('custom')}
                        className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                            filterMode === 'custom'
                                ? 'text-white bg-[var(--accent)] shadow-sm'
                                : 'text-[var(--text-secondary)] bg-[var(--bg-muted)] hover:bg-[var(--border)]'
                        }`}
                    >
                        Custom Range
                    </button>

                    {filterMode === 'custom' && (
                        <div className="flex items-center gap-2 ml-auto">
                            <input type="date" className="input py-1.5 px-3 text-sm w-auto" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                            <span className="text-xs text-[var(--text-muted)]">to</span>
                            <input type="date" className="input py-1.5 px-3 text-sm w-auto" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Summary Cards ──────────────────────────── */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                    { label: 'Orders', value: totals.orderCount, icon: '▤' },
                    { label: 'Items Sold', value: totals.totalItems, icon: '▦' },
                    { label: 'Revenue', value: `$${totals.totalRevenue.toFixed(2)}`, icon: '◆' },
                ].map((stat, i) => (
                    <div key={stat.label} className="card p-4 animate-in" style={{ animationDelay: `${i * 40}ms` }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 font-bold text-xs bg-[var(--accent-soft)] text-[var(--accent)]">{stat.icon}</div>
                        <div className="text-xl font-black tracking-tight text-[var(--accent)]">{stat.value}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Orders grouped by day ───────────────────── */}
            <div className="space-y-4">
                {loading ? (
                    <div className="card-flat text-center py-16 text-[var(--text-muted)]">Loading orders…</div>
                ) : groupedOrders.length === 0 ? (
                    <div className="card-flat text-center py-16">
                        <div className="text-4xl mb-3 opacity-30">📋</div>
                        <p className="text-[var(--text-muted)] text-sm">
                            {filterMode === 'today'
                                ? 'No orders today yet.'
                                : 'No orders found for the selected range.'}
                        </p>
                    </div>
                ) : (
                    groupedOrders.map(([dateKey, dayOrders]) => {
                        const dayTotal = dayOrders.reduce((s, o) => s + (o.totalPrice ?? 0), 0);
                        const dayItems = dayOrders.reduce((s, o) => s + (o.quantity ?? 0), 0);
                        return (
                            <div key={dateKey} className="card-flat overflow-hidden">
                                {/* Day header */}
                                <div className="flex items-center justify-between px-5 py-3 bg-[var(--bg-muted)] border-b border-[var(--border)]">
                                    <div>
                                        <p className="text-sm font-bold text-[var(--text-primary)]">{formatDateHeading(dateKey)}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{dayOrders.length} order{dayOrders.length !== 1 ? 's' : ''} · {dayItems} item{dayItems !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-[var(--accent)]">${dayTotal.toFixed(2)}</p>
                                        <p className="text-xs text-[var(--text-muted)]">Day total</p>
                                    </div>
                                </div>
                                {/* Orders */}
                                <div className="divide-y divide-[var(--border)]">
                                    {dayOrders.map(order => (
                                        <div
                                            key={order.id}
                                            onClick={() => setSelectedOrder(order)}
                                            className="flex items-center justify-between p-5 hover:bg-[var(--bg-base)] transition cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-bold text-xs">#{order.id}</div>
                                                <div>
                                                    <div className="font-medium text-sm text-[var(--text-primary)]">{order.description}</div>
                                                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{formatTime(order.createdAt)} · {order.quantity} item{order.quantity !== 1 ? 's' : ''}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="font-bold text-[var(--accent)]">${(order.totalPrice ?? 0).toFixed(2)}</div>
                                                <span className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity text-xs">View ›</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Order Detail Modal ─────────────────────── */}
            {selectedOrder && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrder(null); }}>
                    <div className="card p-0 max-w-md w-full mx-4 overflow-hidden animate-in">
                        <div className="px-6 py-5 bg-[var(--bg-muted)] border-b border-[var(--border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-bold text-xs">#{selectedOrder.id}</div>
                                <div>
                                    <h3 className="font-bold text-[var(--text-primary)] text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>Order Details</h3>
                                    <p className="text-xs text-[var(--text-muted)]">{formatTime(selectedOrder.createdAt)} · {selectedOrder.quantity} item{selectedOrder.quantity !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition">✕</button>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Items</p>
                            <div className="space-y-2">
                                {parseDescription(selectedOrder.description).map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-bold text-xs">{item.name.charAt(0).toUpperCase()}</div>
                                            <span className="text-sm font-medium text-[var(--text-primary)]">{item.name}</span>
                                        </div>
                                        <span className="text-sm text-[var(--text-secondary)] font-semibold">x{item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="px-6 pb-5">
                            <div className="border-t border-[var(--border)] pt-4 space-y-2.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-secondary)]">Date</span>
                                    <span className="font-medium">{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-secondary)]">Time</span>
                                    <span className="font-medium">{formatTime(selectedOrder.createdAt) || '—'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-secondary)]">Total Price</span>
                                    <span className="font-bold">${(selectedOrder.totalPrice ?? 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 pb-5">
                            <button onClick={() => setSelectedOrder(null)} className="btn btn-ghost w-full py-2.5">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}