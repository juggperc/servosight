import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "public", "icons");

const svgBuffer = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0a0a0a"/>
  <text x="256" y="200" font-family="Arial, sans-serif" font-size="100" font-weight="800" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">SERVO</text>
  <text x="256" y="310" font-family="Arial, sans-serif" font-size="100" font-weight="800" fill="#22c55e" text-anchor="middle" dominant-baseline="middle">SIGHT</text>
</svg>`);

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const { name, size } of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(iconsDir, name));
  console.log(`Generated ${name} (${size}x${size})`);
}
