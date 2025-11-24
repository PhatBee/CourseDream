import React from 'react';
import { Check } from 'lucide-react';

const CourseOverview = ({ course }) => {
  const { 
    description = '', 
    learnOutcomes = [], 
    requirements = [] 
  } = course;

  return (
    <div className="space-y-6">
      <div>
        <h5 className="text-xl font-semibold text-gray-800 mb-3">Course Description</h5>
        {/* Dùng dangerouslySetInnerHTML nếu description là HTML */}
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>

      <div>
        <h5 className="text-xl font-semibold text-gray-800 mb-3">What you'll learn</h5>
        <ul className="space-y-2">
          {learnOutcomes.map((item, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
              <span className="text-gray-600">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h5 className="text-xl font-semibold text-gray-800 mb-3">Requirements</h5>
        <ul className="space-y-2 list-disc list-inside">
          {requirements.map((item, index) => (
            <li key={index} className="text-gray-600">{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CourseOverview;