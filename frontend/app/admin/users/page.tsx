'use client';
import { useState, useEffect } from 'react';
import { users as usersApi, type UserInfo, ApiError } from '@/lib/api';

export default function AdminUsers() {
    const [userList, setUserList] = useState<UserInfo[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit modal
    const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
    const [editForm, setEditForm] = useState({ username: '', password: '' });
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState('');

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<UserInfo | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        try {
            const data = await usersApi.getAll();
            setUserList(data);
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (user: UserInfo) => {
        setEditForm({ username: user.username, password: '' });
        setEditingUser(user);
        setEditError('');
    };

    const closeEdit = () => {
        setEditingUser(null);
        setEditError('');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser || !editForm.username.trim()) return;

        setSaving(true);
        setEditError('');

        try {
            await usersApi.update(editingUser.id, {
                username: editForm.username.trim(),
                password: editForm.password || undefined,
            });
            closeEdit();
            loadUsers();
        } catch (err) {
            if (err instanceof ApiError && err.status === 403) {
                setEditError('You do not have permission to update users.');
            } else {
                setEditError('Failed to update user. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);

        try {
            await usersApi.delete(deleteTarget.id);
            setDeleteTarget(null);
            loadUsers();
        } catch (err) {
            if (err instanceof ApiError && err.status === 403) {
                alert('You do not have permission to delete users.');
            } else {
                alert('Failed to delete user.');
            }
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                >
                    Users
                </h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                    {userList.length} user{userList.length !== 1 ? 's' : ''} registered
                </p>
            </div>

            <div className="card-flat overflow-hidden">
                {loading ? (
                    <div className="text-center py-16 text-[var(--text-muted)]">Loading users…</div>
                ) : userList.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-4xl mb-3 opacity-30">◉</div>
                        <p className="text-[var(--text-muted)] text-sm">No users found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {/* Table header */}
                        <div className="flex items-center px-5 py-3 bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                            <div className="w-16">ID</div>
                            <div className="flex-1">Username</div>
                            <div className="w-28 text-center">Role</div>
                            <div className="w-40 text-right">Actions</div>
                        </div>

                        {userList.map((user, index) => (
                            <div
                                key={user.id}
                                className="flex items-center px-5 py-4 hover:bg-[var(--bg-base)] transition group"
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                <div className="w-16 text-sm text-[var(--text-muted)]">
                                    {user.id}
                                </div>
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-9 h-9 rounded-full bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] font-bold text-xs">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-sm">{user.username}</span>
                                </div>
                                <div className="w-28 text-center">
                                    {user.role === 'ADMIN' ? (
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-orange-200">
                                            Admin
                                        </span>
                                    ) : (
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border)]">
                                            User
                                        </span>
                                    )}
                                </div>
                                <div className="w-40 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEdit(user)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-muted)] hover:bg-[var(--border)] transition"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(user)}
                                        className="btn-danger"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Edit User Modal ──────────────────────────── */}
            {editingUser && (
                <div
                    className="modal-overlay"
                    onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
                >
                    <div className="card p-0 max-w-md w-full mx-4 overflow-hidden animate-in">
                        <div className="px-6 py-5 bg-[var(--bg-muted)] border-b border-[var(--border)] flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)] text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Edit User
                                </h3>
                                <p className="text-xs text-[var(--text-muted)]">Update user #{editingUser.id}</p>
                            </div>
                            <button
                                onClick={closeEdit}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6">
                            {editError && (
                                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                    {editError}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Username</label>
                                    <input
                                        className="input"
                                        placeholder="Username"
                                        value={editForm.username}
                                        onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                                        New Password <span className="normal-case text-[var(--text-muted)] font-normal">(leave blank to keep current)</span>
                                    </label>
                                    <input
                                        className="input"
                                        type="password"
                                        placeholder="Enter new password"
                                        value={editForm.password}
                                        onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={closeEdit} className="btn btn-ghost flex-1 py-2.5">Cancel</button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving || !editForm.username.trim()}
                                        className="btn btn-primary flex-1 py-2.5 disabled:opacity-60"
                                    >
                                        {saving ? 'Saving…' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ────────────────── */}
            {deleteTarget && (
                <div
                    className="modal-overlay"
                    onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
                >
                    <div className="card p-6 max-w-sm w-full mx-4 animate-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-[var(--danger)] font-bold text-lg">
                                !
                            </div>
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)]">Delete User</h3>
                                <p className="text-xs text-[var(--text-muted)]">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-5">
                            Are you sure you want to delete <strong>{deleteTarget.username}</strong>? This will permanently remove their account and all associated data.
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setDeleteTarget(null)} className="btn btn-ghost flex-1 py-2.5">Cancel</button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="btn flex-1 py-2.5 disabled:opacity-60"
                                style={{ background: 'var(--danger)', color: '#fff' }}
                            >
                                {deleting ? 'Deleting…' : 'Delete User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}