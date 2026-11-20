// Usage (Windows or Linux): node seed-authorities.js   — reads .env from the repo root
try { process.loadEnvFile(); } catch { /* no .env: rely on real environment variables */ }
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Prisma 7 needs the same driver adapter as src/lib/prisma.ts.
const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) });

async function main() {
    const password = process.env.AUTHORITY_SEED_PASSWORD;
    if (!password) {
        throw new Error('Set AUTHORITY_SEED_PASSWORD to seed authority accounts');
    }
    const passwordHash = await bcrypt.hash(password, 10);

    // Create Municipal Authority
    await prisma.user.upsert({
        where: { email: 'municipal@sadaksathi.ai' },
        update: { role: 'municipal', passwordHash },
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
        update: { role: 'traffic', passwordHash },
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
