import React from 'react';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const BlogSection = ({ blogs }) => {
  const defaultBlogs = [
    {
      id: 1,
      title: "Làm thế nào để tìm được người cố vấn hoàn hảo cho hành trình học tập của bạn",
      date: "2026",
      category: "Dịch vụ tư vấn",
      image: "https://placehold.co/400x250/e2e8f0/1e293b?text=Blog+Marketing",
      slug: "how-to-find-mentor"
    },
    {
      id: 2,
      title: "Giải phóng tiềm năng của bạn ở trường và xa hơn",
      date: "2026",
      category: "Thành tích nổi bật",
      image: "https://placehold.co/400x250/e2e8f0/1e293b?text=Blog+School",
      slug: "unlocking-potential"
    },
    {
      id: 3,
      title: "11 Mẹo sẽ giúp bạn có thêm khách hàng với kiến thức thiết kế",
      date: "2026",
      category: "Học tập",
      image: "https://placehold.co/400x250/e2e8f0/1e293b?text=Blog+Design",
      slug: "11-tips-design"
    }
  ];

  const displayBlogs = blogs && blogs.length > 0 ? blogs : defaultBlogs;

  return (
    <section className="py-24 bg-gray-50 relative">
      {/* Background decor: Hồng nhẹ */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* Header Căn Trái */}
        <div className="text-left mb-12">
          <span className="text-rose-500 font-bold text-sm uppercase tracking-wider">Bài viết mới nhất</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2 mb-3">Bài viết mới nhất</h2>
          <p className="text-gray-500 max-w-2xl">Cập nhật các bài viết mới nhất và thông tin chi tiết từ các chuyên gia hàng đầu của chúng tôi.</p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
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
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-rose-600 uppercase tracking-wide shadow-sm">
                  {blog.category}
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {blog.date}</span>
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Admin</span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-rose-600 transition-colors text-justify">
                  <Link to={`/blog/${blog.slug}`}>
                    {blog.title}
                  </Link>
                </h3>

                <Link to={`/blog/${blog.slug}`} className="inline-flex items-center text-sm font-bold text-rose-600 hover:text-rose-800 transition-colors mt-2">
                  Đọc Thêm <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Phần Thống kê nhỏ ở dưới (Stat Box) */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Stat 1 */}
            <div className="flex items-center justify-center gap-5 p-2">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-3xl shrink-0">
                🎓
              </div>
              <div className="text-left">
                <h3 className="text-3xl font-extrabold text-gray-900">3,490+</h3>
                <p className="text-gray-500 text-sm font-medium">Học viên đăng ký</p>
              </div>
            </div>
            {/* Stat 2 */}
            <div className="flex items-center justify-center gap-5 p-2">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-3xl shrink-0">
                💻
              </div>
              <div className="text-left">
                <h3 className="text-3xl font-extrabold text-gray-900">255+</h3>
                <p className="text-gray-500 text-sm font-medium">Khóa học</p>
              </div>
            </div>
            {/* Stat 3 */}
            <div className="flex items-center justify-center gap-5 p-2">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-3xl shrink-0">
                🌍
              </div>
              <div className="text-left">
                <h3 className="text-3xl font-extrabold text-gray-900">15+</h3>
                <p className="text-gray-500 text-sm font-medium">Quốc Gia</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default BlogSection;