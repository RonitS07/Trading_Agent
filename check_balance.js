
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);

    for (const user of users) {
        console.log(`\nUser: ${user.name} (id: ${user.id}), Balance: ${user.balance}`);

        const trades = await prisma.trade.findMany({
            where: { userId: user.id },
            orderBy: { timestamp: 'desc' }
        });

        console.log("Recent Trades:");
        trades.forEach(t => {
            console.log(`${t.timestamp.toISOString()} | ${t.action} ${t.qty} ${t.symbol} | Status: ${t.status} | Price: ${t.price} | Limit: ${t.limitPrice}`);
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
