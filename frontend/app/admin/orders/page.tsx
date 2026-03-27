'use client';
import { useState, useEffect } from 'react';
import { orders as ordersApi, type Order, ApiError } from '@/lib/api';

export default function AdminOrders() {
    const [orderList, setOrderList] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit modal
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [editForm, setEditForm] = useState({ description: '', totalPrice: '', paidAmount: '', remainingAmount: '', quantity: '' });
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

    const openEdit = (order: Order) => {
        setEditForm({
            description: order.description || '',
            totalPrice: String(order.totalPrice ?? 0),
            paidAmount: String(order.paidAmount ?? 0),
            remainingAmount: String(order.remainingAmount ?? 0),
            quantity: String(order.quantity ?? 0),
        });
        setEditingOrder(order);
        setEditError('');
    };

    const closeEdit = () => {
        setEditingOrder(null);
        setEditError('');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOrder) return;

        setSaving(true);
        setEditError('');

        try {
            await ordersApi.update(editingOrder.id, {
                description: editForm.description,
                totalPrice: parseFloat(editForm.totalPrice),
                paidAmount: parseFloat(editForm.paidAmount),
                remainingAmount: parseFloat(editForm.remainingAmount),
                quantity: parseInt(editForm.quantity, 10),
            });
            closeEdit();
            loadOrders();
        } catch (err) {
            if (err instanceof ApiError && err.status === 403) {
                setEditError('You do not have permission to update orders.');
            } else {
                setEditError('Failed to update order. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);

        try {
            await ordersApi.delete(deleteTarget.id);
            setDeleteTarget(null);
            loadOrders();
        } catch (err) {
            if (err instanceof ApiError && err.status === 403) {
                alert('You do not have permission to delete orders.');
            } else {
                alert('Failed to delete order.');
            }
        } finally {
            setDeleting(false);
        }
    };

    // Auto-calculate remaining when paid changes
    const handlePaidChange = (value: string) => {
        const paid = parseFloat(value) || 0;
        const total = parseFloat(editForm.totalPrice) || 0;
        setEditForm({
            ...editForm,
            paidAmount: value,
            remainingAmount: String(Math.max(0, total - paid)),
        });
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
                <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                >
                    Orders
                </h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                    {orderList.length} order{orderList.length !== 1 ? 's' : ''} total
                </p>
            </div>

            <div className="card-flat overflow-hidden">
                {loading ? (
                    <div className="text-center py-16 text-[var(--text-muted)]">Loading orders…</div>
                ) : orderList.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-4xl mb-3 opacity-30">▤</div>
                        <p className="text-[var(--text-muted)] text-sm">No orders found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {/* Table header */}
                        <div className="flex items-center px-5 py-3 bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                            <div className="w-16">ID</div>
                            <div className="flex-1">Description</div>
                            <div className="w-20 text-right">Items</div>
                            <div className="w-24 text-right">Total</div>
                            <div className="w-24 text-right">Paid</div>
                            <div className="w-24 text-right">Status</div>
                            <div className="w-40 text-right">Actions</div>
                        </div>

                        {orderList.map((order, index) => (
                            <div
                                key={order.id}
                                className="flex items-center px-5 py-4 hover:bg-[var(--bg-base)] transition group cursor-pointer"
                                style={{ animationDelay: `${index * 30}ms` }}
                                onClick={() => setSelectedOrder(order)}
                            >
                                <div className="w-16">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-bold text-xs">
                                        #{order.id}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{order.description || '—'}</div>
                                </div>
                                <div className="w-20 text-right text-sm text-[var(--text-secondary)]">
                                    {order.quantity}
                                </div>
                                <div className="w-24 text-right font-bold text-sm text-[var(--accent)]">
                                    ${(order.totalPrice ?? 0).toFixed(2)}
                                </div>
                                <div className="w-24 text-right text-sm font-medium text-[var(--success)]">
                                    ${(order.paidAmount ?? 0).toFixed(2)}
                                </div>
                                <div className="w-24 text-right">
                                    {(order.remainingAmount ?? 0) > 0 ? (
                                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-50 text-[var(--danger)] border border-red-200">
                                            Partial
                                        </span>
                                    ) : (
                                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-[var(--success)] border border-green-200">
                                            Paid
                                        </span>
                                    )}
                                </div>
                                <div className="w-40 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => openEdit(order)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-muted)] hover:bg-[var(--border)] transition"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(order)}
                                        className="btn-danger"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Order Detail Modal ──────────────────────── */}
            {selectedOrder && !editingOrder && !deleteTarget && (
                <div
                    className="modal-overlay"
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrder(null); }}
                >
                    <div className="card p-0 max-w-md w-full mx-4 overflow-hidden animate-in">
                        <div className="px-6 py-5 bg-[var(--bg-muted)] border-b border-[var(--border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-bold text-xs">
                                    #{selectedOrder.id}
                                </div>
                                <div>
                                    <h3 className="font-bold text-[var(--text-primary)] text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
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

                        <div className="px-6 py-4">
                            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Items</p>
                            <div className="space-y-2">
                                {parseDescription(selectedOrder.description).map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-bold text-xs">
                                                {item.name.charAt(0).toUpperCase()}
                                            </div>
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
                                    <span className="text-[var(--text-secondary)]">Total Price</span>
                                    <span className="font-bold">${(selectedOrder.totalPrice ?? 0).toFixed(2)}</span>
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
                            </div>
                        </div>

                        <div className="px-6 pb-5 flex gap-2">
                            <button onClick={() => setSelectedOrder(null)} className="btn btn-ghost flex-1 py-2.5">
                                Close
                            </button>
                            <button
                                onClick={() => { setSelectedOrder(null); openEdit(selectedOrder); }}
                                className="btn btn-primary flex-1 py-2.5"
                            >
                                Edit Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Order Modal ─────────────────────────── */}
            {editingOrder && (
                <div
                    className="modal-overlay"
                    onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
                >
                    <div className="card p-0 max-w-md w-full mx-4 overflow-hidden animate-in">
                        <div className="px-6 py-5 bg-[var(--bg-muted)] border-b border-[var(--border)] flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)] text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Edit Order #{editingOrder.id}
                                </h3>
                                <p className="text-xs text-[var(--text-muted)]">Update order details</p>
                            </div>
                            <button
                                onClick={closeEdit}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6">
                            {editError && (
                                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                    {editError}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Description</label>
                                    <input
                                        className="input"
                                        placeholder="Order description"
                                        value={editForm.description}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Total Price</label>
                                        <input
                                            className="input"
                                            type="number"
                                            step="0.01"
                                            value={editForm.totalPrice}
                                            onChange={e => setEditForm({ ...editForm, totalPrice: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Quantity</label>
                                        <input
                                            className="input"
                                            type="number"
                                            value={editForm.quantity}
                                            onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Paid Amount</label>
                                        <input
                                            className="input"
                                            type="number"
                                            step="0.01"
                                            value={editForm.paidAmount}
                                            onChange={e => handlePaidChange(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Remaining</label>
                                        <input
                                            className="input bg-[var(--bg-muted)]"
                                            type="number"
                                            step="0.01"
                                            value={editForm.remainingAmount}
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={closeEdit} className="btn btn-ghost flex-1 py-2.5">Cancel</button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="btn btn-primary flex-1 py-2.5 disabled:opacity-60"
                                    >
                                        {saving ? 'Saving…' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ────────────────── */}
            {deleteTarget && (
                <div
                    className="modal-overlay"
                    onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
                >
                    <div className="card p-6 max-w-sm w-full mx-4 animate-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-[var(--danger)] font-bold text-lg">
                                !
                            </div>
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)]">Delete Order</h3>
                                <p className="text-xs text-[var(--text-muted)]">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-5">
                            Are you sure you want to delete <strong>Order #{deleteTarget.id}</strong>? This will permanently remove it.
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setDeleteTarget(null)} className="btn btn-ghost flex-1 py-2.5">Cancel</button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="btn flex-1 py-2.5 disabled:opacity-60"
                                style={{ background: 'var(--danger)', color: '#fff' }}
                            >
                                {deleting ? 'Deleting…' : 'Delete Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}