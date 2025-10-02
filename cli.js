#!/usr/bin/env node

/**
 * CLI Wrapper for TypeScript execution
 * This file wraps the TypeScript CLI and runs it using tsx
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Run the TypeScript CLI using tsx
const tsxPath = join(__dirname, 'node_modules', '.bin', 'tsx');
const cliPath = join(__dirname, 'cli.ts');

const child = spawn(tsxPath, [cliPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
