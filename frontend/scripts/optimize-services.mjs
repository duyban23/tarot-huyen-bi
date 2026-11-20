/**
 * Chuyển ảnh bảng giá dịch vụ (JPG gốc) sang WebP 2 kích thước cho `/booking`.
 *
 * Ảnh gốc nằm ở `frontend/assets-src/services/` (không deploy), kết quả ghi vào
 * `frontend/public/images/services/`. Chạy từ thư mục `frontend`:
 *
 *     node scripts/optimize-services.mjs
 *
 * Mỗi ảnh ra 2 file: `-1600.webp` (desktop, cũng dùng cho lightbox) và
 * `-900.webp` (mobile / màn hình hẹp). Giữ nguyên tỉ lệ gốc — carousel tự căn
 * khung, không cắt chữ.
 */
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, "..", "assets-src", "services");
const OUT = path.resolve(here, "..", "public", "images", "services");

/** Tên file gốc -> tên web (slug dùng trong serviceImages.ts). */
const SLUGS = {
  "dichvu6.jpg": "hai-hinh-thuc-xem",
  "dichvu5.jpg": "cac-loai-bai-khac",
  "dichvu4.jpg": "combo",
  "dichvu2.jpg": "tea-leaf",
  "dichvu3.jpg": "dich-vu-khac",
  "dichvu1.jpg": "thanh-toan",
};

const SIZES = [
  { suffix: "-1600", width: 1600, quality: 84 },
  { suffix: "-900", width: 900, quality: 80 },
];

const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f));
await mkdir(OUT, { recursive: true });

for (const file of files) {
  const slug = SLUGS[file] ?? path.parse(file).name.toLowerCase();
  const src = path.join(SRC, file);
  const meta = await sharp(src).metadata();
  console.log(
    `${file}  ${meta.width}x${meta.height}  ratio=${(meta.width / meta.height).toFixed(2)}`,
  );

  for (const size of SIZES) {
    const dest = path.join(OUT, `${slug}${size.suffix}.webp`);
    const info = await sharp(src)
      .resize({ width: Math.min(size.width, meta.width), withoutEnlargement: true })
      .webp({ quality: size.quality, effort: 6 })
      .toFile(dest);
    console.log(
      `  -> ${path.basename(dest)}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`,
    );
  }
}
