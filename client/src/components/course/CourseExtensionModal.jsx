import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, CreditCard, Award } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { extendEnrollmentThunk } from '../../features/enrollment/enrollmentSlice';
import ReactDOM from 'react-dom';
import { toast } from 'react-hot-toast';

const CourseExtensionModal = ({ isOpen, onClose, enrollment }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.enrollment);
  const [selectedPackage, setSelectedPackage] = useState('2weeks');
  const [paymentMethod, setPaymentMethod] = useState('vnpay');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSelectedPackage('2weeks');
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !enrollment || !enrollment.course) return null;

  const paymentMethods = [
    {
      id: "vnpay",
      label: "VNPAY",
      icon: "./VNPAY.svg",
      description: "Thanh toán qua VNPAY",
    },
    {
      id: "momo",
      label: "MoMo",
      icon: "./MOMO.svg",
      description: "Ví điện tử MoMo",
    },
    {
      id: "zalopay",
      label: "ZaloPay",
      icon: "./ZaloPay.svg",
      description: "Ví điện tử ZaloPay",
    },
  ];

  const { course, extensionCount = 0 } = enrollment;
  const durationInWeeks = course.durationInWeeks || 12;
  const basePrice = course.priceDiscount !== undefined ? course.priceDiscount : (course.price || 0);

  let packages = [
    {
      id: '2weeks',
      name: 'Gói 2 tuần',
      duration: '2 tuần',
      price: basePrice === 0 ? 20000 : Math.round(basePrice * (2 / durationInWeeks)),
      description: 'Gia hạn nhanh để hoàn thành nốt bài học',
      discountLabel: null,
    },
    {
      id: '4weeks',
      name: 'Gói 1 tháng',
      duration: '4 tuần',
      price: basePrice === 0 ? 35000 : Math.round((basePrice * (4 / durationInWeeks)) * 0.95),
      description: 'Tiết kiệm 5% - Đủ thời gian ôn tập sâu',
      discountLabel: basePrice === 0 ? null : 'Giảm 5%',
    },
    {
      id: 'full',
      name: 'Gói trọn vẹn',
      duration: `${durationInWeeks} tuần`,
      price: basePrice === 0 ? 66000 : Math.round(basePrice * 0.7),
      description: `Tiết kiệm 30% - Bằng thời gian gốc (${durationInWeeks} tuần)`,
      discountLabel: basePrice === 0 ? null : 'Giảm 30%',
    },
  ];

  if (durationInWeeks <= 4) {
    packages = packages.filter(pkg => pkg.id !== 'full');
  }

  const formatPrice = (amount) => {
    if (amount === 0) return 'MIỄN PHÍ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleConfirmExtension = async () => {
    try {
      const packageIdToSend = extensionCount === 0 ? '2weeks' : selectedPackage;

      const result = await dispatch(
        extendEnrollmentThunk({
          enrollmentId: enrollment._id,
          packageId: packageIdToSend,
          paymentMethod: extensionCount === 0 ? 'free' : paymentMethod,
          platform: 'web'
        })
      ).unwrap();

      if (result.isPaid && result.paymentUrl) {
        toast.loading('Đang chuyển hướng đến cổng thanh toán...');
        window.location.href = result.paymentUrl;
      } else {
        toast.success(result.message || 'Gia hạn khóa học thành công!');
        onClose();
      }
    } catch (err) {
      toast.error(err || 'Đã có lỗi xảy ra trong quá trình gia hạn.');
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden transform transition-all flex flex-col max-h-[90vh]">

        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="font-bold text-gray-900 text-lg text-justify">Gia hạn khóa học</h3>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{course.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {extensionCount === 0 ? (
            /* Ưu đãi Lần đầu tiên gia hạn */
            <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-xl p-5 text-center">
              <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-full mb-3">
                <Award size={32} />
              </div>
              <h4 className="font-bold text-emerald-800 text-base mb-1">Món quà học tập dành cho bạn!</h4>
              <p className="text-sm text-emerald-700 leading-relaxed mb-3">
                Đây là lần đầu tiên bạn gia hạn khóa học này. Hệ thống gửi tặng bạn <span className="font-bold">2 tuần học hoàn toàn MIỄN PHÍ</span>.
              </p>
              <div className="inline-block bg-white border border-emerald-200 text-emerald-700 font-semibold px-4 py-2 rounded-lg text-sm shadow-sm">
                Thời gian: thêm 2 tuần truy cập
              </div>
            </div>
          ) : (
            /* Gia hạn từ lần thứ 2 trở đi */
            <>
              <p className="text-sm text-gray-600 mb-2">
                Khóa học đã hết hạn. Vui lòng chọn một trong các gói gia hạn phù hợp dưới đây để tiếp tục lộ trình học tập:
              </p>

              <div className="space-y-3">
                {packages.map((pkg) => (
                  <label
                    key={pkg.id}
                    className={`group flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:border-rose-300
                      ${selectedPackage === pkg.id
                        ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500'
                        : 'border-gray-200 bg-white'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="extensionPackage"
                        value={pkg.id}
                        checked={selectedPackage === pkg.id}
                        onChange={(e) => setSelectedPackage(e.target.value)}
                        disabled={isLoading}
                        className="mt-1 accent-rose-500 h-4 w-4 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm group-hover:text-rose-700 transition-colors">
                            {pkg.name}
                          </span>
                          {pkg.discountLabel && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                              {pkg.discountLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{pkg.description}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className={`font-bold text-sm ${selectedPackage === pkg.id ? 'text-rose-600' : 'text-gray-900'}`}>
                        {formatPrice(pkg.price)}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                        <Calendar size={10} /> +{pkg.duration}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Cổng thanh toán */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h5 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1.5">
                  <CreditCard size={16} className="text-gray-500" /> Chọn phương thức thanh toán
                </h5>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'vnpay', name: 'VNPAY', logo: '../public/vnpay.svg' },
                    { id: 'momo', name: 'MoMo', logo: '../public/momo.svg' },
                    { id: 'zalopay', name: 'ZaloPay', logo: '../public/zalopay.svg' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex flex-col items-center justify-center p-2.5 border rounded-lg transition-all duration-200
                        ${paymentMethod === method.id
                          ? 'border-rose-500 bg-rose-50/30 text-rose-700 ring-1 ring-rose-500 font-medium'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                    >
                      <img
                        src={method.logo}
                        alt={method.name}
                        className="w-10 h-10 object-contain mb-1"
                      />
                      <span className="text-xs">{method.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleConfirmExtension}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <CreditCard size={16} />
            {isLoading
              ? 'Đang xử lý...'
              : (extensionCount === 0 ? 'Nhận miễn phí ngay' : 'Gia hạn')
            }
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default CourseExtensionModal;