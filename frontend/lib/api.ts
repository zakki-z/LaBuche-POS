const API_BASE = 'http://localhost:8080/api';

const DEBUG = process.env.NODE_ENV !== 'production';

function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
    if (!DEBUG) return;
    const prefix = `[API ${level.toUpperCase()}]`;
    const timestamp = new Date().toISOString();
    switch (level) {
        case 'info': console.log(`${prefix} ${timestamp} — ${message}`, data ?? ''); break;
        case 'warn': console.warn(`${prefix} ${timestamp} — ${message}`, data ?? ''); break;
        case 'error': console.error(`${prefix} ${timestamp} — ${message}`, data ?? ''); break;
    }
}

// ── Session helpers ───────────────────────────────────────
export function getUsername(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('username');
}

export function getUserRole(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('userRole');
}

export function getAccessToken(): string | null {
    return getUsername();
}

export function isAdminSession(): boolean {
    return getUserRole() === 'ADMIN';
}

export function setSession(username: string, role: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('username', username);
    localStorage.setItem('userRole', role);
}

export function clearSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
}

export function hasSession(): boolean {
    return !!getUsername();
}

// ── Custom error class ────────────────────────────────────
export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

// ── Core fetch wrapper ────────────────────────────────────
async function request<T>(
    endpoint: string,
    options: RequestInit = {},
    overrideUsername?: string,
): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const username = overrideUsername || getUsername();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(username ? { 'X-Username': username } : {}),
        ...(options.headers as Record<string, string> ?? {}),
    };

    log('info', `${options.method ?? 'GET'} ${endpoint}`, options.body ? JSON.parse(options.body as string) : undefined);

    const start = performance.now();

    try {
        const res = await fetch(url, { ...options, headers });
        const duration = Math.round(performance.now() - start);

        if (!res.ok) {
            const errorBody = await res.text().catch(() => 'No body');
            log('error', `${res.status} ${res.statusText} (${duration}ms) — ${endpoint}`, errorBody);
            if (res.status === 403) throw new ApiError('FORBIDDEN', 403);
            if (res.status === 401) throw new ApiError('UNAUTHORIZED', 401);
            throw new ApiError(errorBody || `Request failed with status ${res.status}`, res.status);
        }

        if (res.status === 204) {
            log('info', `204 No Content (${duration}ms) — ${endpoint}`);
            return {} as T;
        }

        const contentType = res.headers.get('content-type') || '';
        let data: T;
        if (contentType.includes('application/json')) {
            data = await res.json();
        } else {
            const text = await res.text();
            data = text as unknown as T;
        }
        log('info', `${res.status} OK (${duration}ms) — ${endpoint}`, data);
        return data as T;
    } catch (err) {
        if (err instanceof ApiError) throw err;
        log('error', `Network error — ${endpoint}`, err);
        throw new ApiError('Network error. Is the server running?', 0);
    }
}

// ── Types ─────────────────────────────────────────────────
export type Category = { id: number; name: string };
export type Product = { id: number; name: string; price: number; categoryId: number | null; categoryName: string | null };
export type Order = { id: number; description: string; totalPrice: number; quantity: number; username?: string; createdAt?: string };
export type AuthResponse = { username: string; role: string };
export type TokenPair = AuthResponse;
export type UserInfo = { id: number; username: string; role: string; badgeNumber?: string };

// ── Auth endpoints ────────────────────────────────────────
export const auth = {
    async login(username: string, password: string): Promise<AuthResponse> {
        const data = await request<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        setSession(data.username, data.role);
        return data;
    },

    async badgeLogin(badgeNumber: string): Promise<AuthResponse> {
        const data = await request<AuthResponse>('/auth/badge-login', {
            method: 'POST',
            body: JSON.stringify({ badgeNumber }),
        });
        setSession(data.username, data.role);
        return data;
    },

    async verify(username: string, password: string): Promise<AuthResponse> {
        return request<AuthResponse>('/auth/verify', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    },

    async register(fullName: string, username: string, password: string, role: string, badgeNumber?: string): Promise<string> {
        return request<string>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ fullName, username, password, role, badgeNumber: badgeNumber || null }),
        });
    },

    logout() {
        clearSession();
    },
};

// ── Product endpoints ─────────────────────────────────────
export const products = {
    async getAll(u?: string): Promise<Product[]> { return request<Product[]>('/v1.0/products', {}, u); },
    async getById(id: number, u?: string): Promise<Product> { return request<Product>(`/v1.0/products/${id}`, {}, u); },
    async create(product: { name: string; price: string | number; categoryId?: number | null }, u?: string): Promise<Product> {
        return request<Product>('/v1.0/products', { method: 'POST', body: JSON.stringify(product) }, u);
    },
    async update(id: number, product: Partial<Product>, u?: string): Promise<Product> {
        return request<Product>(`/v1.0/products/${id}`, { method: 'PUT', body: JSON.stringify(product) }, u);
    },
    async delete(id: number, u?: string): Promise<void> { await request<void>(`/v1.0/products/${id}`, { method: 'DELETE' }, u); },
};

// ── Category endpoints ────────────────────────────────────
export const categories = {
    async getAll(u?: string): Promise<Category[]> { return request<Category[]>('/v1.0/categories', {}, u); },
    async create(category: { name: string }, u?: string): Promise<Category> {
        return request<Category>('/v1.0/categories', { method: 'POST', body: JSON.stringify(category) }, u);
    },
    async delete(id: number, u?: string): Promise<void> { await request<void>(`/v1.0/categories/${id}`, { method: 'DELETE' }, u); },
};

// ── Order endpoints ───────────────────────────────────────
export const orders = {
    async getAll(u?: string): Promise<Order[]> { return request<Order[]>('/v1.0/orders', {}, u); },
    async getById(id: number, u?: string): Promise<Order> { return request<Order>(`/v1.0/orders/${id}`, {}, u); },
    async create(order: { quantity: number; totalPrice: number; description: string }, u?: string): Promise<Order> {
        return request<Order>('/v1.0/orders', { method: 'POST', body: JSON.stringify(order) }, u);
    },
    async update(id: number, order: Partial<Order>, u?: string): Promise<Order> {
        return request<Order>(`/v1.0/orders/${id}`, { method: 'PUT', body: JSON.stringify(order) }, u);
    },
    async delete(id: number, u?: string): Promise<void> { await request<void>(`/v1.0/orders/${id}`, { method: 'DELETE' }, u); },
};

// ── User endpoints (Admin) ────────────────────────────────
export const users = {
    async getAll(u?: string): Promise<UserInfo[]> { return request<UserInfo[]>('/users', {}, u); },
    async getById(id: number, u?: string): Promise<UserInfo> { return request<UserInfo>(`/users/${id}`, {}, u); },
    async update(id: number, user: { username?: string; password?: string; badgeNumber?: string }, u?: string): Promise<UserInfo> {
        return request<UserInfo>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(user) }, u);
    },
    async delete(id: number, u?: string): Promise<void> { await request<void>(`/users/${id}`, { method: 'DELETE' }, u); },
};