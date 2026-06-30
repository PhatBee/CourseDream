import { AlertTriangle } from "lucide-react";

const CancelModal = ({ isOpen, onClose, onSaveDraft, onExit }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-6 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="text-yellow-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Thay đổi chưa lưu</h3>
                <p className="text-gray-600 mb-6">
                    Bạn có thay đổi chưa được lưu. Bạn có muốn lưu khóa học này dưới dạng bản nháp trước khi thoát?
                </p>
                <div className="flex flex-col gap-3">
                    <button onClick={onSaveDraft} className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">
                        Lưu Bản Nháp & Thoát
                    </button>
                    <button onClick={onExit} className="w-full py-2.5 border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition">
                        Không lưu & Thoát
                    </button>
                    <button onClick={onClose} className="w-full py-2.5 text-gray-500 font-medium hover:text-gray-700">
                        Hủy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CancelModal;
