// src/components/course/CourseAccordion.js
import React from 'react';
import SectionItem from './SectionItem';

const CourseAccordion = ({ sections = [] }) => {
  const totalLectures = sections.reduce((acc, sec) => acc + (sec.lectures?.length || 0), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h5 className="text-xl font-semibold text-gray-800">Course Content</h5>
        <span className="text-sm text-gray-500">
          {sections.length} sections • {totalLectures} lectures
        </span>
      </div>
      
      <div className="space-y-3">
        {sections.map((section) => (
          <SectionItem key={section._id} section={section} />
        ))}
      </div>
    </div>
  );
};

export default CourseAccordion;