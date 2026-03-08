import 'dotenv/config';
import { prisma } from './src/lib/prisma';

async function main() {
  try {
    const user = await prisma.user.findFirst();
    console.log("Success initialized Prisma!", user);
  } catch (e: any) {
    console.error("Full Error:");
    console.error(e);
  }
}

main();
