/**
 * Bảng giá dùng chung cho `/services` và bước chọn dịch vụ ở `/booking`.
 *
 * `name` của mỗi mục phải khớp **từng chữ** với tên service trong DB
 * (backend/app/seed.py) để `/booking?service=<tên>` preselect được.
 * Mục nào không có trong DB thì để `link` (contact / courses).
 */

export type CatalogLinkType = "booking" | "contact" | "courses";

export type CatalogItem = {
  name: string;
  detail?: string;
  /** Giá hiển thị ở /services (ở /booking lấy giá thật từ DB) */
  price: string;
  /** Mặc định: "booking" → /booking?service=<name> */
  link?: CatalogLinkType;
};

export type CatalogCategory = {
  id: string;
  icon: string;
  name: string;
  desc: string;
  items: CatalogItem[];
};

export const CATEGORIES: CatalogCategory[] = [
  {
    id: "thoi-gian",
    icon: "time",
    name: "Xem theo thời gian",
    desc: "Trong 1–2 tiếng đó các bạn sẽ được trò chuyện chuyên sâu với chuyên gia, Reader sẽ dùng tất cả các loại bài để giải đáp hết thắc mắc của bạn, cặn kẽ, lắng nghe tâm sự và giải quyết vấn đề cho bạn.",
    items: [
      { name: "Xem Online 1 tiếng", detail: "Gọi video, trò chuyện chuyên sâu trong 1 tiếng", price: "500.000 /tiếng" },
      { name: "Xem Online 2 tiếng", detail: "Gọi video, trò chuyện chuyên sâu trong 2 tiếng", price: "900.000 /2 tiếng" },
      { name: "Xem Offline 1 tiếng", detail: "Gặp trực tiếp ở Hà Nội, Hà Nam, Ninh Bình trong 1 tiếng", price: "800.000 /tiếng" },
      { name: "Xem Offline 2 tiếng", detail: "Gặp trực tiếp ở Hà Nội, Hà Nam, Ninh Bình trong 2 tiếng", price: "1.500.000 /2 tiếng" },
    ],
  },
  {
    id: "tarot",
    icon: "tarot",
    name: "Tarot",
    desc: "Từ 1 câu hỏi duy nhất tới full mọi vấn đề — mỗi kiểu một giá.",
    items: [
      { name: "Tarot cơ bản 1 câu hỏi", detail: "Trải bài cơ bản (tương ứng với 1 câu hỏi)", price: "200.000" },
      { name: "Tarot chuyên sâu 1 chuyện", detail: "Trải bài Tarot chuyên sâu 1 chuyện (tương ứng với tình cảm, công việc, học hành, tiền tài,…)", price: "300.000" },
      { name: "Tarot full mọi vấn đề", detail: "Trải bài Tarot full mọi vấn đề không gợi ý câu hỏi (người xem đặt câu hỏi, Reader trả lời)", price: "300.000" },
      { name: "Tarot chuyên sâu + tư vấn 30'", detail: "Tarot chuyên sâu gợi ý full câu hỏi + tư vấn trong vòng 30 phút", price: "350.000" },
      { name: "Xem full Tarot", detail: "Không giới hạn thời gian, được gợi ý câu hỏi · 450.000/người", price: "450.000/người" },
    ],
  },
  {
    id: "tra",
    icon: "leaf",
    name: "Tea Leaf",
    desc: "Bài trà cho tuần, 3–12 tháng — mốc thời gian gần tới cả năm.",
    items: [
      { name: "Tea Leaf 3 tháng full", detail: "Xem bài tuần hoặc bài trà mốc thời gian gần (3 tháng full vấn đề)", price: "250.000" },
      { name: "Tea Leaf 6 tháng 3 vấn đề", detail: "Trải bài Tea Leaf 6 tháng, 3 vấn đề", price: "300.000" },
      { name: "Tea Leaf 6 tháng full", detail: "Tea Leaf 6 tháng full vấn đề", price: "400.000" },
      { name: "Bài trà full 12 tháng", detail: "Bài trà full 12 tháng/3 vấn đề", price: "450.000" },
      { name: "Tea Leaf 12 tháng full", detail: "Trải bài Tea Leaf 12 tháng full 6 vấn đề: tình cảm, tiền bạc, hôn nhân, thành công, hạnh phúc, may mắn, học hành, công việc", price: "500.000" },
    ],
  },
  {
    id: "bai-khac",
    icon: "cards",
    name: "Các loại bài khác",
    desc: "Haletu · Oracle · Lenormand · The Lover · The Heart.",
    items: [
      { name: "Haletu xin lời khuyên 30'", detail: "Trải bài xin lời khuyên Haletu, kèm tư vấn tình cảm từ kinh nghiệm/góc nhìn/ý kiến cá nhân của Reader trong vòng 30'", price: "300.000" },
      { name: "Tín hiệu vũ trụ 30'", detail: "Bài tín hiệu vũ trụ / lời khuyên tình cảm / cuộc sống trong vòng 30'", price: "300.000" },
      { name: "Lenormand vận mệnh", detail: "Dự đoán vận mệnh, tiên đoán tương lai và nhìn lại quá khứ (trải bài xâu chuỗi 3–5 lá/1 câu hỏi)", price: "250.000" },
      { name: "Grand Tableau 36 lá", detail: "Trải Grand Tableau 36 lá để kể 1 câu chuyện: quá khứ – hiện tại – tác động – tương lai xa từ 1 tháng – 1 năm, thậm chí 2–3 năm (1–2 tiếng)", price: "500.000" },
      { name: "Lenormand tổng quan", detail: "Trải tổng quan cho 1 đối tượng hoặc 1 vụ việc cụ thể trong khoảng thời gian xác định (vài tháng hoặc vài năm) · 300.000 – 400.000", price: "300.000 – 400.000" },
      { name: "Oracle kết hợp", detail: "Trải bài kết hợp Oracle (vừa được đặt câu hỏi vừa có mốc thời gian cụ thể, kết hợp giữa Tarot và Trà) · 100.000/câu hỏi", price: "100.000 /câu hỏi" },
      { name: "Bài The Lover", detail: "Chuyên dự báo tình yêu 1–3 tháng tới, tín hiệu vũ trụ hoặc đưa ra chỉ dẫn về mặt tình cảm", price: "200.000" },
      { name: "Bài The Heart 3 lá", detail: "Bài The Heart (trái tim): lời khuyên, chỉ dẫn tình cảm 3 lá trong 30'", price: "300.000" },
    ],
  },
  {
    id: "dich-vu-khac",
    icon: "crystal",
    name: "Dịch vụ khác",
    desc: "Thần số học, bản đồ sao, tử vi, lá số chiêm tinh, đá phong thủy và dạy xem Tarot.",
    items: [
      { name: "Thần số học", detail: "Tặng tâm số học, gồm bản PDF 125 trang", price: "800.000" },
      { name: "Bản đồ sao vận hạn", price: "800.000" },
      { name: "Bản đồ sao cá nhân", price: "1.000.000" },
      { name: "Bản đồ sao đôi", price: "1.500.000" },
      { name: "Lá số chiêm tinh", price: "800.000" },
      { name: "Tử vi cá nhân", price: "800.000" },
      { name: "Tử vi xem đôi", price: "1.500.000" },
      { name: "Đá phong thủy", detail: "Đá phong thủy, trang sức stone…", price: "LIÊN HỆ", link: "contact" },
      { name: "Dạy xem Tarot", detail: "Khóa cơ bản 5tr · Khóa nâng cao 10tr (phát triển bản thân, nữ tính, thiền, thay đổi và tái sinh)", price: "Xem khóa học", link: "courses" },
    ],
  },
  {
    id: "combo",
    icon: "combo",
    name: "Combo",
    desc: "Kết hợp nhiều loại bài — đi sâu một lần cho tất cả mọi khúc mắc.",
    items: [
      { name: "Combo Tarot + Tea Leaf 6 tháng", detail: "Trải bài VIP combo Tarot + Tea Leaf trong vòng 6 tháng (không giới hạn thời gian)", price: "700.000" },
      { name: "Combo VIP Full Tarot + Trà 12 tháng", detail: "Combo VIP Full Tarot + Trà trong vòng 12 tháng (tặng bài Haletu hoặc Oracle)", price: "1.000.000" },
      { name: "Combo Tarot + Lenormand", detail: "Combo được yêu thích nhất: Tarot + Lenormand (sự kết hợp hoàn hảo tuyệt đối cho tất cả mọi khúc mắc)", price: "800.000" },
      { name: "Combo 1 chuyện all bài", detail: "Combo sử dụng tất cả mọi loại bài (Haletu, Oracle, Tarot, Tea Leaf, Lenormand,…) để xem về duy nhất 1 chuyện như tình yêu, công việc, tiền bạc, gia đình,…", price: "650.000" },
      { name: "Combo Pro trị liệu", detail: "Combo Pro: Full Tarot + Full Trà + Haletu + Oracle + Lenormand + tư vấn tình cảm + trị liệu tâm lý (trong vòng 3 tiếng, nếu thêm +450k/tiếng)", price: "1.500.000" },
      { name: "Combo HOT toàn diện", detail: "COMBO HOT NHẤT: Full toàn bộ tất cả mọi loại bài kèm theo dõi chữa lành vết thương tâm hồn, không giới hạn thời gian xem, gợi ý câu hỏi, kèm bảo hành xem lại và tư vấn tình cảm miễn phí trong vòng 1 tháng bất cứ khi nào cần", price: "3.000.000" },
      { name: "Dịch vụ tâm linh đặc biệt", detail: "Xem về người thứ 3, chết chóc, phá thai, sảy, những điều trái nhân văn, pháp luật, spell phù thuỷ… cần nhiều năng lượng, đối chọi và trả giá để đạt được mong muốn — giá cả ib tuỳ vấn đề tâm linh khó cỡ nào", price: "IB", link: "contact" },
    ],
  },
];

