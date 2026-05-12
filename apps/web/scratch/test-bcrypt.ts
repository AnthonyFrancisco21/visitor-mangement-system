import bcrypt from 'bcryptjs';

async function test() {
  const password = 'Admin@1234';
  const rounds = 12;
  const hash = await bcrypt.hash(password, rounds);
  console.log('Password:', password);
  console.log('Hash:', hash);
  const isMatch = await bcrypt.compare(password, hash);
  console.log('Match:', isMatch);
}

test();
