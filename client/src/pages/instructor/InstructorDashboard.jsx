import React, { useEffect, useState } from "react";
import { getInstructorStats } from "../../api/instructorApi";
import InstructorStatsCards from "../../components/instructor/InstructorStatsCards";
import InstructorRecentCourses from "../../components/instructor/InstructorRecentCreateCourses";
import InstructorEarningsChart from "../../components/instructor/InstructorEarningsChart";

const InstructorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInstructorStats().then((res) => {
      setStats(res.data);
      setLoading(false);
    });
  }, []);

  if (loading)
    return <div className="text-center py-12">Đang tải thống kê...</div>;
  if (!stats)
    return <div className="text-center py-12">Không có dữ liệu thống kê.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <InstructorStatsCards stats={stats} />
      <InstructorEarningsChart earningsByYear={stats.earningsByYear || []} />
      <InstructorRecentCourses recentCourses={stats.recentCourses || []} />
    </div>
  );
};

export default InstructorDashboard;