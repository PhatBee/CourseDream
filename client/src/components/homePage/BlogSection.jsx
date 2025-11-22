import React from 'react';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const BlogSection = ({ blogs }) => {
  // Fallback data nếu chưa có API thật
  const defaultBlogs = [
    {
      id: 1,
      title: "How to Find the Perfect Mentor for Your Academic Journey",
      date: "May 15, 2024",
      category: "Marketing",
      image: "https://placehold.co/400x250/e2e8f0/1e293b?text=Blog+Marketing",
      slug: "how-to-find-mentor"
    },
    {
      id: 2,
      title: "Unlocking Your Potential in School and Beyond",
      date: "Jun 22, 2024",
      category: "Statistics",
      image: "https://placehold.co/400x250/e2e8f0/1e293b?text=Blog+School",
      slug: "unlocking-potential"
    },
    {
      id: 3,
      title: "11 Tips to Help You Get New Clients with Design Knowledge",
      date: "Aug 05, 2024",
      category: "Learning",
      image: "https://placehold.co/400x250/e2e8f0/1e293b?text=Blog+Design",
      slug: "11-tips-design"
    }
  ];

  const displayBlogs = blogs && blogs.length > 0 ? blogs : defaultBlogs;

  return (
    <section className="py-20 bg-gray-50 relative">
        {/* Background decor */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute top-20 left-10 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
             <div className="absolute bottom-20 right-10 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 max-w-2xl mx-auto" data-aos="fade-up">
           <h2 className="text-3xl font-bold text-gray-900 mb-3">Latest Blogs</h2>
           <p className="text-gray-500">Dont Miss Stay Updated with the Latest Articles and Insights from our top experts.</p>
        </div>
        
        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {displayBlogs.map((blog) => (
            <div key={blog.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden border border-gray-100">
              <div className="relative overflow-hidden h-56">
                <Link to={`/blog/${blog.slug}`}>
                    <img 
                        src={blog.image} 
                        alt={blog.title} 
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
                    />
                </Link>
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-indigo-600 uppercase tracking-wide">
                    {blog.category}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {blog.date}</span>
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Admin</span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                  <Link to={`/blog/${blog.slug}`}>
                    {blog.title}
                  </Link>
                </h3>
                
                <Link to={`/blog/${blog.slug}`} className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mt-2">
                    Read More <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Phần Thống kê nhỏ ở dưới (Enroll Group) - Giống template gốc */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12" data-aos="fade-up">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                 {/* Stat 1 */}
                 <div className="flex items-center justify-center gap-4 p-4">
                     <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-3xl">
                         🎓
                     </div>
                     <div>
                         <h3 className="text-3xl font-bold text-gray-900">3,490+</h3>
                         <p className="text-gray-500 text-sm font-medium">Students Enrolled</p>
                     </div>
                 </div>
                 {/* Stat 2 */}
                 <div className="flex items-center justify-center gap-4 p-4">
                     <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-3xl">
                         💻
                     </div>
                     <div>
                         <h3 className="text-3xl font-bold text-gray-900">255+</h3>
                         <p className="text-gray-500 text-sm font-medium">Total Courses</p>
                     </div>
                 </div>
                 {/* Stat 3 */}
                 <div className="flex items-center justify-center gap-4 p-4">
                     <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center text-3xl">
                         🌍
                     </div>
                     <div>
                         <h3 className="text-3xl font-bold text-gray-900">15+</h3>
                         <p className="text-gray-500 text-sm font-medium">Countries</p>
                     </div>
                 </div>
             </div>
        </div>

      </div>
    </section>
  );
};

export default BlogSection;