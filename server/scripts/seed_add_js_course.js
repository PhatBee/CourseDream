// scripts/seed_add_js_course.js
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
  console.error('❌ MONGODB_URI is missing!');
  process.exit(1);
}
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // ====== INPUT DATA ======
    const instructorId = '6913f6f74ef370e87cb6d779';

    const title = 'JavaScript Fundamentals Course for Beginners';
    const shortDescription = 'JavaScript for Beginners: Learn JavaScript and Supercharge Your Web Design!';
    const description = `
Are you eager to step into the dynamic and exciting world of web development? "JavaScript Fundamentals Course for Beginners" is your entry point into the realm of web programming. Whether you're an absolute newcomer to coding or someone looking to start your web development journey, this course is designed to provide a strong foundation in JavaScript, one of the most essential languages for creating interactive and dynamic web applications.
`.trim();

    const topics = ['Javascript', 'Phát triển web', 'phát triển'];
    const includes = [
      '3 giờ video theo yêu cầu',
      'Truy cập trên thiết bị di động và TV',
      'Quyền truy cập đầy đủ suốt đời',
    ];
    const audience = [
      'who are JavaScript Newbies',
      'who want a thorough step by step introduction to the JavaScript language',
      'who want to learn how to build their first JavaScript Application',
    ];
    const requirements = [
      'No Prior Coding Experience Needed',
      'If you knew the HTML and CSS then it will be helpful for learning',
    ];
    const learnOutcomes = [
      'Understand the fundamental concepts in JavaScript',
      'Learn and apply the best practices',
      'JavaScript Modules',
      'Functional Programming',
      'Extensive, informative and interesting video lecture',
      'All about variables, functions, objects and arrays',
      'How to use conditional statements in JavaScript',
      'How to architect your code using flowcharts and common patterns',
      'Complete Code demonstrated in lecture',
      'How to write functions in JavaScript',
      'Manipulating web pages (DOM) with JavaScript',
      'Finish the course with real life JavaScript skills',
    ];

    // Section & lectures (23 lectures)
    const sectionTitle = 'Introduction';
    const lectures = [
      { title: 'Statements',          preview: true,  duration: '6:00',  url: 'https://dai.ly/x9tlk9w' },
      { title: 'Syntax',              preview: true,  duration: '5:47',  url: 'https://dai.ly/x9tlk9u' },
      { title: 'Comments',            preview: true,  duration: '5:43',  url: 'https://dai.ly/x9tlk9y' },
      { title: 'Operators',           preview: false, duration: '4:12',  url: 'https://dai.ly/x9tlkhw' },
      { title: 'Arithmetic',          preview: false, duration: '5:57',  url: 'https://dai.ly/x9tlki2' },
      { title: 'Assignment',          preview: false, duration: '6:34',  url: 'https://dai.ly/x9tlkhy' },
      { title: 'Strings',             preview: false, duration: '9:07',  url: 'https://dai.ly/x9tlki4' },
      { title: 'String Methods',      preview: false, duration: '13:15', url: 'https://dai.ly/x9tlki0' },
      { title: 'String Search',       preview: false, duration: '7:11',  url: 'https://dai.ly/x9tlki8' },
      { title: 'String Templates',    preview: false, duration: '8:35',  url: 'https://dai.ly/x9tlkie' },
      { title: 'Random',              preview: false, duration: '8:12',  url: 'https://dai.ly/x9tlkig' },
      { title: 'Booleans',            preview: false, duration: '5:55',  url: 'https://dai.ly/x9tlkic' },
      { title: 'Switch',              preview: false, duration: '8:32',  url: 'https://dai.ly/x9totay' },
      { title: 'Break',               preview: false, duration: '6:36',  url: 'https://dai.ly/x9totau' },
      { title: 'Sets',                preview: false, duration: '7:21',  url: 'https://dai.ly/x9totas' },
      { title: 'Typeof',              preview: false, duration: '5:11',  url: 'https://dai.ly/x9totaw' },
      { title: 'RegExp',              preview: false, duration: '5:32',  url: 'https://dai.ly/x9totb0' },
      { title: 'Scope',               preview: false, duration: '10:00', url: 'https://dai.ly/x9totb2' },
      { title: 'Strict Mode',         preview: false, duration: '6:35',  url: 'https://dai.ly/x9totb8' },
      { title: 'Style Guide',         preview: false, duration: '6:15',  url: 'https://dai.ly/x9totb6' },
      { title: 'Classes Inheritance', preview: false, duration: '5:29',  url: 'https://dai.ly/x9totjo' },
      { title: 'Static Methods',      preview: false, duration: '10:18', url: 'https://dai.ly/x9totjq' },
      { title: 'Object Protection',   preview: false, duration: '10:38', url: 'https://dai.ly/x9totjm' },
    ];

    const toSeconds = (mmss) => {
      const [m, s] = mmss.split(':').map(Number);
      return m * 60 + s;
    };

    // ====== Ensure categories ======
    const categoryNames = ['Javascript', 'Phát triển web', 'phát triển'];
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
    let existing = await Course.findOne({ slug });
    if (existing) {
      console.log('Course slug exists, updating existing course...');
    }

    const course = existing || new Course();
    course.title = title;
    course.slug = slug;
    course.thumbnail = ''; // cập nhật sau nếu có
    course.description = description;
    course.shortDescription = shortDescription;
    course.price = 0; // miễn phí hoặc cập nhật sau
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

    // ====== Create section ======
    let section = await Section.findOne({ course: course._id, title: sectionTitle });
    if (!section) {
      section = await Section.create({
        title: sectionTitle,
        course: course._id,
        order: 1,
        lectures: [],
      });
      console.log('Created section:', sectionTitle);
    }

    // ====== Create lectures ======
    let order = 1;
    let totalSeconds = 0;
    const lectureIds = [];
    for (const L of lectures) {
      const duration = toSeconds(L.duration);
      totalSeconds += duration;

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
          order,
          isPreviewFree: !!L.preview,
        });
        console.log('Created lecture:', L.title);
      } else {
        // update nếu đã tồn tại
        lec.videoUrl = L.url;
        lec.duration = duration;
        lec.order = order;
        lec.isPreviewFree = !!L.preview;
        await lec.save();
        console.log('Updated lecture:', L.title);
      }

      lectureIds.push(lec._id);
      order++;
    }

    // attach lectures vào section (giữ thứ tự)
    section.lectures = lectureIds;
    await section.save();

    // cập nhật course.sections
    const sections = await Section.find({ course: course._id }).sort({ order: 1 });
    course.sections = sections.map(s => s._id);

    // totals
    course.totalLectures = lectureIds.length;
    course.totalDurationSeconds = totalSeconds;
    course.totalHours = Number((totalSeconds / 3600).toFixed(2)); // ~2.82h (2h48m55s)

    await course.save();

    console.log('Done. Course ID:', course._id.toString());
    console.log('Total lectures:', course.totalLectures);
    console.log('Total duration (s):', course.totalDurationSeconds);
    console.log('Total hours:', course.totalHours);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
