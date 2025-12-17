import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CtaSection = () => {
  const benefits = [
    "Access Your Class anywhere",
    "Flexible Course Plan",
    "Quality Assurance",
    "Cost Effectiveness",
    "The Most World Class Instructors"
  ];

  return (
    // 1. Copy background gradient từ HeroSection
    <section className="relative bg-gradient-to-br from-rose-50 via-white to-orange-50 py-24 overflow-hidden">
      
      {/* 2. Copy các đốm màu trang trí (Decoration Blobs) từ HeroSection */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-rose-200 rounded-full blur-3xl opacity-40 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-200 rounded-full blur-3xl opacity-40 translate-x-1/4 translate-y-1/4"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-16">
           
           {/* Ảnh minh họa */}
           <div className="w-full md:w-1/2 flex justify-center md:justify-start">
             <img 
                src="https://dreamslms.dreamstechnologies.com/html/template/assets/img/feature/feature-17.svg" 
                alt="Share Knowledge" 
                className="rounded-2xl shadow-xl transform hover:-translate-y-2 transition-all duration-500" 
             />
           </div>

           {/* Nội dung bên phải */}
           <div className="w-full md:w-1/2 text-left">
             <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
               Want to share your knowledge? <br/>
               <span className="text-rose-500">Join us a Mentor</span>
             </h2>
             <p className="text-gray-600 mb-8 text-lg">
               High-definition video is video of higher resolution and quality than standard-definition. While there is no standardized meaning for high-definition, generally any video.
             </p>
             
             <ul className="space-y-4 mb-10">
               {benefits.map((item, i) =>(
                 <li key={i} className="flex items-center gap-3">
                   <div className="bg-green-100 p-1 rounded-full shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                   </div>
                   <span className="font-medium text-gray-700">{item}</span>
                 </li>
               ))}
             </ul>
             
             <div>
                <Link to="profile/become-instructor" className="inline-flex items-center gap-2 bg-rose-600 text-white px-8 py-4 rounded-full font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">
                  Register as Instructor <ArrowRight className="w-5 h-5" />
                </Link>
             </div>
           </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;