import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // 1. Import Portal
import { X, Copy, Check, Facebook, Twitter } from 'lucide-react';

const ShareModal = ({ isOpen, onClose, url, title }) => {
  const [isCopied, setIsCopied] = useState(false);

  // 2. Ngăn cuộn trang khi mở modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const openCenteredPopup = (url, title, w, h) => {
    const left = (window.innerWidth - w) / 2 + window.screenLeft;
    const top = (window.innerHeight - h) / 2 + window.screenTop;
    
    // Các tham số cửa sổ (không thanh công cụ, không thanh cuộn...)
    const options = `
      scrollbars=no,
      resizable=no,
      status=no,
      location=no,
      toolbar=no,
      menubar=no,
      width=${w},
      height=${h},
      left=${left},
      top=${top}
    `;
    
    window.open(url, title, options);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFacebookShare = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    openCenteredPopup(shareUrl, 'Share on Facebook', 600, 400);
  };

  const handleTwitterShare = () => {
    const text = `Check out this amazing course: ${title}`;
    const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    openCenteredPopup(shareUrl, 'Share on Twitter', 600, 400);
  };

  // 3. Nội dung Modal
  const modalContent = (
    // Lớp phủ full màn hình (z-index cực cao để đè lên tất cả)
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">Share this course</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button 
            onClick={handleFacebookShare}
            className="flex items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-[#F0F9FF] hover:border-blue-200 hover:text-blue-600 transition-all group"
          >
            <Facebook size={20} className="text-blue-600" />
            <span className="font-medium text-gray-700 group-hover:text-blue-700">Facebook</span>
          </button>

          <button 
            onClick={handleTwitterShare}
            className="flex items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-400 hover:text-black transition-all group"
          >
            <Twitter size={20} className="text-sky-500" />
            <span className="font-medium text-gray-700 group-hover:text-black">Twitter</span>
          </button>
        </div>

        {/* Copy Link */}
        <div className="relative">
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            Page Link
          </label>
          <div className="flex items-center shadow-sm rounded-lg overflow-hidden">
            <input 
              type="text" 
              readOnly 
              value={url} 
              className="w-full bg-gray-50 border border-gray-300 border-r-0 text-gray-600 text-sm rounded-l-lg focus:ring-0 focus:border-gray-300 block p-3 outline-none"
            />
            <button 
              onClick={handleCopy}
              className={`p-3 text-sm font-medium text-white rounded-r-lg border border-l-0 transition-all w-28 flex justify-center items-center
                ${isCopied 
                  ? 'bg-green-500 border-green-500 hover:bg-green-600' 
                  : 'bg-gray-900 border-gray-900 hover:bg-gray-800'
                }`}
            >
              {isCopied ? (
                <><Check size={16} className="mr-1.5" /> Copied</>
              ) : (
                <><Copy size={16} className="mr-1.5" /> Copy</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ShareModal;