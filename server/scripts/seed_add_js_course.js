// scripts/seed_add_uiux_figma_adobexd.js
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
      console.error('❌ MONGO_URI is missing!');
      process.exit(1);
    }
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // ====== INPUT DATA ======
    const instructorId = '6913f6f74ef370e87cb6d779'; // giữ nguyên instructor như khóa JS

    const title = 'UIUX with Figma and Adobe XD';
    const shortDescription = 'Learn User Interface and User Experience UI UX with Adobe XD and Figma';

    const description = `
Are you ready to embark on a journey to master the art of designing beautiful, user-friendly interfaces and captivating user experiences? Look no further! In this course, we'll take you from a beginner to a proficient UI/UX designer, equipping you with the essential skills and techniques to create stunning designs for web and mobile applications.

Course Overview:
1. Introduction to UI/UX Design: We'll start with the fundamentals, understanding the core principles of UI/UX design, the design process, and the role of designers in shaping digital experiences.
2. Getting Started with Figma: Figma has revolutionized the design industry with its collaborative features and powerful capabilities. We'll provide you with a comprehensive introduction to Figma...
3. Mastering Adobe XD: Adobe XD is another prominent design tool used widely in the industry...
4. User Research and Analysis • Wireframing and Prototyping • Designing for Web & Mobile • Microinteractions • Collaborative Design • Real-World Projects

By the end of this course, you'll be equipped with the expertise to create captivating UI/UX designs using Figma and Adobe XD, making you a sought-after professional in the field of user interface and experience design. Enroll now and join us on this exciting journey into the world of UI/UX design!
`.trim();

    const topics = ['Figma', 'công cụ thiết kế', 'thiết kế'];
    const includes = [
      '10,5 giờ video theo yêu cầu',
      '1 bài viết',
      '1 tài nguyên có thể tải xuống',
      'Truy cập trên thiết bị di động và TV',
      'Quyền truy cập đầy đủ suốt đời',
    ];
    const audience = [
      'Beginner who want to learn UIUX',
    ];
    const requirements = [
      'Basic Computer Knowledge',
    ];
    const learnOutcomes = [
      'Thành thạo Figma từ cơ bản đến nâng cao',
      'Sử dụng thành thạo Adobe XD để thiết kế UI/UX',
      'Hiểu rõ quy trình thiết kế UI/UX thực tế',
      'Thiết kế được giao diện web và mobile app chuyên nghiệp',
      'Xây dựng được portfolio UI/UX thực tế',
    ];

    // ====== SECTIONS & LECTURES ======
    const sectionsData = [
      {
        title: 'Phần 1: Figma',
        lectures: [
          { title: 'Introduction', preview: true, duration: '07:14', url: 'https://dai.ly/x9tw5te' },
          { title: 'Introduction to Figma', preview: false, duration: '15:48', url: 'https://dai.ly/x9tw5ti' },
          { title: 'Interface and Workspace', preview: false, duration: '11:45', url: 'https://dai.ly/x9tw5tk' },
          { title: 'Basic Tools in Toolbar', preview: true, duration: '28:41', url: 'https://dai.ly/x9tw5tc' },
          { title: 'Frames, Pages and Artboard in Figma', preview: false, duration: '14:36', url: 'https://dai.ly/x9tw5tg' },
          { title: 'Type Tool in Figma', preview: true, duration: '12:14', url: 'https://dai.ly/x9tw5tm' },
          { title: 'Creation Tools in Figma', preview: false, duration: '11:30', url: 'https://dai.ly/x9tw5ts' },
          { title: 'Hand tool and adding comment in Figma', preview: false, duration: '13:24', url: 'https://dai.ly/x9tw5tu' },
          { title: 'Font colour and Stroke colour in Figma', preview: false, duration: '15:22', url: 'https://dai.ly/x9tw5tw' },
          { title: 'Alingings in Figma', preview: false, duration: '06:20', url: 'https://dai.ly/x9tw5ty' },
          { title: 'Masking in Figma', preview: false, duration: '06:57', url: 'https://dai.ly/x9tw65c' },
          { title: 'Styles in Figma', preview: false, duration: '14:19', url: 'https://dai.ly/x9tw65a' },
          { title: 'Components', preview: false, duration: '09:59', url: 'https://dai.ly/x9tw65e' },
          { title: 'Effects in Figma', preview: false, duration: '07:59', url: 'https://dai.ly/x9ty7fe' },
          { title: 'Constraints and Icons in Figma', preview: false, duration: '14:15', url: 'https://dai.ly/x9ty7fg' },
          { title: 'Layout grid and the Figma Community', preview: false, duration: '13:31', url: 'https://dai.ly/x9ty7fm' },
          { title: 'Grouping, Framing, Auto layout and Team Library', preview: false, duration: '30:56', url: 'https://dai.ly/x9ty7fq' },
          { title: 'Design styles and Shortcut keys in Figma', preview: false, duration: '41:13', url: 'https://dai.ly/x9ty7fo' },
          { title: 'Project of Designing Mobile app pages', preview: false, duration: '32:15', url: 'https://dai.ly/x9ty7fk' },
          { title: 'Web page designing using Shape blocking method', preview: false, duration: '32:08', url: 'https://dai.ly/x9ty7fs' },
          { title: 'Tips to work in Figma Efficiently', preview: false, duration: '21:31', url: 'https://dai.ly/x9ty7fu' },
          { title: 'Making rounded text, exporting and sharing link in Figma', preview: false, duration: '12:22', url: 'https://dai.ly/x9ty7fy' },
        ]
      },
      {
        title: 'Phần 2: Adobe XD',
        lectures: [
          { title: 'INTRO', preview: false, duration: '02:49', url: 'https://dai.ly/x9ty7fw' },
          { title: 'What is Adobe XD', preview: false, duration: '06:32', url: 'https://dai.ly/x9ty7k0' },
          { title: 'Difference between UI _ UX', preview: false, duration: '04:59', url: 'https://dai.ly/x9ty7k2' },
          { title: 'Persona _ Task Flow in UX', preview: false, duration: '10:18', url: 'https://dai.ly/x9ty7k6' },
          { title: 'Wireframe (High Fidelity _ Low Fidelity)', preview: false, duration: '09:28', url: 'https://dai.ly/x9ty7o2' },
          { title: 'Art Boards', preview: false, duration: '10:03', url: 'https://dai.ly/x9u2o1g' },
          { title: 'Working With Text', preview: false, duration: '12:19', url: 'https://dai.ly/x9u2o1e' },
          { title: 'Creating rectangle, circle and triangle and edit them in adobe XD for UI UX', preview: false, duration: '12:41', url: 'https://dai.ly/x9u2o1i' },
          { title: 'Using Colors in Adobe XD', preview: false, duration: '07:46', url: 'https://dai.ly/x9u2o1m' },
          { title: 'Strokes _ Copy pasting Appearance', preview: false, duration: '20:04', url: 'https://dai.ly/x9u2o1k' },
          { title: 'Icons', preview: false, duration: '12:21', url: 'https://dai.ly/x9u2o1o' },
          { title: 'UI KIT', preview: false, duration: '07:53', url: 'https://dai.ly/x9u2rgo' },
          { title: 'Prototyping', preview: false, duration: '08:58', url: 'https://dai.ly/x9u2o1q' },
          { title: 'Project: Educational Site', preview: false, duration: '01:12:25', url: 'https://dai.ly/kXwsL6siwqqUGRE1Lsy' },
          { title: 'Project: Resturant site', preview: false, duration: '01:00:47', url: 'https://dai.ly/x9u2o1s' },
        ]
      }
    ];

    const toSeconds = (timeStr) => {
      const parts = timeStr.split(':').map(Number);
      if (parts.length === 3) {
        const [h, m, s] = parts;
        return h * 3600 + m * 60 + s;
      } else {
        const [m, s] = parts;
        return m * 60 + s;
      }
    };

    // ====== Ensure categories ======
    const categoryNames = ['Figma', 'Công cụ thiết kế', 'Thiết kế'];
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

    // ====== Create course ======
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
    course.thumbnail = '';        // cập nhật sau nếu có
    course.previewUrl = '';
    course.description = description;
    course.shortDescription = shortDescription;
    course.price = 869000;
    course.priceDiscount = 169000;
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

    for (let secIdx = 0; secIdx < sectionsData.length; secIdx++) {
      const secData = sectionsData[secIdx];
      const sectionOrder = secIdx + 1;

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
      let lectureOrder = 1;

      for (const L of secData.lectures) {
        const duration = toSeconds(L.duration);
        totalSeconds += duration;
        totalLectures++;

        let lec = await Lecture.findOne({
          section: section._id,
          title: L.title,
        });

        if (!lec) {
          lec = await Lecture.create({
            title: L.title,
            videoUrl: L.url,
            duration,
            section: section._id,
            order: lectureOrder,
            isPreviewFree: !!L.preview,
          });
          console.log(`   Created lecture: ${L.title} (${L.duration})`);
        } else {
          lec.videoUrl = L.url;
          lec.duration = duration;
          lec.order = lectureOrder;
          lec.isPreviewFree = !!L.preview;
          await lec.save();
          console.log(`   Updated lecture: ${L.title}`);
        }

        lectureIds.push(lec._id);
        lectureOrder++;
      }

      section.lectures = lectureIds;
      await section.save();
      sectionIds.push(section._id);
    }

    // Update course with sections & totals
    course.sections = sectionIds;
    course.totalLectures = totalLectures;
    course.totalDurationSeconds = totalSeconds;
    course.totalHours = Number((totalSeconds / 3600).toFixed(2)); // ~10.55 giờ

    await course.save();

    console.log('\n✅ DONE!');
    console.log('Course ID:', course._id.toString());
    console.log('Total sections:', sectionsData.length);
    console.log('Total lectures:', course.totalLectures);
    console.log('Total duration:', `${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}m`);
    console.log('Total hours (float):', course.totalHours);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})();