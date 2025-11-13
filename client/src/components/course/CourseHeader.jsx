import React from 'react';

import StarRating from '../common/StarRating'; 

import { FaPlay } from 'react-icons/fa';
import { HiOutlineBookOpen, HiOutlineClock, HiOutlineUsers } from 'react-icons/hi';

const CourseHeader = ({ course }) => {
  const { 
    title = '', 
    description = '', 
    thumbnail = '', 
    totalLectures = 0, 
    totalHours = 0, 
    studentsCount = 0, 
    instructor = {}, 
    categories = [],
    rating = 0,
    reviewCount = 0 
  } = course;

  const categoryName = categories[0]?.name || 'Course';

  return (
    <div className="bg-gray-50 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 lg:flex items-center">
        
        {/* Cột trái: Thumbnail Video */}
        <div className="relative flex-shrink-0 mb-4 lg:mb-0 lg:w-2/5">
          <img 
            className="w-full h-auto object-cover rounded-md aspect-video" 
            src={thumbnail || 'https://dreamslms.dreamstechnologies.com/html/template/assets/img/course/course-details-two-2.jpg'} 
            alt={title} 
          />
          {/* Nút Play */}
          <a 
            href="https://www.youtube.com/embed/1trvO6dqQUI"
            target="_blank" 
            rel="noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-md group"
          >
            <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
              <FaPlay className="text-blue-600 text-2xl" />
            </div>
          </a>
        </div>

        {/* Cột phải: Thông tin chi tiết */}
        <div className="w-full lg:pl-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-sm text-gray-600 mb-3">{description}</p>
          
          {/* Thông số nhanh */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap my-4">
            <span className="flex items-center text-sm font-medium text-gray-700">
              <HiOutlineBookOpen className="mr-1.5 text-gray-500" /> {totalLectures} Lessons
            </span>
            <span className="flex items-center text-sm font-medium text-gray-700">
              <HiOutlineClock className="mr-1.5 text-gray-500" /> {totalHours.toFixed(1)} hours
            </span>
            <span className="flex items-center text-sm font-medium text-gray-700">
              <HiOutlineUsers className="mr-1.5 text-gray-500" /> {studentsCount} Students
            </span>
            <span className="text-xs font-semibold bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">{categoryName}</span>
          </div>
          
          {/* Giảng viên và Rating */}
          <div className="sm:flex items-center justify-between mt-4 border-t pt-4">
            {/* Giảng viên */}
            <div className="flex items-center mb-2 sm:mb-0">
              <img 
                className="w-10 h-10 rounded-full object-cover" 
                src={instructor.avatar || 'default-avatar.jpg'} 
                alt={instructor.name || 'Instructor'} 
              />
              <div className="ml-3">
                <h5 className="text-base font-semibold text-gray-800">{instructor.name || '...'}</h5>
                <p className="text-sm text-gray-500">Instructor</p>
              </div>
            </div>
            {/* Rating */}
            <div className="flex items-center">
              <StarRating rating={rating} />
              <p className="text-sm ml-2">
                <span className="font-bold text-gray-800">{rating.toFixed(1)}</span>
                <span className="text-gray-500"> ({reviewCount} reviews)</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseHeader;