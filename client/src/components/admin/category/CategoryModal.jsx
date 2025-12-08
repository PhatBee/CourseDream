import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const CategoryModal = ({ isOpen, onClose, onConfirm, initialData, isEditing }) => {
  const [formData, setFormData] = useState({ name: '', icon: '' });

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || { name: '', icon: ''});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(formData);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative z-10 animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">
            {isEditing ? 'Edit Category' : 'Add New Category'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
              placeholder="e.g. Web Development"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon Class / Emoji</label>
            <div className="flex gap-3">
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                placeholder="e.g. 💻 or fa-code"
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
              />
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-xl border border-rose-100">
                {formData.icon || '?'}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 shadow-md shadow-rose-200 transition-all"
            >
              {isEditing ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CategoryModal;