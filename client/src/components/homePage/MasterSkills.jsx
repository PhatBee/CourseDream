import React from 'react';
import { CheckCircle, Video, Cloud, Award, Layout } from 'lucide-react';

const MasterSkills = () => {
  // Dữ liệu danh sách kỹ năng (Có thể lấy từ API hoặc file config)
  const skills = [
    { 
      id: 1, 
      text: "Stay motivated with engaging instructors", 
      icon: <Video className="w-6 h-6 text-indigo-600" /> 
    },
    { 
      id: 2, 
      text: "Keep up with in the latest in cloud", 
      icon: <Cloud className="w-6 h-6 text-indigo-600" /> 
    },
    { 
      id: 3, 
      text: "Get certified with 100+ certification courses", 
      icon: <Award className="w-6 h-6 text-indigo-600" /> 
    },
    { 
      id: 4, 
      text: "Build skills your way, from labs to courses", 
      icon: <Layout className="w-6 h-6 text-indigo-600" /> 
    },
  ];

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          
          {/* Cột trái: Nội dung text */}
          <div className="w-full lg:w-1/2" data-aos="fade-up">
            <span className="text-indigo-600 font-bold text-sm uppercase tracking-wider">What’s New</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4 leading-tight">
              Master the skills to drive your career
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">
              Get certified, master modern tech skills, and level up your career — whether you’re starting out or a seasoned pro. 
              95% of eLearning learners report our hands-on content directly helped their careers.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {skills.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-50 hover:border-indigo-100 transition-colors">
                  <div className="bg-white p-2 rounded-full shadow-sm shrink-0">
                    {item.icon}
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: Ảnh ghép (Collage) */}
          <div className="w-full lg:w-1/2 relative mt-10 lg:mt-0" data-aos="fade-up">
             {/* Bạn thay thế src ảnh thật ở đây */}
            <div className="relative z-10 text-center">
                <img 
                    src="https://images.prestigeonline.com/wp-content/uploads/sites/6/2025/06/16143016/usagi-chiikawa-characters-820x1024-1.jpeg" 
                    alt="Master Skills" 
                    className="rounded-3xl shadow-2xl inline-block relative z-10" 
                />
                
                {/* Các phần trang trí nổi (Floating elements) - Mô phỏng style cũ */}
                <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl animate-bounce duration-[3000ms] z-20 hidden md:block">
                    <Award className="w-8 h-8 text-yellow-500" />
                </div>
                
                <div className="absolute bottom-10 -left-10 bg-white p-4 rounded-2xl shadow-xl z-20 hidden md:block">
                   <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                       <span className="font-bold text-gray-800">Active Learning</span>
                   </div>
                </div>
            </div>

            {/* Background mờ trang trí */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-50/50 rounded-full blur-3xl -z-10"></div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default MasterSkills;