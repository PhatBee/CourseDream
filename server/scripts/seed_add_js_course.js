// scripts/seed_add_docker_expert.js
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

    const title = 'Docker: From Beginner to Expert';
    const shortDescription = 'Animations-based, hands-on, fun and engaging Docker course from a Senior Software Engineer with a PhD';

    const description = `
This will be one of the most interesting and fun courses that you will take on Docker.

With an animations and hands-on first approach, this course has been designed to be super friendly for absolute beginners. Complex Docker concepts are brought to life with engaging animations, real-world examples, and plenty of practice labs.

What you’ll master:
• Understand Docker architecture fundamentals
• Build & optimise custom Docker images (including multi-stage builds)
• Master container management (detached, interactive, lifecycle)
• Docker networking – bridge, custom networks
• Orchestrate everything elegantly with Docker Compose
• Containerise real-world applications from scratch

The course contains dozens of hands-on labs, downloadable resources, and animated explanations that make learning Docker both effective and enjoyable!

By the end, you’ll confidently deploy, manage, and scale containerised applications in any environment.
`.trim();

    const topics = ['Docker', 'Công cụ phát triển phần mềm', 'Phát triển'];
    const includes = [
      '3 giờ video theo yêu cầu',
      '10 tài nguyên có thể tải xuống',
      'Truy cập trên thiết bị di động và TV',
      'Quyền truy cập đầy đủ suốt đời',
    ];
    const audience = [
      'Absolute beginners',
      'System Administrators',
      'Cloud Infrastructure Engineers',
      'Developers',
    ];
    const requirements = ['No prior programming or system administration experience required'];
    const learnOutcomes = [
      'Hiểu sâu kiến trúc Docker và cách hoạt động của container',
      'Xây dựng và tối ưu Docker images (bao gồm multi-stage builds)',
      'Quản lý container chuyên nghiệp: detached, interactive, logs, exec...',
      'Làm chủ Docker Networking và tạo custom networks',
      'Sử dụng Docker Compose để orchestrate nhiều container một cách dễ dàng',
      'Containerise các ứng dụng thực tế từ A-Z',
    ];

    // ====== SECTIONS & LECTURES ======
    const sectionsData = [
      {
        title: 'Introduction',
        lectures: [
          { title: 'Introduction', preview: true, duration: '02:34', url: 'https://dai.ly/x9uaxtu' },
          { title: 'Docker CheatSheet and Udemy Review', preview: false, duration: '01:59', url: 'https://dai.ly/x9uaxu4' },
          { title: 'The Evolution of Docker', preview: false, duration: '12:35', url: 'https://dai.ly/x9uaxty' },
          { title: 'High Level Docker Architecture', preview: false, duration: '08:07', url: 'https://dai.ly/x9uaxu2' },
          { title: 'Docker Installation: MacOS Instructions', preview: false, duration: '02:38', url: 'https://dai.ly/x9uaxtw' },
          { title: 'Docker Installation: Windows Instructions', preview: false, duration: '05:34', url: 'https://dai.ly/x9uaxu0' },
          { title: 'Dockerfile, Images and Containers', preview: true, duration: '06:51', url: 'https://dai.ly/x9uaxu8' },
        ]
      },
      {
        title: 'Building Docker Images',
        lectures: [
          { title: 'Docker Images: Types and Layers', preview: false, duration: '07:34', url: 'https://dai.ly/x9uay9g' },
          { title: 'Building Custom Docker Images', preview: false, duration: '07:44', url: 'https://dai.ly/x9uay9o' },
          { title: 'Lab: Building Docker Images', preview: false, duration: '01:28', url: 'https://dai.ly/x9uay9k' },
          { title: 'Lab Solution: Building Docker Images', preview: false, duration: '03:17', url: 'https://dai.ly/x9uay9i' },
          { title: 'Docker Images: Optimisation Techniques', preview: true, duration: '15:42', url: 'https://dai.ly/x9uay9m' },
        ]
      },
      {
        title: 'Container Management',
        lectures: [
          { title: 'Docker Container Management: Basic Concepts', preview: false, duration: '08:18', url: 'https://dai.ly/x9udk5g' },
          { title: 'Docker Container Management: Detached vs Interactive Mode', preview: true, duration: '04:47', url: 'https://dai.ly/x9udk5i' },
          { title: 'Demo: Nginx Server in Detached Mode', preview: false, duration: '01:25', url: 'https://dai.ly/x9udk5m' },
          { title: 'Lab: Container Management', preview: false, duration: '02:17', url: 'https://dai.ly/x9udk5o' },
          { title: 'Lab Solution: Container Management', preview: false, duration: '03:39', url: 'https://dai.ly/x9udk5k' },
          { title: 'Best Practices for Container Management', preview: false, duration: '03:19', url: 'https://dai.ly/x9udk5q' },
          { title: 'Interactive Mode: Deep Dive', preview: false, duration: '05:15', url: 'https://dai.ly/x9udk5s' },
          { title: 'Lab: Modifying Containers at Runtime', preview: false, duration: '03:36', url: 'https://dai.ly/x9udk5u' },
          { title: 'Lab Solution: Modifying Containers at Runtime', preview: false, duration: '03:48', url: 'https://dai.ly/x9udk5w' },
        ]
      },
      {
        title: 'Containerising Real-World Applications',
        lectures: [
          { title: 'Containerising a real-world application', preview: true, duration: '09:09', url: 'https://dai.ly/x9udk5y' },
          { title: 'Multistage Builds: Basic Concepts', preview: false, duration: '05:18', url: 'https://dai.ly/x9udlne' },
          { title: 'Multistage Build In Action', preview: false, duration: '09:05', url: 'https://dai.ly/x9udlpq' },
        ]
      },
      {
        title: 'Docker Networking and Docker Compose',
        lectures: [
          { title: 'Docker Networking: Introduction', preview: false, duration: '09:44', url: 'https://dai.ly/x9udlsw' },
          { title: 'Container Isolation in Docker Networking', preview: false, duration: '05:43', url: 'https://dai.ly/x9udlyg' },
          { title: 'Custom Docker Networks', preview: false, duration: '05:21', url: 'https://dai.ly/x9ugr3c' },
          { title: 'Docker Compose in Action', preview: false, duration: '08:33', url: 'https://dai.ly/x9ugr3a' },
          { title: 'Lab: Docker Compose', preview: false, duration: '03:23', url: 'https://dai.ly/x9ugr36' },
          { title: 'Lab Solution: Docker Compose', preview: false, duration: '05:58', url: 'https://dai.ly/x9ugr3e' },
        ]
      },
      {
        title: 'Conclusion',
        lectures: [
          { title: 'Conclusion and Next Steps', preview: false, duration: '02:39', url: 'https://dai.ly/x9ugr38' },
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
    const categoryNames = ['Docker', 'Công cụ phát triển phần mềm', 'Phát triển'];
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
    course.thumbnail = 'https://img-c.udemycdn.com/course/750x422/6448337_c9ac.jpg'; // có thể thay link thật sau
    course.previewUrl = '';
    course.description = description;
    course.shortDescription = shortDescription;
    course.price = 399000;
    course.priceDiscount = 199000;
    course.level = 'beginner'; // Điều chỉnh theo khóa học thêm vào
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
      } else {
        console.log(`Section exists: ${secData.title}`);
      }

      const lectureIds = [];
      let lecOrder = 1;

      for (const L of secData.lectures) {
        if (!L.url) continue;

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
    course.totalHours = Number((totalSeconds / 3600).toFixed(2));

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