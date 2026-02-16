#!/usr/bin/env node
/**
 * Ensures DATABASE_URL exists in .env for Prisma CLI (which only reads .env).
 * Copies DATABASE_URL from .env.local to .env if missing.
 * Run before: prisma migrate dev
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
const envLocalPath = path.join(root, '.env.local');

function normalize(content) {
  return (content || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function getVar(content, name) {
  const normalized = normalize(content);
  const m = normalized.match(new RegExp(`^\\s*${name}\\s*=\\s*(.+)\\s*$`, 'm'));
  if (!m) return null;
  return m[1].replace(/^["']|["']$/g, '').trim();
}

function hasVar(content, name) {
  return new RegExp(`^\\s*${name}\\s*=`, 'm').test(normalize(content));
}

let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const envLocalContent = fs.existsSync(envLocalPath) ? fs.readFileSync(envLocalPath, 'utf8') : '';

const hasInEnv = hasVar(envContent, 'DATABASE_URL');
const fromLocal = getVar(envLocalContent, 'DATABASE_URL');

if (!hasInEnv && fromLocal) {
  const line = `DATABASE_URL=${fromLocal}\n`;
  envContent = envContent.trimEnd() + (envContent ? '\n' : '') + line;
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('[ensure-env] Wrote DATABASE_URL from .env.local into .env for Prisma.');
}

const finalUrl = getVar(envContent, 'DATABASE_URL') || fromLocal;
if (!finalUrl) {
  console.error('[ensure-env] No DATABASE_URL found in .env or .env.local.');
  console.error('  Add a line to .env.local (or .env):');
  console.error('  DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public');
  console.error('  (For Neon: get the connection string from the Neon dashboard and paste it as DATABASE_URL=...)');
  console.error('  Then run: npm run prisma:migrate -- --name init');
  process.exit(1);
}
