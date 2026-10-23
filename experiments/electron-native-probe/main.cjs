const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const reportArg = process.argv.find((arg) => arg.startsWith('--probe-report='));
if (!reportArg) process.exit(2);
const reportPath = reportArg.slice('--probe-report='.length);
app.setPath('userData', path.join(path.dirname(reportPath), 'profile'));

app.whenReady().then(async () => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('CREATE TABLE probe(value INTEGER); INSERT INTO probe VALUES (42)');
  const row = db.prepare('SELECT value, sqlite_version() AS sqliteVersion FROM probe').get();
  db.close();
  const window = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  await window.loadURL('data:text/html,<title>Native platform probe</title><h1 id="ready">ready</h1>');
  const rendered = await window.webContents.executeJavaScript('document.getElementById("ready").textContent');
  const report = {
    platform: process.platform,
    arch: process.arch,
    electron: process.versions.electron,
    node: process.versions.node,
    modules: process.versions.modules,
    sqliteVersion: row.sqliteVersion,
    sqliteValue: row.value,
    renderer: rendered,
    packaged: app.isPackaged,
    executable: process.execPath,
  };
  if (row.value !== 42 || rendered !== 'ready' || !app.isPackaged) throw new Error('PROBE_ASSERTION_FAILED');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  window.destroy();
  app.quit();
}).catch((error) => {
  console.error(error);
  app.exit(1);
});
