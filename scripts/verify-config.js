#!/usr/bin/env node
/**
 * verify-config.js — CLI entry point for config.yaml verification
 *
 * Usage:
 *   node scripts/verify-config.js <config.yaml> [--json] [--quiet]
 *
 * Options:
 *   --json    Output results as JSON (for CI parsing)
 *   --quiet   Only show errors, suppress warnings
 *
 * Exit code: 0 = valid, 1 = has errors
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── ANSI colors (zero-dependency) ───────────────────────────────────────────

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

// ─── Inline the verifier (to avoid import resolution issues) ─────────────────
// We import from the shared module using a relative path.

import { verifyConfig } from '../src/utils/verify-config.js';

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const flags = {
    json: args.includes('--json'),
    quiet: args.includes('--quiet'),
  };
  const files = args.filter(a => !a.startsWith('--'));

  if (files.length === 0) {
    console.error(`${RED}Error: No file specified${RESET}`);
    console.error(`Usage: node scripts/verify-config.js <config.yaml> [--json] [--quiet]`);
    process.exit(2);
  }

  const filePath = resolve(files[0]);
  let yamlText;
  try {
    yamlText = readFileSync(filePath, 'utf-8');
  } catch (e) {
    console.error(`${RED}Error: Cannot read file "${filePath}": ${e.message}${RESET}`);
    process.exit(2);
  }

  const result = verifyConfig(yamlText);

  if (flags.json) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.valid ? 0 : 1);
  }

  // ─── Human-readable output ─────────────────────────────────────────────

  const { valid, errors, warnings, stats } = result;

  console.log(`\n${BOLD}EtherCAT Config Verification${RESET}`);
  console.log(`${DIM}File: ${filePath}${RESET}`);
  console.log(`${DIM}Modules: ${stats.moduleCount} | Tasks: ${stats.taskCount}${RESET}`);
  console.log('─'.repeat(50));

  if (errors.length > 0) {
    console.log(`\n${RED}${BOLD}Errors (${errors.length})${RESET}`);
    for (const err of errors) {
      const loc = formatLocation(err);
      console.log(`  ${RED}✗${RESET} ${loc}${err.message}`);
    }
  }

  if (warnings.length > 0 && !flags.quiet) {
    console.log(`\n${YELLOW}${BOLD}Warnings (${warnings.length})${RESET}`);
    for (const warn of warnings) {
      const loc = formatLocation(warn);
      console.log(`  ${YELLOW}⚠${RESET} ${loc}${warn.message}`);
    }
  }

  console.log('─'.repeat(50));
  if (valid) {
    console.log(`${GREEN}${BOLD}✓ Configuration is valid${RESET}`);
    if (warnings.length > 0 && !flags.quiet) {
      console.log(`${YELLOW}  (${warnings.length} warning(s))${RESET}`);
    }
  } else {
    console.log(`${RED}${BOLD}✗ Configuration has ${errors.length} error(s)${RESET}`);
  }
  console.log();

  process.exit(valid ? 0 : 1);
}

function formatLocation(issue) {
  const parts = [];
  if (issue.module) parts.push(`sn${issue.module}`);
  if (issue.task) parts.push(issue.task);
  const loc = parts.length > 0 ? `[${parts.join('/')}] ` : '';
  const line = issue.line ? `${DIM}L${issue.line}:${RESET} ` : '';
  return `${loc}${line}`;
}

main();
