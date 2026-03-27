import Link from 'next/link';

export default function Home() {
  return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="card p-10 max-w-lg w-full text-center animate-in">
          {/* Logo mark */}
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>QP</span>
          </div>

          <h1
              className="text-4xl font-black mb-3 text-[var(--text-primary)] tracking-tight"
              style={{ fontFamily: 'Playfair Display, serif' }}
          >
            QuantPOS
          </h1>
          <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
            A refined point-of-sale system. Manage products, process orders, and handle transactions with ease.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link href="/login" className="btn btn-primary flex-1 py-3 text-base">
              Sign In
            </Link>
            <Link href="/register" className="btn btn-ghost flex-1 py-3 text-base">
              Create Account
            </Link>
          </div>

          <div className="pt-6 border-t border-[var(--border)] text-sm text-[var(--text-secondary)] text-left">
            <p className="font-semibold mb-2 text-[var(--text-primary)]">Quick Testing Tip</p>
            <p className="leading-relaxed">
              Create a <strong>USER</strong> account to test POS checkout, or an <strong>ADMIN</strong> account to manage products (add, update, delete).
            </p>
          </div>
        </div>
      </div>
  );
}