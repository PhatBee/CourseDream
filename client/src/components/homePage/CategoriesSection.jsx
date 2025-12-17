import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const CategoriesSection = () => {
  const { items: categories } = useSelector((state) => state.categories); 
  const displayCategories = categories?.length > 0 ? categories : [];

  return (
    <section className="py-20 bg-white">
      {/* Dùng max-w-7xl để thẳng hàng với Hero */}
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Căn Trái */}
        <div className="text-left mb-10">
          <span className="text-rose-500 font-bold text-sm uppercase tracking-wider">Favourite Course</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2">Top Category</h2>
        </div>
        
        <div className="flex flex-wrap justify-start gap-6">
          {displayCategories.map((cat) => (
            <Link 
              to={`/courses?category=${cat._id}`} 
              key={cat._id} 
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-rose-200 cursor-pointer transition-all duration-300 min-w-[220px] group"
            >
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-xl group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
                {cat.icon || cat.name.charAt(0)}
              </div>
              <div>
                <h5 className="font-bold text-gray-900 group-hover:text-rose-600 transition-colors">{cat.name}</h5>
                <p className="text-xs text-gray-500">{cat.courseCount || 0} Courses</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;