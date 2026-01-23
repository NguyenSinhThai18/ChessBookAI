import type { LessonPlan, TopicBrief } from './types';

export function buildTopicInterpreterPrompt(userTopic: string) {
  return `
Bạn là TOPIC INTERPRETER cho sách dạy cờ vua cho TRẺ EM / NGƯỜI MỚI.

Người dùng nhập CHỦ ĐỀ RẤT NGẮN: "${userTopic}"

NHIỆM VỤ:
Phân tích chủ đề và trả về JSON THUẦN theo schema bên dưới.

PHÂN LOẠI PHẠM VI CHỦ ĐỀ (RẤT QUAN TRỌNG):
- Nếu chủ đề CHỈ liên quan đến 1 quân cờ cụ thể
  (ví dụ: "chặn chiếu bằng tượng", "nước đi của mã")
  → scope = "single_piece"
  → relatedPieces = [quân đó]

- Nếu chủ đề là KHÁI NIỆM / CHIẾN THUẬT CHUNG
  có thể áp dụng cho NHIỀU quân cờ
  (ví dụ: "bắt quân không được bảo vệ", "chặn nước chiếu", "ghim quân")
  → scope = "multi_piece"
  → relatedPieces PHẢI bao gồm các quân phù hợp:
     queen, rook, bishop, knight
  → KHÔNG dùng pawn trừ khi chủ đề nói rõ về tốt

SCHEMA BẮT BUỘC:
{
  "topicType": "rule|tactic|skill",
  "coreIdea": "một câu ngắn, dễ hiểu cho trẻ em",
  "audience": "kid_beginner",
  "keywords": ["... tối đa 5 ..."],
  "misconceptions": ["... 2-3 lỗi hay gặp ..."],
  "scope": "single_piece|multi_piece",
  "relatedPieces": ["queen|rook|bishop|knight|king|pawn"]
}

LUẬT CỨNG:
- KHÔNG tạo bàn cờ
- KHÔNG sinh ví dụ
- KHÔNG FEN
- KHÔNG giải thích
- CHỈ trả JSON hợp lệ
`.trim();
}


// export function buildLessonPlannerPrompt(topicBrief: TopicBrief) {
//   return `
// Bạn là LESSON PLANNER (sư phạm) cho trẻ em học cờ vua.

// Topic brief:
// ${JSON.stringify(topicBrief)}

// Nhiệm vụ: từ 1 prompt tạo 2-3 LESSON độc lập. Mỗi lesson gồm:
// - 1 phần GUIDE: 3-6 ý gạch đầu dòng, ngôn ngữ trẻ em, đúng trọng tâm.
// - 4-6 EXERCISE tăng dần độ khó, mỗi bài chỉ có 1 nước đúng ("single_best_move").

// Trả về JSON THUẦN theo schema:
// {
//   "lessons": [
//     {
//       "lessonId": "lesson-1",
//       "title": "tên ngắn gọn",
//       "guideOutline": ["..."],
//       "exerciseLadder": [
//         { "id": "ex-1-1", "goal": "...", "difficulty": "easy|medium|hard", "constraint": "single_best_move" }
//       ]
//     }
//   ]
// }

// Luật cứng:
// - KHÔNG sinh bàn cờ, KHÔNG sinh quân, KHÔNG points, KHÔNG FEN.
// - CHỈ trả JSON, không markdown, không giải thích.
// `.trim();
// }

export function buildLessonPlannerPrompt(topicBrief: TopicBrief) {
  return `
Bạn là LESSON PLANNER (sư phạm) cho sách dạy cờ vua cho TRẺ EM.

Topic brief:
${JSON.stringify(topicBrief)}

QUY TẮC CỐT LÕI:
- MỖI LESSON = 1 QUÂN CỜ DUY NHẤT
- KHÔNG được trộn nhiều quân cờ trong 1 lesson

CÁCH XÁC ĐỊNH SỐ LESSON:
- Nếu topicBrief.scope = "single_piece"
  → Tạo ĐÚNG 1 lesson cho quân cờ đó
- Nếu topicBrief.scope = "multi_piece"
  → Tạo 1 lesson RIÊNG cho MỖI quân cờ trong topicBrief.relatedPieces

CẤU TRÚC MỖI LESSON:
- lessonId: duy nhất
- title: có tên quân cờ (vd: "Chặn chiếu bằng TƯỢNG")
- guideOutline:
  - 3–6 gạch đầu dòng
  - Chỉ nói về quân cờ của lesson
- exerciseLadder:
  - 4–6 bài
  - Độ khó tăng dần
  - Mỗi bài chỉ có 1 nước đúng ("single_best_move")

OUTPUT JSON:
{
  "lessons": [
    {
      "lessonId": "lesson-bishop",
      "piece": "bishop",
      "title": "...",
      "guideOutline": ["..."],
      "exerciseLadder": [...]
    }
  ]
}

LUẬT CỨNG:
- KHÔNG sinh bàn cờ
- KHÔNG sinh quân
- KHÔNG sinh points
- CHỈ trả JSON
`.trim();
}