/**
 * "Chọn theo nỗi lòng" ở /services — 4 lối vào không cần gõ gì.
 *
 * Dữ liệu cố ý để đúng hình dạng mà phần AI sau này sẽ trả về:
 * `{ reason, picks: [tên service] }` → cùng một UI render gợi ý, chỉ đổi
 * nguồn dữ liệu (xem ghi chú trong components/MoodPicker.tsx).
 */
export type Mood = {
  id: string;
  icon: string;
  question: string;
  hint: string;
  /** Tên trải bài gợi ý — khớp tên trong CATEGORIES/DB */
  picks: string[];
};

/**
 * Mỗi trải bài chỉ nằm ở **một** thẻ (không lặp giữa các thẻ) — khách mở lần
 * lượt mà thấy lại đúng danh sách cũ sẽ tưởng bị lặp, mất tin.
 */
export const MOODS: Mood[] = [
  {
    id: "tinh-cam",
    icon: "heart-crack",
    question: "Người ấy có còn thương mình?",
    hint: "Crush mập mờ · người yêu xa cách · người cũ chưa quên",
    picks: ["Bài The Lover", "Bài The Heart 3 lá", "Haletu xin lời khuyên 30'"],
  },
  {
    id: "cong-viec",
    icon: "briefcase",
    question: "Công việc · tiền bạc đang bế tắc?",
    hint: "Nhảy việc hay ở lại · thi cử · kinh doanh · tiền tài",
    picks: ["Tarot chuyên sâu 1 chuyện", "Combo 1 chuyện all bài", "Xem Online 1 tiếng"],
  },
  {
    id: "tuong-lai",
    icon: "moon",
    question: "Sắp tới có gì thay đổi?",
    hint: "Vài tuần tới cả năm — mốc thời gian rõ ràng",
    picks: ["Tea Leaf 3 tháng full", "Lenormand vận mệnh", "Tín hiệu vũ trụ 30'"],
  },
  {
    id: "chinh-minh",
    icon: "sparkles",
    question: "Muốn hiểu chính mình hơn",
    hint: "Không biết mình muốn gì · mệt mà chẳng rõ vì sao",
    picks: ["Tarot cơ bản 1 câu hỏi", "Thần số học", "Bản đồ sao cá nhân"],
  },
];

/** Lấy mục trong bảng giá theo tên (để hiện giá/chi tiết ở thẻ gợi ý). */
export function findItem(name: string): CatalogItem | undefined {
  for (const c of CATEGORIES) {
    const hit = c.items.find((i) => i.name === name);
    if (hit) return hit;
  }
  return undefined;
}

export function itemHref(item: CatalogItem): string {
  if (item.link === "contact") return "/contact";
  if (item.link === "courses") return "/recruit";
  return `/booking?service=${encodeURIComponent(item.name)}`;
}

export function itemCta(item: CatalogItem): string {
  if (item.link === "contact") return "Liên hệ để được tư vấn";
  if (item.link === "courses") return "Xem các khóa học";
  return "Đặt lịch dịch vụ này";
}

/** Bỏ dấu để tìm "tinh duyen" ra "tình duyên". */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}
