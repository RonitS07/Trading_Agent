
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ronitId = "cml0m8k830000ynjw3mcsaqv1";
    const user = await prisma.user.findUnique({ where: { id: ronitId } });

    if (!user) {
        console.log("Ronit Shah not found");
        return;
    }

    console.log(`Current Balance for ${user.name}: ₹${user.balance}`);

    // The execution of SELL 10 ICICIAMC.NS credited ₹29,746.31
    // This order was originally placed before the fix, so it was already credited.
    // We need to subtract this amount to fix the "double-credit".

    const adjustment = 29746.31;
    const newBalance = user.balance - adjustment;

    await prisma.user.update({
        where: { id: ronitId },
        data: { balance: newBalance }
    });

    console.log(`Updated Balance for ${user.name}: ₹${newBalance}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
