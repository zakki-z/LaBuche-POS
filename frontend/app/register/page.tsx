// app/register/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';

export default function Register() {
    const [form, setForm] = useState({ fullName: '', username: '', password: '', role: 'USER' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await auth.register(form.fullName, form.username, form.password, form.role);
            router.push('/login');
        } catch {
            setError('Registration failed. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="card p-8 max-w-sm w-full animate-in">
                <div className="mb-6">
                    <h2
                        className="text-2xl font-bold tracking-tight text-[var(--text-primary)]"
                        style={{ fontFamily: 'Playfair Display, serif' }}
                    >
                        Create account
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Get started with QuantPOS</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Full Name</label>
                        <input
                            className="input"
                            placeholder="Your full name"
                            value={form.fullName}
                            onChange={e => setForm({ ...form, fullName: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Username</label>
                        <input
                            className="input"
                            placeholder="Choose a username"
                            value={form.username}
                            onChange={e => setForm({ ...form, username: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Password</label>
                        <input
                            className="input"
                            type="password"
                            placeholder="Create a password"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Role</label>
                        <select
                            className="input select"
                            value={form.role}
                            onChange={e => setForm({ ...form, role: e.target.value })}
                        >
                            <option value="USER">Cashier (USER)</option>
                            <option value="ADMIN">Manager (ADMIN)</option>
                        </select>
                    </div>
                    <button
                        onClick={handleRegister}
                        disabled={loading}
                        className="btn btn-primary w-full py-3 mt-2 disabled:opacity-60"
                    >
                        {loading ? 'Creating…' : 'Create Account'}
                    </button>
                </div>

                <p className="mt-6 text-sm text-center text-[var(--text-muted)]">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[var(--accent)] font-semibold hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}