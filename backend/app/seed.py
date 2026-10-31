from sqlalchemy.orm import Session

from app.models import Service


def seed_services(db: Session) -> None:
    existing = {s.name for s in db.query(Service).all()}

    # Menu chỉ gồm đúng bảng giá mới của tiệm (không seed thêm món nào khác).
    services: list[Service] = []

    # Gói marketing hiển thị ở trang Services (frontend hardcode).
    # Tên phải khớp từng chữ với ServicesPage.tsx để preselect ở trang đặt lịch.
    # Thời lượng là ước lượng — chỉnh lại trong trang Admin nếu cần.
    marketing = [
        # ── Xem theo thời gian ──
        Service(
            name="Xem Online 1 tiếng",
            description="Gọi video, trò chuyện chuyên sâu trong 1 tiếng. Reader dùng tất cả các loại bài để giải đáp hết thắc mắc, lắng nghe tâm sự và giải quyết vấn đề cho bạn.",
            duration_minutes=60,
            price=500000,
        ),
        Service(
            name="Xem Online 2 tiếng",
            description="Gọi video, trò chuyện chuyên sâu trong 2 tiếng. Reader dùng tất cả các loại bài để giải đáp hết thắc mắc, lắng nghe tâm sự và giải quyết vấn đề cho bạn.",
            duration_minutes=120,
            price=900000,
        ),
        Service(
            name="Xem Offline 1 tiếng",
            description="Gặp trực tiếp ở Hà Nội, Hà Nam, Ninh Bình, trong 1 tiếng, trò chuyện chuyên sâu cùng Reader.",
            duration_minutes=60,
            price=800000,
        ),
        Service(
            name="Xem Offline 2 tiếng",
            description="Gặp trực tiếp ở Hà Nội, Hà Nam, Ninh Bình, trong 2 tiếng, trò chuyện chuyên sâu cùng Reader.",
            duration_minutes=120,
            price=1500000,
        ),
        # ── Tarot ──
        Service(
            name="Tarot cơ bản 1 câu hỏi",
            description="Trải bài cơ bản (tương ứng với 1 câu hỏi).",
            duration_minutes=30,
            price=200000,
        ),
        Service(
            name="Tarot chuyên sâu 1 chuyện",
            description="Trải bài Tarot chuyên sâu 1 chuyện (tương ứng với tình cảm, công việc, học hành, tiền tài,…).",
            duration_minutes=60,
            price=300000,
        ),
        Service(
            name="Tarot full mọi vấn đề",
            description="Trải bài Tarot full mọi vấn đề không gợi ý câu hỏi (người xem đặt câu hỏi, Reader trả lời).",
            duration_minutes=60,
            price=300000,
        ),
        Service(
            name="Tarot chuyên sâu + tư vấn 30'",
            description="Tarot chuyên sâu gợi ý full câu hỏi + tư vấn trong vòng 30 phút.",
            duration_minutes=30,
            price=350000,
        ),
        Service(
            name="Xem full Tarot",
            description="Xem full Tarot: không giới hạn thời gian, được gợi ý câu hỏi (450.000/người).",
            duration_minutes=90,
            price=450000,
        ),
        # ── Tea Leaf ──
        Service(
            name="Tea Leaf 3 tháng full",
            description="Xem bài tuần hoặc bài trà mốc thời gian gần (3 tháng full vấn đề).",
            duration_minutes=60,
            price=250000,
        ),
        Service(
            name="Tea Leaf 6 tháng 3 vấn đề",
            description="Trải bài Tea Leaf 6 tháng, 3 vấn đề.",
            duration_minutes=60,
            price=300000,
        ),
        Service(
            name="Tea Leaf 6 tháng full",
            description="Tea Leaf 6 tháng full vấn đề.",
            duration_minutes=60,
            price=400000,
        ),
        Service(
            name="Bài trà full 12 tháng",
            description="Bài trà full 12 tháng/3 vấn đề.",
            duration_minutes=60,
            price=450000,
        ),
        Service(
            name="Tea Leaf 12 tháng full",
            description="Trải bài Tea Leaf 12 tháng full 6 vấn đề: tình cảm, tiền bạc, hôn nhân, thành công, hạnh phúc, may mắn, học hành, công việc.",
            duration_minutes=90,
            price=500000,
        ),
        # ── Các loại bài khác ──
        Service(
            name="Haletu xin lời khuyên 30'",
            description="Trải bài xin lời khuyên Haletu, kèm tư vấn tình cảm từ kinh nghiệm/góc nhìn/ý kiến cá nhân của Reader trong vòng 30'.",
            duration_minutes=30,
            price=300000,
        ),
        Service(
            name="Tín hiệu vũ trụ 30'",
            description="Bài tín hiệu vũ trụ / lời khuyên tình cảm / cuộc sống trong vòng 30'.",
            duration_minutes=30,
            price=300000,
        ),
        Service(
            name="Lenormand vận mệnh",
            description="Xem bài Lenormand dự đoán vận mệnh, tiên đoán tương lai và nhìn lại quá khứ (trải bài xâu chuỗi 3–5 lá/1 câu hỏi).",
            duration_minutes=60,
            price=250000,
        ),
        Service(
            name="Grand Tableau 36 lá",
            description="Xem bài Lenormand trải Grand Tableau 36 lá để kể 1 câu chuyện: quá khứ – hiện tại – tác động – tương lai xa từ 1 tháng – 1 năm, thậm chí 2–3 năm (time từ 1–2 tiếng).",
            duration_minutes=120,
            price=500000,
        ),
        Service(
            name="Lenormand tổng quan",
            description="Trải tổng quan cho 1 đối tượng hoặc 1 vụ việc cụ thể trong khoảng thời gian xác định (vài tháng hoặc vài năm) bằng Lenormand: 300.000 – 400.000 VNĐ.",
            duration_minutes=60,
            price=300000,
        ),
        Service(
            name="Oracle kết hợp",
            description="Trải bài kết hợp Oracle (vừa được đặt câu hỏi vừa có mốc thời gian cụ thể, là thể loại bài kết hợp giữa Tarot và Trà): 100.000/câu hỏi.",
            duration_minutes=30,
            price=100000,
        ),
        Service(
            name="Bài The Lover",
            description="Bài The Lover: chuyên dự báo tình yêu 1–3 tháng tới, tín hiệu vũ trụ hoặc đưa ra chỉ dẫn về mặt tình cảm.",
            duration_minutes=60,
            price=200000,
        ),
        Service(
            name="Bài The Heart 3 lá",
            description="Bài The Heart (trái tim): lời khuyên, chỉ dẫn tình cảm 3 lá trong 30'.",
            duration_minutes=30,
            price=300000,
        ),
        # ── Combo ──
        Service(
            name="Combo Tarot + Tea Leaf 6 tháng",
            description="Trải bài VIP combo Tarot + Tea Leaf trong vòng 6 tháng (không giới hạn thời gian).",
            duration_minutes=90,
            price=700000,
        ),
        Service(
            name="Combo VIP Full Tarot + Trà 12 tháng",
            description="Combo VIP Full Tarot + Trà trong vòng 12 tháng (tặng bài Haletu hoặc Oracle).",
            duration_minutes=120,
            price=1000000,
        ),
        Service(
            name="Combo Tarot + Lenormand",
            description="Combo được yêu thích nhất: Tarot + Lenormand (sự kết hợp hoàn hảo tuyệt đối cho tất cả mọi khúc mắc).",
            duration_minutes=90,
            price=800000,
        ),
        Service(
            name="Combo 1 chuyện all bài",
            description="Combo sử dụng tất cả mọi loại bài (Haletu, Oracle, Tarot, Tea Leaf, Lenormand,…) để xem về duy nhất 1 chuyện như tình yêu, công việc, tiền bạc, gia đình,…",
            duration_minutes=90,
            price=650000,
        ),
        Service(
            name="Combo Pro trị liệu",
            description="Combo Pro: Full Tarot + Full Trà + Haletu + Oracle + Lenormand + tư vấn tình cảm + trị liệu tâm lý (trong vòng 3 tiếng, nếu thêm +450k/tiếng).",
            duration_minutes=180,
            price=1500000,
        ),
        Service(
            name="Combo HOT toàn diện",
            description="COMBO HOT NHẤT: Full toàn bộ tất cả mọi loại bài kèm theo dõi chữa lành vết thương tâm hồn, không giới hạn thời gian xem, gợi ý câu hỏi, kèm bảo hành xem lại và tư vấn tình cảm miễn phí trong vòng 1 tháng bất cứ khi nào cần.",
            duration_minutes=120,
            price=3000000,
        ),
        # ── Dịch vụ khác (đặt lịch được) ──
        Service(
            name="Thần số học",
            description="Tặng tâm số học, gồm bản PDF 125 trang.",
            duration_minutes=60,
            price=800000,
        ),
        Service(
            name="Bản đồ sao vận hạn",
            description="Luận bản đồ sao vận hạn.",
            duration_minutes=60,
            price=800000,
        ),
        Service(
            name="Bản đồ sao cá nhân",
            description="Luận bản đồ sao cá nhân.",
            duration_minutes=60,
            price=1000000,
        ),
        Service(
            name="Bản đồ sao đôi",
            description="Luận bản đồ sao đôi.",
            duration_minutes=90,
            price=1500000,
        ),
        Service(
            name="Lá số chiêm tinh",
            description="Luận lá số chiêm tinh.",
            duration_minutes=60,
            price=800000,
        ),
        Service(
            name="Tử vi cá nhân",
            description="Luận tử vi cá nhân.",
            duration_minutes=60,
            price=800000,
        ),
        Service(
            name="Tử vi xem đôi",
            description="Lá số tử vi xem đôi.",
            duration_minutes=90,
            price=1500000,
        ),
    ]

    # Menu cũ không còn trong bảng giá mới -> tắt (không xóa cứng để giữ lịch sử).
    # Chỉ chạm tới đúng các tên do seed tạo ra trước đây, không đụng dịch vụ
    # admin tự thêm tay.
    OLD_MARKETING_NAMES = {
        "Tarot - 1 vấn đề",
        "Tarot - 3 vấn đề",
        "Tarot - Full vấn đề",
        "Tarot - 30 phút",
        "Tarot - 1 tiếng",
        "Tea Leaf - 3 tháng full",
        "Tea Leaf - 6 tháng 3 vấn đề",
        "Tea Leaf - 6 tháng full",
        "Tea Leaf - 12 tháng full",
        "Grand Tableau - cơ bản",
        "Grand Tableau - nâng cao",
        "Grand Tableau - VIP",
        "Combo Tarot + Tea Leaf",
        "Combo VIP Full Tarot",
        "Combo VIP đầy đủ",
        "Đá phong thủy",
        "Lá số chiêu tinh",
        "Bản đồ sao",
        "Tử vi",
        # Món xem theo chủ đề cũ (không còn trong bảng giá mới)
        "Người yêu",
        "Tình trạng trong mối quan hệ",
        "Bạn bè",
        "Gia Đình",
        "Tỏ tình / Cầu hôn",
        "Hôn nhân",
        "Tiểu tam",
        "Công việc hiện tại",
        "Tổng quan học tập",
        "Du học",
        "Khám phá bản thân",
    }

    to_add = [s for s in services + marketing if s.name not in existing]
    if to_add:
        db.add_all(to_add)

    seeded_desc = {m.name: m.description for m in marketing}
    for s in db.query(Service).all():
        if s.name in OLD_MARKETING_NAMES and s.name not in {m.name for m in marketing}:
            s.is_active = False
        # Mô tả trong file này là bản chữ chính thức của bảng giá. Seed chỉ thêm
        # mới, nên mỗi lần sửa chữ phải đồng bộ lại — không thì trang đặt lịch
        # vẫn hiện mô tả cũ. Chỉ chạm mô tả của đúng các tên do seed tạo; giá và
        # thời lượng vẫn để admin tự chỉnh trong trang Admin.
        new_desc = seeded_desc.get(s.name)
        if new_desc is not None and s.description != new_desc:
            s.description = new_desc
    db.commit()
