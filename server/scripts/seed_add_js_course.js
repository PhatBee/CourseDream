// scripts/seed_add_figma_mobile_app.js
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

    const title = 'Mobile App Design in Figma: From Concept to Prototype';
    const shortDescription = 'A step-by-step guide to creating your mobile app design in Figma';

    const description = `
Figma is a powerful, free web-based design tool perfect for UI/UX design — from wireframing to prototyping mobile apps.

In this hands-on course, experienced UI/UX designer Željko Milivojević guides you step-by-step through designing a complete mobile app in Figma, from concept to interactive prototype.

You'll master:
• Differences between iOS & Android design guidelines
• Creating moodboards & design systems
• Building wireframes and high-fidelity designs
• Automating workflows with components & variables
• Prototyping with interactions & animations
• Developer handoff & client revisions
• Latest Figma AI features to speed up your process

No prior experience required! Perfect for beginners, marketers, or designers switching to Figma.

By the end, you'll confidently design professional mobile apps and build a strong portfolio piece.
`.trim();

    const topics = ['Figma', 'Thiết kế ứng dụng Mobile', 'Thiết kế giao diện người dùng', 'Công cụ thiết kế', 'Thiết kế'];
    const includes = [
      '5 giờ video theo yêu cầu',
      '1 bài viết',
      '2 tài nguyên có thể tải xuống',
      'Truy cập trên thiết bị di động và TV',
      'Quyền truy cập đầy đủ suốt đời',
    ];
    const audience = [
      'Beginner designers with no strong design experience',
      'Experienced designers wanting to learn Figma workflows',
      'Online marketers & social media creators needing visuals',
      'Anyone wanting to design mobile apps from scratch',
    ];
    const requirements = [
      'A computer (Mac or Windows)',
      'Internet Connection',
      'No previous design experience is needed',
      'Figma and Whimsical account (both work on a browser)',
    ];
    const learnOutcomes = [
      'Sử dụng thành thạo Figma để thiết kế mobile app từ concept đến prototype',
      'Hiểu sự khác biệt giữa thiết kế iOS và Android',
      'Xây dựng moodboard, design system và wireframe chuyên nghiệp',
      'Tạo high-fidelity design và interactive prototype',
      'Tận dụng Figma AI để tăng tốc workflow',
      'Handoff design cho developer và xử lý revision từ client',
    ];

    // ====== SECTIONS & LECTURES (12 sections) ======
    const sectionsData = [
      {
        title: 'Introduction',
        lectures: [
          { title: 'Introduction and Software recommendation', preview: true, duration: '00:59', url: 'https://dai.ly/x9unnpq' },
          { title: 'Into the Figma', preview: false, duration: '04:46', url: 'https://dai.ly/x9unnqq' },
        ]
      },
      {
        title: 'Getting Started',
        lectures: [
          { title: 'Designing for iOs vs Android', preview: false, duration: '05:33', url: 'https://dai.ly/x9unns6' },
          { title: 'Creating the project', preview: true, duration: '04:15', url: 'https://dai.ly/x9unnt4' },
          { title: 'How to study on Udemy effectively', preview: false, duration: '05:29', url: 'https://dai.ly/x9unnu2' },
        ]
      },
      {
        title: 'Preparation',
        lectures: [
          { title: 'Moodboard & Project Direction', preview: false, duration: '08:28', url: 'https://dai.ly/x9unnum' },
          { title: 'iOS Library', preview: true, duration: '06:33', url: 'https://dai.ly/x9unnwc' },
          { title: 'Design system', preview: false, duration: '21:20', url: 'https://dai.ly/x9upw3s' },
        ]
      },
      {
        title: 'Wireframes',
        lectures: [
          { title: 'Wireframes - Part 1', preview: false, duration: '28:03', url: 'https://dai.ly/x9upw3u' },
          { title: 'Wireframes - Part 2', preview: false, duration: '30:53', url: 'https://dai.ly/x9upw3w' },
          { title: 'Wireframes flow', preview: false, duration: '08:10', url: 'https://dai.ly/x9upw42' },
        ]
      },
      {
        title: 'Design Process',
        lectures: [
          { title: 'Final Design - Part 1', preview: false, duration: '19:40', url: 'https://dai.ly/x9upw3y' },
          { title: 'Fun Exercise: creating a Spotify clone', preview: false, duration: '15:48', url: 'https://dai.ly/x9upw40' },
          { title: 'Final Design - Part 2', preview: false, duration: '28:15', url: 'https://dai.ly/x9upw48' },
          { title: 'Final Design - Part 3', preview: false, duration: '21:25', url: 'https://dai.ly/x9upw4c' },
          { title: 'Final Design - Part 4', preview: false, duration: '25:06', url: 'https://dai.ly/x9upzge' },
        ]
      },
      {
        title: 'Prototype & Handoff',
        lectures: [
          { title: 'Prototype & Animations', preview: false, duration: '08:11', url: 'https://dai.ly/x9upw46' },
          { title: 'Developer handoff & Client revision', preview: false, duration: '03:50', url: 'https://dai.ly/x9upzo8' },
        ]
      },
      {
        title: 'Overview of Figma AI features',
        lectures: [
          { title: 'Interface tour: where to find AI features', preview: false, duration: '01:36', url: 'https://dai.ly/x9uv68k' },
          { title: 'Figma Make, Figma Slides and Figma Buzz', preview: false, duration: '02:15', url: 'https://dai.ly/x9uv68i' },
          { title: 'Cleanup & Alignment — AI-Powered & Manual Tools', preview: false, duration: '02:24', url: 'https://dai.ly/x9uv68m' },
        ]
      },
      {
        title: 'Hands-on demonstration — building with AI',
        lectures: [
          { title: 'Real-time project: a simple landing page', preview: false, duration: '01:47', url: 'https://dai.ly/x9uv68o' },
          { title: 'AI copywriting and UI element generation', preview: false, duration: '01:05', url: 'https://dai.ly/x9uv68q' },
          { title: 'Iterating and editing with AI suggestions', preview: false, duration: '02:08', url: 'https://dai.ly/x9v420m' },
          { title: 'AI in the Design Process — Where It Helps, Where It Doesn’t', preview: false, duration: '02:47', url: 'https://dai.ly/x9v420i' },
        ]
      },
      {
        title: 'Automating repetitive tasks with AI',
        lectures: [
          { title: 'Prompt Thinking — How to Talk to AI Like a Designer', preview: false, duration: '03:11', url: 'https://dai.ly/x9v420o' },
          { title: 'Prompt Recipes — Headlines, Layouts & Visuals', preview: false, duration: '03:16', url: 'https://dai.ly/x9v420k' },
          { title: 'Prompt Playground — Practice Writing Great AI Prompts', preview: false, duration: '02:07', url: 'https://dai.ly/x9v420q' },
          { title: 'Helpful AI plugins: Magician, Diagram, Autoname', preview: false, duration: '02:07', url: 'https://dai.ly/x9v420u' },
        ]
      },
      {
        title: 'Collaboration & handoff with AI',
        lectures: [
          { title: 'Final Touches — File Cleanup, Comments & Versionining', preview: false, duration: '02:17', url: 'https://dai.ly/x9v4212' },
          { title: 'Figma Dev Mode — handoff made smarter', preview: false, duration: '01:59', url: 'https://dai.ly/x9v42b6' },
          { title: 'Async teamwork tips using Figma AI', preview: false, duration: '01:43', url: 'https://dai.ly/x9v42b2' },
        ]
      },
      {
        title: 'Case studies & real-world examples',
        lectures: [
          { title: 'Workflow with AI: before & after', preview: false, duration: '02:57', url: 'https://dai.ly/x9v42aw' },
          { title: 'Team-based design: scaling ideas with prompts', preview: false, duration: '03:05', url: 'https://dai.ly/x9v42b0' },
          { title: 'Figma AI in practice — lessons from real use', preview: false, duration: '02:15', url: 'https://dai.ly/x9v42ay' },
        ]
      },
      {
        title: 'Final Section',
        lectures: [
          { title: 'How to leave a review?', preview: false, duration: '01:49', url: 'https://dai.ly/x9v8uym' },
          { title: 'How to get a certificate?', preview: false, duration: '01:47', url: 'https://dai.ly/x9v42ie' },
          { title: 'Final thoughts', preview: false, duration: '00:49', url: 'https://dai.ly/x9v8uuq' },
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
    const categoryNames = ['Figma', 'Thiết kế ứng dụng Mobile', 'Thiết kế giao diện người dùng', 'Công cụ thiết kế', 'Thiết kế'];
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
    course.thumbnail = 'https://img-c.udemycdn.com/course/480x270/5974670_355b.jpg?w=640&q=75'; // Nếu có thumbnail thực tế từ Udemy, thay vào đây
    course.previewUrl = ''; // video intro preview
    course.description = description;
    course.shortDescription = shortDescription;
    course.price = 409000;
    course.priceDiscount = 269000;
    course.level = 'intermediate';
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
    course.totalHours = Number((totalSeconds / 3600).toFixed(2)); // ~4.82 giờ

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