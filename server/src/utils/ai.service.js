import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateCourseEmbedding = async (text) => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not defined. Skipping embedding generation.");
    // Return dummy vector of 3072 dimensions for now if no key
    return new Array(3072).fill(0.001);
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return []; // Return empty array or handle gracefully
  }
};

export const calculateCosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const generateChatbotStream = async (userMessage, recommendedCourses, history = []) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Lọc lịch sử từ Frontend gửi lên:
  // 1. Loại bỏ tin nhắn đầu tiên nếu nó là 'ai' (Ví dụ: câu "Xin chào")
  let filteredHistory = [...history];
  if (filteredHistory.length > 0 && filteredHistory[0].role === 'ai') {
    filteredHistory.shift();
  }

  // 2. Nếu Frontend gửi cả tin nhắn user hiện tại ở cuối mảng, ta cần loại bỏ
  // vì hàm sendMessageStream bên dưới sẽ tự động gửi message đó lên rồi.
  if (filteredHistory.length > 0 && filteredHistory[filteredHistory.length - 1].role === 'user' && filteredHistory[filteredHistory.length - 1].text === userMessage) {
    filteredHistory.pop();
  }

  // 3. Giới hạn lịch sử trò chuyện (Chỉ giữ lại 10 tin nhắn gần nhất)
  // Việc này CỰC KỲ QUAN TRỌNG trong thực tế để tránh lỗi vượt quá giới hạn Token của API Gemini
  // và tiết kiệm chi phí/quota API.
  if (filteredHistory.length > 10) {
    // Đảm bảo mảng sau khi cắt vẫn bắt đầu bằng role 'user'
    let startIndex = filteredHistory.length - 10;
    if (filteredHistory[startIndex].role === 'ai') {
      startIndex += 1;
    }
    filteredHistory = filteredHistory.slice(startIndex);
  }

  // Convert frontend history to Gemini history format
  const geminiHistory = filteredHistory.map(msg => ({
    role: msg.role === 'ai' ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  const chat = model.startChat({
    history: geminiHistory,
  });

  // Convert course list to readable text
  let coursesInfo = "Không có khóa học nào khớp.";
  if (recommendedCourses && recommendedCourses.length > 0) {
    coursesInfo = recommendedCourses.map((c, index) => {
      return `${index + 1}. Khóa học: ${c.title}\n   Mô tả: ${c.shortDescription}\n   Giá: ${c.price > 0 ? c.price + ' VNĐ' : 'Miễn phí'}`;
    }).join('\n\n');
  }

  const prompt = `Bạn là tư vấn viên của nền tảng học trực tuyến CourseDream. 
Người dùng vừa nhắn: "${userMessage}".
Hệ thống vừa truy xuất cơ sở dữ liệu và tìm được các khóa học sau đây phù hợp nhất với yêu cầu trên:

${coursesInfo}

Nhiệm vụ của bạn:
1. Đóng vai một tư vấn viên thân thiện, chuyên nghiệp.
2. Trả lời câu hỏi của người dùng dựa theo danh sách khóa học ở trên.
3. Nếu người dùng hỏi câu hỏi tiếp nối (dựa vào lịch sử chat), hãy phân tích ngữ cảnh để trả lời.
4. TỰ ĐỘNG PHÁT HIỆN NGÔN NGỮ: Hãy tự động phát hiện ngôn ngữ trong tin nhắn của người dùng ("${userMessage}") và trả lời bằng chính ngôn ngữ đó. 
   - Nếu là Tiếng Việt, xưng hô "mình" và "bạn".
   - Nếu là Tiếng Anh, xưng hô "I" và "you".
5. Câu trả lời cần ngắn gọn, súc tích. Không cần liệt kê lại giá tiền vì nó đã hiển thị ở giao diện.
6. KHÔNG BỊA ĐẶT khóa học không có trong hệ thống.
7. Hỗ trợ định dạng Markdown (ví dụ: **in đậm**) để làm nổi bật thông tin.

Câu trả lời:`;

  const result = await chat.sendMessageStream(prompt);
  return result.stream;
};