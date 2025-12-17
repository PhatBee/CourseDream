// scripts/seed_add_cyber_kill_chain.js
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

    const title = 'Introduction In Cyber Attack For Beginners';
    const shortDescription = 'How to Think Like a Hacker with PCAP analysis to anticipate, detect, and defend against cyber threats.';

    const description = `
In today's evolving threat landscape, understanding how cyberattacks unfold is crucial for building effective defense strategies.

This course takes you on a comprehensive journey through the **Cyber Kill Chain**, a model developed by Lockheed Martin that outlines the stages of a cyberattack — from reconnaissance to exfiltration.

You will learn how attackers operate, how vulnerabilities are exploited, and how defenders can detect, respond to, and mitigate these threats.

Additionally, we dive deep into analyzing PCAP files using Wireshark to uncover network traffic anomalies, identify malicious activities, and improve your incident response skills.

What You'll Learn:
• The 7 stages of the Cyber Kill Chain and real-world attack techniques
• Passive & Active Reconnaissance + OSINT tools
• Weaponization, Delivery, Exploitation, Installation, C2, and Actions on Objectives
• Hands-on PCAP analysis to detect Indicators of Compromise (IoCs)
• Defensive strategies to break the kill chain at every phase

Whether you're an aspiring cybersecurity professional or a seasoned IT expert, this course equips you with the mindset to think like a hacker — so you can better defend your systems.

By the end, you’ll confidently analyze attacks, detect threats early, and build stronger defenses.
`.trim();

    const topics = ['Cybersecurity', 'Ethical Hacking', 'Mạng', 'Bảo mật', 'Công nghệ thông tin', 'Phần mềm'];
    const includes = [
      '2,5 giờ video theo yêu cầu',
      '17 tài nguyên có thể tải xuống',
      'Truy cập trên thiết bị di động và TV',
      'Quyền truy cập đầy đủ suốt đời',
    ];
    const audience = [
      'Cybersecurity beginners who want to understand attack methodologies and defense strategies.',
      'SOC Analysts and Blue Team members looking to improve their incident detection skills.',
      'Networking and IT professionals who want to analyze malicious traffic using PCAP files.',
      'Students and career changers interested in cybersecurity and ethical hacking.',
    ];
    const requirements = [
      'Basic understanding of computer networks (TCP/IP, protocols, etc.).',
      'A computer capable of running Wireshark and virtual machines (e.g., Kali Linux).',
      'No prior cybersecurity experience needed!',
    ];
    const learnOutcomes = [
      'Hiểu rõ mô hình Cyber Kill Chain và từng giai đoạn tấn công',
      'Phân tích PCAP file bằng Wireshark để phát hiện IoCs',
      'Nhận diện kỹ thuật reconnaissance, weaponization, delivery...',
      'Áp dụng chiến lược phòng thủ để phá vỡ chuỗi tấn công',
      'Tư duy như hacker để bảo vệ hệ thống hiệu quả hơn',
    ];

    // ====== SECTIONS & LECTURES ======
    const sectionsData = [
      {
        title: 'Overview about what you will learn in this course',
        lectures: [
          { title: 'What Will You Learn in This Course?', preview: true, duration: '02:20', url: 'https://dai.ly/x9ujvtc' },
          { title: 'Understanding My Accent & Why I’m Sharing This Course', preview: true, duration: '00:54', url: 'https://dai.ly/x9ujvte' },
        ]
      },
      {
        title: 'Introduction to Cyber Kill Chain and Reconnaissance Phase',
        lectures: [
          { title: 'What is Cyber Kill Chain and Passive Reconnaissance', preview: false, duration: '11:54', url: 'https://dai.ly/x9ujvta' },
          { title: 'Active Reconnaissance', preview: false, duration: '10:38', url: 'https://dai.ly/x9ujvt8' },
          { title: 'OSINT Framework', preview: false, duration: '09:59', url: 'https://dai.ly/x9ujvtg' },
        ]
      },
      {
        title: 'Weaponization, Delivery & Exploitation Phases',
        lectures: [
          { title: 'Difference between Malware, Exploit & Payload', preview: false, duration: '06:48', url: 'https://dai.ly/x9ujvti' },
          { title: 'What is Weaponization Phase & Techniques?', preview: false, duration: '07:51', url: 'https://dai.ly/x9ujvtm' },
          { title: 'Delivery Phase', preview: false, duration: '05:08', url: 'https://dai.ly/x9ujwj0' },
          { title: 'What is Exploitation Phase?', preview: false, duration: '04:08', url: 'https://dai.ly/x9ujwkg' },
          { title: 'What does a Hacker do After Gaining Access?', preview: false, duration: '08:10', url: 'https://dai.ly/x9ujwl8' },
        ]
      },
      {
        title: 'Installation, Command & Control and Actions on Objectives Phases',
        lectures: [
          { title: 'Installation Phase', preview: true, duration: '11:24', url: 'https://dai.ly/x9unlpk' },
          { title: 'Command & Control (C2) Phase', preview: false, duration: '09:45', url: 'https://dai.ly/x9unlpq' },
          { title: 'Actions on Objectives (Exfiltration) Phase', preview: false, duration: '05:01', url: 'https://dai.ly/x9unlpo' },
        ]
      },
      {
        title: 'Analysis PCAP Files on Wireshark',
        lectures: [
          { title: 'Indicator of Compromise (IOCs)', preview: true, duration: '23:13', url: 'https://dai.ly/x9unlpm' },
          { title: 'Web Server Attack PCAP File Analysis part (1)', preview: false, duration: '23:51', url: 'https://dai.ly/x9unlps' },
          { title: 'Web Server Attack PCAP File Analysis part (2)', preview: false, duration: '09:19', url: 'https://dai.ly/x9unlpu' },
          { title: 'important notes', preview: false, duration: '02:58', url: 'https://dai.ly/x9unlpw' },
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
    const categoryNames = ['Cybersecurity', 'Ethical Hacking', 'Mạng', 'Bảo mật', 'Công nghệ thông tin', 'Phần mềm'];
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
    course.thumbnail = 'https://img-c.udemycdn.com/course/480x270/6525331_92c4_7.jpg?w=640&q=75'; // bạn có thể thay bằng link thumbnail thực tế sau
    course.previewUrl = ''; // video preview chính
    course.description = description;
    course.shortDescription = shortDescription;
    course.price = 399000;
    course.priceDiscount = 299000;
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