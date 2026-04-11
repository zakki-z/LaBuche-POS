'use client';
import { useState, useEffect, useMemo } from 'react';
import { orders as ordersApi, type Order, ApiError } from '@/lib/api';

// ── Helpers ──────────────────────────────────────────────
function toLocalDateStr(iso: string | undefined): string {
    if (!iso) return 'Unknown';
    return new Date(iso).toLocaleDateString('en-CA');
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
export default function AdminOrders() {
    const [orderList, setOrderList] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    // Date filter
    const [filterMode, setFilterMode] = useState<'today' | 'custom'>('today');
    const [dateFrom, setDateFrom] = useState(todayStr());
    const [dateTo, setDateTo] = useState(todayStr());

    // Edit modal
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [editForm, setEditForm] = useState({ description: '', totalPrice: '', quantity: '' });
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState('');

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Detail view
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => { loadOrders(); }, []);

    const loadOrders = async () => {
        try {
            const data = await ordersApi.getAll();
            setOrderList(data);
        } catch (err) {
            console.error('Failed to load orders:', err);
        } finally {
            setLoading(false);
        }
    };

    // Unique users
    const uniqueUsers = useMemo(() => {
        const users = new Set<string>();
        orderList.forEach(o => { if (o.username) users.add(o.username); });
        return Array.from(users).sort();
    }, [orderList]);

    // Apply both date filter and user filter
    const filteredOrders = useMemo(() => {
        const from = filterMode === 'today' ? todayStr() : dateFrom;
        const to = filterMode === 'today' ? todayStr() : dateTo;
        return orderList.filter(o => {
            const d = toLocalDateStr(o.createdAt);
            const dateOk = d >= from && d <= to;
            const userOk = !selectedUser || o.username === selectedUser;
            return dateOk && userOk;
        });
    }, [orderList, filterMode, dateFrom, dateTo, selectedUser]);

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

    // Edit handlers
    const openEdit = (order: Order) => {
        setEditForm({ description: order.description || '', totalPrice: String(order.totalPrice ?? 0), quantity: String(order.quantity ?? 0) });
        setEditingOrder(order);
        setEditError('');
    };
    const closeEdit = () => { setEditingOrder(null); setEditError(''); };
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOrder) return;
        setSaving(true); setEditError('');
        try {
            await ordersApi.update(editingOrder.id, { description: editForm.description, totalPrice: parseFloat(editForm.totalPrice), quantity: parseInt(editForm.quantity, 10) });
            closeEdit(); loadOrders();
        } catch (err) {
            setEditError(err instanceof ApiError && err.status === 403 ? 'You do not have permission to update orders.' : 'Failed to update order.');
        } finally { setSaving(false); }
    };

    // Delete handler
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await ordersApi.delete(deleteTarget.id);
            setDeleteTarget(null); loadOrders();
        } catch (err) {
            alert(err instanceof ApiError && err.status === 403 ? 'You do not have permission to delete orders.' : 'Failed to delete order.');
        } finally { setDeleting(false); }
    };

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
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>Orders</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                    {filterLabel} · {totals.orderCount} order{totals.orderCount !== 1 ? 's' : ''}
                    {selectedUser && ` · ${selectedUser}`}
                </p>
            </div>

            {/* ── Date Filter ────────────────────────────── */}
            <div className="card-flat p-4 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Period</p>
                    <button
                        onClick={() => setFilterMode('today')}
                        className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${filterMode === 'today' ? 'text-white bg-[var(--accent)] shadow-sm' : 'text-[var(--text-secondary)] bg-[var(--bg-muted)] hover:bg-[var(--border)]'}`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setFilterMode('custom')}
                        className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${filterMode === 'custom' ? 'text-white bg-[var(--accent)] shadow-sm' : 'text-[var(--text-secondary)] bg-[var(--bg-muted)] hover:bg-[var(--border)]'}`}
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
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

            {/* ── User Filter ────────────────────────────── */}
            {uniqueUsers.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Filter by User</p>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setSelectedUser(null)}
                            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${selectedUser === null ? 'text-white bg-[var(--accent)] shadow-sm' : 'text-[var(--text-secondary)] bg-[var(--bg-muted)] hover:bg-[var(--border)]'}`}
                        >
                            All Users
                        </button>
                        {uniqueUsers.map(user => {
                            const count = filteredOrders.filter(o => o.username === user).length;
                            return (
                                <button
                                    key={user}
                                    onClick={() => setSelectedUser(user)}
                                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${selectedUser === user ? 'text-white bg-[var(--accent)] shadow-sm' : 'text-[var(--text-secondary)] bg-[var(--bg-muted)] hover:bg-[var(--border)]'}`}
                                >
                                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{user.charAt(0).toUpperCase()}</span>
                                    {user}
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedUser === user ? 'bg-white/20' : 'bg-[var(--border)]'}`}>{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Orders grouped by day ───────────────────── */}
            <div className="space-y-4">
                {loading ? (
                    <div className="card-flat text-center py-16 text-[var(--text-muted)]">Loading orders…</div>
                ) : groupedOrders.length === 0 ? (
                    <div className="card-flat text-center py-16">
                        <div className="text-4xl mb-3 opacity-30">▤</div>
                        <p className="text-[var(--text-muted)] text-sm">
                            {filterMode === 'today' ? 'No orders today.' : 'No orders found for the selected range.'}
                            {selectedUser && ` (filtered by ${selectedUser})`}
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

                                {/* Table header */}
                                <div className="flex items-center px-5 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">
                                    <div className="w-14">ID</div>
                                    <div className="w-16">Time</div>
                                    <div className="w-24">User</div>
                                    <div className="flex-1">Description</div>
                                    <div className="w-16 text-right">Items</div>
                                    <div className="w-24 text-right">Total</div>
                                    <div className="w-28 text-right">Actions</div>
                                </div>

                                {/* Rows */}
                                <div className="divide-y divide-[var(--border)]">
                                    {dayOrders.map(order => (
                                        <div
                                            key={order.id}
                                            className="flex items-center px-5 py-3.5 hover:bg-[var(--bg-base)] transition group cursor-pointer"
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <div className="w-14">
                                                <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-bold text-xs">#{order.id}</div>
                                            </div>
                                            <div className="w-16 text-xs text-[var(--text-muted)]">{formatTime(order.createdAt)}</div>
                                            <div className="w-24">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-5 h-5 rounded-full bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] font-bold text-[9px]">{(order.username || '?').charAt(0).toUpperCase()}</div>
                                                    <span className="text-xs font-medium text-[var(--text-primary)] truncate">{order.username || '—'}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">{order.description || '—'}</div>
                                            </div>
                                            <div className="w-16 text-right text-sm text-[var(--text-secondary)]">{order.quantity}</div>
                                            <div className="w-24 text-right font-bold text-sm text-[var(--accent)]">${(order.totalPrice ?? 0).toFixed(2)}</div>
                                            <div className="w-28 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => openEdit(order)} className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-muted)] hover:bg-[var(--border)] transition">Edit</button>
                                                <button onClick={() => setDeleteTarget(order)} className="btn-danger">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Day footer */}
                                <div className="flex items-center px-5 py-2.5 bg-[var(--bg-muted)] text-sm font-semibold border-t border-[var(--border)]">
                                    <div className="w-14"></div>
                                    <div className="w-16"></div>
                                    <div className="w-24"></div>
                                    <div className="flex-1 text-[var(--text-secondary)]">{dayOrders.length} order{dayOrders.length !== 1 ? 's' : ''}</div>
                                    <div className="w-16 text-right text-[var(--text-secondary)]">{dayItems}</div>
                                    <div className="w-24 text-right font-bold text-[var(--accent)]">${dayTotal.toFixed(2)}</div>
                                    <div className="w-28"></div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Order Detail Modal ──────────────────────── */}
            {selectedOrder && !editingOrder && !deleteTarget && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrder(null); }}>
                    <div className="card p-0 max-w-md w-full mx-4 overflow-hidden animate-in">
                        <div className="px-6 py-5 bg-[var(--bg-muted)] border-b border-[var(--border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-bold text-xs">#{selectedOrder.id}</div>
                                <div>
                                    <h3 className="font-bold text-[var(--text-primary)] text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>Order Details</h3>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        {selectedOrder.username && <span className="font-medium text-[var(--text-secondary)]">{selectedOrder.username} · </span>}
                                        {formatTime(selectedOrder.createdAt)} · {selectedOrder.quantity} item{selectedOrder.quantity !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition">✕</button>
                        </div>

                        {selectedOrder.username && (
                            <div className="px-6 py-3 border-b border-[var(--border)] flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] font-bold text-xs">{selectedOrder.username.charAt(0).toUpperCase()}</div>
                                <div>
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedOrder.username}</p>
                                    <p className="text-xs text-[var(--text-muted)]">Cashier</p>
                                </div>
                            </div>
                        )}

                        <div className="px-6 py-4">
                            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Items</p>
                            <div className="space-y-2">
                                {parseDescription(selectedOrder.description).map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-bold text-xs">{item.name.charAt(0).toUpperCase()}</div>
                                            <span className="text-sm font-medium">{item.name}</span>
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

                        <div className="px-6 pb-5 flex gap-2">
                            <button onClick={() => setSelectedOrder(null)} className="btn btn-ghost flex-1 py-2.5">Close</button>
                            <button onClick={() => { setSelectedOrder(null); openEdit(selectedOrder); }} className="btn btn-primary flex-1 py-2.5">Edit Order</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Order Modal ─────────────────────────── */}
            {editingOrder && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}>
                    <div className="card p-0 max-w-md w-full mx-4 overflow-hidden animate-in">
                        <div className="px-6 py-5 bg-[var(--bg-muted)] border-b border-[var(--border)] flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)] text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>Edit Order #{editingOrder.id}</h3>
                                <p className="text-xs text-[var(--text-muted)]">{editingOrder.username && `${editingOrder.username} · `}Update order details</p>
                            </div>
                            <button onClick={closeEdit} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition">✕</button>
                        </div>
                        <div className="p-6">
                            {editError && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{editError}</div>}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Description</label>
                                    <input className="input" placeholder="Order description" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Total Price</label>
                                        <input className="input" type="number" step="0.01" value={editForm.totalPrice} onChange={e => setEditForm({ ...editForm, totalPrice: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Quantity</label>
                                        <input className="input" type="number" value={editForm.quantity} onChange={e => setEditForm({ ...editForm, quantity: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={closeEdit} className="btn btn-ghost flex-1 py-2.5">Cancel</button>
                                    <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1 py-2.5 disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ────────────────── */}
            {deleteTarget && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
                    <div className="card p-6 max-w-sm w-full mx-4 animate-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-[var(--danger)] font-bold text-lg">!</div>
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)]">Delete Order</h3>
                                <p className="text-xs text-[var(--text-muted)]">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-5">
                            Are you sure you want to delete <strong>Order #{deleteTarget.id}</strong>
                            {deleteTarget.username && <> by <strong>{deleteTarget.username}</strong></>}?
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setDeleteTarget(null)} className="btn btn-ghost flex-1 py-2.5">Cancel</button>
                            <button onClick={handleDelete} disabled={deleting} className="btn flex-1 py-2.5 disabled:opacity-60" style={{ background: 'var(--danger)', color: '#fff' }}>{deleting ? 'Deleting…' : 'Delete Order'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}