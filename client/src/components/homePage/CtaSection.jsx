import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CtaSection = () => {
  // Danh sách lợi ích khi tham gia
  const benefits = [
    "Access Your Class anywhere",
    "Flexible Course Plan",
    "Quality Assurance",
    "Cost Effectiveness",
    "The Most World Class Instructors"
  ];

  return (
    <section className="py-20 bg-indigo-900 text-white relative overflow-hidden">
      {/* Background decor (giả lập ảnh nền bg-3, bg-4) */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-30 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-600 rounded-full blur-[100px] opacity-30 -translate-x-1/2 translate-y-1/3"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-12">
           
           {/* Ảnh minh họa bên trái */}
           <div className="w-full md:w-1/2 flex justify-center md:justify-start" data-aos="fade-right">
             <img 
                src="https://dreamslms.dreamstechnologies.com/html/template/assets/img/feature/feature-17.svg" 
                alt="Share Knowledge" 
                className="rounded-2xl shadow-2xl transform -rotate-2 hover:rotate-0 transition-all duration-500 border-4 border-white/10" 
             />
           </div>

           {/* Nội dung bên phải */}
           <div className="w-full md:w-1/2" data-aos="fade-left">
             <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
               Want to share your knowledge? <br/>
               <span className="text-indigo-300">Join us a Mentor</span>
             </h2>
             <p className="text-indigo-100 mb-8 text-lg opacity-90">
               High-definition video is video of higher resolution and quality than standard-definition. While there is no standardized meaning for high-definition, generally any video.
             </p>
             
             <ul className="space-y-4 mb-10">
               {benefits.map((item, i) =>(
                 <li key={i} className="flex items-center gap-3">
                   <div className="bg-green-500/20 p-1.5 rounded-full shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                   </div>
                   <span className="font-medium">{item}</span>
                 </li>
               ))}
             </ul>
             
             <div className="flex gap-4">
                <Link to="/become-instructor" className="bg-white text-indigo-900 px-8 py-3.5 rounded-lg font-bold hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                  Register as Instructor <ArrowRight className="w-4 h-4" />
                </Link>
             </div>
           </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;