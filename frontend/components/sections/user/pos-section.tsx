'use client';
import { useState, useEffect } from 'react';
import { products as productsApi, categories as categoriesApi, orders as ordersApi, getUsername, type Product, type Category } from '@/lib/api';
import { generateReceiptPDF } from '@/lib/receipt-generator';

type CartItem = Product & { quantity: number };

export default function POS() {
    const [productList, setProductList] = useState<Product[]>([]);
    const [categoryList, setCategoryList] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingOut, setCheckingOut] = useState(false);

    useEffect(() => {
        Promise.all([productsApi.getAll(), categoriesApi.getAll()])
            .then(([prods, cats]) => {
                setProductList(prods);
                setCategoryList(cats);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filteredProducts = selectedCategory === null
        ? productList
        : productList.filter(p => p.categoryId === selectedCategory);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const exists = prev.find(item => item.id === product.id);
            if (exists) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev =>
            prev.map(item => {
                if (item.id !== productId) return item;
                const newQty = item.quantity + delta;
                return newQty <= 0 ? item : { ...item, quantity: newQty };
            }).filter(item => item.quantity > 0)
        );
    };

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setCheckingOut(true);

        const description = cart.map(c => `${c.name} x${c.quantity}`).join(', ');
        const orderData = {
            quantity: itemCount,
            totalPrice: total,
            paidAmount: total,
            remainingAmount: 0,
            description,
        };

        try {
            const createdOrder = await ordersApi.create(orderData);

            generateReceiptPDF({
                orderId: createdOrder.id,
                username: getUsername() || 'Unknown',
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                })),
                total,
                paidAmount: total,
                date: new Date(),
            });

            setCart([]);
            alert('Checkout successful! Your receipt has been downloaded.');
        } catch {
            alert('Checkout failed. Please try again.');
        } finally {
            setCheckingOut(false);
        }
    };

    return (
        <div className="animate-in">
            <div className="mb-6">
                <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                >
                    Point of Sale
                </h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">Tap a product to add it to the current order</p>
            </div>

            <div className="flex gap-6 items-start">
                {/* Product grid */}
                <div className="flex-1">
                    {/* Category filter tabs */}
                    {categoryList.length > 0 && (
                        <div className="flex gap-2 mb-4 flex-wrap">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                                    selectedCategory === null
                                        ? 'text-white bg-[var(--accent)] shadow-sm'
                                        : 'text-[var(--text-secondary)] bg-[var(--bg-muted)] hover:bg-[var(--border)]'
                                }`}
                            >
                                All
                            </button>
                            {categoryList.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                                        selectedCategory === cat.id
                                            ? 'text-white bg-[var(--accent)] shadow-sm'
                                            : 'text-[var(--text-secondary)] bg-[var(--bg-muted)] hover:bg-[var(--border)]'
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-20 text-[var(--text-muted)]">Loading products…</div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="card-flat p-12 text-center text-[var(--text-muted)]">
                            {selectedCategory !== null
                                ? 'No products in this category.'
                                : 'No products available. Add some from the Products page.'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {filteredProducts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    className="card p-4 text-left cursor-pointer hover:border-[var(--accent)] active:scale-[0.97] transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center mb-3 text-[var(--accent)] font-bold text-sm group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
                                        {p.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="font-semibold text-[var(--text-primary)] text-sm">{p.name}</div>
                                    {p.categoryName && (
                                        <div className="text-xs text-[var(--text-muted)] mt-0.5">{p.categoryName}</div>
                                    )}
                                    <div className="text-[var(--accent)] font-bold mt-1">${p.price.toFixed(2)}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cart sidebar */}
                <div className="w-80 shrink-0 sticky top-24">
                    <div className="card-flat overflow-hidden">
                        <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-muted)]">
                            <h3 className="font-bold text-[var(--text-primary)]">Current Order</h3>
                            {itemCount > 0 && (
                                <span className="text-xs text-[var(--text-muted)]">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                            )}
                        </div>

                        <div className="p-5">
                            {cart.length === 0 ? (
                                <p className="text-sm text-[var(--text-muted)] text-center py-8">
                                    Cart is empty
                                </p>
                            ) : (
                                <div className="space-y-3 mb-4">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex items-center justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">{item.name}</div>
                                                <div className="text-xs text-[var(--text-muted)]">${item.price.toFixed(2)} each</div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="w-7 h-7 rounded-md bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--border)] transition text-sm font-bold"
                                                >
                                                    −
                                                </button>
                                                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="w-7 h-7 rounded-md bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--border)] transition text-sm font-bold"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="text-sm font-bold w-16 text-right">${(item.price * item.quantity).toFixed(2)}</div>
                                            <button onClick={() => removeFromCart(item.id)} className="text-[var(--text-muted)] hover:text-[var(--danger)] transition text-xs ml-1">
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {cart.length > 0 && (
                                <>
                                    <div className="border-t border-[var(--border)] pt-3 flex justify-between items-center mb-4">
                                        <span className="font-bold text-[var(--text-primary)]">Total</span>
                                        <span className="text-xl font-black text-[var(--accent)]">${total.toFixed(2)}</span>
                                    </div>
                                    <button
                                        onClick={handleCheckout}
                                        disabled={checkingOut}
                                        className="btn btn-success w-full py-3 disabled:opacity-60"
                                    >
                                        {checkingOut ? 'Processing…' : 'Checkout & Download Receipt'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}