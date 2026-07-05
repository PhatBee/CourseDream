import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Course from '../modules/course/course.model.js';
import { generateCourseEmbedding } from '../utils/ai.service.js';

const migrateEmbeddings = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    if (!process.env.GEMINI_API_KEY) {
      console.warn("WARNING: GEMINI_API_KEY is not set. Embeddings will be filled with dummy values.");
    }

    // Lấy tất cả các khoá học đã publish để cập nhật lại toàn bộ vector
    const courses = await Course.find({ status: 'published' });
    console.log(`Found ${courses.length} published courses to migrate.`);

    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      console.log(`Processing ${i + 1}/${courses.length}: ${course.title}...`);
      
      const textToEmbed = `${course.title}. ${course.shortDescription}. ${course.description}`;
      const embedding = await generateCourseEmbedding(textToEmbed);
      
      if (embedding && embedding.length > 0) {
        course.embedding = embedding;
        await course.save();
        console.log(`✅ Saved embedding for: ${course.title}`);
      } else {
        console.log(`❌ Failed to generate embedding for: ${course.title}`);
      }

      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateEmbeddings();
