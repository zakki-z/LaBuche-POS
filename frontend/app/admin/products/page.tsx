'use client';
import { useState, useEffect } from 'react';
import { products as productsApi, categories as categoriesApi, type Product, type Category, ApiError } from '@/lib/api';

type ModalMode = 'create' | 'edit' | null;

export default function AdminProducts() {
    const [productList, setProductList] = useState<Product[]>([]);
    const [categoryList, setCategoryList] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form, setForm] = useState({ name: '', price: '', categoryId: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [prods, cats] = await Promise.all([productsApi.getAll(), categoriesApi.getAll()]);
            setProductList(prods);
            setCategoryList(cats);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setForm({ name: '', price: '', categoryId: '' });
        setEditingProduct(null);
        setModalMode('create');
        setError('');
    };

    const openEdit = (product: Product) => {
        setForm({
            name: product.name,
            price: String(product.price),
            categoryId: product.categoryId ? String(product.categoryId) : '',
        });
        setEditingProduct(product);
        setModalMode('edit');
        setError('');
    };

    const closeModal = () => {
        setModalMode(null);
        setEditingProduct(null);
        setError('');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.price) return;

        setSaving(true);
        setError('');

        try {
            if (modalMode === 'create') {
                await productsApi.create({
                    name: form.name.trim(),
                    price: form.price,
                    categoryId: form.categoryId ? parseInt(form.categoryId) : null,
                });
            } else if (modalMode === 'edit' && editingProduct) {
                await productsApi.update(editingProduct.id, {
                    name: form.name.trim(),
                    price: parseFloat(form.price),
                    categoryId: form.categoryId ? parseInt(form.categoryId) : null,
                });
            }
            closeModal();
            loadData();
        } catch (err) {
            if (err instanceof ApiError && err.status === 403) {
                setError('You do not have permission to perform this action.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);

        try {
            await productsApi.delete(deleteTarget.id);
            setDeleteTarget(null);
            loadData();
        } catch (err) {
            if (err instanceof ApiError && err.status === 403) {
                alert('You do not have permission to delete products.');
            } else {
                alert('Failed to delete product.');
            }
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1
                        className="text-2xl font-bold tracking-tight"
                        style={{ fontFamily: 'Playfair Display, serif' }}
                    >
                        Products
                    </h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        {productList.length} product{productList.length !== 1 ? 's' : ''} in catalog
                    </p>
                </div>
                <button onClick={openCreate} className="btn btn-primary">
                    + Add Product
                </button>
            </div>

            <div className="card-flat overflow-hidden">
                {loading ? (
                    <div className="text-center py-16 text-[var(--text-muted)]">Loading products…</div>
                ) : productList.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-4xl mb-3 opacity-30">▦</div>
                        <p className="text-[var(--text-muted)] text-sm">No products yet. Add your first one.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {/* Table header */}
                        <div className="flex items-center px-5 py-3 bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                            <div className="flex-1">Product</div>
                            <div className="w-32 text-center">Category</div>
                            <div className="w-28 text-right">Price</div>
                            <div className="w-40 text-right">Actions</div>
                        </div>

                        {productList.map((product, index) => (
                            <div
                                key={product.id}
                                className="flex items-center px-5 py-4 hover:bg-[var(--bg-base)] transition group"
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-bold text-xs">
                                        {product.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm">{product.name}</div>
                                        <div className="text-xs text-[var(--text-muted)]">ID: {product.id}</div>
                                    </div>
                                </div>
                                <div className="w-32 text-center">
                                    {product.categoryName ? (
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-orange-200">
                                            {product.categoryName}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-[var(--text-muted)]">—</span>
                                    )}
                                </div>
                                <div className="w-28 text-right font-bold text-[var(--accent)]">
                                    ${product.price.toFixed(2)}
                                </div>
                                <div className="w-40 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEdit(product)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-muted)] hover:bg-[var(--border)] transition"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(product)}
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

            {/* ── Create / Edit Modal ──────────────────────── */}
            {modalMode && (
                <div
                    className="modal-overlay"
                    onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
                >
                    <div className="card p-0 max-w-md w-full mx-4 overflow-hidden animate-in">
                        <div className="px-6 py-5 bg-[var(--bg-muted)] border-b border-[var(--border)] flex items-center justify-between">
                            <div>
                                <h3
                                    className="font-bold text-[var(--text-primary)] text-lg"
                                    style={{ fontFamily: 'Playfair Display, serif' }}
                                >
                                    {modalMode === 'create' ? 'New Product' : 'Edit Product'}
                                </h3>
                                <p className="text-xs text-[var(--text-muted)]">
                                    {modalMode === 'create' ? 'Add a new product to the catalog' : `Editing "${editingProduct?.name}"`}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                                        Product Name
                                    </label>
                                    <input
                                        className="input"
                                        placeholder="Enter product name"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                                        Price
                                    </label>
                                    <input
                                        className="input"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={form.price}
                                        onChange={e => setForm({ ...form, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                                        Category
                                    </label>
                                    <select
                                        className="input select"
                                        value={form.categoryId}
                                        onChange={e => setForm({ ...form, categoryId: e.target.value })}
                                    >
                                        <option value="">No category</option>
                                        {categoryList.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={closeModal} className="btn btn-ghost flex-1 py-2.5">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving || !form.name.trim() || !form.price}
                                        className="btn btn-primary flex-1 py-2.5 disabled:opacity-60"
                                    >
                                        {saving ? 'Saving…' : modalMode === 'create' ? 'Create Product' : 'Save Changes'}
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
                                <h3 className="font-bold text-[var(--text-primary)]">Delete Product</h3>
                                <p className="text-xs text-[var(--text-muted)]">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-5">
                            Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This will permanently remove it from your catalog.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="btn btn-ghost flex-1 py-2.5"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="btn flex-1 py-2.5 disabled:opacity-60"
                                style={{ background: 'var(--danger)', color: '#fff' }}
                            >
                                {deleting ? 'Deleting…' : 'Delete Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}