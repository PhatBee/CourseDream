// scripts/seed_add_notion_launch_kit.js
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

import Course from '../src/modules/course/course.model.js';
import Section from '../src/modules/course/section.model.js';
import Lecture from '../src/modules/course/lecture.model.js';
import Category from '../src/modules/category/category.model.js';

function slugify(text) {
  return text
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

(async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('MONGO_URI is missing!');
      process.exit(1);
    }
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // ====== INPUT DATA ======
    const instructorId = '6913f6f74ef370e87cb6d779';

    const title = 'The Ultimate Notion Course Launch Kit';
    const shortDescription = 'Launch Your Course with Notion: Design Sales Pages, Dashboards, and Slide Decks for a Seamless Course Experience.';

    const description = `
Launching a course can be overwhelming — especially when you're juggling multiple tools and platforms.

With **The Ultimate Notion Course Launch Kit**, you can design, organize, and launch your entire course — all inside Notion.

In this course you’ll learn how to:
• Build beautiful, high-converting sales pages directly in Notion
• Create polished course dashboards for a seamless student experience
• Design stunning, customizable slide decks (perfect for video lessons)
• Use Notion as your all-in-one launch hub (no more messy tools!)

Includes ready-to-use templates + step-by-step video training.

No design skills? No problem! Everything is beginner-friendly and fully customizable to match your brand.

Stop switching between apps. Launch faster, cleaner, and with total confidence — all from one place: Notion.
`.trim();

    const topics = ['Notion Workspace', 'Marketing'];
    const includes = [
      '2 giờ video theo yêu cầu',
      'Truy cập trên thiết bị di động và TV',
      'Quyền truy cập đầy đủ suốt đời',
    ];
    const audience = [
      'Course creators who want to launch faster using Notion',
      'Coaches, educators, and creators tired of juggling multiple tools',
      'Beginners who want a simple, beautiful, all-in-one launch system',
    ];
    const requirements = [
      'Basic familiarity with Notion is helpful but not required',
      'No advanced tech skills or special software needed — everything is done within Notion',
      'Beginners are welcome — this course is designed to be user-friendly for all experience levels',
    ];
    const learnOutcomes = [
      'Thiết kế sales page chuyên nghiệp hoàn toàn trong Notion',
      'Tạo dashboard khóa học đẹp mắt và dễ sử dụng cho học viên',
      'Xây dựng slide deck đẹp như Canva nhưng linh hoạt hơn với Notion',
      'Tổ chức và launch khóa học chỉ với một công cụ duy nhất: Notion',
      'Tự tin launch khóa học mà không cần biết code hay dùng nhiều app',
    ];

    // ====== SECTIONS & LECTURES (chỉ 1 phần) ======
    const sectionsData = [
      {
        title: 'The Ultimate Notion Course Launch Kit',
        lectures: [
          { title: 'Welcome on board!', preview: true, duration: '05:09', url: 'https://dai.ly/x9ugt4k' },
          { title: 'Creating Notion Slides', preview: false, duration: '19:41', url: 'https://dai.ly/x9ugt4i' },
          { title: 'The Foundation of Clarity', preview: false, duration: '10:18', url: 'https://dai.ly/x9ugt4e' },
          { title: 'Editing Your Course with Loom', preview: true, duration: '04:59', url: 'https://dai.ly/x9ugt4c' },
          { title: 'Editing Your Course with CapCut', preview: false, duration: '20:08', url: 'https://dai.ly/x9ugt4g' },
          { title: 'Sales Page in Notion - Part 1', preview: false, duration: '24:35', url: 'https://dai.ly/x9ugujy' },
          { title: 'Sales Page in Notion - Part 2', preview: false, duration: '17:16', url: 'https://dai.ly/x9ugv9y' },
          { title: 'Notion Course Dashboard', preview: false, duration: '09:57', url: 'https://dai.ly/x9ugwji' },
          { title: 'Flodesk Checkout', preview: false, duration: '09:13', url: 'https://dai.ly/x9ujv1o' },
          { title: 'Stripe Checkout Alternative', preview: true, duration: '05:10', url: 'https://dai.ly/x9ujuz0' },
          { title: 'Conclusion', preview: true, duration: '01:33', url: 'https://dai.ly/x9ujuz2' },
        ]
      }
    ];

    const toSeconds = (timeStr) => {
      const parts = timeStr.split(':').map(Number);
      if (parts.length === 3) {
        const [h, m, s] = parts;
        return h * 3600 + m * 60 + s;
      }
      const [m, s] = parts;
      return m * 60 + s;
    };

    // ====== Ensure categories ======
    const categoryNames = ['Notion Workspace', 'Marketing'];
    const categoryIds = [];
    for (const name of categoryNames) {
      const slug = slugify(name);
      let cat = await Category.findOne({ slug });
      if (!cat) {
        cat = await Category.create({ name, slug });
        console.log('Created category:', name);
      }
      categoryIds.push(cat._id);
    }

    // ====== Create / Update course ======
    const slug = slugify(title);
    let course = await Course.findOne({ slug });

    if (course) {
      console.log('Course already exists → updating...');
    } else {
      course = new Course();
      console.log('Creating new course...');
    }

    course.title = title;
    course.slug = slug;
    course.thumbnail = 'https://img-c.udemycdn.com/course/750x422/6181677_24a6.jpg'; // thay link thật sau nếu cần
    course.previewUrl = '';
    course.description = description;
    course.shortDescription = shortDescription;
    course.price = 499000;
    course.priceDiscount = 199000;
    course.level = 'beginner';
    course.language = 'en';
    course.requirements = requirements;
    course.learnOutcomes = learnOutcomes;
    course.instructor = new mongoose.Types.ObjectId(instructorId);
    course.categories = categoryIds;
    course.topics = topics;
    course.includes = includes;
    course.audience = audience;
    course.status = 'published';

    await course.save();

    // ====== Create sections & lectures ======
    let totalSeconds = 0;
    let totalLectures = 0;
    const sectionIds = [];

    for (let s = 0; s < sectionsData.length; s++) {
      const secData = sectionsData[s];
      const sectionOrder = s + 1;

      let section = await Section.findOne({ course: course._id, title: secData.title });
      if (!section) {
        section = await Section.create({
          title: secData.title,
          course: course._id,
          order: sectionOrder,
          lectures: [],
        });
        console.log(`Created section: ${secData.title}`);
      }

      const lectureIds = [];
      let lecOrder = 1;

      for (const L of secData.lectures) {
        const duration = toSeconds(L.duration);
        totalSeconds += duration;
        totalLectures++;

        let lec = await Lecture.findOne({ section: section._id, title: L.title });

        if (!lec) {
          lec = await Lecture.create({
            title: L.title,
            videoUrl: L.url,
            duration,
            section: section._id,
            order: lecOrder,
            isPreviewFree: !!L.preview,
          });
          console.log(`   Created lecture: ${L.title} (${L.duration})${L.preview ? ' [PREVIEW]' : ''}`);
        } else {
          lec.videoUrl = L.url;
          lec.duration = duration;
          lec.order = lecOrder;
          lec.isPreviewFree = !!L.preview;
          await lec.save();
          console.log(`   Updated lecture: ${L.title}`);
        }

        lectureIds.push(lec._id);
        lecOrder++;
      }

      section.lectures = lectureIds;
      await section.save();
      sectionIds.push(section._id);
    }

    // ====== Update course totals ======
    course.sections = sectionIds;
    course.totalLectures = totalLectures;
    course.totalDurationSeconds = totalSeconds;
    course.totalHours = Number((totalSeconds / 3600).toFixed(2)); // ~2.12 giờ

    await course.save();

    console.log('\nDONE!');
    console.log('Course ID      :', course._id.toString());
    console.log('Total sections :', sectionsData.length);
    console.log('Total lectures :', course.totalLectures);
    console.log('Total duration :', `${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}m`);
    console.log('Total hours    :', course.totalHours);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();