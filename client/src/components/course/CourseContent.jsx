import React, { useState } from 'react';
import CourseOverview from './CourseOverview';
import CourseAccordion from './CourseAccordion';
import InstructorBio from './InstructorBio';
import CourseReviews from './CourseReviews';

const tabs = ['Overview', 'Course Content', 'Instructor', 'Reviews'];

const CourseContent = ({ course, reviews }) => {
  const [activeTab, setActiveTab] = useState('Overview');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return <CourseOverview course={course} />;
      case 'Course Content':
        return <CourseAccordion sections={course.sections} />;
      case 'Instructor':
        return <InstructorBio instructor={course.instructor} />;
      case 'Reviews':
        return <CourseReviews reviews={reviews} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <nav className="flex flex-wrap -mb-px px-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-5 border-b-2 font-medium text-sm
                ${activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="p-5">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default CourseContent;