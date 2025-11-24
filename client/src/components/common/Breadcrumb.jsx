// src/components/Breadcrumb.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const formatBreadcrumb = (segment) => {
  if (!segment) return '';
  return segment
    .replace(/-/g, ' ') // đổi dấu gạch ngang thành khoảng trắng
    .replace(/\b\w/g, (char) => char.toUpperCase()); // viết hoa chữ cái đầu
};

const Breadcrumb = ({ title }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x); // loại bỏ rỗng

  return (
    <div className="bg-gray-100 py-6 text-center">
      <div className="container mx-auto px-4 max-w-7xl">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>

        <nav aria-label="breadcrumb">
          <ol className="flex justify-center items-center text-sm text-gray-500 mb-0">
            {/* Trang chủ */}
            <li>
              <Link to="/" className="hover:text-blue-600">Home</Link>
            </li>

            {pathnames.map((segment, index) => {
              const routeTo = '/' + pathnames.slice(0, index + 1).join('/');
              const isLast = index === pathnames.length - 1;

              return (
                <React.Fragment key={index}>
                  <li aria-hidden="true" className="mx-2">
                    <ChevronRight size={16} />
                  </li>

                  <li>
                    {isLast ? (
                      <span className="text-gray-700 font-medium">
                        {formatBreadcrumb(segment)}
                      </span>
                    ) : (
                      <Link to={routeTo} className="hover:text-blue-600">
                        {formatBreadcrumb(segment)}
                      </Link>
                    )}
                  </li>
                </React.Fragment>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
};

export default Breadcrumb;
