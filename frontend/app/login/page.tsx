'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';
import { useRfidScanner } from '@/lib/useRfidScanner';

export default function Login() {
    const [form, setForm] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [badgeScanning, setBadgeScanning] = useState(false);
    const router = useRouter();

    // Listen for RFID badge taps
    useRfidScanner({
        onScan: async (badgeNumber) => {
            setBadgeScanning(true);
            setError('');

            try {
                await auth.badgeLogin(badgeNumber);
                router.push('/pos');
            } catch {
                setError(`Badge not recognized (${badgeNumber}). Please register first or use manual login.`);
            } finally {
                setBadgeScanning(false);
            }
        },
        enabled: !loading,
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await auth.login(form.username, form.password);
            router.push('/pos');
        } catch {
            setError('Invalid username or password. Please try again.');
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
                        Welcome back
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Sign in to your account</p>
                </div>

                {/* RFID Badge Section */}
                <div
                    className={`border-2 border-dashed rounded-xl p-4 text-center mb-5 transition-all ${
                        badgeScanning
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                            : 'border-[var(--border)] bg-[var(--bg-base)]'
                    }`}
                >
                    <div className={`text-3xl mb-2 ${badgeScanning ? 'animate-pulse' : ''}`}>
                        📶
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {badgeScanning ? 'Reading badge…' : 'Tap your RFID badge'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                        Hold your card near the reader to sign in instantly
                    </p>
                </div>

                <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px bg-[var(--border)]" />
                    <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">or</span>
                    <div className="flex-1 h-px bg-[var(--border)]" />
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Username</label>
                        <input
                            className="input"
                            placeholder="Enter your username"
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
                            placeholder="Enter your password"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="btn btn-primary w-full py-3 mt-2 disabled:opacity-60"
                    >
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </div>

                <p className="mt-6 text-sm text-center text-[var(--text-muted)]">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="text-[var(--accent)] font-semibold hover:underline">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}