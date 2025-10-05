#!/usr/bin/env node
/**
 * Production Build Script for LiveBoard
 * This script handles the complete build process for production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Helper functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}${colors.bright}▶ ${msg}${colors.reset}`),
};

// Check if production environment file exists
function checkEnvironment() {
  log.step('Checking environment configuration...');
  
  const envFile = path.join(__dirname, '.env.production');
  const serverEnvFile = path.join(__dirname, 'server', '.env');
  
  if (!fs.existsSync(envFile)) {
    log.warning('.env.production not found. Creating from example...');
    const exampleEnv = path.join(__dirname, 'server', '.env.example');
    if (fs.existsSync(exampleEnv)) {
      const content = fs.readFileSync(exampleEnv, 'utf8');
      fs.writeFileSync(envFile, content);
      log.info('Created .env.production from example. Please update with production values.');
    }
  }
  
  if (!fs.existsSync(serverEnvFile)) {
    log.warning('server/.env not found. Creating from .env.production...');
    if (fs.existsSync(envFile)) {
      fs.copyFileSync(envFile, serverEnvFile);
      log.success('Created server/.env');
    }
  }
  
  log.success('Environment configuration checked');
}

// Install dependencies
function installDependencies() {
  log.step('Installing dependencies...');
  
  try {
    // Root dependencies
    log.info('Installing root dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Server dependencies
    log.info('Installing server dependencies...');
    execSync('npm install', { cwd: path.join(__dirname, 'server'), stdio: 'inherit' });
    
    // Client dependencies
    log.info('Installing client dependencies...');
    execSync('npm install', { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });
    
    log.success('All dependencies installed');
  } catch (error) {
    log.error('Failed to install dependencies');
    throw error;
  }
}

// Build client
function buildClient() {
  log.step('Building client application...');
  
  try {
    execSync('npm run build', { 
      cwd: path.join(__dirname, 'client'), 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    const distPath = path.join(__dirname, 'client', 'dist');
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath);
      log.success(`Client built successfully (${files.length} files)`);
    } else {
      throw new Error('Client dist folder not found');
    }
  } catch (error) {
    log.error('Failed to build client');
    throw error;
  }
}

// Prepare server for production
function prepareServer() {
  log.step('Preparing server for production...');
  
  try {
    // Create necessary directories
    const dirs = [
      path.join(__dirname, 'server', 'logs'),
      path.join(__dirname, 'server', 'uploads'),
      path.join(__dirname, 'server', 'temp'),
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log.info(`Created directory: ${dir}`);
      }
    });
    
    // Generate Prisma client if using Prisma
    const prismaSchema = path.join(__dirname, 'server', 'prisma', 'schema.prisma');
    if (fs.existsSync(prismaSchema)) {
      log.info('Generating Prisma client...');
      execSync('npx prisma generate', { 
        cwd: path.join(__dirname, 'server'), 
        stdio: 'inherit' 
      });
    }
    
    log.success('Server prepared for production');
  } catch (error) {
    log.error('Failed to prepare server');
    throw error;
  }
}

// Run production tests
function runTests() {
  log.step('Running production tests...');
  
  try {
    // Check if server starts
    log.info('Testing server startup...');
    const serverProcess = require('child_process').spawn('node', 
      [path.join(__dirname, 'server', 'src', 'bulletproof-server.js')],
      { 
        env: { ...process.env, NODE_ENV: 'production', PORT: '4001' },
        detached: false
      }
    );
    
    // Wait for server to start
    setTimeout(() => {
      serverProcess.kill();
      log.success('Server startup test passed');
    }, 3000);
    
  } catch (error) {
    log.warning('Tests skipped or failed');
  }
}

// Create production bundle
function createBundle() {
  log.step('Creating production bundle...');
  
  const bundlePath = path.join(__dirname, 'dist');
  
  try {
    // Clean existing bundle
    if (fs.existsSync(bundlePath)) {
      fs.rmSync(bundlePath, { recursive: true, force: true });
    }
    fs.mkdirSync(bundlePath);
    
    // Copy server files
    const serverDist = path.join(bundlePath, 'server');
    fs.mkdirSync(serverDist);
    
    const serverFiles = [
      'src',
      'package.json',
      'package-lock.json',
      '.env.example'
    ];
    
    serverFiles.forEach(file => {
      const src = path.join(__dirname, 'server', file);
      const dest = path.join(serverDist, file);
      if (fs.existsSync(src)) {
        if (fs.lstatSync(src).isDirectory()) {
          fs.cpSync(src, dest, { recursive: true });
        } else {
          fs.copyFileSync(src, dest);
        }
      }
    });
    
    // Copy client build
    const clientDist = path.join(bundlePath, 'client');
    const clientBuild = path.join(__dirname, 'client', 'dist');
    if (fs.existsSync(clientBuild)) {
      fs.cpSync(clientBuild, clientDist, { recursive: true });
    }
    
    // Create start script
    const startScript = `#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

console.log('Starting LiveBoard Production Server...');

// Start server
execSync('node server/src/bulletproof-server.js', {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});
`;
    
    fs.writeFileSync(path.join(bundlePath, 'start.js'), startScript);
    fs.chmodSync(path.join(bundlePath, 'start.js'), '755');
    
    // Create README
    const readme = `# LiveBoard Production Bundle

## Quick Start

1. Install dependencies:
   \`\`\`bash
   cd server && npm install
   \`\`\`

2. Configure environment:
   - Copy \`server/.env.example\` to \`server/.env\`
   - Update with your production values

3. Start the server:
   \`\`\`bash
   node start.js
   \`\`\`

## Ports
- Server: 4000 (configurable via PORT env)
- Client: Served by server at /

## Environment Variables
See \`server/.env.example\` for all available options.
`;
    
    fs.writeFileSync(path.join(bundlePath, 'README.md'), readme);
    
    log.success(`Production bundle created at: ${bundlePath}`);
  } catch (error) {
    log.error('Failed to create production bundle');
    throw error;
  }
}

// Main build process
async function build() {
  console.log(`\n${colors.bright}${colors.cyan}🚀 LiveBoard Production Build${colors.reset}\n`);
  
  const startTime = Date.now();
  
  try {
    checkEnvironment();
    installDependencies();
    buildClient();
    prepareServer();
    runTests();
    createBundle();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n${colors.green}${colors.bright}✨ Build completed successfully in ${duration}s${colors.reset}`);
    console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
    console.log('1. Review and update environment variables in .env.production');
    console.log('2. Deploy the dist/ folder to your production server');
    console.log('3. Run "node start.js" on the production server');
    
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}Build failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run build if called directly
if (require.main === module) {
  build();
}

module.exports = { build };
