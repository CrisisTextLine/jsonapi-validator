#!/usr/bin/env node

/**
 * CLI Wrapper for TypeScript execution
 *
 * This wrapper uses tsx to run the TypeScript CLI directly
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cliPath = join(__dirname, 'cli.ts');

// Use tsx to execute the TypeScript CLI
const proc = spawn('npx', ['tsx', cliPath, ...process.argv.slice(2)], {
  stdio: 'inherit'
});

proc.on('exit', (code) => {
  process.exit(code || 0);
});

proc.on('error', (err) => {
  console.error('Failed to start CLI:', err);
  process.exit(1);
});
