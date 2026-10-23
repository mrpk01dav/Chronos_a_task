import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function addDirectoryToZip(zip, dirPath, rootDir) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      await addDirectoryToZip(zip, fullPath, rootDir);
    } else {
      const content = fs.readFileSync(fullPath);
      zip.file(`android/${relativePath}`, content);
    }
  }
}

async function packageAndroid() {
  const zip = new JSZip();
  const androidDir = path.resolve('android');

  if (!fs.existsSync(androidDir)) {
    console.error('android directory does not exist!');
    process.exit(1);
  }

  console.log('Packaging android directory into zip...');
  await addDirectoryToZip(zip, androidDir, androidDir);

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const targets = [
    path.resolve('public/Chronos-Native-Android-Project.zip'),
    path.resolve('Chronos-Native-Android-Project.zip'),
  ];

  if (fs.existsSync(path.resolve('dist'))) {
    targets.push(path.resolve('dist/Chronos-Native-Android-Project.zip'));
  }

  for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, buffer);
    console.log(`Saved updated ZIP to: ${target} (${buffer.length} bytes)`);
  }
}

packageAndroid().catch((err) => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
