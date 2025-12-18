import React, { useState } from 'react';
import { Search, ArrowRight, Star, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();

    navigate(`/courses?q=${encodeURIComponent(searchTerm)}`);
  };
  return (
    // Đổi nền sang tông Rose/Red nhẹ
    <section className="relative bg-gradient-to-br from-rose-50 via-white to-orange-50 py-20 lg:py-28 overflow-hidden">

      {/* Background Decoration (Đổi màu blob sang đỏ/cam) */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-rose-200 rounded-full blur-3xl opacity-40 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-200 rounded-full blur-3xl opacity-40 translate-x-1/4 translate-y-1/4"></div>

      {/* Sử dụng max-w-7xl để mở rộng, px-6 để tạo lề an toàn */}
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left Content: Căn trái toàn bộ */}
          <div className="w-full lg:w-1/2 space-y-6 text-left">
            <span className="font-bold text-rose-600 tracking-wider uppercase text-sm inline-block">
              The Leader in Online Learning
            </span>

            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              Engaging & Accessible <br />
              <span className="text-rose-500">Online Courses</span> For All
            </h1>

            <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
              Our specialized online courses are designed to bring the classroom experience to you, no matter where you are.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="relative max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-11 pr-4 py-4 border-2 border-rose-100 rounded-2xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 sm:text-sm transition-all shadow-sm"
                placeholder="What do you want to learn today?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="absolute inset-y-2 right-2 px-6 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-colors shadow-md flex items-center gap-2 group"
              >
                Search
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            {/* Trust Stats (Căn trái) */}
            <div className="pt-4">
              <p className="text-sm text-gray-500 font-medium mb-2">Trusted by over 15K Users worldwide</p>
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-900">290+</h2>
                <div className="flex items-center gap-1 text-yellow-500">
                  <span className="text-3xl font-bold text-gray-900 mr-2">4.4</span>
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="w-full lg:w-1/2">
            <div className="relative">
              {/* Link ảnh giữ nguyên */}
              <img
                src="https://d1kdu080g8vme4.cloudfront.net/files/topics/31589_ext_24_en_2.jpg?version=1743056864"
                alt="Hero Student"
                className="w-full h-auto rounded-2xl shadow-2xl shadow-rose-900/10 relative z-10 object-cover"
              />

              {/* Decor sau ảnh (Đổi màu sang Rose) */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg z-20 animate-bounce-slow hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="bg-rose-100 p-2 rounded-full">
                    <User className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Active Students</p>
                    <p className="font-bold text-gray-900">10k+</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;