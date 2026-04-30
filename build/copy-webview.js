const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'webview-ui', 'dist');
const dst = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(src)) {
  console.error(`❌ Webview dist not found at ${src}`);
  process.exit(1);
}

if (!fs.existsSync(dst)) {
  fs.mkdirSync(dst, { recursive: true });
}

function copyRecursive(srcDir, dstDir) {
  fs.readdirSync(srcDir).forEach((file) => {
    const srcFile = path.join(srcDir, file);
    const dstFile = path.join(dstDir, file);
    const stat = fs.statSync(srcFile);

    if (stat.isDirectory()) {
      if (!fs.existsSync(dstFile)) {
        fs.mkdirSync(dstFile, { recursive: true });
      }
      copyRecursive(srcFile, dstFile);
    } else {
      fs.copyFileSync(srcFile, dstFile);
    }
  });
}

copyRecursive(src, dst);
console.log('✓ Copied webview assets to dist/');
