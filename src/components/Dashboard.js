'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DesktopTerminal from './DesktopTerminal';
import MobileTerminal from './MobileTerminal';
import { PortfolioProvider } from './Providers';

export default function Dashboard({ initialUser }) {
    const router = useRouter();
    const [user, setUser] = useState(initialUser);
    const [hasMounted, setHasMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setHasMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleTradeComplete = async (data) => {
        router.refresh();
        try {
            const res = await fetch(`/api/user?userId=${user.id}`);
            const updated = await res.json();
            if (!updated.error) setUser(updated);
        } catch (e) { /* silent */ }
    };

    const handleProfileRedirect = () => {
        router.push('/profile');
    };

    const handleLogout = () => {
        // Force hard redirect to clear state
        window.location.href = '/api/auth/signout';
    };

    if (!hasMounted) return null;

    if (isMobile) {
        return (
            <PortfolioProvider user={user}>
                <MobileTerminal user={user} onProfile={handleProfileRedirect} onLogout={handleLogout} onTradeComplete={handleTradeComplete} />
            </PortfolioProvider>
        );
    }

    return (
        <PortfolioProvider user={user}>
            <DesktopTerminal user={user} onTradeComplete={handleTradeComplete} />
        </PortfolioProvider>
    );
}


