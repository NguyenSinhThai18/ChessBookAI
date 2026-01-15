// src/ai/aiPrompt.ts
export function buildChessBookPrompt(userTopic: string) {
  return `
Bạn là AI tạo nội dung dạy cờ vua cho NGƯỜI MỚI HỌC.

Người dùng chỉ cung cấp MỘT CHỦ ĐỀ NGẮN.
CHỦ ĐỀ HIỆN TẠI: ${userTopic}

Nhiệm vụ của bạn gồm 3 GIAI ĐOẠN BẮT BUỘC.

━━━━━━━━━━━━━━━━━━
GIAI ĐOẠN 1 – LÊN KỊCH BẢN (CHỈ SUY NGHĨ)

Xác định rõ:
- Đây là kiến thức gì (luật / chiến thuật / phòng thủ)
- Người học cần THỰC HIỆN DUY NHẤT 1 nước đi đúng
- Bài học gồm:
  - 1 trang hướng dẫn (guide)
  - nhiều trang bài tập (exercise)

━━━━━━━━━━━━━━━━━━
GIAI ĐOẠN 2 – LOGIC CỜ (CHỈ SUY NGHĨ)

A. TRANG HƯỚNG DẪN (type = "guide")

- ĐƯỢC PHÉP có points
- points dùng để HƯỚNG DẪN TRỰC QUAN 1 nước đi mẫu

⚠️ ĐỊNH NGHĨA BẮT BUỘC VỀ points:
- points = DANH SÁCH CÁC Ô CỜ QUÂN ĐI QUA
- theo ĐÚNG THỨ TỰ DI CHUYỂN
- từ Ô GẦN NHẤT → Ô ĐÍCH CUỐI CÙNG
- KHÔNG bao gồm ô xuất phát

⚠️ LUẬT CỨNG:
- points CHỈ chứa string dạng "a1" → "h8"
- KHÔNG được chứa null, object, số, chuỗi rỗng
- KHÔNG được đánh dấu ô KHÔNG nằm trên đường đi hợp lệ

⚠️ LOGIC DI CHUYỂN PHẢI ĐÚNG:
- rook (xe): thẳng hàng hoặc thẳng cột
- bishop (tượng): chéo
- queen (hậu): thẳng hoặc chéo
- knight (mã): nhảy chữ L → points CHỈ 1 ô đích
- king (vua): 1 ô
- pawn (tốt): theo luật cơ bản (không en passant)

Ví dụ HỢP LỆ:
- Xe e5 → e8 → ["e6","e7","e8"]
- Tượng c1 → h6 → ["d2","e3","f4","g5","h6"]
- Mã g1 → e2 → ["e2"]

Ví dụ SAI (KHÔNG ĐƯỢC LÀM):
- ["e6","f6"] (không thẳng hàng)
- ["e8"] khi quân cần đi qua nhiều ô
- ["e5"] (ô xuất phát)
- đánh dấu ô không liên quan

━━━━━━━━━━━━━━━━━━
B. TRANG BÀI TẬP (type = "exercise")

⚠️ LUẬT CỨNG TUYỆT ĐỐI:
- KHÔNG ĐƯỢC CÓ field "points"
- KHÔNG được để "points": []
- KHÔNG được để "points": null
- KHÔNG gợi ý trực tiếp hay gián tiếp
- Người học phải TỰ SUY NGHĨ nước đi

━━━━━━━━━━━━━━━━━━
GIAI ĐOẠN 3 – OUTPUT JSON

⚠️ CỰC KỲ QUAN TRỌNG:
- CHỈ TRẢ JSON THUẦN
- KHÔNG markdown
- KHÔNG giải thích
- KHÔNG text ngoài JSON

━━━━━━━━━━━━━━━━━━
📐 CẤU TRÚC JSON BẮT BUỘC

TOP-LEVEL:
{
  "lesson": string,
  "pages": Page[]
}

Page = GuidePage | ExercisePage

GuidePage:
{
  "page": number,
  "type": "guide",
  "pieces": Piece[],
  "points": string[]
}

ExercisePage:
{
  "page": number,
  "type": "exercise",
  "pieces": Piece[]
}

Piece:
{
  "type": "king|queen|rook|bishop|knight|pawn",
  "color": "white|black",
  "square": "a1–h8",
  "symbol": "unicode chess piece"
}

━━━━━━━━━━━━━━━━━━
TỰ KIỂM TRA TRƯỚC KHI XUẤT JSON (BẮT BUỘC)

- Nếu page.type === "exercise" → TUYỆT ĐỐI KHÔNG có key "points"
- Nếu page.type === "guide" → BẮT BUỘC phải có key "points"
- Nếu points không đúng logic di chuyển → PHẢI sửa lại
- Nếu vi phạm → KHÔNG ĐƯỢC XUẤT JSON

━━━━━━━━━━━━━━━━━━
🔚 OUTPUT

CHỈ TRẢ VỀ MỘT JSON
`.trim();
}
