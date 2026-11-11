"""Gọi Gemini + chống cháy tiền (rate-limit IP, cache, max_tokens thấp).

Key chỉ nằm ở server. Không có key → trả thông báo thân thiện, không crash.
"""

from __future__ import annotations

import logging
import time

import httpx

from app.config import (
    GEMINI_API_KEY,
    GEMINI_FALLBACK_MODELS,
    GEMINI_MODEL,
    GEMINI_TIMEOUT_SECONDS,
)

logger = logging.getLogger(__name__)

_SYSTEM = (
    "Bạn là My — người lắng nghe bằng Tarot và huyền học của Healing With My. "
    "Viết tiếng Việt, xưng 'tôi', giọng dịu dàng, nhập tâm, truyền cảm hứng, "
    "không phán xét. TUYỆT ĐỐI không nhắc tới AI, robot, mô hình, máy móc hay "
    "'với tư cách là'. Chỉ luận giải dựa trên DỮ LIỆU ĐÃ TÍNH và TƯ LIỆU TRA CỨU "
    "cho sẵn — không bịa thêm vị trí sao, nhà, góc chiếu hay lá bài. "
    "Nếu phần DỮ LIỆU ĐÃ TÍNH thực sự không có dòng Cung Mọc hoặc không ghi "
    "nhà cho các hành tinh, TUYỆT ĐỐI không nhắc tới nhà hay Cung Mọc — chỉ "
    "luận theo cung, và mở đầu bằng một câu nhẹ nhàng rằng phần Cung Mọc/nhà "
    "chưa xem được vì thiếu giờ sinh. Ngược lại, nếu dữ liệu có Cung Mọc và "
    "nhà, phải luận đầy đủ và TUYỆT ĐỐI không nói thiếu giờ sinh. "
    "Viết lại bằng lời của mình, không trích nguyên văn tư liệu. "
    "Với bản đồ sao đôi, dùng ý nghĩa cặp hành tinh trong góc chiếu chéo rồi "
    "diễn giải thành tương tác giữa hai người, không gán ghép máy móc. "
    "Kết thúc bằng 1 câu vỗ về, rồi thêm dòng: 'Những dòng này là góc nhìn tham "
    "khảo từ chiêm tinh học, để bạn hiểu mình hơn — không phải lời khuyên y tế, "
    "pháp lý hay tài chính.'"
)

_DISCLAIMER = (
    "Những dòng này là góc nhìn tham khảo, để bạn hiểu mình hơn — "
    "không phải lời khuyên y tế, pháp lý hay tài chính."
)


def ensure_disclaimer(text: str) -> str:
    """Prompt có thể bị model bỏ qua; đảm bảo câu miễn trừ luôn có ở cuối."""
    if "không phải lời khuyên y tế" in text:
        return text
    return f"{text.rstrip()}\n\n{_DISCLAIMER}"


async def interpret(data_summary: str, full: bool) -> tuple[str | None, str | None]:
    """Trả (text, error). error khác None khi chưa cấu hình hoặc gọi lỗi."""
    if not GEMINI_API_KEY:
        return None, (
            "My đang chuẩn bị không gian xem cho bạn — "
            "bạn quay lại sau ít phút nhé."
        )
    scope = (
        "Hãy luận giải CHI TIẾT, nhiều phần (tính cách, tình cảm, công việc, "
        "lời khuyên), khoảng 800-1200 từ."
        if full
        else "Hãy luận giải NGẮN GỌN trong 120-180 từ, chạm vào 1-2 điểm "
        "sáng nhất, và khéo léo gợi rằng vẫn còn nhiều điều chưa kể hết "
        "trong bản đầy đủ."
    )
    prompt = f"{scope}\n\nDỮ LIỆU ĐÃ TÍNH:\n{data_summary}"

    # Model chính có thể bị quá tải (503 UNAVAILABLE) vào giờ cao điểm, nên
    # thử lần lượt các model dự phòng trước khi báo lỗi cho khách.
    models = [GEMINI_MODEL]
    models += [m for m in GEMINI_FALLBACK_MODELS if m and m != GEMINI_MODEL]

    # Timeout mặc định 30s: bản full thực tế ~8-15s, còn dư cho model dự phòng
    # và headroom so với maxDuration 60s của Vercel. Connect timeout ngắn hơn
    # để lỗi mạng không treo lâu.
    timeout = httpx.Timeout(GEMINI_TIMEOUT_SECONDS, connect=10.0)
    deadline = time.monotonic() + GEMINI_TIMEOUT_SECONDS
    async with httpx.AsyncClient(timeout=timeout) as client:
        for model in models:
            if time.monotonic() >= deadline:
                break
            started = time.perf_counter()
            try:
                r = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                    headers={
                        "x-goog-api-key": GEMINI_API_KEY,
                        "Content-Type": "application/json",
                    },
                    json={
                        "system_instruction": {"parts": [{"text": _SYSTEM}]},
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.7,
                            "maxOutputTokens": 2000 if full else 400,
                        },
                    },
                    timeout=httpx.Timeout(
                        max(10.0, deadline - time.monotonic()), connect=10.0
                    ),
                )
            except httpx.TimeoutException:
                logger.warning(
                    "gemini timeout model=%s full=%s elapsed=%.1fs",
                    model, full, time.perf_counter() - started,
                )
                return None, "My đang viết hơi lâu — bạn thử lại sau ít phút nhé."
            except Exception:
                logger.exception("gemini request failed model=%s full=%s", model, full)
                return None, "Mất kết nối tới những vì sao — bạn thử lại sau ít phút nhé."

            elapsed = time.perf_counter() - started
            if r.status_code == 200:
                parts = (
                    r.json().get("candidates", [{}])[0]
                    .get("content", {}).get("parts", [])
                )
                text = "".join(p.get("text", "") for p in parts).strip()
                if text:
                    logger.info(
                        "gemini ok model=%s full=%s elapsed=%.1fs prompt=%d chars out=%d chars",
                        model, full, elapsed, len(prompt), len(text),
                    )
                    return ensure_disclaimer(text), None
                logger.warning(
                    "gemini empty model=%s full=%s elapsed=%.1fs", model, full, elapsed
                )
                continue

            # 429/5xx: model đang quá tải hoặc hết quota → thử model kế tiếp.
            logger.warning(
                "gemini status=%s model=%s full=%s elapsed=%.1fs body=%s",
                r.status_code, model, full, elapsed,
                r.text[:240].replace("\n", " "),
            )

    return None, "Vũ trụ đang bận một chút — bạn thử lại sau ít phút nhé."

