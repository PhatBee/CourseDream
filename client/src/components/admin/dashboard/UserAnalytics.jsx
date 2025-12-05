import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#e11d48', '#e5e7eb'];

const UserAnalytics = ({ totalStudents, activeStudents }) => {
  const inactiveStudents = totalStudents - activeStudents;
  
  const data = [
    { name: 'Enrolled', value: activeStudents },
    { name: 'Registered Only', value: inactiveStudents },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full text-left">
      <h3 className="text-lg font-bold text-gray-800 mb-1">Student Overview</h3>

      <div className="flex-1 min-h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} stroke="none"/>
              ))}
            </Pie>
            <Tooltip />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              formatter={(value, entry) => (
                <span className="text-sm text-gray-600 ml-1">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Số tổng ở giữa biểu đồ */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
          <span className="text-2xl font-bold text-gray-800">{totalStudents}</span>
          <span className="text-xs text-gray-400 uppercase">Total</span>
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics;