import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X } from 'lucide-react';

const RemoveModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Remove Item", 
  message = "Are you sure you want to remove this item? This action cannot be undone.",
  confirmLabel = "Yes, Remove",
  cancelLabel = "Cancel",
  isDeleting = false // Trạng thái loading khi đang gọi API xóa
}) => {
  
  // Ngăn cuộn trang khi mở modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      {/* Overlay - click để đóng */}
      <div className="absolute inset-0" onClick={!isDeleting ? onClose : undefined}></div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative z-10 animate-scaleIn text-center">
        {/* Nút đóng góc phải */}
        <button 
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <X size={20} />
        </button>

        {/* Icon Thùng rác */}
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="text-red-500 w-8 h-8" />
        </div>

        {/* Tiêu đề & Nội dung */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-2.5 rounded-full bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors min-w-[100px] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-6 py-2.5 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 shadow-lg shadow-red-200 transition-all transform hover:scale-105 min-w-[140px] flex justify-center items-center disabled:transform-none disabled:opacity-70"
          >
            {isDeleting ? (
                // Simple Loading Spinner nhỏ
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  // Sử dụng createPortal để render modal ra ngoài root div (tránh bị ảnh hưởng bởi z-index của cha)
  if (typeof document !== 'undefined') {
      return createPortal(modalContent, document.body);
  }
  return null;
};

export default RemoveModal;