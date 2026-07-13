const sharp = require("sharp");
const { mkdir, writeFile, access } = require("fs/promises");
const { join } = require("path");

const SOURCE = join(process.cwd(), "public", "icons", "drop-source.png");

const sizes = [
  { name: "drop-icon-192.png", size: 192 },
  { name: "drop-icon-512.png", size: 512 },
  { name: "drop-apple-touch-icon.png", size: 180 },
  { name: "drop-favicon.png", size: 32 },
];

async function generate(name, size) {
  const buffer = await sharp(SOURCE)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(join(process.cwd(), "public", "icons", name), buffer);
}

async function main() {
  try {
    await access(SOURCE);
  } catch {
    console.error("Missing public/icons/drop-source.png");
    process.exit(1);
  }

  await mkdir(join(process.cwd(), "public", "icons"), { recursive: true });

  for (const { name, size } of sizes) {
    await generate(name, size);
    console.log(`Generated ${name} (${size}x${size})`);
  }
}

main().catch(console.error);
