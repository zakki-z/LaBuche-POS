'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAccessToken, getUserRole } from '@/lib/api';

const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: '◫' },
    { href: '/admin/products', label: 'Products', icon: '▦' },
    { href: '/admin/orders', label: 'Orders', icon: '▤' },
    { href: '/admin/users', label: 'Users', icon: '◉' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const token = getAccessToken();
        if (!token) {
            router.replace('/login');
            return;
        }

        const role = getUserRole();
        if (role !== 'ADMIN') {
            router.replace('/pos');
            return;
        }

        setAuthorized(true);
        setChecking(false);
    }, [router]);

    if (checking || !authorized) {
        return (
            <div className="flex gap-6 animate-in">
                <div className="flex-1 text-center py-20 text-[var(--text-muted)]">
                    Checking permissions…
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-6 animate-in">
            {/* Sidebar */}
            <aside className="w-56 shrink-0 sticky top-24 self-start">
                <div className="card-flat p-3">
                    <div className="px-3 py-2 mb-2">
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Admin Panel</p>
                    </div>
                    <nav className="space-y-0.5">
                        {adminLinks.map(link => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        isActive
                                            ? 'bg-[var(--accent)] text-white shadow-sm'
                                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                                    }`}
                                >
                                    <span className="text-base leading-none">{link.icon}</span>
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}