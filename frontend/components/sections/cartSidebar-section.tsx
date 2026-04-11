'use client';
import { useState } from 'react';
import type { Product } from '@/lib/api';

type CartItem = Product & { quantity: number };

interface CartSidebarProps {
    cart: CartItem[];
    onUpdateQuantity: (productId: number, newQuantity: number) => void;
    onRemoveFromCart: (productId: number) => void;
    onUpdatePrice: (productId: number, newPrice: number) => void;
    onResetOrder: () => void;
    onCheckoutClick: () => void;
    checkingOut: boolean;
    badgeScanning: boolean;
}

export default function CartSidebar({
                                        cart,
                                        onUpdateQuantity,
                                        onRemoveFromCart,
                                        onUpdatePrice,
                                        onResetOrder,
                                        onCheckoutClick,
                                        checkingOut,
                                        badgeScanning,
                                    }: CartSidebarProps) {
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [numInput, setNumInput] = useState('');
    const [confirmingReset, setConfirmingReset] = useState(false);

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Auto-select first item if current selection is gone
    const effectiveSelectedId =
        selectedItemId !== null && cart.some(i => i.id === selectedItemId)
            ? selectedItemId
            : cart.length > 0
                ? cart[0].id
                : null;

    const handleKey = (key: string) => {
        if (key === 'C') {
            setNumInput('');
        } else if (key === '.') {
            if (!numInput.includes('.')) {
                setNumInput(prev => (prev === '' ? '0.' : prev + '.'));
            }
        } else {
            const dot = numInput.indexOf('.');
            if (dot !== -1 && numInput.length - dot > 2) return;
            setNumInput(prev => prev + key);
        }
    };

    const applyPrice = () => {
        if (effectiveSelectedId === null || numInput === '') return;
        const val = parseFloat(numInput);
        if (!isNaN(val) && val >= 0) {
            onUpdatePrice(effectiveSelectedId, Math.round(val * 100) / 100);
        }
        setNumInput('');
    };

    const applyQuantity = () => {
        if (effectiveSelectedId === null || numInput === '') return;
        const val = parseInt(numInput, 10);
        if (!isNaN(val) && val >= 0) {
            if (val === 0) {
                onRemoveFromCart(effectiveSelectedId);
            } else {
                onUpdateQuantity(effectiveSelectedId, val);
            }
        }
        setNumInput('');
    };

    const deleteSelected = () => {
        if (effectiveSelectedId === null) return;
        onRemoveFromCart(effectiveSelectedId);
        setNumInput('');
    };

    const handleReset = () => {
        if (!confirmingReset) {
            setConfirmingReset(true);
            setTimeout(() => setConfirmingReset(false), 3000);
            return;
        }
        onResetOrder();
        setNumInput('');
        setSelectedItemId(null);
        setConfirmingReset(false);
    };

    const keys = [
        ['7', '8', '9'],
        ['4', '5', '6'],
        ['1', '2', '3'],
        ['0', '.', 'C'],
    ];

    return (
        <div className="w-[340px] shrink-0">
            <div className="card-flat overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
                {/* Numeric display */}
                <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-muted)] flex items-center justify-between shrink-0">
                    <h3 className="font-bold text-[var(--text-primary)] text-sm">Current Order</h3>
                    <div className="font-mono text-lg font-bold text-[var(--text-primary)] bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-0.5 min-w-[90px] text-right">
                        {numInput || '0'}
                    </div>
                </div>

                {/* Order items — takes remaining space */}
                <div className="flex-1 min-h-0 flex flex-col border-b border-[var(--border)]">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_58px_30px_58px] gap-1 px-3 py-1.5 bg-[var(--bg-muted)] text-[10px] font-semibold text-[var(--text-muted)] border-b border-[var(--border)] uppercase tracking-wide shrink-0">
                        <span>Description</span>
                        <span className="text-right">PU</span>
                        <span className="text-center">Qte</span>
                        <span className="text-right">Total</span>
                    </div>

                    {/* Items list */}
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        {cart.length === 0 ? (
                            <p className="text-xs text-[var(--text-muted)] text-center py-4">Cart is empty</p>
                        ) : (
                            cart.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedItemId(item.id)}
                                    className={`grid grid-cols-[1fr_58px_30px_58px] gap-1 px-3 py-1.5 cursor-pointer transition-colors border-b border-[var(--border)] last:border-b-0 ${
                                        effectiveSelectedId === item.id
                                            ? 'bg-[var(--accent-soft)]'
                                            : 'hover:bg-[var(--bg-muted)]'
                                    }`}
                                >
                                    <span className="text-xs font-medium truncate text-[var(--text-primary)]">{item.name}</span>
                                    <span className="text-xs text-right text-[var(--text-secondary)]">{item.price.toFixed(2)}</span>
                                    <span className="text-xs text-center font-semibold text-[var(--text-primary)]">{item.quantity}</span>
                                    <span className="text-xs text-right font-bold text-[var(--text-primary)]">{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Somme row */}
                    {cart.length > 0 && (
                        <div className="grid grid-cols-[1fr_58px_30px_58px] gap-1 px-3 py-2 bg-[var(--bg-muted)] border-t border-[var(--border)] shrink-0">
                            <span className="text-xs font-bold text-[var(--text-primary)]">Somme</span>
                            <span></span>
                            <span className="text-xs text-center font-bold text-[var(--text-primary)]">{itemCount}</span>
                            <span className="text-xs text-right font-black text-[var(--accent)]">{total.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                {/* Keypad + actions — fixed at bottom */}
                <div className="p-3 shrink-0">
                    {/* Numeric keypad */}
                    <div className="grid grid-cols-3 gap-1 mb-2">
                        {keys.flat().map(key => (
                            <button
                                key={key}
                                onClick={() => handleKey(key)}
                                className="h-10 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-muted)] active:scale-95 transition-all"
                            >
                                {key}
                            </button>
                        ))}
                    </div>

                    {/* Prix / QTE */}
                    <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                        <button
                            onClick={applyPrice}
                            disabled={!numInput || effectiveSelectedId === null}
                            className="h-9 rounded-lg bg-[var(--accent)] text-white font-bold text-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
                        >
                            Prix
                        </button>
                        <button
                            onClick={applyQuantity}
                            disabled={!numInput || effectiveSelectedId === null}
                            className="h-9 rounded-lg bg-[var(--accent)] text-white font-bold text-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
                        >
                            QTE
                        </button>
                    </div>

                    {/* Delete selected / Reset order */}
                    <div className="grid grid-cols-2 gap-1.5 mb-3">
                        <button
                            onClick={deleteSelected}
                            disabled={effectiveSelectedId === null}
                            className="h-9 rounded-lg bg-[var(--bg-base)] border-2 border-[var(--danger)] text-[var(--danger)] font-bold text-xs hover:bg-[var(--danger)] hover:text-white active:scale-95 transition-all disabled:opacity-40 disabled:hover:bg-[var(--bg-base)] disabled:hover:text-[var(--danger)]"
                        >
                            ✕ Supprimer
                        </button>
                        <button
                            onClick={handleReset}
                            className={`h-9 rounded-lg font-bold text-xs active:scale-95 transition-all ${
                                confirmingReset
                                    ? 'bg-[var(--danger)] text-white animate-pulse'
                                    : 'bg-[var(--bg-base)] border-2 border-[var(--text-muted)] text-[var(--text-secondary)] hover:border-[var(--danger)] hover:text-[var(--danger)]'
                            }`}
                        >
                            {confirmingReset ? 'Confirmer ?' : '⟲ Annuler tout'}
                        </button>
                    </div>

                    {/* Badge tap hint */}
                    <div
                        className={`border-2 border-dashed rounded-xl p-2 text-center mb-2 transition-all ${
                            badgeScanning
                                ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                                : 'border-[var(--border)] bg-[var(--bg-base)]'
                        }`}
                    >
                        <div className={`text-base mb-0.5 ${badgeScanning ? 'animate-pulse' : ''}`}>📶</div>
                        <p className="text-[10px] font-semibold text-[var(--text-primary)]">
                            {badgeScanning ? 'Authenticating…' : 'Tap badge to checkout'}
                        </p>
                        <p className="text-[9px] text-[var(--text-muted)]">
                            One tap signs in and completes the order
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}