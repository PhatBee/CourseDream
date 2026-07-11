import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyRewardVouchers } from '../../features/promotion/promotionSlice';
import { Gift, Calendar } from 'lucide-react';

const VoucherCard = ({ voucher }) => {
  // Tính số ngày còn lại
  const getDaysLeft = (endDate) => {
    const diffTime = new Date(endDate) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysLeft = getDaysLeft(voucher.endDate);

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-200 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between">
      {/* Decorative background shape */}
      <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-200 rounded-full opacity-20 pointer-events-none"></div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          Quà hoàn thành khóa
          </span>
          <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
            <Calendar size={12} /> Còn {daysLeft} ngày
          </span>
        </div>

        <h4 className="text-lg font-bold text-gray-800 mb-1">Ưu đãi độc quyền {voucher.discountValue}%</h4>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        <div className="text-center font-mono font-bold text-amber-800 bg-white border border-amber-300 rounded-xl py-2 px-3 tracking-wider text-sm select-all">
          {voucher.code}
        </div>
        <div className="text-[11px] text-gray-500 text-justify leading-relaxed">
          Mã giảm giá này đã được liên kết trực tiếp với tài khoản của bạn. Bạn không cần phải sao chép hay nhập thủ công, hệ thống sẽ tự động hiển thị để chọn áp dụng tại trang thanh toán.
        </div>
      </div>
    </div>
  );
};

const MyRewardVouchers = () => {
  const dispatch = useDispatch();
  const { myRewards, myRewardsLoading } = useSelector((state) => state.promotion);

  useEffect(() => {
    dispatch(fetchMyRewardVouchers());
  }, [dispatch]);

  if (myRewardsLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-28 bg-gray-200 rounded-xl"></div>
          <div className="h-28 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!myRewards || myRewards.length === 0) {
    return null; // Không hiển thị gì nếu không có voucher nào khả dụng
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
          <Gift size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 text-justify">Ưu đãi đặc quyền của bạn</h3>
          <p className="text-xs text-gray-500">Sử dụng các mã này tại trang thanh toán để được giảm giá</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myRewards.map((voucher) => (
          <VoucherCard key={voucher._id} voucher={voucher} />
        ))}
      </div>
    </div>
  );
};

export default MyRewardVouchers;
