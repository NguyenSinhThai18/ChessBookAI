import type { LessonPlan, TopicBrief } from './types';

export function buildTopicInterpreterPrompt(userTopic: string) {
  return `
Bạn là TOPIC INTERPRETER cho sách dạy cờ vua cho TRẺ EM / NGƯỜI MỚI.

Người dùng nhập CHỦ ĐỀ RẤT NGẮN: "${userTopic}"

Nhiệm vụ: phân tích chủ đề và trả về JSON THUẦN theo schema:
{
  "topicType": "rule|tactic|skill",
  "coreIdea": "một câu ngắn",
  "audience": "kid_beginner",
  "keywords": ["... tối đa 5 ..."],
  "misconceptions": ["... 2-3 lỗi hay gặp ..."]
}

Luật cứng:
- KHÔNG tạo bàn cờ, KHÔNG FEN, KHÔNG ví dụ vị trí.
- CHỈ trả JSON, không markdown, không giải thích.
`.trim();
}

export function buildLessonPlannerPrompt(topicBrief: TopicBrief) {
  return `
Bạn là LESSON PLANNER (sư phạm) cho trẻ em học cờ vua.

Topic brief:
${JSON.stringify(topicBrief)}

Nhiệm vụ: từ 1 prompt tạo 2-3 LESSON độc lập. Mỗi lesson gồm:
- 1 phần GUIDE: 3-6 ý gạch đầu dòng, ngôn ngữ trẻ em, đúng trọng tâm.
- 4-6 EXERCISE tăng dần độ khó, mỗi bài chỉ có 1 nước đúng ("single_best_move").

Trả về JSON THUẦN theo schema:
{
  "lessons": [
    {
      "lessonId": "lesson-1",
      "title": "tên ngắn gọn",
      "guideOutline": ["..."],
      "exerciseLadder": [
        { "id": "ex-1-1", "goal": "...", "difficulty": "easy|medium|hard", "constraint": "single_best_move" }
      ]
    }
  ]
}

Luật cứng:
- KHÔNG sinh bàn cờ, KHÔNG sinh quân, KHÔNG points, KHÔNG FEN.
- CHỈ trả JSON, không markdown, không giải thích.
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








