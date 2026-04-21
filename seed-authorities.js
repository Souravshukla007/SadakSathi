require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Create Municipal Authority
    await prisma.user.upsert({
        where: { email: 'municipal@sadaksathi.ai' },
        update: { role: 'municipal' },
        create: {
            username: 'municipal_desk',
            fullName: 'Municipal Authority',
            email: 'municipal@sadaksathi.ai',
            passwordHash,
            role: 'municipal',
            city: 'New Delhi',
            state: 'Delhi'
        }
    });

    // Create Traffic Authority
    await prisma.user.upsert({
        where: { email: 'traffic@sadaksathi.ai' },
        update: { role: 'traffic' },
        create: {
            username: 'traffic_desk',
            fullName: 'Traffic Authority',
            email: 'traffic@sadaksathi.ai',
            passwordHash,
            role: 'traffic',
            city: 'New Delhi',
            state: 'Delhi'
        }
    });

    console.log('Authority accounts created successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
