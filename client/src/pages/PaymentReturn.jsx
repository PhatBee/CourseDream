import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CheckCircle, XCircle, Home, BookOpen } from 'lucide-react';
import paymentService from '../features/payment/paymentService';
import { getCart } from '../features/cart/cartSlice'; // Import action lấy lại giỏ hàng

const PaymentReturn = () => {
    const location = useLocation();
    const dispatch = useDispatch();

    const [status, setStatus] = useState('loading'); // loading | success | failed
    const [message, setMessage] = useState('Đang xử lý kết quả thanh toán...');

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // Lấy query string từ URL (VD: ?vnp_Amount=...&vnp_ResponseCode=...)
                const searchParams = location.search;

                if (!searchParams) {
                    setStatus('failed');
                    setMessage('Không tìm thấy thông tin giao dịch.');
                    return;
                }

                // Gọi API Backend xác thực
                const res = await paymentService.verifyPayment(searchParams);

                if (res.success) {
                    setStatus('success');
                    setMessage('Thanh toán thành công! Bạn đã sở hữu khóa học.');

                    // CẬP NHẬT GIỎ HÀNG: Gọi getCart để Redux cập nhật lại số lượng (về 0 hoặc giảm đi)
                    dispatch(getCart());
                } else {
                    setStatus('failed');
                    setMessage(res.message || 'Giao dịch thất bại.');
                }
            } catch (error) {
                console.error(error);
                setStatus('failed');
                setMessage('Có lỗi xảy ra trong quá trình xử lý.');
            }
        };

        // Chạy 1 lần khi mount
        verifyPayment();
    }, [location, dispatch]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">

                    {status === 'loading' && (
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                            <h2 className="text-xl font-medium text-gray-900">Đang xác thực giao dịch...</h2>
                            <p className="text-gray-500 mt-2">Vui lòng không tắt trình duyệt.</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center animate-fade-in">
                            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h2>
                            <p className="text-gray-600 mb-6">{message}</p>

                            <div className="space-y-3 w-full">
                                <Link
                                    to="/my-courses" // Giả sử bạn có trang khóa học của tôi
                                    className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    Vào học ngay
                                </Link>
                                <Link
                                    to="/"
                                    className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <Home className="w-4 h-4 mr-2" />
                                    Về trang chủ
                                </Link>
                            </div>
                        </div>
                    )}

                    {status === 'failed' && (
                        <div className="flex flex-col items-center animate-fade-in">
                            <XCircle className="h-16 w-16 text-red-500 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h2>
                            <p className="text-gray-600 mb-6">{message}</p>

                            <div className="space-y-3 w-full">
                                <Link
                                    to="/cart"
                                    className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    Quay lại giỏ hàng
                                </Link>
                                <Link
                                    to="/"
                                    className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Về trang chủ
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentReturn;