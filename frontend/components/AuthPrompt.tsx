'use client';
import { useState } from 'react';
import { auth } from '@/lib/api';

type AuthPromptProps = {
    /** What the user is trying to do, shown in the modal */
    actionLabel: string;
    /** If true, requires ADMIN role */
    requireAdmin?: boolean;
    /** Called with the authenticated username on success */
    onSuccess: (username: string, role: string) => void;
    /** Called when user cancels */
    onCancel: () => void;
};

export default function AuthPrompt({ actionLabel, requireAdmin = false, onSuccess, onCancel }: AuthPromptProps) {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [form, setForm] = useState({ fullName: '', username: '', password: '', role: 'USER' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!form.username.trim() || !form.password.trim()) return;
        setLoading(true);
        setError('');

        try {
            const result = await auth.login(form.username, form.password);

            if (requireAdmin && result.role !== 'ADMIN') {
                setError('This action requires an admin account.');
                setLoading(false);
                return;
            }

            onSuccess(result.username, result.role);
        } catch {
            setError('Invalid username or password.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!form.username.trim() || !form.password.trim()) return;
        setLoading(true);
        setError('');

        try {
            await auth.register(form.fullName, form.username, form.password, form.role);
            // Auto-login after register
            const result = await auth.login(form.username, form.password);

            if (requireAdmin && result.role !== 'ADMIN') {
                setError('This action requires an admin account.');
                setLoading(false);
                return;
            }

            onSuccess(result.username, result.role);
        } catch {
            setError('Registration failed. Username may already be taken.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
            <div className="card p-0 max-w-sm w-full mx-4 overflow-hidden animate-in">
                {/* Header */}
                <div className="px-6 py-5 bg-[var(--bg-muted)] border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm">
                            {requireAdmin ? '⚡' : '🔑'}
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--text-primary)] text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                                {requireAdmin ? 'Admin Required' : 'Sign In Required'}
                            </h3>
                            <p className="text-xs text-[var(--text-muted)]">
                                {actionLabel}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tab toggle */}
                <div className="flex border-b border-[var(--border)]">
                    <button
                        onClick={() => { setMode('login'); setError(''); }}
                        className={`flex-1 py-3 text-sm font-semibold transition-all ${
                            mode === 'login'
                                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                        }`}
                    >
                        Sign In
                    </button>
                    {!requireAdmin && (
                        <button
                            onClick={() => { setMode('register'); setError(''); }}
                            className={`flex-1 py-3 text-sm font-semibold transition-all ${
                                mode === 'register'
                                    ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                            }`}
                        >
                            Create Account
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        {mode === 'register' && (
                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Full Name</label>
                                <input
                                    className="input"
                                    placeholder="Your full name"
                                    value={form.fullName}
                                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Username</label>
                            <input
                                className="input"
                                placeholder="Enter username"
                                value={form.username}
                                onChange={e => setForm({ ...form, username: e.target.value })}
                                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Password</label>
                            <input
                                className="input"
                                type="password"
                                placeholder="Enter password"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
                            />
                        </div>
                        {mode === 'register' && (
                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Role</label>
                                <select
                                    className="input select"
                                    value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value })}
                                >
                                    <option value="USER">Cashier (USER)</option>
                                    <option value="ADMIN">Manager (ADMIN)</option>
                                </select>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button onClick={onCancel} className="btn btn-ghost flex-1 py-2.5">
                                Cancel
                            </button>
                            <button
                                onClick={mode === 'login' ? handleLogin : handleRegister}
                                disabled={loading || !form.username.trim() || !form.password.trim()}
                                className="btn btn-primary flex-1 py-2.5 disabled:opacity-60"
                            >
                                {loading ? 'Verifying…' : mode === 'login' ? 'Sign In' : 'Create & Sign In'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}