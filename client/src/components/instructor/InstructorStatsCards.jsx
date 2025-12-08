import React from "react";

const statsConfig = [
  {
    key: "enrolledCourses",
    label: "Enrolled Courses",
    icon: "/icons/graduation.svg",
    bg: "bg-violet-100",
    text: "text-black",
    value: (stats) => stats.enrolledCourses || 0,
  },
  {
    key: "activeCourses",
    label: "Active Courses",
    icon: "/icons/book.svg",
    bg: "bg-pink-100",
    text: "text-black",
    value: (stats) => stats.activeCourses || 0,
  },
  {
    key: "completedCourses",
    label: "Completed Courses",
    icon: "/icons/bookmark.svg",
    bg: "bg-green-100",
    text: "text-black",
    value: (stats) => stats.completedCourses || 0,
  },
  {
    key: "totalStudents",
    label: "Total Students",
    icon: "/icons/user-octagon.svg",
    bg: "bg-purple-100",
    text: "text-black",
    value: (stats) => stats.totalStudents || 0,
  },
  {
    key: "totalCourses",
    label: "Total Courses",
    icon: "/icons/book-2.svg",
    bg: "bg-cyan-100",
    text: "text-black",
    value: (stats) => stats.totalCourses || 0,
  },
  {
    key: "totalEarnings",
    label: "Total Earnings",
    icon: "/icons/money-add.svg",
    bg: "bg-purple-100",
    text: "text-black",
    value: (stats) => (stats.totalEarnings || 0) + "đ",
  },
];

const InstructorStatsCards = ({ stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
    {statsConfig.map((item) => (
      <div key={item.key} className="bg-white rounded-xl shadow flex items-center gap-4 p-6">
        <span className={`w-14 h-14 flex items-center justify-center rounded-xl ${item.bg}`}>
          <img src={item.icon} alt="" className="w-8 h-8" />
        </span>
        <div className="flex flex-col items-start">
          <div className="text-gray-500 text-base">{item.label}</div>
          <div className={`text-2xl font-bold text-black ${item.text}`}>{item.value(stats)}</div>
        </div>
      </div>
    ))}
  </div>
);

export default InstructorStatsCards;