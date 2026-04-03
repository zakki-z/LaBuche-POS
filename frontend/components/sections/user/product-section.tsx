'use client';
import { useState, useEffect } from 'react';
import { products as productsApi, categories as categoriesApi, hasSession, auth, type Product, type Category, ApiError } from '@/lib/api';
import AuthPrompt from '../../AuthPrompt';

export default function Products() {
    const [productList, setProductList] = useState<Product[]>([]);
    const [categoryList, setCategoryList] = useState<Category[]>([]);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', categoryId: '' });
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');

    // Auth prompt state
    const [showAuth, setShowAuth] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
    const [authLabel, setAuthLabel] = useState('');

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

    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const signOutAfterAction = () => {
        if (hasSession()) {
            auth.logout();
        }
    };

    const requireAuth = (label: string, action: () => Promise<void>) => {
        if (!hasSession()) {
            setAuthLabel(label);
            setPendingAction(() => action);
            setShowAuth(true);
        } else {
            action()
                .then(() => {
                    loadData();
                    signOutAfterAction();
                    showSuccess(`${label.replace('Sign in to ', '')} completed. You have been signed out.`);
                })
                .catch((err) => {
                    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
                        setAuthLabel(label);
                        setPendingAction(() => action);
                        setShowAuth(true);
                    } else {
                        alert('Action failed. Please try again.');
                    }
                });
        }
    };

    const handleAuthSuccess = () => {
        setShowAuth(false);
        if (pendingAction) {
            const action = pendingAction;
            setPendingAction(null);
            action()
                .then(() => {
                    loadData();
                    signOutAfterAction();
                    showSuccess('Action completed. You have been signed out.');
                })
                .catch(() => alert('Action failed.'));
        }
    };

    const createProduct = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProduct.name.trim() || !newProduct.price) return;

        requireAuth('Sign in to add a product', async () => {
            await productsApi.create({
                name: newProduct.name.trim(),
                price: newProduct.price,
                categoryId: newProduct.categoryId ? parseInt(newProduct.categoryId, 10) : null,
            });
            setNewProduct({ name: '', price: '', categoryId: '' });
        });
    };

    const createCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        requireAuth('Sign in to create a category', async () => {
            await categoriesApi.create({ name: newCategory.trim() });
            setNewCategory('');
        });
    };

    const deleteProduct = (id: number) => {
        requireAuth('Sign in to delete a product', async () => {
            await productsApi.delete(id);
        });
    };

    // Group products by category
    const uncategorized = productList.filter(p => !p.categoryName);
    const byCategory = categoryList
        .map(cat => ({ category: cat, products: productList.filter(p => p.categoryId === cat.id) }))
        .filter(group => group.products.length > 0);

    return (
        <div className="animate-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>Products</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">Manage your product catalog and categories</p>
            </div>

            {successMessage && (
                <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium animate-in">
                    {successMessage}
                </div>
            )}

            <div className="card-flat p-6">
                {/* Add category */}
                <div className="flex gap-3 mb-4">
                    <input className="input flex-1" placeholder="New category name" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                    <button onClick={createCategory} className="btn btn-ghost px-6">+ Category</button>
                </div>

                {/* Add product */}
                <div className="flex gap-3 mb-6 pb-6 border-b border-[var(--border)]">
                    <input className="input flex-3" placeholder="Product name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
                    <input className="input flex-1" type="number" step="0.01" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required />
                    <select className="input select flex-1" value={newProduct.categoryId} onChange={e => setNewProduct({ ...newProduct, categoryId: e.target.value })}>
                        <option value="">No category</option>
                        {categoryList.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <button onClick={createProduct} className="btn btn-primary px-6">Add Product</button>
                </div>

                {/* Product list */}
                {loading ? (
                    <div className="text-center py-12 text-[var(--text-muted)]">Loading…</div>
                ) : productList.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-muted)]">No products yet. Add your first one above.</div>
                ) : (
                    <div className="space-y-6">
                        {byCategory.map(({ category, products }) => (
                            <div key={category.id}>
                                <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">{category.name}</h3>
                                <div className="space-y-2">
                                    {products.map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] hover:border-[var(--text-muted)] transition group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-bold text-xs">{p.name.charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <div className="font-semibold text-sm">{p.name}</div>
                                                    <div className="text-xs text-[var(--text-muted)]">ID: {p.id} · {category.name}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-[var(--accent)]">${p.price.toFixed(2)}</span>
                                                <button onClick={() => deleteProduct(p.id)} className="btn-danger opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {uncategorized.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">Uncategorized</h3>
                                <div className="space-y-2">
                                    {uncategorized.map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] hover:border-[var(--text-muted)] transition group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-secondary)] font-bold text-xs">{p.name.charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <div className="font-semibold text-sm">{p.name}</div>
                                                    <div className="text-xs text-[var(--text-muted)]">ID: {p.id}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-[var(--accent)]">${p.price.toFixed(2)}</span>
                                                <button onClick={() => deleteProduct(p.id)} className="btn-danger opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* On-demand auth */}
            {showAuth && (
                <AuthPrompt
                    actionLabel={authLabel}
                    onSuccess={handleAuthSuccess}
                    onCancel={() => { setShowAuth(false); setPendingAction(null); }}
                />
            )}
        </div>
    );
}