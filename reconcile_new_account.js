
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // This is the NEW account ID from the user's latest login after reset
    const ronitId = "cml0n916z000oxvh7k6oorv72";
    const user = await prisma.user.findUnique({ where: { id: ronitId } });

    if (!user) {
        console.log("Ronit (new) not found");
        return;
    }

    console.log(`Current Balance for ${user.name}: ₹${user.balance}`);

    // Adjusting to match the previous reconciled balance of ₹1,29,666.50
    const newBalance = 129666.50;

    await prisma.user.update({
        where: { id: ronitId },
        data: { balance: newBalance }
    });

    console.log(`Updated Balance for ${user.name}: ₹${newBalance}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
