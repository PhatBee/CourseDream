import React from 'react';
import { Video, Download, Key, Smartphone, Award, HelpCircle } from 'lucide-react';

const includesData = [
  { icon: <Video size={18} />, text: '11 hours on-demand video' },
  { icon: <Download size={18} />, text: '69 downloadable resources' },
  { icon: <Key size={18} />, text: 'Full lifetime access' },
  { icon: <Smartphone size={18} />, text: 'Access on mobile and TV' },
  { icon: <HelpCircle size={18} />, text: 'Assignments' },
  { icon: <Award size={18} />, text: 'Certificate of Completion' },
];

const IncludesCard = ({ course }) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-5">
        <h5 className="text-lg font-semibold text-gray-800 mb-4">Includes</h5>
        <ul className="space-y-3">
          {includesData.map((item, index) => (
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

export default IncludesCard;