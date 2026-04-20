import React from "react";
import EnrollCard from "./EnrollCard";
import IncludesCard from "./IncludesCard";
import FeaturesCard from "./FeaturesCard";

const CourseSidebar = ({ course, isInstructor }) => {
  return (
    <div className="sticky top-24 space-y-6">
      {/* Cấp quyền isInstructor cho EnrollCard (Làm admin/Tác giả) */}
      <EnrollCard course={course} isInstructor={isInstructor} />
      <IncludesCard course={course} />
      <FeaturesCard course={course} />
    </div>
  );
};

export default CourseSidebar;
