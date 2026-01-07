import React from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';

const CourseListHeader = ({ totalCourses, viewMode, setViewMode }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
      
      {/* Result Count */}
      <p className="text-gray-600 text-sm">
        Showing <span className="font-bold text-gray-900">1-9</span> of <span className="font-bold text-gray-900">{totalCourses}</span> results
      </p>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* View Toggle Buttons */}
        <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <List size={18} />
          </button>
        </div>

        {/* Sort Dropdown */}
        {/* <select className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-100 cursor-pointer hover:border-rose-300 transition-colors">
          <option>Newly Published</option>
          <option>Price: Low to High</option>
          <option>Price: High to Low</option>
          <option>Rating: High to Low</option>
        </select> */}

        {/* Search Input (Optional - as seen in screenshot) */}
        {/* <div className="relative hidden md:block">
           <input 
             type="text" 
             placeholder="Search..." 
             className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-100 w-[200px]"
           />
           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div> */}
      </div>
    </div>
  );
};

export default CourseListHeader;