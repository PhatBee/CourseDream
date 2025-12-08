import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldAlert, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BanUserModal = ({ isOpen, onClose, onConfirm, user, isBanning }) => {
    const [reason, setReason] = useState('');

    // Reset form khi mở modal
    useEffect(() => {
        if (isOpen) setReason('');
    }, [isOpen]);

    if (!isOpen || !user) return null;
    const handleConfirm = () => {
        if (isBanning) {
            if (!reason.trim()) {
                toast.error("Vui lòng nhập lý do khóa tài khoản!");
                return;
            }
            toast.success("Đã khóa tài khoản người dùng!");
        }
        else {
            toast.success("Đã mở khóa tài khoản người dùng!");
        }
        onConfirm(user._id, reason);
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            {/* Overlay click to close */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 animate-scaleIn">

                {/* Header */}
                <div className={`p-6 text-center ${isBanning ? 'bg-rose-50' : 'bg-green-50'}`}>
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 ${isBanning ? 'bg-rose-100 text-rose-500' : 'bg-green-100 text-green-500'}`}>
                        {isBanning ? <ShieldAlert size={32} /> : <CheckCircle size={32} />}
                    </div>
                    <h3 className={`text-xl font-bold ${isBanning ? 'text-rose-600' : 'text-green-600'}`}>
                        {isBanning ? 'Ban User Account' : 'Unban User Account'}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                        {isBanning
                            ? `Are you sure you want to ban ${user.name}?`
                            : `Are you sure you want to reactivate ${user.name}?`}
                    </p>
                </div>

                {/* Body */}
                <div className="p-6">
                    {isBanning ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for banning <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none text-sm"
                                placeholder="Ex: Violated community guidelines..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            ></textarea>
                            <p className="text-xs text-gray-400 mt-2">
                                This reason will be displayed to the user when they try to login.
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600 text-center">
                            The user will regain access to all features immediately.
                        </p>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={`flex-1 py-2.5 rounded-lg text-white font-medium shadow-md transition-colors
                ${isBanning
                                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
                                    : 'bg-green-500 hover:bg-green-600 shadow-green-200'
                                }`}
                        >
                            {isBanning ? 'Confirm Ban' : 'Confirm Unban'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default BanUserModal;
