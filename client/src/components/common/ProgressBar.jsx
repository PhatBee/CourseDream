import React from 'react';

const ProgressBar = ({ percentage, height = "h-2", color = "bg-green-500" }) => {
  const width = Math.min(100, Math.max(0, percentage));

  return (
    <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
      <div 
        className={`${color} ${height} rounded-full transition-all duration-500 ease-out`} 
        style={{ width: `${width}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;