export function buildContentGeneratorPrompt(
  userTopic: string,
  topicBrief: TopicBrief,
  lessonPlan: LessonPlan
) {
  // Keep output compatible with current mapper: { lesson, pages: [{type, pieces, points?}] }
  return `
Bạn là CONTENT GENERATOR cho sách dạy cờ vua cho trẻ em.

Chủ đề: "${userTopic}"
Topic brief:
${JSON.stringify(topicBrief)}

Lesson plan:
${JSON.stringify(lessonPlan)}

Nhiệm vụ: tạo JSON THUẦN theo cấu trúc:
{
  "lesson": string,
  "lessons": [{ "lessonId": string, "title": string }],
  "pages": Page[]
}

Trong đó:
- Page type="guide": BẮT BUỘC có "points": string[] (ô cờ "a1".."h8"), đúng logic đường đi minh họa, có "title" ngắn gọn tóm ý chính, có "lessonId".
- Page type="exercise": TUYỆT ĐỐI KHÔNG có key "points" (không null, không [], không tồn tại), có "lessonId", "title" chỉ cần "Trắng đi trước" hoặc "Đen đi trước".

Mỗi page cần có:
{
  "page": number,
  "type": "guide|exercise",
  "lessonId": string,
  "title": string,
  "pieces": [
    { "type": "king|queen|rook|bishop|knight|pawn", "color": "white|black", "square": "a1..h8" }
  ]
}

Luật ổn định:
- Luôn có đủ 2 vua (white king + black king) trên mỗi trang.
- Không có 2 quân đứng cùng 1 ô.
- Ưu tiên ít quân cho GUIDE; EXERCISE phải tăng độ khó theo từng bài: thêm nhiều nước đi mới HOẶC nhiều quân hơn để gây nhiễu.
- Mỗi lesson phải bắt đầu bằng 1 trang GUIDE (có points), sau đó là các EXERCISE của lesson đó (không points).
- Nếu có nhiều lesson, ghép các lesson nối tiếp nhau (guide rồi các exercise của lesson đó) trong mảng pages.

Output:
- CHỈ trả JSON, không markdown, không giải thích.
`.trim();
}




// export function buildContentGeneratorPrompt(

//   userTopic: string,

//   topicBrief: TopicBrief,

//   lessonPlan: LessonPlan

// ) {

//   // Keep output compatible with current mapper: { lesson, pages: [{type, pieces, points?}] }

//   return `

// Bạn là CONTENT GENERATOR cho sách dạy cờ vua cho trẻ em.



// Chủ đề: "${userTopic}"

// Topic brief:

// ${JSON.stringify(topicBrief)}



// Lesson plan:

// ${JSON.stringify(lessonPlan)}



// Nhiệm vụ: tạo JSON THUẦN theo cấu trúc:

// {

//   "lesson": string,

//   "pages": Page[]

// }



// Trong đó:

// - Page type="guide": BẮT BUỘC có "points": string[] (ô cờ "a1".."h8"), đúng logic đường đi minh họa.

// - Page type="exercise": TUYỆT ĐỐI KHÔNG có key "points" (không null, không [], không tồn tại).



// Mỗi page cần có:

// {

//   "page": number,

//   "type": "guide|exercise",

//   "pieces": [

//     { "type": "king|queen|rook|bishop|knight|pawn", "color": "white|black", "square": "a1..h8" }

//   ]

// }



// Luật ổn định:

// - Luôn có đủ 2 vua (white king + black king) trên mỗi trang.

// - Không có 2 quân đứng cùng 1 ô.

// - Ưu tiên ít quân (phù hợp trẻ em), tăng dần theo lessonPlan.exerciseLadder.



// Output:

// - CHỈ trả JSON, không markdown, không giải thích.

// `.trim();

// }








