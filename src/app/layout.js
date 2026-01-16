import { Outfit, JetBrains_Mono } from 'next/font/google';
import './style.css';
import './mobile.css';
import Providers from '@/components/Providers';

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
    display: 'swap',
});

const mono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});

export const metadata = {
    title: 'TradePilot - Next-Gen Trading Terminal',
    description: 'Advanced AI Paper Trading Agent for Indian Markets',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${outfit.variable} ${mono.variable}`} suppressHydrationWarning>
            <head>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            </head>
            <body className="pro-theme">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}

