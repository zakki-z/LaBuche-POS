// app/layout.tsx
import './globals.css';
import Link from 'next/link';
import NavBar from '@/components/navbar';

export const metadata = {
    title: 'QuantPOS',
    description: 'A modern point-of-sale system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link
                href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:wght@500;700;900&display=swap"
                rel="stylesheet"
            />
        </head>
        <body>
        <NavBar />
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
        </body>
        </html>
    );
}