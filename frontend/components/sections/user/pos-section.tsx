'use client';
import { useState, useEffect } from 'react';
import { products as productsApi, categories as categoriesApi, orders as ordersApi, getUsername, hasSession, auth, type Product, type Category } from '@/lib/api';
import { generateReceiptPDF } from '@/lib/receipt-generator';
import { useRfidScanner } from '@/lib/useRfidScanner';
import AuthPrompt from '../../AuthPrompt';
import CartSidebar from '../cartSidebar-section';

type CartItem = Product & { quantity: number };

export default function POS() {
    const [productList, setProductList] = useState<Product[]>([]);
    const [categoryList, setCategoryList] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingOut, setCheckingOut] = useState(false);
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [badgeScanning, setBadgeScanning] = useState(false);

    useEffect(() => {
        Promise.all([productsApi.getAll(), categoriesApi.getAll()])
            .then(([prods, cats]) => {
                setProductList(prods);
                setCategoryList(cats);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useRfidScanner({
        onScan: async (badgeNumber) => {
            if (cart.length === 0 || showAuthPrompt || checkingOut) return;

            setBadgeScanning(true);
            try {
                const result = await auth.badgeLogin(badgeNumber);
                setBadgeScanning(false);
                await performCheckoutAs(result.username);
            } catch {
                setBadgeScanning(false);
                setSuccessMessage('');
                setShowAuthPrompt(true);
            }
        },
        enabled: !showAuthPrompt && !checkingOut && cart.length > 0,
    });

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

    const setQuantity = (productId: number, newQuantity: number) => {
        setCart(prev =>
            prev.map(item =>
                item.id === productId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const updatePrice = (productId: number, newPrice: number) => {
        setCart(prev =>
            prev.map(item =>
                item.id === productId ? { ...item, price: newPrice } : item
            )
        );
    };

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleCheckoutClick = () => {
        if (cart.length === 0) return;

        if (!hasSession()) {
            setShowAuthPrompt(true);
            return;
        }

        performCheckout();
    };

    const handleAuthSuccess = () => {
        setShowAuthPrompt(false);
        performCheckout();
    };

    const performCheckout = async () => {
        const currentUsername = getUsername() || 'Guest';
        await performCheckoutAs(currentUsername);
    };

    const performCheckoutAs = async (username: string) => {
        setCheckingOut(true);

        const description = cart.map(c => `${c.name} x${c.quantity}`).join(', ');
        const orderData = {
            quantity: itemCount,
            totalPrice: total,
            description,
        };

        try {
            const createdOrder = await ordersApi.create(orderData);

            generateReceiptPDF({
                orderId: createdOrder.id,
                username,
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                })),
                total,
                date: new Date(),
            });

            setCart([]);
            auth.logout();

            setSuccessMessage(`Checkout successful! Receipt downloaded. Signed in as ${username} (now signed out).`);
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch {
            alert('Checkout failed. Please try again.');
        } finally {
            setCheckingOut(false);
        }
    };

    return (
        <div className="animate-in min-h-[calc(100vh-2rem)] -mx-6 px-1">
            <div className="pb-3">
                <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Point of Sale
                </h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">Tap a product to add it to the current order</p>
            </div>

            {successMessage && (
                <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium animate-in">
                    {successMessage}
                </div>
            )}

            <div className="flex gap-6 items-start">
                {/* Product grid */}
                <div className="flex-1">
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
                <CartSidebar
                    cart={cart}
                    onUpdateQuantity={setQuantity}
                    onRemoveFromCart={removeFromCart}
                    onUpdatePrice={updatePrice}
                    onResetOrder={() => setCart([])}
                    onCheckoutClick={handleCheckoutClick}
                    checkingOut={checkingOut}
                    badgeScanning={badgeScanning}
                />
            </div>

            {showAuthPrompt && (
                <AuthPrompt
                    actionLabel="Sign in to complete your checkout"
                    onSuccess={handleAuthSuccess}
                    onCancel={() => setShowAuthPrompt(false)}
                />
            )}
        </div>
    );
}