import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Dashboard from "@/components/Dashboard";

export const dynamic = 'force-dynamic';

export default async function Home() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            portfolio: true,
            trades: {
                take: 5,
                orderBy: { timestamp: 'desc' }
            }
        }
    });

    if (!user) {
        // Edge case: Session exists but user deleted?
        redirect('/login');
    }

    // Pass safe user object (exclude password)
    const { password, ...safeUser } = user;

    return (
        <Dashboard initialUser={safeUser} />
    );
}
