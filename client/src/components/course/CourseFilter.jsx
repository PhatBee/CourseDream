import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { categoryApi } from '../../api/categoryApi';
import { userApi } from '../../api/userApi';
import { courseApi } from '../../api/courseApi';

// Accordion section giữ nguyên hiệu ứng
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

const CheckboxItem = ({ label, checked, onChange, count }) => (
  <label className="flex items-center cursor-pointer group">
    <div className="relative flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 checked:border-rose-500 checked:bg-rose-500 transition-all"
      />
      <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 14" fill="none">
        <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <span className="ml-3 text-gray-600 group-hover:text-gray-900 text-sm flex-1">{label}</span>
    {count !== undefined && <span className="text-xs text-gray-400">({count})</span>}
  </label>
);

const prices = [
  { label: "All", value: "" },
  { label: "Free", value: "free" },
  { label: "Paid", value: "paid" }
];

const levels = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
  { label: "All Levels", value: "alllevels" }
];

const CourseFilter = ({ onFilterChange }) => {
  // State cho filter
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState([]); // array for checkbox
  const [instructor, setInstructor] = useState([]); // array for checkbox
  const [price, setPrice] = useState([]);
  const [level, setLevel] = useState([]); // array for checkbox

  // State cho dữ liệu động
  const [categories, setCategories] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [levelsData, setLevelsData] = useState([]);
  const [priceStats, setPriceStats] = useState({});
  const [levelStats, setLevelStats] = useState({});

  // Lấy dữ liệu động từ API khi mount
  useEffect(() => {
    categoryApi.getAllCategoriesSimple().then(res => setCategories(res.data?.data || []));
    userApi.getInstructors().then(res => setInstructors(res.data || []));
    courseApi.getLevels().then(res => setLevelsData(res.data || []));
    courseApi.getCourseStats().then(res => {
      setPriceStats(res.data.price || {});
      setLevelStats(res.data.level || {});
    });
  }, []);

  // Gửi filter lên cha mỗi khi thay đổi
  useEffect(() => {
    onFilterChange && onFilterChange({
      q: keyword,
      category,
      instructor,
      price,
      level
    });
    // eslint-disable-next-line
  }, [keyword, category, instructor, price, level]);

  // Clear All
  const handleClearAll = () => {
    setKeyword("");
    setCategory([]);
    setInstructor([]);
    setPrice([]);
    setLevel([]);
  };

  // Checkbox handler
  const handleCheckbox = (value, arr, setArr) => {
    setArr(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-rose-500"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg></span>
          Filters
        </h3>
        <button
          className="text-sm font-semibold text-rose-500 hover:text-rose-700 hover:underline transition-all"
          onClick={handleClearAll}
        >
          Clear All
        </button>
      </div>

      {/* Search trong Filter */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search keywords..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-400 transition-all"
        />
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      {/* Categories */}
      <FilterSection title="Categories">
        {categories && categories.map && categories.map(cat => (
          <CheckboxItem
            key={cat._id}
            label={cat.name}
            checked={category.includes(cat._id)}
            onChange={() => handleCheckbox(cat._id, category, setCategory)}
            count={cat.courseCount}
          />
        ))}
      </FilterSection>

      {/* Instructors */}
      <FilterSection title="Instructors">
        {instructors.map(ins => (
          <CheckboxItem
            key={ins._id}
            label={ins.name}
            checked={instructor.includes(ins._id)}
            onChange={() => handleCheckbox(ins._id, instructor, setInstructor)}
          />
        ))}
      </FilterSection>

      {/* Price */}
      <FilterSection title="Price">
        {prices.map(p => (
          <CheckboxItem
            key={p.value}
            label={
              <>
                {p.label}
                {typeof priceStats[p.value === "" ? "all" : p.value] === "number" &&
                  <span className="text-xs text-gray-400 ml-1">
                    ({priceStats[p.value === "" ? "all" : p.value]})
                  </span>
                }
              </>
            }
            checked={price.includes(p.value)}
            onChange={() => handleCheckbox(p.value, price, setPrice)}
          />
        ))}
      </FilterSection>

      {/* Level */}
      <FilterSection title="Level" defaultOpen={false}>
        {levels.map(lv => (
          <CheckboxItem
            key={lv.value}
            label={
              <>
                {lv.label}
                {typeof levelStats[lv.value] === "number" &&
                  <span className="text-xs text-gray-400 ml-1">
                    ({levelStats[lv.value]})
                  </span>
                }
              </>
            }
            checked={level.includes(lv.value)}
            onChange={() => handleCheckbox(lv.value, level, setLevel)}
          />
        ))}
      </FilterSection>
    </div>
  );
};

export default CourseFilter;