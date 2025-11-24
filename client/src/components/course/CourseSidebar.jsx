import React from 'react';
import EnrollCard from './EnrollCard';
import IncludesCard from './IncludesCard';
import FeaturesCard from './FeaturesCard';

const CourseSidebar = ({ course }) => {
  return (
    <div className="sticky top-24 space-y-6"> 
      <EnrollCard course={course} />
      <IncludesCard course={course} />
      <FeaturesCard course={course} />
    </div>
  );
};

export default CourseSidebar;