/**
 * First-run admin account setup for hospital deployments.
 * Run after db push: node tools/create-admin.mjs
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createInterface } from 'readline';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolveAnswer) => {
    rl.question(question, (answer) => {
      rl.close();
      resolveAnswer(answer.trim());
    });
  });
}

async function main() {
  loadEnv();

  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not set. Run setup-h1ms.ps1 first.');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const existing = await prisma.user.count();
    if (existing > 0) {
      const proceed = await prompt(
        `Database already has ${existing} user(s). Create another admin? (y/N): `
      );
      if (proceed.toLowerCase() !== 'y') {
        console.log('Skipped admin creation.');
        return;
      }
    }

    console.log('\n--- Create Hospital Administrator ---\n');

    const name = await prompt('Admin full name: ');
    const email = await prompt('Admin email: ');
    let password = await prompt('Admin password (min 8 chars): ');

    if (!name || !email || !email.includes('@')) {
      console.error('ERROR: Name and valid email are required.');
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('ERROR: Password must be at least 8 characters.');
      process.exit(1);
    }

    const confirm = await prompt('Confirm password: ');
    if (password !== confirm) {
      console.error('ERROR: Passwords do not match.');
      process.exit(1);
    }

    const duplicate = await prisma.user.findUnique({ where: { email } });
    if (duplicate) {
      console.error(`ERROR: User already exists: ${email}`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'ADMIN',
        department: 'Administration',
        isActive: true,
      },
    });

    console.log('\nAdministrator account created successfully.');
    console.log(`  Email: ${email}`);
    console.log('  Use these credentials to sign in at http://localhost:3000\n');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Failed to create admin:', err.message || err);
  process.exit(1);
});
