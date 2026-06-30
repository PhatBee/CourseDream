import React from 'react';
import { Trash2, PlusCircle, AlertCircle } from 'lucide-react';

const DynamicListInput = ({
    title,
    items,
    onAdd,
    onRemove,
    onChange,
    placeholder,
    hasError = false,   // highlight toàn bộ container khi lỗi
    errorMsg = ''       // message hiển thị bên dưới
}) => (
    <div className={`p-4 rounded-lg border transition-all ${hasError
            ? 'border-red-300 bg-red-50/40 ring-2 ring-red-300'
            : 'border-gray-200 bg-gray-50'
        }`}>
        <h6 className={`font-semibold mb-3 flex items-center gap-1.5 ${hasError ? 'text-red-600' : 'text-gray-700'}`}>
            {hasError && <AlertCircle size={14} className="flex-shrink-0" />}
            {title}
            {hasError && <span className="text-xs font-normal text-red-500 ml-1">— Bắt buộc</span>}
        </h6>

        {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2 animate-fadeIn">
                <input
                    type="text"
                    value={item}
                    onChange={(e) => onChange(idx, e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 outline-none bg-white transition-all ${hasError && !item.trim()
                            ? 'border-red-300 focus:ring-red-300'
                            : 'focus:ring-rose-400'
                        }`}
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
            className={`text-sm font-medium flex items-center mt-2 transition-colors ${hasError
                    ? 'text-red-600 hover:text-red-800'
                    : 'text-blue-600 hover:text-blue-800'
                }`}
        >
            <PlusCircle size={16} className="mr-1" />
            {items.length === 0 ? 'Thêm mục đầu tiên' : 'Thêm mục mới'}
        </button>

        {hasError && errorMsg && (
            <p className="mt-2 flex items-center gap-1 text-xs text-red-500 font-medium animate-fadeIn">
                <AlertCircle size={12} className="flex-shrink-0" /> {errorMsg}
            </p>
        )}
    </div>
);

export default DynamicListInput;