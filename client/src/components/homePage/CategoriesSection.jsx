import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const CategoriesSection = () => {
  // Giả sử bạn có categorySlice
  const { items: categories } = useSelector((state) => state.categories); 

  // Nếu chưa có API category, bạn có thể fallback về mảng tĩnh tạm thời
  const displayCategories = categories?.length > 0 ? categories : [];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center md:text-left mb-10">
          <span className="text-indigo-600 font-bold text-sm uppercase">Favourite Course</span>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">Top Category</h2>
        </div>
        
        <div className="flex flex-wrap justify-center md:justify-start gap-6">
          {displayCategories.map((cat) => (
            <Link 
              to={`/courses?category=${cat.slug || cat._id}`} 
              key={cat._id} 
              className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 cursor-pointer transition-all min-w-[200px]"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-xl">
                {/* Nếu có icon từ API thì dùng, không thì dùng chữ cái đầu */}
                {cat.icon || cat.name.charAt(0)}
              </div>
              <div>
                <h5 className="font-bold text-gray-900">{cat.name}</h5>
                {/* Giả sử API trả về số lượng courseCount */}
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