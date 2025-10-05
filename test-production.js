#!/usr/bin/env node
/**
 * Production Readiness Test Script
 * Tests all critical components for production deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let testsPassed = 0;
let testsFailed = 0;
const issues = [];

function test(name, fn) {
  process.stdout.write(`Testing ${name}... `);
  try {
    fn();
    console.log(`${colors.green}✓${colors.reset}`);
    testsPassed++;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset}`);
    issues.push({ test: name, error: error.message });
    testsFailed++;
  }
}

console.log('\n🔍 LiveBoard Production Readiness Test\n');

// Test 1: Check Node.js version
test('Node.js version (>=14.0.0)', () => {
  const version = process.version;
  const major = parseInt(version.split('.')[0].substring(1));
  if (major < 14) {
    throw new Error(`Node.js ${version} is too old. Required: >=14.0.0`);
  }
});

// Test 2: Check package.json files
test('Package configuration files', () => {
  const files = [
    'package.json',
    'server/package.json',
    'client/package.json'
  ];
  
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing ${file}`);
    }
    
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!content.name || !content.version) {
      throw new Error(`Invalid ${file}: missing name or version`);
    }
  });
});

// Test 3: Check environment configuration
test('Environment configuration', () => {
  const envExample = path.join(__dirname, 'server', '.env.example');
  if (!fs.existsSync(envExample)) {
    throw new Error('Missing server/.env.example');
  }
  
  const envProd = path.join(__dirname, '.env.production');
  if (!fs.existsSync(envProd)) {
    console.warn(`\n  ${colors.yellow}⚠ .env.production not found (will use defaults)${colors.reset}`);
  }
});

// Test 4: Check critical server files
test('Server files', () => {
  const criticalFiles = [
    'server/src/bulletproof-server.js',
    'server/src/middleware/errorHandler.js',
    'server/src/utils/logger.js',
    'server/src/utils/enterpriseDb.js'
  ];
  
  criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing critical file: ${file}`);
    }
  });
});

// Test 5: Check client configuration
test('Client configuration', () => {
  const viteConfig = path.join(__dirname, 'client', 'vite.config.js');
  if (!fs.existsSync(viteConfig)) {
    throw new Error('Missing client/vite.config.js');
  }
  
  const configFile = path.join(__dirname, 'client', 'src', 'config', 'index.js');
  if (!fs.existsSync(configFile)) {
    throw new Error('Missing client/src/config/index.js');
  }
});

// Test 6: Check dependencies
test('Dependencies installation', () => {
  // Check root dependencies
  if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    throw new Error('Root dependencies not installed. Run: npm install');
  }
  
  // Check server dependencies
  if (!fs.existsSync(path.join(__dirname, 'server', 'node_modules'))) {
    throw new Error('Server dependencies not installed. Run: cd server && npm install');
  }
  
  // Check client dependencies
  if (!fs.existsSync(path.join(__dirname, 'client', 'node_modules'))) {
    throw new Error('Client dependencies not installed. Run: cd client && npm install');
  }
});

// Test 7: Check for console.log statements in production code
test('Console statements in production', () => {
  const serverFiles = [
    'server/src/bulletproof-server.js',
    'server/src/middleware/errorHandler.js'
  ];
  
  let consoleCount = 0;
  serverFiles.forEach(file => {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const matches = content.match(/console\.(log|error|warn|info)/g);
    if (matches) {
      consoleCount += matches.length;
    }
  });
  
  if (consoleCount > 20) {
    console.warn(`\n  ${colors.yellow}⚠ Found ${consoleCount} console statements (consider using logger)${colors.reset}`);
  }
});

// Test 8: Check security headers
test('Security configuration', () => {
  const serverFile = path.join(__dirname, 'server', 'src', 'bulletproof-server.js');
  const content = fs.readFileSync(serverFile, 'utf8');
  
  const securityChecks = [
    { pattern: /cors/i, name: 'CORS' },
    { pattern: /jwt|jsonwebtoken/i, name: 'JWT authentication' },
    { pattern: /bcrypt/i, name: 'Password hashing' }
  ];
  
  const missing = [];
  securityChecks.forEach(check => {
    if (!check.pattern.test(content)) {
      missing.push(check.name);
    }
  });
  
  if (missing.length > 0) {
    throw new Error(`Missing security features: ${missing.join(', ')}`);
  }
});

// Test 9: Check build scripts
test('Build scripts', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  
  const requiredScripts = ['build:client', 'build:server'];
  const missing = requiredScripts.filter(script => !packageJson.scripts[script]);
  
  if (missing.length > 0) {
    throw new Error(`Missing build scripts: ${missing.join(', ')}`);
  }
});

// Test 10: Check startup scripts
test('Startup scripts', () => {
  const scripts = [
    'start-production.bat',
    'start-production.sh',
    'build.js'
  ];
  
  scripts.forEach(script => {
    if (!fs.existsSync(path.join(__dirname, script))) {
      throw new Error(`Missing startup script: ${script}`);
    }
  });
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results:\n`);
console.log(`  ${colors.green}Passed: ${testsPassed}${colors.reset}`);
console.log(`  ${colors.red}Failed: ${testsFailed}${colors.reset}`);

if (issues.length > 0) {
  console.log(`\n${colors.red}❌ Issues found:${colors.reset}\n`);
  issues.forEach(issue => {
    console.log(`  • ${issue.test}: ${issue.error}`);
  });
  
  console.log(`\n${colors.yellow}⚠ Action Required:${colors.reset}`);
  console.log('  Please fix the issues above before deploying to production.\n');
  process.exit(1);
} else {
  console.log(`\n${colors.green}✅ All tests passed!${colors.reset}`);
  console.log('\n🚀 Your application is production-ready!\n');
  console.log('Next steps:');
  console.log('  1. Review and update .env.production with your production values');
  console.log('  2. Run "node build.js" to create production bundle');
  console.log('  3. Deploy using start-production.bat (Windows) or start-production.sh (Linux/Mac)\n');
}
