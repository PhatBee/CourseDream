// scripts/seed_add_python_datascience.js
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

    const title = 'Python for Data Science Pro: The Complete Mastery Course';
    const shortDescription = 'Become a Data Science Pro: Master Data Analysis, Visualization, and Machine Learning with Python';

    const description = `
Starting with the fundamentals of Python, you’ll quickly progress to advanced topics, including data manipulation with Pandas, statistical analysis, and machine learning with scikit-learn. You’ll also explore powerful data visualization tools like Matplotlib and Seaborn, enabling you to present data insights clearly and effectively. The course is packed with hands-on projects and real-world datasets, providing you with practical experience that mirrors the demands of the data science field.

By the end of this course, you’ll have the expertise to analyze, visualize, and model data using Python, making you a highly sought-after data science professional.

What You'll Learn:
• Python Basics for Data Science
• Data Manipulation with Pandas
• Statistical Analysis
• Machine Learning with scikit-learn
• Data Visualization with Matplotlib & Seaborn
• Best Practices for clean, reproducible code

Who This Course is For:
• Aspiring data scientists
• Python developers wanting to specialize in data analysis & ML
• Data analysts upgrading their skills
• Professionals who want to leverage data for decision-making

Enroll today and start your journey to becoming a proficient data scientist!
`.trim();

    const topics = ['Python', 'Khoa học dữ liệu', 'Phát triển'];
    const includes = [
      '4 giờ video theo yêu cầu',
      'Truy cập trên thiết bị di động và TV',
      'Quyền truy cập đầy đủ suốt đời',
    ];
    const audience = [
      'Anyone who want to learn master Python for data science.',
      'Python developers looking to specialize in data analysis and machine learning.',
    ];
    const requirements = ['No prior knowledge is required!'];
    const learnOutcomes = [
      'Thành thạo Python cho Data Science từ cơ bản đến nâng cao',
      'Làm sạch, xử lý và phân tích dữ liệu với Pandas',
      'Trực quan hóa dữ liệu chuyên nghiệp bằng Matplotlib & Seaborn',
      'Xây dựng và đánh giá mô hình Machine Learning',
      'Hiểu sâu về thống kê và các phân phối quan trọng',
      'Thực hiện dự án thực tế từ đầu đến cuối',
    ];

    // ====== SECTIONS & LECTURES (6 modules) ======
    const sectionsData = [
      {
        title: 'Module 1: Introduction to Python and Data Science',
        lectures: [
          { title: 'Variables, data types, and operators', preview: true, duration: '09:20', url: 'https://dai.ly/x9u2rj0' },
          { title: 'Control Flow: Conditionals and Loops', preview: true, duration: '06:14', url: 'https://dai.ly/x9u2riy' },
          { title: 'Functions and Modules', preview: false, duration: '07:08', url: 'https://dai.ly/x9u2riw' },
          { title: 'Functions with Inputs', preview: false, duration: '08:10', url: 'https://dai.ly/x9u577i' },
        ]
      },
      {
        title: 'Module 2: Data Manipulation with Python',
        lectures: [
          { title: 'Understanding Arrays and Matrices', preview: false, duration: '07:40', url: 'https://dai.ly/x9u577e' },
          { title: 'Array Operations', preview: false, duration: '08:06', url: 'https://dai.ly/x9u577c' },
          { title: 'DataFrames and Series', preview: false, duration: '06:53', url: 'https://dai.ly/x9u577g' },
          { title: 'Data Cleaning and Preparation', preview: false, duration: '08:23', url: 'https://dai.ly/x9u577s' },
          { title: 'Handling Missing Data', preview: false, duration: '06:47', url: 'https://dai.ly/x9u577a' },
          { title: 'Merging and Joining Data', preview: false, duration: '09:09', url: 'https://dai.ly/x9u577k' },
          { title: 'Sorting and Filtering Data', preview: false, duration: '10:41', url: 'https://dai.ly/x9u577q' },
          { title: 'Grouping and Aggregation', preview: false, duration: '09:36', url: 'https://dai.ly/x9u577m' },
        ]
      },
      {
        title: 'Module 3: Data Visualization',
        lectures: [
          { title: 'Basic Plots: Line, Bar, Scatter', preview: false, duration: '11:52', url: 'https://dai.ly/x9u577o' },
          { title: 'Customizing Plots', preview: false, duration: '10:59', url: 'https://dai.ly/x9u57dg' },
          { title: 'Subplots and Figures', preview: false, duration: '06:18', url: 'https://dai.ly/x9u57dk' },
          { title: 'Creating Interactive Charts', preview: false, duration: '09:26', url: 'https://dai.ly/x9u57di' },
        ]
      },
      {
        title: 'Module 4: Statistical Analysis',
        lectures: [
          { title: 'Measures of Central Tendency', preview: false, duration: '08:25', url: 'https://dai.ly/x9u57nk' },
          { title: 'Measures of Variability', preview: false, duration: '07:29', url: 'https://dai.ly/x9u9ad6' },
          { title: 'Normal, Binomial, and Other Distributions', preview: false, duration: '12:29', url: 'https://dai.ly/x9u9ad4' },
          { title: 'Null and Alternative Hypotheses', preview: false, duration: '09:06', url: 'https://dai.ly/x9u9ad8' },
        ]
      },
      {
        title: 'Module 5: Introduction to Machine Learning',
        lectures: [
          { title: 'Feature Scaling and Normalization', preview: false, duration: '08:03', url: 'https://dai.ly/x9u9hws' },
          { title: 'Encoding Categorical Variables', preview: false, duration: '11:59', url: 'https://dai.ly/x9u9hwy' },
          { title: 'Handling Imbalanced Data', preview: false, duration: '09:25', url: 'https://dai.ly/x9u9hwu' },
          { title: 'Linear and Logistic Regression', preview: false, duration: '11:23', url: 'https://dai.ly/x9u9hww' },
        ]
      },
      {
        title: 'Module 6: Advanced Topics in Data Science',
        lectures: [
          { title: 'Introduction to Time Series Data', preview: false, duration: '07:02', url: 'https://dai.ly/x9u9hzu' },
          { title: 'Decomposition, ARIMA Models', preview: false, duration: '10:57', url: 'https://dai.ly/x9u9hzw' },
          { title: 'Text Preprocessing', preview: false, duration: '08:09', url: 'https://dai.ly/x9u9hzs' },
          { title: 'Sentiment Analysis', preview: false, duration: '05:53', url: 'https://dai.ly/x9u9hzy' },
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
    const categoryNames = ['Python', 'Khoa học dữ liệu', 'Phát triển'];
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
    course.thumbnail = 'https://img-c.udemycdn.com/course/750x422/6137323_e6a1_3.jpg';
    course.previewUrl = '';
    course.description = description;
    course.shortDescription = shortDescription;
    course.price = 399000;               // bạn có thể đổi thành giá thực: ví dụ 799000
    course.priceDiscount = 199000;
    course.level = 'alllevels';    // hoặc 'beginner' / 'intermediate'
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
          console.log(`   Created lecture: ${L.title} (${L.duration})`);
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