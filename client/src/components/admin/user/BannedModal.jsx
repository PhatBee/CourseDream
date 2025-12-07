import React from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, X } from 'lucide-react';

const BannedModal = ({ isOpen, onClose, reason }) => {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
        
        {/* Header Màu Rose */}
        <div className="bg-rose-500 p-6 flex flex-col items-center justify-center text-white">
          <div className="bg-white/20 p-3 rounded-full mb-3 backdrop-blur-sm">
            <ShieldAlert size={40} className="text-white" />
          </div>
          <h3 className="text-2xl font-bold">Account Suspended</h3>
          <p className="text-rose-100 text-sm mt-1">Access Denied</p>
        </div>

        {/* Body */}
        <div className="p-8 text-center">
          <p className="text-gray-600 mb-2">
            We are sorry, but your account has been deactivated by the administrator.
          </p>
          
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 my-6 text-left">
            <p className="text-xs font-bold text-rose-400 uppercase tracking-wide mb-1">
              Reason for suspension:
            </p>
            <p className="text-gray-800 font-medium italic">
              "{reason || "Violation of Terms of Service"}"
            </p>
          </div>

          <p className="text-gray-400 text-xs mb-6">
            If you believe this is a mistake, please contact support.
          </p>

          <button 
            onClick={onClose}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default BannedModal;