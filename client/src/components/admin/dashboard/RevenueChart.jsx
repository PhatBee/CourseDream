import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRevenueAnalytics } from '../../../features/admin/adminSlice';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Loader } from 'lucide-react';

const RevenueChart = () => {
  const dispatch = useDispatch();
  const { revenueData, isLoading } = useSelector((state) => state.admin);
  const [filter, setFilter] = useState('year');

  useEffect(() => {
    dispatch(fetchRevenueAnalytics(filter));
  }, [dispatch, filter]);

  const chartData = revenueData?.chartData || [];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full text-left">
      {/* Header + Filter */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Revenue Analytics</h3>
        </div>
        <select 
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-rose-500 cursor-pointer"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Chart */}
      <div className="h-[300px] w-full relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <Loader className="animate-spin text-rose-500" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9ca3af', fontSize: 12}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9ca3af', fontSize: 12}}
                tickFormatter={(val) => `${val/1000}k`} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#e11d48" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default RevenueChart;