import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { Search, ArrowRight, Star, User } from "lucide-react";

const HeroSection = () => {
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/courses?q=${encodeURIComponent(keyword.trim())}`);
    }
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
              Engaging & Accessible <br/>
              <span className="text-rose-500">Online Courses</span> For All
            </h1>
            
            <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
              Our specialized online courses are designed to bring the classroom experience to you, no matter where you are.
            </p>
            
            {/* Search Form */}
            <div className="bg-white p-2 rounded-lg shadow-xl shadow-rose-100/50 max-w-lg border border-gray-100">
              <form className="flex items-center gap-2" onSubmit={handleSearch}>
                <div className="flex items-center flex-1 px-3">
                  <Search className="w-5 h-5 text-gray-400 mr-2" />
                  <input 
                    type="text" 
                    placeholder="Search courses..." 
                    className="w-full p-2 focus:outline-none text-gray-700 placeholder-gray-400 bg-transparent" 
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                  />
                </div>
                <button className="bg-rose-600 hover:bg-rose-700 text-white p-3 rounded-md transition-colors shadow-lg shadow-rose-200">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>

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