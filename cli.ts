#!/usr/bin/env node

/**
 * JSON:API Validator CLI
 *
 * Command-line interface for validating JSON:API v1.1 compliance
 *
 * Usage:
 *   jsonapi-validator <url> [options]
 *
 * Options:
 *   --method <method>     HTTP method (default: GET)
 *   --auth-type <type>    Authentication type: none, bearer, apiKey, basic (default: none)
 *   --token <token>       Bearer token
 *   --api-key <key>       API key
 *   --username <user>     Basic auth username
 *   --password <pass>     Basic auth password
 *   --body <json>         Request body (JSON string)
 *   --json                Output results as JSON
 *   --verbose             Show detailed output
 *   --help                Show this help message
 */

import { runValidation } from './src/utils/ValidationService.js';
import type { ValidationReport } from './src/types/validation.js';

/**
 * CLI configuration for API validation
 */
interface CliConfig {
  apiUrl: string;
  httpMethod: string;
  authType: 'none' | 'bearer' | 'apiKey' | 'basic';
  authCredentials: {
    token?: string;
    key?: string;
    username?: string;
    password?: string;
  };
  customHeaders: Record<string, string>;
  requestBody: string;
}

/**
 * CLI output options
 */
interface CliOptions {
  json: boolean;
  verbose: boolean;
}

/**
 * Parsed command-line arguments
 */
interface ParsedArgs {
  config: CliConfig;
  options: CliOptions;
}

const args: string[] = process.argv.slice(2);

/**
 * Display help message
 */
function showHelp(): void {
  console.log(`
JSON:API Validator CLI

Usage:
  jsonapi-validator <url> [options]

Options:
  --method <method>     HTTP method (default: GET)
  --auth-type <type>    Authentication type: none, bearer, apiKey, basic (default: none)
  --token <token>       Bearer token for bearer authentication
  --api-key <key>       API key for apiKey authentication
  --username <user>     Username for basic authentication
  --password <pass>     Password for basic authentication
  --body <json>         Request body as JSON string
  --json                Output results as JSON
  --verbose             Show detailed validation output
  --help                Show this help message

Examples:
  # Validate a simple endpoint
  jsonapi-validator https://api.example.com/articles

  # Validate with bearer token
  jsonapi-validator https://api.example.com/articles --auth-type bearer --token YOUR_TOKEN

  # Validate a POST request with body
  jsonapi-validator https://api.example.com/articles --method POST --body '{"data":{"type":"articles"}}'

  # Get JSON output for scripting
  jsonapi-validator https://api.example.com/articles --json
`);
}

/**
 * Parse command-line arguments into config and options
 * @returns Parsed configuration and options
 */
function parseArgs(): ParsedArgs {
  if (args.length === 0 || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  const config: CliConfig = {
    apiUrl: args[0] || '',
    httpMethod: 'GET',
    authType: 'none',
    authCredentials: {},
    customHeaders: {},
    requestBody: ''
  };

  const options: CliOptions = {
    json: false,
    verbose: false
  };

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--method':
        config.httpMethod = args[++i] || 'GET';
        break;
      case '--auth-type':
        config.authType = (args[++i] as 'none' | 'bearer' | 'apiKey' | 'basic') || 'none';
        break;
      case '--token':
        config.authCredentials.token = args[++i];
        break;
      case '--api-key':
        config.authCredentials.key = args[++i];
        break;
      case '--username':
        config.authCredentials.username = args[++i];
        break;
      case '--password':
        config.authCredentials.password = args[++i];
        break;
      case '--body':
        config.requestBody = args[++i] || '';
        break;
      case '--json':
        options.json = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        process.exit(1);
    }
  }

  return { config, options };
}

/**
 * Format validation results for display
 * @param results - Validation results
 * @param options - CLI options
 * @returns Formatted output string
 */
function formatResults(results: ValidationReport, options: CliOptions): string {
  if (options.json) {
    return JSON.stringify(results, null, 2);
  }

  let output = '\n';

  // Summary
  const summary = results.summary;
  const hasFailures = summary.failed > 0;
  const hasError = results.metadata.status === 'error';
  const icon = hasFailures ? '❌' : summary.warnings > 0 ? '⚠️' : '✅';

  if (hasError) {
    output += `${icon} Error: Validation Failed\n`;
  } else {
    output += `${icon} Validation ${hasFailures ? 'Failed' : 'Completed'}\n`;
  }
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  output += `  Passed:   ${summary.passed}\n`;
  output += `  Failed:   ${summary.failed}\n`;
  output += `  Warnings: ${summary.warnings}\n`;
  output += `  Total:    ${summary.total}\n\n`;

  // Detailed results if verbose or if there are failures
  if (options.verbose || hasFailures || summary.warnings > 0) {
    if (results.sections) {
      for (const [category, section] of Object.entries(results.sections)) {
        const tests = section.tests || [];
        const failures = tests.filter(t => t.status === 'failed');
        const warnings = tests.filter(t => t.status === 'warning');

        if (failures.length > 0 || warnings.length > 0 || options.verbose) {
          output += `\n${category}\n`;
          output += `${'─'.repeat(category.length)}\n`;

          for (const test of tests) {
            if (test.status === 'failed' || test.status === 'warning' || options.verbose) {
              const testIcon = test.status === 'failed' ? '✗' : test.status === 'warning' ? '⚠' : '✓';
              output += `  ${testIcon} ${test.test}\n`;

              if (test.message) {
                output += `     ${test.message}\n`;
              }
            }
          }
        }
      }
    }
  }

  return output;
}

/**
 * Main CLI execution function
 */
async function main(): Promise<void> {
  let options: CliOptions = { verbose: false, json: false };

  try {
    const parsed = parseArgs();
    options = parsed.options;
    const config = parsed.config;

    if (!options.json) {
      console.log(`\n🔍 Validating JSON:API endpoint: ${config.apiUrl}\n`);
    }

    const results: ValidationReport = await runValidation(config);

    const output = formatResults(results, options);

    // For JSON output, write directly to stdout without extra formatting
    if (options.json) {
      console.log(output);
    } else {
      console.log(output);
    }

    // Exit with error code if validation failed
    process.exit(results.summary.failed > 0 ? 1 : 0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // For JSON mode, output error as JSON
    if (options.json) {
      console.log(JSON.stringify({
        error: errorMessage,
        status: 'error',
        summary: { total: 0, passed: 0, failed: 1, warnings: 0 }
      }, null, 2));
    } else {
      console.error(`\n❌ Error: ${errorMessage}\n`);
      if (options.verbose && error instanceof Error) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

main();
