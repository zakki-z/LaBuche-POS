'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth, getUsername, getUserRole, hasSession } from '@/lib/api';
import AuthPrompt from './AuthPrompt';

export default function NavBar() {
    const router = useRouter();
    const pathname = usePathname();
    const [loggedIn, setLoggedIn] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [username, setUsernameState] = useState<string | null>(null);
    const [showAdminAuth, setShowAdminAuth] = useState(false);

    const refresh = () => {
        setLoggedIn(hasSession());
        setRole(getUserRole());
        setUsernameState(getUsername());
    };

    useEffect(() => { refresh(); }, [pathname]);

    const handleSignOut = () => {
        auth.logout();
        refresh();
        router.push('/');
    };

    const handleAdminClick = () => {
        if (role === 'ADMIN') {
            router.push('/admin');
        } else {
            setShowAdminAuth(true);
        }
    };

    const handleAdminAuthSuccess = (u: string, r: string) => {
        setShowAdminAuth(false);
        refresh();
        if (r === 'ADMIN') {
            router.push('/admin');
        }
    };

    const navLinks = [
        { href: '/pos', label: 'POS' },
        { href: '/products', label: 'Products' },
        { href: '/orders', label: 'Orders' },
    ];

    return (
        <>
            <nav className="sticky top-0 z-40 backdrop-blur-md bg-[var(--bg-base)]/80 border-b border-[var(--border)]">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-sm">
                            QP
                        </div>
                        <span
                            className="text-lg font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors"
                            style={{ fontFamily: 'Playfair Display, serif' }}
                        >
                            QuantPOS
                        </span>
                    </Link>
                    <div className="flex items-center gap-1">
                        {navLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                                    pathname?.startsWith(link.href)
                                        ? 'text-[var(--accent)] bg-[var(--accent-soft)]'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* Admin button — always visible, prompts auth if needed */}
                        <button
                            onClick={handleAdminClick}
                            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                                pathname?.startsWith('/admin')
                                    ? 'text-[var(--accent)] bg-[var(--accent-soft)]'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                            }`}
                        >
                            Admin
                        </button>

                        <div className="w-px h-5 bg-[var(--border)] mx-2" />

                        {loggedIn ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[var(--text-muted)] px-2 py-1 rounded-md bg-[var(--bg-muted)]">
                                    {username} · {role}
                                </span>
                                <button
                                    onClick={handleSignOut}
                                    className="px-3.5 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-50 transition-all cursor-pointer"
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <span className="text-xs text-[var(--text-muted)] px-2 py-1">
                                Browsing as guest
                            </span>
                        )}
                    </div>
                </div>
            </nav>

            {showAdminAuth && (
                <AuthPrompt
                    actionLabel="Admin panel access requires manager credentials"
                    requireAdmin={true}
                    onSuccess={handleAdminAuthSuccess}
                    onCancel={() => setShowAdminAuth(false)}
                />
            )}
        </>
    );
}