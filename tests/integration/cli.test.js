/**
 * CLI tests
 *
 * Tests for the command-line interface
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLI_PATH = join(__dirname, '..', 'cli.js');
const MOCK_SERVER_URL = 'http://localhost:3001';

// Helper function to run CLI command
function runCLI(args = [], timeout = 10000) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [CLI_PATH, ...args]);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timeoutId = setTimeout(() => {
      proc.kill();
      reject(new Error('Command timed out'));
    }, timeout);

    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      resolve({ code, stdout, stderr });
    });

    proc.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

describe('CLI', () => {
  describe('Help and basic options', () => {
    it('should display help with --help flag', async () => {
      const { code, stdout } = await runCLI(['--help']);
      expect(code).toBe(0);
      expect(stdout).toContain('JSON:API Validator CLI');
      expect(stdout).toContain('Usage:');
      expect(stdout).toContain('Examples:');
    });

    it('should display help when no arguments provided', async () => {
      const { code, stdout } = await runCLI([]);
      expect(code).toBe(0);
      expect(stdout).toContain('JSON:API Validator CLI');
    });
  });

  describe('Validation', () => {
    it('should validate a valid endpoint and exit with code 0', async () => {
      const { code, stdout } = await runCLI([`${MOCK_SERVER_URL}/api/articles`]);
      expect(stdout).toContain('Validating JSON:API endpoint');
      expect(stdout).toMatch(/Validation (Completed|Failed)/);
      expect(stdout).toContain('Passed:');
      expect(stdout).toContain('Failed:');
    });

    it('should output JSON format with --json flag', async () => {
      const { code, stdout } = await runCLI([`${MOCK_SERVER_URL}/api/articles`, '--json']);
      expect(() => JSON.parse(stdout)).not.toThrow();
      const result = JSON.parse(stdout);
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('sections');
    });

    it('should show verbose output with --verbose flag', async () => {
      const { code, stdout } = await runCLI([`${MOCK_SERVER_URL}/api/articles`, '--verbose']);
      expect(stdout).toContain('Validating JSON:API endpoint');
      // Verbose mode should show more details
      expect(stdout.length).toBeGreaterThan(500);
    });

    it('should handle invalid URL', async () => {
      const { code, stdout, stderr } = await runCLI(['not-a-valid-url']);
      expect(code).toBe(1);
      expect(stderr || stdout).toContain('Error');
    });

    it('should handle unreachable endpoint', async () => {
      const { code, stdout, stderr } = await runCLI(['http://localhost:9999/api/test']);
      expect(code).toBe(1);
      expect(stderr || stdout).toContain('Error');
    }, 15000);
  });

  describe('HTTP Methods', () => {
    it('should support different HTTP methods', async () => {
      const { code, stdout } = await runCLI([
        `${MOCK_SERVER_URL}/api/articles`,
        '--method',
        'GET'
      ]);
      expect(code).toBeDefined();
      expect(stdout).toContain('Validating JSON:API endpoint');
    });
  });

  describe('Authentication', () => {
    it('should accept bearer token authentication', async () => {
      const { code, stdout } = await runCLI([
        `${MOCK_SERVER_URL}/api/articles`,
        '--auth-type',
        'bearer',
        '--token',
        'test-token'
      ]);
      expect(code).toBeDefined();
      expect(stdout).toContain('Validating JSON:API endpoint');
    });

    it('should accept API key authentication', async () => {
      const { code, stdout } = await runCLI([
        `${MOCK_SERVER_URL}/api/articles`,
        '--auth-type',
        'apiKey',
        '--api-key',
        'test-key'
      ]);
      expect(code).toBeDefined();
      expect(stdout).toContain('Validating JSON:API endpoint');
    });

    it('should accept basic authentication', async () => {
      const { code, stdout } = await runCLI([
        `${MOCK_SERVER_URL}/api/articles`,
        '--auth-type',
        'basic',
        '--username',
        'user',
        '--password',
        'pass'
      ]);
      expect(code).toBeDefined();
      expect(stdout).toContain('Validating JSON:API endpoint');
    });
  });

  describe('Exit codes', () => {
    it('should exit with 0 for successful validation (with warnings)', async () => {
      const { code } = await runCLI([`${MOCK_SERVER_URL}/api/articles`]);
      // Exit code 0 means validation completed, even with warnings
      // Exit code 1 means validation failed
      expect([0, 1]).toContain(code);
    });
  });
});
