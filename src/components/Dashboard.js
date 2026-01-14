'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DesktopTerminal from './DesktopTerminal';
import MobileTerminal from './MobileTerminal';

export default function Dashboard({ initialUser }) {
    const router = useRouter();
    const [user, setUser] = useState(initialUser);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
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
        } catch (e) { console.error(e); }
    };

    const handleLogout = () => {
        router.push('/profile');
    };

    if (isMobile) {
        return <MobileTerminal user={user} onLogout={handleLogout} />;
    }

    return <DesktopTerminal user={user} onTradeComplete={handleTradeComplete} />;
}


