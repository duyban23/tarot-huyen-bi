"""Gọi Gemini + chống cháy tiền (rate-limit IP, cache, max_tokens thấp).

Key chỉ nằm ở server. Không có key → trả thông báo thân thiện, không crash.
"""

from __future__ import annotations

import asyncio
import logging
import time

import httpx

from app.config import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_TIMEOUT_SECONDS

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

_RETRY_STATUS = {429, 500, 502, 503, 504}
_MAX_ATTEMPTS = 3

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

    # Timeout cấu hình mặc định 50s: bản full thực tế 40-48s, còn 10s headroom
    # so với maxDuration 60s của Vercel để kịp trả lỗi thân thiện. Connect
    # timeout ngắn hơn để lỗi mạng không treo cả phút.
    timeout = httpx.Timeout(GEMINI_TIMEOUT_SECONDS, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        for attempt in range(1, _MAX_ATTEMPTS + 1):
            started = time.perf_counter()
            try:
                r = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
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
                )
            except httpx.TimeoutException:
                logger.warning(
                    "gemini timeout full=%s attempt=%d elapsed=%.1fs",
                    full, attempt, time.perf_counter() - started,
                )
                return None, "My đang viết hơi lâu — bạn thử lại sau ít phút nhé."
            except Exception:
                logger.exception(
                    "gemini request failed full=%s attempt=%d", full, attempt
                )
                return None, "Mất kết nối tới những vì sao — bạn thử lại sau ít phút nhé."

            elapsed = time.perf_counter() - started
            if r.status_code == 200:
                parts = (
                    r.json().get("candidates", [{}])[0]
                    .get("content", {}).get("parts", [])
                )
                text = "".join(p.get("text", "") for p in parts).strip()
                if not text:
                    logger.warning(
                        "gemini empty full=%s attempt=%d elapsed=%.1fs",
                        full, attempt, elapsed,
                    )
                    return None, "Vũ trụ đang bận một chút — bạn thử lại sau ít phút nhé."
                logger.info(
                    "gemini ok full=%s attempt=%d elapsed=%.1fs prompt=%d chars out=%d chars",
                    full, attempt, elapsed, len(prompt), len(text),
                )
                return ensure_disclaimer(text), None

            logger.warning(
                "gemini status=%s full=%s attempt=%d elapsed=%.1fs body=%s",
                r.status_code, full, attempt, elapsed,
                r.text[:240].replace("\n", " "),
            )
            if r.status_code in _RETRY_STATUS and attempt < _MAX_ATTEMPTS:
                await asyncio.sleep(0.6 * attempt)
                continue
            return None, "Vũ trụ đang bận một chút — bạn thử lại sau ít phút nhé."

    return None, "Vũ trụ đang bận một chút — bạn thử lại sau ít phút nhé."
