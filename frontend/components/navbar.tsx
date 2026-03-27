'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth, getAccessToken, getUserRole } from '@/lib/api';

export default function NavBar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const token = getAccessToken();
        setIsLoggedIn(!!token);
        if (token) {
            setRole(getUserRole());
        } else {
            setRole(null);
        }
    }, [pathname]); // re-check on every route change

    const handleSignOut = () => {
        auth.logout();
        setIsLoggedIn(false);
        setRole(null);
        router.push('/login');
    };

    // Build nav links based on auth state and role
    const navLinks = [];
    if (isLoggedIn) {
        navLinks.push({ href: '/pos', label: 'POS' });
        navLinks.push({ href: '/products', label: 'Products' });
        navLinks.push({ href: '/orders', label: 'Orders' });
        if (role === 'ADMIN') {
            navLinks.push({ href: '/admin', label: 'Admin' });
        }
    }

    return (
        <nav className="sticky top-0 z-40 backdrop-blur-md bg-[var(--bg-base)]/80 border-b border-[var(--border)]">
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/public" className="flex items-center gap-2.5 group">
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
                    {isLoggedIn && (
                        <>
                            <div className="w-px h-5 bg-[var(--border)] mx-2" />
                            <button
                                onClick={handleSignOut}
                                className="px-3.5 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-50 transition-all cursor-pointer"
                            >
                                Sign Out
                            </button>
                        </>
                    )}
                    {!isLoggedIn && (
                        <>
                            <Link
                                href="/login"
                                className="px-3.5 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-all"
                            >
                                Sign In
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}