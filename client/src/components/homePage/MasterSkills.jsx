import React from 'react';
import { Video, Cloud, Award, Layout } from 'lucide-react';

const MasterSkills = () => {
  const skills = [
    { id: 1, text: "Luôn giữ động lực với các giảng viên lôi cuốn", icon: <Video className="w-6 h-6" /> },
    { id: 2, text: "Luôn cập nhật những xu hướng mới nhất về Cloud", icon: <Cloud className="w-6 h-6" /> },
    { id: 3, text: "Được chứng nhận với hơn 100 khóa học chứng chỉ", icon: <Award className="w-6 h-6" /> },
    { id: 4, text: "Xây dựng kỹ năng theo cách của bạn, từ phòng lab đến các khóa học", icon: <Layout className="w-6 h-6" /> },
  ];

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Cột trái: Text */}
          <div className="w-full lg:w-1/2 text-left">
            <span className="text-rose-500 font-bold text-sm uppercase tracking-wider">What’s New</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2 mb-6 leading-tight">
              Học các kỹ năng để thăng tiến trong sự nghiệp
            </h2>
            <p className="text-gray-600 mb-10 text-lg leading-relaxed text-justify">
              Được chứng nhận, thành thạo các kỹ năng công nghệ hiện đại và nâng cao sự nghiệp — cho dù bạn mới bắt đầu hay là một chuyên gia dày dạn kinh nghiệm.
              95% người học eLearning báo cáo rằng nội dung thực hành của chúng tôi đã trực tiếp giúp ích cho sự nghiệp của họ.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {skills.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-rose-200 hover:shadow-md transition-all">
                  <div className="bg-rose-50 text-rose-500 p-3 rounded-full shrink-0">
                    {item.icon}
                  </div>
                  <p className="text-sm font-bold text-gray-800 text-justify">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: Ảnh (Giữ nguyên link của bạn) */}
          <div className="w-full lg:w-1/2 relative flex justify-center lg:justify-end">
            <div className="relative z-10 text-center">
              <img
                src="https://images.prestigeonline.com/wp-content/uploads/sites/6/2025/06/16143016/usagi-chiikawa-characters-820x1024-1.jpeg"
                alt="Master Skills"
                className="rounded-3xl shadow-2xl inline-block relative z-10 max-h-[600px] object-cover"
              />

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl animate-bounce duration-[3000ms] z-20 hidden md:block border border-gray-50">
                <Award className="w-8 h-8 text-yellow-500" />
              </div>

              <div className="absolute bottom-10 -left-10 bg-white p-4 rounded-2xl shadow-xl z-20 hidden md:block border border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-bold text-gray-800">Đang học...</span>
                </div>
              </div>
            </div>

            {/* Background blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-rose-100/50 rounded-full blur-3xl -z-10"></div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default MasterSkills;