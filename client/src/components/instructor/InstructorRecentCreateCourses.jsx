import React from "react";

const InstructorRecentCourses = ({ recentCourses }) => (
  <div>
    <h5 className="mb-4 font-bold text-lg">Recently Created Courses</h5>
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-xl shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-3 px-4 text-left font-semibold">Courses</th>
            <th className="py-3 px-4 text-left font-semibold">Enrolled</th>
            <th className="py-3 px-4 text-left font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {recentCourses.map((course, idx) => (
            <tr key={idx} className="border-b last:border-none hover:bg-gray-50 transition">
              <td className="py-3 px-4 flex items-center gap-3">
                <a href={`/courses/${course.slug}`} className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                  <img src={course.thumbnail || '/default-course.svg'} alt="Img" className="w-full h-full object-cover" onError={e => { e.target.onerror = null; e.target.src = '/default-course.svg'; }}/>
                </a>
                <span className="font-medium">
                  <a href={`/courses/${course.slug}`} className="hover:text-blue-600">{course.title}</a>
                </span>
              </td>
              <td className="py-3 px-4 text-left">{course.studentsCount}</td>
              <td className="py-3 px-4 text-left">{course.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default InstructorRecentCourses;