'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DesktopTerminal from './DesktopTerminal';
import MobileTerminal from './MobileTerminal';

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

    const handleLogout = () => {
        router.push('/profile');
    };

    if (!hasMounted) return null;

    if (isMobile) {
        return <MobileTerminal user={user} onLogout={handleLogout} onTradeComplete={handleTradeComplete} />;
    }

    return <DesktopTerminal user={user} onTradeComplete={handleTradeComplete} />;
}


