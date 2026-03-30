'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUserRole, hasSession } from '@/lib/api';
import AuthPrompt from "@/components/AuthPrompt";

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
    const [showAuth, setShowAuth] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (hasSession() && getUserRole() === 'ADMIN') {
            setAuthorized(true);
            setChecking(false);
        } else {
            // Not admin — show the auth prompt
            setShowAuth(true);
            setChecking(false);
        }
    }, []);

    const handleAuthSuccess = (_username: string, role: string) => {
        setShowAuth(false);
        if (role === 'ADMIN') {
            setAuthorized(true);
        } else {
            // They logged in but not as admin
            router.push('/pos');
        }
    };

    const handleAuthCancel = () => {
        setShowAuth(false);
        router.push('/pos');
    };

    if (checking) {
        return (
            <div className="flex gap-6 animate-in">
                <div className="flex-1 text-center py-20 text-[var(--text-muted)]">
                    Checking permissions…
                </div>
            </div>
        );
    }

    if (showAuth) {
        return (
            <AuthPrompt
                actionLabel="Admin panel requires manager credentials"
                requireAdmin={true}
                onSuccess={handleAuthSuccess}
                onCancel={handleAuthCancel}
            />
        );
    }

    if (!authorized) {
        return null;
    }

    return (
        <div className="flex gap-6 animate-in">
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
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}