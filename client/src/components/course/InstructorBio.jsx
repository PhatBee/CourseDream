import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

const InstructorBio = ({ instructor = {} }) => {
  const {
    name = '...',
    avatar,
    bio = '...',
    skills = '...',
    // totalCourses = 5, 
    // totalStudents = 270000 
  } = instructor;

  return (
    <div className="space-y-5 text-left">
      <h5 className="text-xl font-semibold text-gray-800">About the instructor</h5>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center">
          <img
            className="w-16 h-16 rounded-full object-cover"
            src={avatar || '/default-avatar.svg'}
            alt={name}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
          <div className="ml-4">
            <Link to={`/instructor/${name}`} className="text-lg font-semibold text-gray-800 hover:text-blue-600">
              {name}
            </Link>
            <p className="text-sm text-gray-500">UX/UI Designer</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Star size={16} className="text-yellow-400 fill-current" />
          <Star size={16} className="text-yellow-400 fill-current" />
          <Star size={16} className="text-yellow-400 fill-current" />
          <Star size={16} className="text-yellow-400 fill-current" />
          <Star size={16} className="text-yellow-400 fill-current" />
          <span className="ml-1 text-sm font-medium">4.5</span>
        </div>
      </div>

      {/* <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <p><strong>{totalCourses}</strong> Courses</p>
        <p><strong>{totalStudents}</strong> Students</p>
      </div> */}

      <p className="text-gray-600 leading-relaxed">{bio}</p>

      <div>
        <h6 className="font-semibold text-gray-800 mb-2">Skills:</h6>
        <p className="text-sm text-gray-600">{skills}</p>
      </div>
    </div>
  );
};

export default InstructorBio;