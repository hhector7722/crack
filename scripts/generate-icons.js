const sharp = require("sharp");
const { mkdir, writeFile } = require("fs/promises");
const { join } = require("path");

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

async function generateIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#09090b"/>
      <text
        x="50%"
        y="54%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="system-ui, sans-serif"
        font-weight="700"
        font-size="${size * 0.45}"
        fill="#fafafa"
      >C</text>
    </svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function main() {
  const dir = join(process.cwd(), "public", "icons");
  await mkdir(dir, { recursive: true });

  for (const { name, size } of sizes) {
    const buffer = await generateIcon(size);
    await writeFile(join(dir, name), buffer);
    console.log(`Generated ${name}`);
  }
}

main().catch(console.error);
