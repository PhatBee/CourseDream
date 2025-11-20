import React, { useState } from 'react';
import CourseOverview from './CourseOverview';
import CourseAccordion from './CourseAccordion';
import InstructorBio from './InstructorBio';
import CourseReviews from './CourseReviews';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';

const CourseContent = ({ course, reviews }) => {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="space-y-6"> 
      
      {/* Card 1: Overview */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-5">
          <CourseOverview course={course} />
        </div>
      </div>

      {/* Card 2: Course Content (Accordion) */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-5">
          <CourseAccordion sections={course.sections} />
        </div>
      </div>

      {/* Card 3: Instructor Bio */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-5">
          <InstructorBio instructor={course.instructor} />
        </div>
      </div>

      {/* Card 4: Reviews (List) */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-5">
          <ReviewList reviews={reviews} />
        </div>
      </div>

      {/* Card 5: Post Review (Form) */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-5">
          <ReviewForm />
        </div>
      </div>

    </div>
  );
};

export default CourseContent;