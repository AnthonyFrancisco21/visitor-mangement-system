import { prisma } from '../lib/prisma';
import 'dotenv/config';

async function check() {
  const users = await prisma.user.findMany();
  console.log('Total users:', users.length);
  users.forEach(u => {
    console.log(`Email: ${u.email}, Role: ${u.role}, PasswordHash: ${u.password.substring(0, 10)}...`);
  });
}

check();
