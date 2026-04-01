import 'dotenv/config';
import { prisma } from './src/prisma.js';

async function main() {
  try {
    const count = await prisma.user.count();
    console.log('--- DB Connection Success. User count:', count);
    process.exit(0);
  } catch (err) {
    console.error('--- DB Connection Failure:', err);
    process.exit(1);
  }
}

main();
