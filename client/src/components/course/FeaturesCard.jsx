import React from 'react';
import { Users, Clock, Layers, PlayCircle, BarChart2 } from 'lucide-react';

const FeaturesCard = ({ course }) => {
  const {
    studentsCount = 0,
    totalHours = 0,
    sections = [],
    totalLectures = 0,
    level = 'beginner'
  } = course;

  // chuyển level thành tiếng việt (beginner, advanced, intermediate, alllevels)
  const levelText = (level) => {
    switch (level) {
      case 'beginner':
        return 'Người mới bắt đầu';
      case 'advanced':
        return 'Nâng cao';
      case 'intermediate':
        return 'Trung cấp';
      case 'alllevels':
        return 'Mọi trình độ';
      default:
        return level;
    }
  };

  const features = [
    { icon: <Users size={18} />, text: `Học viên: ${studentsCount}` },
    { icon: <Clock size={18} />, text: `Thời lượng: ${totalHours.toFixed(1)} giờ` },
    { icon: <Layers size={18} />, text: `Số chương: ${sections.length}` },
    { icon: <PlayCircle size={18} />, text: `Video: ${totalLectures} bài giảng` },
    { icon: <BarChart2 size={18} />, text: `Cấp độ: ${levelText(level)}` },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-5">
        <h5 className="text-lg font-semibold text-gray-800 mb-4 text-justify">Thông tin khóa học</h5>
        <ul className="space-y-3">
          {features.map((item, index) => (
            <li key={index} className="flex items-center text-sm text-gray-700">
              <span className="text-rose-600 mr-3">{item.icon}</span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FeaturesCard;