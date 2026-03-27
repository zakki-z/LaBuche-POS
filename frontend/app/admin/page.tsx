'use client';
import { useState, useEffect } from 'react';
import { products as productsApi, orders as ordersApi, type Product, type Order } from '@/lib/api';
import Link from 'next/link';

export default function AdminDashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [orderList, setOrderList] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([productsApi.getAll(), ordersApi.getAll()])
            .then(([p, o]) => {
                setProducts(p);
                setOrderList(o);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const totalRevenue = orderList.reduce((sum, o) => sum + (o.paidAmount ?? 0), 0);
    const totalOutstanding = orderList.reduce((sum, o) => sum + (o.remainingAmount ?? 0), 0);

    const stats = [
        { label: 'Total Products', value: products.length, color: 'var(--accent)', bg: 'var(--accent-soft)', icon: '▦' },
        { label: 'Total Orders', value: orderList.length, color: 'var(--success)', bg: '#dcfce7', icon: '▤' },
        { label: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, color: 'var(--accent)', bg: 'var(--accent-soft)', icon: '◆' },
        { label: 'Outstanding', value: `$${totalOutstanding.toFixed(2)}`, color: 'var(--danger)', bg: '#fef2f2', icon: '◇' },
    ];

    if (loading) {
        return <div className="text-center py-20 text-[var(--text-muted)]">Loading dashboard…</div>;
    }

    return (
        <div>
            <div className="mb-6">
                <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                >
                    Admin Dashboard
                </h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">Overview of your store</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {stats.map((stat, i) => (
                    <div
                        key={stat.label}
                        className="card p-5 animate-in"
                        style={{ animationDelay: `${i * 60}ms` }}
                    >
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 font-bold text-sm"
                            style={{ backgroundColor: stat.bg, color: stat.color }}
                        >
                            {stat.icon}
                        </div>
                        <div className="text-2xl font-black tracking-tight" style={{ color: stat.color }}>
                            {stat.value}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { href: '/admin/products', label: 'Manage Products', desc: 'Add, edit, or remove products', icon: '▦' },
                    { href: '/admin/orders', label: 'Manage Orders', desc: 'View, update, or delete orders', icon: '▤' },
                    { href: '/admin/users', label: 'Manage Users', desc: 'Manage user accounts & roles', icon: '◉' },
                ].map((item, i) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="card p-5 group hover:border-[var(--accent)] transition-all animate-in"
                        style={{ animationDelay: `${(i + 4) * 60}ms` }}
                    >
                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center mb-3 text-[var(--text-secondary)] group-hover:bg-[var(--accent)] group-hover:text-white transition-colors font-bold">
                            {item.icon}
                        </div>
                        <div className="font-semibold text-sm text-[var(--text-primary)]">{item.label}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">{item.desc}</div>
                    </Link>
                ))}
            </div>
        </div>
    );
}