/**
 * generate-icons.js
 * Generates extension icons (16x16, 48x48, 128x128) from icons/icon-master.png.
 */

const { execSync } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'resize-icons.ps1');

try {
  const output = execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, {
    encoding: 'utf8',
  });
  console.log(output);
} catch (err) {
  console.error('Error generating icons:', err.message);
  process.exit(1);
}
