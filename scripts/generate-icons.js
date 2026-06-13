const sharp = require("sharp");
const { mkdir, writeFile, access } = require("fs/promises");
const { join } = require("path");

const SOURCE = join(process.cwd(), "public", "icons", "logo-source.png");

const sizes = [
  { name: "favicon.png", size: 32 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

async function generateFromSource(name, size) {
  return sharp(SOURCE)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .toBuffer()
    .then((buffer) => writeFile(join(process.cwd(), "public", "icons", name), buffer));
}

async function main() {
  try {
    await access(SOURCE);
  } catch {
    console.error("Missing public/icons/logo-source.png");
    process.exit(1);
  }

  const dir = join(process.cwd(), "public", "icons");
  await mkdir(dir, { recursive: true });

  for (const { name, size } of sizes) {
    await generateFromSource(name, size);
    console.log(`Generated ${name} (${size}x${size})`);
  }
}

main().catch(console.error);
