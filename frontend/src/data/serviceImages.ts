/**
 * Ảnh bảng giá / dịch vụ cho carousel ở `/booking`.
 *
 * Ảnh gốc để ở `frontend/assets-src/services/`. Muốn thêm ảnh mới: bỏ file JPG
 * vào đó, khai báo slug trong `frontend/scripts/optimize-services.mjs`, chạy
 * `node scripts/optimize-services.mjs` (trong thư mục frontend), rồi thêm một
 * dòng vào `SERVICE_SLIDES` bên dưới.
 *
 * Ảnh hiện tại là các bảng giá theo nhóm dịch vụ (không phải ảnh riêng từng
 * trải bài), nên `name` là tên nhóm — dùng cho nhãn dưới ảnh, không dùng để
 * khớp với dịch vụ trong DB.
 */
import { fold } from "./serviceCatalog";

export type ServiceSlide = {
  /** Nhãn hiển thị dưới ảnh */
  name: string;
  /** Ảnh lớn (desktop + lightbox), đường dẫn trong /public */
  src: string;
  /** Ảnh nhẹ hơn cho mobile — tuỳ chọn, có thì carousel tự dùng srcSet */
  srcSmall?: string;
  /** Một dòng mô tả ngắn dưới ảnh (tuỳ chọn) */
  caption?: string;
};

export const SERVICE_SLIDES: ServiceSlide[] = [
  {
    name: "2 hình thức xem",
    src: "/images/services/hai-hinh-thuc-xem-1600.webp",
    srcSmall: "/images/services/hai-hinh-thuc-xem-900.webp",
    caption: "Xem theo thời gian, hoặc xem theo từng loại bài — tuỳ điều bạn đang cần.",
  },
  {
    name: "Các loại bài khác",
    src: "/images/services/cac-loai-bai-khac-1600.webp",
    srcSmall: "/images/services/cac-loai-bai-khac-900.webp",
    caption: "Ngoài Tarot, My còn dùng Lenormand và các bộ bài khác khi buổi trải cần thêm lớp nghĩa.",
  },
  {
    name: "Combo",
    src: "/images/services/combo-1600.webp",
    srcSmall: "/images/services/combo-900.webp",
    caption: "Gói kết hợp nhiều bộ bài — nhìn một chuyện từ nhiều góc, sâu hơn một lần trải.",
  },
  {
    name: "Tea Leaf",
    src: "/images/services/tea-leaf-1600.webp",
    srcSmall: "/images/services/tea-leaf-900.webp",
    caption: "Trà diệp — đọc vận hạn theo từng quãng thời gian, nhẹ nhàng và chậm rãi.",
  },
  {
    name: "Dịch vụ khác",
    src: "/images/services/dich-vu-khac-1600.webp",
    srcSmall: "/images/services/dich-vu-khac-900.webp",
    caption: "Thần số học, bản đồ sao, tử vi, lá số chiêm tinh và các khoá học.",
  },
  {
    name: "Thông tin thanh toán",
    src: "/images/services/thanh-toan-1600.webp",
    srcSmall: "/images/services/thanh-toan-900.webp",
    caption: "Cách chuyển khoản và những lưu ý trước khi mình bắt đầu buổi trải.",
  },
];

/** Danh sách carousel thực tế. */
export const GALLERY_SLIDES: ServiceSlide[] = SERVICE_SLIDES;

/** Tìm ảnh theo tên dịch vụ (bỏ dấu, khớp lỏng nếu tên DB khác một chút). */
export function findSlide(name: string): ServiceSlide | undefined {
  const wanted = fold(name.trim());
  if (!wanted) return undefined;
  return (
    SERVICE_SLIDES.find((s) => fold(s.name.trim()) === wanted) ??
    SERVICE_SLIDES.find((s) => {
      const n = fold(s.name.trim());
      return n.startsWith(wanted) || wanted.startsWith(n);
    }) ??
    SERVICE_SLIDES.find((s) => {
      const n = fold(s.name.trim());
      return n.includes(wanted) || wanted.includes(n);
    })
  );
}
