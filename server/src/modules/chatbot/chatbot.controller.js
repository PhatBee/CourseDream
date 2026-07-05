import Course from '../course/course.model.js';
import { generateCourseEmbedding, calculateCosineSimilarity, generateChatbotStream } from '../../utils/ai.service.js';

export const askChatbot = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Tin nhắn không được để trống" });
    }

    // 1. Generate embedding for the user message
    const messageVector = await generateCourseEmbedding(message);
    
    // 2. Perform Vector Search (assuming Index is created)
    let topCourses = [];
    try {
      const searchResults = await Course.aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: messageVector,
            numCandidates: 100,
            limit: 10
          }
        },
        {
          $match: { status: 'published' }
        },
        {
          $project: {
            embedding: 0,
            score: { $meta: "vectorSearchScore" }
          }
        }
      ]);
      
      // Ngưỡng điểm của Atlas (DotProduct/Cosine) thường cao hơn, lọc > 0.6
      topCourses = searchResults.filter(c => c.score > 0.6).slice(0, 3);
    } catch (err) {
      console.error("\n=== Chi tiết lỗi Vector Search ===");
      console.error(err.message || err);
      console.error("==================================\n");
      console.warn("Vector Search Index 'vector_index' chưa được tạo hoặc bị lỗi. Đang dùng thuật toán tìm kiếm tuần tự (Fallback).");
      // Fallback
      const allCourses = await Course.find({ status: 'published' }).select('+embedding title shortDescription price level slug thumbnail').lean();
      const scoredCourses = allCourses.map(course => {
        const score = course.embedding && course.embedding.length > 0 
          ? calculateCosineSimilarity(messageVector, course.embedding)
          : 0;
        return { ...course, score };
      });
      scoredCourses.sort((a, b) => b.score - a.score);
      topCourses = scoredCourses.slice(0, 3).filter(c => c.score > 0.2); 
    }

    // 3. Thiết lập Header cho SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const coursesData = topCourses.map(c => ({
      _id: c._id,
      title: c.title,
      slug: c.slug,
      price: c.price,
      thumbnail: c.thumbnail,
      level: c.level
    }));

    // 4. Generate AI response stream
    try {
      const stream = await generateChatbotStream(message, topCourses, history);
      
      for await (const chunk of stream) {
        const chunkText = chunk.text();
        res.write(`data: ${JSON.stringify({ type: 'text', text: chunkText })}\n\n`);
      }
    } catch (aiError) {
      console.error("AI Stream Error:", aiError);
      res.write(`data: ${JSON.stringify({ type: 'text', text: "Hệ thống AI hiện đang quá tải hoặc gặp sự cố. Bạn có thể xem tạm các khóa học bên dưới nhé." })}\n\n`);
    }

    // Gửi mảng danh sách khóa học đề xuất sau khi AI đã gõ chữ xong (để tránh UI bị giật)
    res.write(`data: ${JSON.stringify({ type: 'courses', courses: coursesData })}\n\n`);

    // Gửi tín hiệu kết thúc
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Lỗi server" });
    } else {
      res.end();
    }
  }
};
