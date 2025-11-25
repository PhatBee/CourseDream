import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

// Component con cho từng nhóm filter (Accordion)
const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-5">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full mb-4 group"
      >
        <h4 className="text-lg font-bold text-gray-800 group-hover:text-rose-500 transition-colors">{title}</h4>
        {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>
      
      <div className={`space-y-3 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </div>
  );
};

const CheckboxItem = ({ label, count }) => (
  <label className="flex items-center cursor-pointer group">
    <div className="relative flex items-center">
      <input type="checkbox" className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 checked:border-rose-500 checked:bg-rose-500 transition-all" />
      <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 14" fill="none">
        <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <span className="ml-3 text-gray-600 group-hover:text-gray-900 text-sm flex-1">{label}</span>
    {count && <span className="text-xs text-gray-400">({count})</span>}
  </label>
);

const CourseFilter = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-rose-500"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg></span>
          Filters
        </h3>
        <button className="text-sm font-semibold text-rose-500 hover:text-rose-700 hover:underline transition-all">
          Clear All
        </button>
      </div>

      {/* Search trong Filter */}
      <div className="relative mb-6">
        <input 
          type="text" 
          placeholder="Search keywords..." 
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-400 transition-all"
        />
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      {/* Categories */}
      <FilterSection title="Categories">
        <CheckboxItem label="Backend" count={3} />
        <CheckboxItem label="CSS" count={2} />
        <CheckboxItem label="Frontend" count={2} />
        <CheckboxItem label="General" count={2} />
        <CheckboxItem label="IT & Software" count={2} />
      </FilterSection>

      {/* Instructors */}
      <FilterSection title="Instructors">
        <CheckboxItem label="Keny White" count={10} />
        <CheckboxItem label="Hinata Hyuga" count={5} />
        <CheckboxItem label="John Doe" count={3} />
        <CheckboxItem label="Nicole Brown" count={8} />
      </FilterSection>

      {/* Price */}
      <FilterSection title="Price">
        <CheckboxItem label="All" count={10} />
        <CheckboxItem label="Free" count={5} />
        <CheckboxItem label="Paid" count={3} />
      </FilterSection>

      {/* Level */}
      <FilterSection title="Level" defaultOpen={false}>
        <CheckboxItem label="Beginner" count={10} />
        <CheckboxItem label="Intermediate" count={5} />
        <CheckboxItem label="Expert" count={3} />
      </FilterSection>

    </div>
  );
};

export default CourseFilter;