import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const results = path.resolve('results');
fs.mkdirSync(results, { recursive: true });
const reportPath = path.join(results, 'launch.json');
const host = { platform: process.platform, arch: process.arch, release: os.release(), cpus: os.cpus().length };
fs.writeFileSync(path.join(results, 'host.json'), JSON.stringify(host, null, 2) + '\n');
assert.equal(process.platform, process.env.PROBE_EXPECT_PLATFORM);
assert.equal(process.arch, process.env.PROBE_EXPECT_ARCH);
const packagedRoot = path.resolve(`out/Electron Platform Probe-${process.platform}-x64`);
const executable = process.platform === 'darwin'
  ? path.join(packagedRoot, 'Electron Platform Probe.app/Contents/MacOS/electron-platform-probe')
  : path.join(packagedRoot, 'electron-platform-probe.exe');
assert.ok(fs.existsSync(executable), `Missing executable: ${executable}`);
const child = spawn(executable, [`--probe-report=${reportPath}`], { stdio: ['ignore', 'pipe', 'pipe'] });
const output = [];
child.stdout.on('data', (data) => output.push(data));
child.stderr.on('data', (data) => output.push(data));
let timedOut = false;
const timeout = setTimeout(() => {
  timedOut = true;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F']);
  else child.kill('SIGKILL');
}, 90_000);
let exitCode;
try {
  exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', resolve);
  });
} finally {
  clearTimeout(timeout);
  fs.writeFileSync(path.join(results, 'launch.log'), Buffer.concat(output));
}
assert.equal(timedOut, false, 'Packaged app exceeded 90 seconds');
assert.equal(exitCode, 0, Buffer.concat(output).toString());
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
assert.equal(report.platform, process.platform);
assert.equal(report.arch, 'x64');
assert.equal(report.electron, '42.11.18');
assert.equal(report.sqliteValue, 42);
assert.equal(report.renderer, 'ready');
assert.equal(report.packaged, true);
const artifacts = [];
function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (entry.isFile()) artifacts.push({
      path: path.relative(process.cwd(), file),
      bytes: fs.statSync(file).size,
      sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
    });
  }
}
visit(path.resolve('out/make'));
assert.ok(artifacts.length > 0);
fs.writeFileSync(path.join(results, 'artifacts.json'), JSON.stringify(artifacts, null, 2) + '\n');
console.log(JSON.stringify({ host, report, artifacts }, null, 2));
