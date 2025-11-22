import React from 'react';
import { Search, ArrowRight, Star, User } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative bg-indigo-50 py-20 overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-200 rounded-full blur-3xl opacity-50 translate-x-1/4 translate-y-1/4"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/2 space-y-6">
            <span className="font-bold text-indigo-600 tracking-wider uppercase text-sm">The Leader in Online Learning</span>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
              Engaging & Accessible <span className="text-indigo-600">Online Courses</span> For All
            </h1>
            <p className="text-lg text-gray-600">
              Our specialized online courses are designed to bring the classroom experience to you.
            </p>
            
            <div className="bg-white p-2 rounded-lg shadow-lg max-w-lg">
              <form className="flex flex-col md:flex-row gap-2">
                <div className="flex items-center flex-1 px-3 border-b md:border-b-0 md:border-r border-gray-200">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input type="text" placeholder="Search courses..." className="w-full p-3 focus:outline-none text-gray-700" />
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-md transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="relative">
               <img src="https://d1kdu080g8vme4.cloudfront.net/files/topics/31589_ext_24_en_2.jpg?version=1743056864" alt="Hero" className="w-full h-auto rounded-2xl shadow-2xl relative z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;