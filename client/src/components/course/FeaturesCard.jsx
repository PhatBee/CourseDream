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

  const features = [
    { icon: <Users size={18} />, text: `Enrolled: ${studentsCount} students` },
    { icon: <Clock size={18} />, text: `Duration: ${totalHours.toFixed(1)} hours` },
    { icon: <Layers size={18} />, text: `Chapters: ${sections.length}` },
    { icon: <PlayCircle size={18} />, text: `Video: ${totalLectures} lectures` },
    { icon: <BarChart2 size={18} />, text: `Level: ${level.charAt(0).toUpperCase() + level.slice(1)}` },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-5">
        <h5 className="text-lg font-semibold text-gray-800 mb-4">Course Features</h5>
        <ul className="space-y-3">
          {features.map((item, index) => (
            <li key={index} className="flex items-center text-sm text-gray-700">
              <span className="text-blue-600 mr-3">{item.icon}</span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FeaturesCard;