const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');

console.log('=======================================================');
console.log('🚀 Launching Skill Exchange Platform (Full-Stack)');
console.log('=======================================================');

const isWin = process.platform === 'win32';
const pnpmCmd = isWin ? 'pnpm.cmd' : 'pnpm';

// Start Server
const serverProc = spawn(pnpmCmd, ['dev'], {
  cwd: serverDir,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5000' }
});

// Start Client
const clientProc = spawn(pnpmCmd, ['dev'], {
  cwd: clientDir,
  stdio: 'inherit',
  shell: true,
});

process.on('SIGINT', () => {
  serverProc.kill();
  clientProc.kill();
  process.exit();
});