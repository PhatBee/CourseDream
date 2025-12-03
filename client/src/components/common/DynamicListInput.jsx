import React from 'react';
import { Trash2, PlusCircle } from 'lucide-react';

const DynamicListInput = ({ title, items, onAdd, onRemove, onChange, placeholder }) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h6 className="font-semibold text-gray-700 mb-3">{title}</h6>
        {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2 animate-fadeIn">
                <input
                    type="text"
                    value={item}
                    onChange={(e) => onChange(idx, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    placeholder={placeholder}
                />
                <button
                    onClick={() => onRemove(idx)}
                    className="text-red-500 hover:bg-red-100 p-2 rounded transition flex-shrink-0"
                    title="Remove item"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        ))}
        <button
            onClick={onAdd}
            className="text-blue-600 text-sm font-medium flex items-center mt-2 hover:text-blue-800 transition-colors"
        >
            <PlusCircle size={16} className="mr-1" /> Add New Item
        </button>
    </div>
);

export default DynamicListInput;