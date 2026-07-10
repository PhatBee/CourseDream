import React, { useState, useEffect, useMemo } from 'react';

// Guardrail: no course should require more than 24 months / 104 weeks of access
const MAX_WEEKS = 104;

const formatVND = (n) => {
  const num = Number(n) || 0;
  return new Intl.NumberFormat('vi-VN').format(num);
};

const Step5_Pricing = ({ courseData: courseDataProp, handleInputChange: handleInputChangeProp }) => {
  // Standalone-safe: works as a drop-in with real props, or demos itself with internal state
  const [internalData, setInternalData] = useState({
    durationInWeeks: 0,
    isFree: false,
    price: 0,
    priceDiscount: 0,
    messageToReviewer: '',
  });

  const courseData = courseDataProp ?? internalData;

  const handleInputChange =
    handleInputChangeProp ??
    ((e) => {
      const { name, value, type, checked } = e.target;
      setInternalData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    });

  const [durationUnit, setDurationUnit] = useState('weeks'); // Mặc định ưu tiên hiển thị theo Tuần
  const [localDuration, setLocalDuration] = useState('');
  const [durationError, setDurationError] = useState('');

  // ✅ KHẮC PHỤC LỖI: Đồng bộ dữ liệu khi API load xong + Ưu tiên hiển thị đơn vị Tuần (Weeks)
  useEffect(() => {
    if (courseData && courseData.durationInWeeks) {
      // Khi có dữ liệu từ hệ thống/API, ép hiển thị theo Tuần để bảo toàn độ chính xác
      setLocalDuration(courseData.durationInWeeks);
      setDurationUnit('weeks');
    }
  }, [courseData.durationInWeeks]); // Trigger chạy lại ngay khi giá trị từ API đổ về

  const weeksFor = (value, unit) => {
    const n = Math.max(0, parseInt(value, 10) || 0);
    return unit === 'months' ? n * 4 : n;
  };

  const handleDurationChange = (value, unit) => {
    setLocalDuration(value);
    const weeks = weeksFor(value, unit);
    setDurationError(weeks > MAX_WEEKS ? `Thời hạn tối đa cho phép là ${MAX_WEEKS} tuần (24 tháng).` : '');
    handleInputChange({ target: { name: 'durationInWeeks', value: weeks } });
  };

  const handleDurationBlur = () => {
    const weeks = weeksFor(localDuration, durationUnit);
    if (weeks > MAX_WEEKS) {
      const clampedWeeks = MAX_WEEKS;
      setLocalDuration(durationUnit === 'months' ? MAX_WEEKS / 4 : MAX_WEEKS);
      setDurationError('');
      handleInputChange({ target: { name: 'durationInWeeks', value: clampedWeeks } });
    }
  };

  const handleUnitSwitch = (unit) => {
    if (unit === durationUnit) return;
    const currentWeeks = Number(courseData.durationInWeeks) || 0;
    setDurationUnit(unit);
    setLocalDuration(unit === 'months' ? Math.round(currentWeeks / 4) : currentWeeks);
    setDurationError('');
  };

  const approxMonths = useMemo(() => {
    const w = Number(courseData.durationInWeeks) || 0;
    return w % 4 === 0 ? w / 4 : (w / 4).toFixed(1);
  }, [courseData.durationInWeeks]);

  const priceError = useMemo(() => {
    if (courseData.isFree) return '';
    const p = Number(courseData.price) || 0;
    const d = Number(courseData.priceDiscount) || 0;
    return d > p && p > 0 ? 'Giá khuyến mãi phải thấp hơn hoặc bằng giá gốc.' : '';
  }, [courseData.price, courseData.priceDiscount, courseData.isFree]);

  const discountPercent = useMemo(() => {
    const p = Number(courseData.price) || 0;
    const d = Number(courseData.priceDiscount) || 0;
    if (!p || !d || d >= p) return null;
    return Math.round(((p - d) / p) * 100);
  }, [courseData.price, courseData.priceDiscount]);

  const messageLen = (courseData.messageToReviewer || '').length;
  const MESSAGE_LIMIT = 500;

  return (
    <div className="font-sans text-[#1C2130] w-full mx-auto text-justify">
      <div className="w-full">
        
        {/* Header */}
        <div className="mb-[26px]">
          <h2 className="font-sans font-bold text-[25px] text-center m-0 mt-1 mb-1.5">
            Giá và giới hạn truy cập
          </h2>
        </div>

        {/* Duration section */}
        <section className="pb-[18px] mb-5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[#E11D48] text-[13px] leading-none">*</span>
            <h3 className="text-[14px] font-bold">Thời hạn truy cập khóa học</h3>
          </div>
          <p className="text-[12.5px] text-[#6B7280] my-1 mt-1 mb-3.5 leading-[1.5] text-justify">
            Học viên sẽ không thể truy cập nội dung bài học sau khi hết thời hạn này, kể từ ngày kích hoạt khóa học.
          </p>

          <div className="flex gap-3">
            <input
              type="number"
              min="1"
              placeholder={durationUnit === 'months' ? 'Nhập số tháng...' : 'Nhập số tuần...'}
              value={localDuration}
              onChange={(e) => handleDurationChange(e.target.value, durationUnit)}
              onBlur={handleDurationBlur}
              className="flex-1 min-w-0 px-4 py-3 border border-[#FDA4AF] rounded-xl font-semibold text-[15px] bg-white text-[#1C2130] outline-none focus:ring-3 focus:ring-[#FFE4E6] focus:border-[#E11D48] transition-all"
            />
            <div className="flex bg-white border border-[#FDA4AF] rounded-xl p-1 relative w-[180px] shrink-0">
              <div
                className={`absolute top-1 bottom-1 left-1 w-[84px] bg-[#E11D48] rounded-lg transition-transform duration-200 cubic-bezier(0.4,0,0.2,1) ${
                  durationUnit === 'weeks' ? 'translate-x-[88px]' : 'translate-x-0'
                }`}
              />
              <button
                type="button"
                onClick={() => handleUnitSwitch('months')}
                className={`relative flex-1 py-2 text-[13px] font-semibold rounded-lg bg-none border-none cursor-pointer z-10 transition-colors ${
                  durationUnit === 'months' ? 'text-white' : 'text-[#6B7280]'
                }`}
              >
                Tháng
              </button>
              <button
                type="button"
                onClick={() => handleUnitSwitch('weeks')}
                className={`relative flex-1 py-2 text-[13px] font-semibold rounded-lg bg-none border-none cursor-pointer z-10 transition-colors ${
                  durationUnit === 'weeks' ? 'text-white' : 'text-[#6B7280]'
                }`}
              >
                Tuần
              </button>
            </div>
          </div>

          {durationError && (
            <p className="text-[12px] text-[#E11D48] mt-2.5 font-medium animate-fade-in">
              {durationError}
            </p>
          )}

          {courseData.durationInWeeks > 0 && (
            <div className="font-sans mt-3.5 border-b border-dashed border-[#FDA4AF] pb-2.5 text-[12.5px] text-[#9F1239] flex justify-between">
              <span>Tổng thời hạn ghi nhận</span>
              <strong>{courseData.durationInWeeks} tuần · ≈ {approxMonths} tháng</strong>
            </div>
          )}
        </section>

        {/* Free toggle */}
        <div className="flex items-center justify-between gap-4 mt-5 pb-4 border-b border-[#E4E4E7]">
          <div>
            <div className="font-bold text-[14px]">Khóa học miễn phí</div>
            <div className="text-[12px] text-[#6B7280] mt-0.5 text-justify">
              {courseData.isFree ? 'Học viên truy cập toàn bộ nội dung mà không cần thanh toán.' : 'Bật để mở khóa học miễn phí cho mọi học viên.'}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!!courseData.isFree}
            onClick={() => handleInputChange({ target: { name: 'isFree', type: 'checkbox', checked: !courseData.isFree, value: !courseData.isFree } })}
            className={`shrink-0 w-[46px] h-[26px] rounded-full border-none p-0.5 cursor-pointer transition-colors ${
              courseData.isFree ? 'bg-[#E11D48]' : 'bg-[#D4D4D8]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                courseData.isFree ? 'translate-x-[20px]' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Pricing */}
        {!courseData.isFree && (
          <div className="mt-5 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold mb-1.5">Giá gốc</label>
                <div className="relative">
                  <span className="font-sans absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B8FA3] text-[14px]">₫</span>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    value={courseData.price || 0}
                    onChange={handleInputChange}
                    className="w-full pl-7 pr-3.5 py-3 border border-[#E4E4E7] rounded-xl text-[15px] font-semibold outline-none focus:ring-3 focus:ring-[#FFE4E6] focus:border-[#E11D48] transition-all"
                  />
                </div>
                <div className="font-sans text-[11.5px] text-[#8B8FA3] mt-1.5">{formatVND(courseData.price)} ₫</div>
              </div>

              <div>
                <label className="block text-[13px] font-bold mb-1.5">Giá khuyến mãi</label>
                <div className="relative">
                  <span className="font-sans absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B8FA3] text-[14px]">₫</span>
                  <input
                    type="number"
                    name="priceDiscount"
                    min="0"
                    value={courseData.priceDiscount || 0}
                    onChange={handleInputChange}
                    className={`w-full pl-7 pr-3.5 py-3 border rounded-xl text-[15px] font-semibold outline-none focus:ring-3 focus:ring-[#FFE4E6] focus:border-[#E11D48] transition-all ${
                      priceError ? 'border-[#FDA4AF]' : 'border-[#E4E4E7]'
                    }`}
                  />
                </div>
                <div className={`font-sans text-[11.5px] mt-1.5 flex gap-2 items-center ${priceError ? 'text-[#E11D48]' : 'text-[#8B8FA3]'}`}>
                  {formatVND(courseData.priceDiscount)} ₫
                  {discountPercent !== null && !priceError && (
                    <span className="bg-[#FFF1F2] text-[#E11D48] font-bold px-[7px] py-[1px] rounded-full">-{discountPercent}%</span>
                  )}
                </div>
              </div>
            </div>
            {priceError && <p className="text-[12px] text-[#E11D48] mt-2.5 font-medium animate-fade-in">{priceError}</p>}
          </div>
        )}

        {/* Message to reviewer */}
        <div className="mt-[22px]">
          <label className="block text-[13px] font-bold mb-1.5">Lời nhắn gửi tới admin</label>
          <textarea
            name="messageToReviewer"
            maxLength={MESSAGE_LIMIT}
            value={courseData.messageToReviewer || ''}
            onChange={handleInputChange}
            placeholder="Hãy nhập lời nhắn gửi tới admin..."
            className="w-full h-[110px] px-4 py-3 border border-[#E4E4E7] rounded-xl text-[14px] resize-y font-sans outline-none focus:ring-3 focus:ring-[#FFE4E6] focus:border-[#E11D48] transition-all"
          />
          <div className="text-right text-[11px] text-[#8B8FA3] mt-1">{messageLen}/{MESSAGE_LIMIT}</div>
        </div>

        {/* Summary ledger */}
        <div className="font-sans mt-6 py-1">
          <div className="text-[10.5px] font-bold tracking-wider text-[#8B8FA3] mb-2.5 uppercase">
            Tóm tắt trước khi gửi duyệt
          </div>
          <Row label="Thời hạn truy cập" value={`${courseData.durationInWeeks || 0} tuần`} />
          <Row label="Trạng thái" value={courseData.isFree ? 'Miễn phí' : 'Trả phí'} accent={courseData.isFree ? '#E11D48' : undefined} />
          {!courseData.isFree && (
            <>
              <Row label="Giá gốc" value={`${formatVND(courseData.price)} ₫`} />
              <Row label="Giá khuyến mãi" value={`${formatVND(courseData.priceDiscount)} ₫`} accent={priceError ? '#E11D48' : '#E11D48'} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, accent }) => (
  <div className="flex justify-between text-[12.5px] py-2 border-t border-dashed border-[#E4E4E7]">
    <span className="text-[#6B7280]">{label}</span>
    <span className={`font-semibold ${accent ? 'text-[#E11D48]' : 'text-[#1C2130]'}`}>{value}</span>
  </div>
);

export default Step5_Pricing;