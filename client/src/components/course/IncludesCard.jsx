import React from 'react';
import { Video, Download, Key, Smartphone, Award, HelpCircle, Check } from 'lucide-react';

const staticIcons = [
  <Video size={18} />,
  <Download size={18} />,
  <Key size={18} />,
  <Smartphone size={18} />,
  <HelpCircle size={18} />,
  <Award size={18} />,
];

const defaultIcon = <Check size={18} />;

const IncludesCard = ({ course }) => {

  const includesList = course.includes || []; 

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-5">
        <h5 className="text-lg font-semibold text-gray-800 mb-4">Includes</h5>
        <ul className="space-y-3">
          
          {/* 3. Lặp qua mảng 'includesList' (từ database) */}
          {includesList.map((text, index) => (
            <li key={index} className="flex items-center text-sm text-gray-700">
              
              {/* Lấy icon tương ứng với 'index' */}
              <span className="text-blue-600 mr-3">
                {staticIcons[index] || defaultIcon}
              </span>
              
              {/* Hiển thị text động từ database */}
              {text}
            </li>
          ))}

        </ul>
      </div>
    </div>
  );
};

export default IncludesCard;