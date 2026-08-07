import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = join(root, 'public', 'icons', 'icon.svg')
const out = join(root, 'public', 'icons')

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size, maskable } of sizes) {
  let input = svg
  if (maskable) {
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#16a34a"/></svg>`)
    const base = await sharp(svg).resize(Math.round(size * 0.72)).toBuffer()
    input = await sharp(mask).composite([{ input: base, gravity: 'center' }]).png().toBuffer()
  }
  await sharp(input).resize(size, size).png().toFile(join(out, name))
  console.log('generated', name)
}
