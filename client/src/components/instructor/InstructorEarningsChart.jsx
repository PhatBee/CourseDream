import React from "react";
import Chart from "react-apexcharts";

const InstructorEarningsChart = ({ earningsByYear }) => {
  if (!earningsByYear || earningsByYear.length === 0) return null;

  const months = earningsByYear.map(e => e.month);
  const amounts = earningsByYear.map(e => e.amount);

  const options = {
    chart: { type: "bar", toolbar: { show: false } },
    xaxis: { categories: months },
    colors: ["#6366f1"],
    grid: { borderColor: "#e5e7eb" },
  };
  const series = [{ name: "Earnings", data: amounts }];

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <h5 className="font-bold text-lg">Earnings by Year</h5>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">
            <i className="isax isax-calendar"></i>
          </span>
          <input
            type="text"
            className="border rounded px-2 py-1 text-sm"
            placeholder="dd/mm/yyyy - dd/mm/yyyy"
            readOnly
          />
        </div>
      </div>
      <Chart options={options} series={series} type="bar" height={300} />
    </div>
  );
};

export default InstructorEarningsChart;