import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Ban, CheckCircle, Eye } from 'lucide-react';
import { createPortal } from 'react-dom';

const ActionMenu = ({ user, onToggleBlock, onViewDetails }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  // Tính toán vị trí menu khi mở
  const toggleMenu = (e) => {
    e.stopPropagation();
    if (!isOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Hiển thị menu bên trái nút bấm, căn chỉnh top
      setMenuPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX - 160 // Trừ đi chiều rộng menu (khoảng 192px / 12rem)
      });
    }
    setIsOpen(!isOpen);
  };

  // Đóng menu khi click ra ngoài hoặc cuộn trang
  useEffect(() => {
    const closeMenu = () => setIsOpen(false);
    
    if (isOpen) {
      window.addEventListener('click', closeMenu);
      window.addEventListener('scroll', closeMenu);
      window.addEventListener('resize', closeMenu);
    }
    
    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('scroll', closeMenu);
      window.removeEventListener('resize', closeMenu);
    };
  }, [isOpen]);

  const menuContent = isOpen ? (
    <div 
      className="fixed z-[9999] w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 animate-fadeIn"
      style={{ top: menuPosition.top, left: menuPosition.left }}
      onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan ra ngoài làm đóng menu ngay lập tức
    >
      {/* Nút Ban/Unban */}
      <button
        onClick={() => {
          onToggleBlock();
          setIsOpen(false);
        }}
        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors font-medium
          ${user.isBlocked ? 'text-green-600' : 'text-red-600'}
        `}
      >
        {user.isBlocked ? (
          <>
            <CheckCircle size={16} /> Unban User
          </>
        ) : (
          <>
            <Ban size={16} /> Ban User
          </>
        )}
      </button>
      
      {/* Nút Xem chi tiết (Nếu cần) */}
      {onViewDetails && (
        <button 
          onClick={() => {
            onViewDetails();
            setIsOpen(false);
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
        >
          <Eye size={16} className="text-gray-400" /> View Details
        </button>
      )}
    </div>
  ) : null;

  return (
    <>
      <button 
        ref={buttonRef}
        onClick={toggleMenu}
        className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
      >
        <MoreVertical size={18} />
      </button>
      
      {/* Render menu ra ngoài body bằng Portal để không bị khuất */}
      {isOpen && createPortal(menuContent, document.body)}
    </>
  );
};

export default ActionMenu;