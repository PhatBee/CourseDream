import Payment from '../modules/payment/payment.model.js';

/**
 * Đếm số khóa học hợp lệ đã mua trong quá khứ của người dùng.
 * Hợp lệ: Trạng thái 'success', đơn hàng không miễn phí (amount > 0).
 */
export const countValidPurchasedCourses = async (studentId) => {
    // Tìm các đơn hàng thành công và amount > 0, bỏ qua những đơn gán thủ công / miễn phí hoàn toàn
    const payments = await Payment.find({
        student: studentId,
        status: 'success',
        amount: { $gt: 0 },
        method: { $ne: 'free' }
    }).select('courses items');
    
    const validCourseIds = new Set();
    payments.forEach(payment => {
        if (payment.items && payment.items.length > 0) {
            payment.items.forEach(item => {
                if (item.finalPrice > 0) {
                    validCourseIds.add(item.course.toString());
                }
            });
        } else if (payment.courses && payment.courses.length > 0) {
            // Backward compatibility
            payment.courses.forEach(courseId => {
                validCourseIds.add(courseId.toString());
            });
        }
    });
    
    return validCourseIds.size;
};

/**
 * Lấy % giảm giá dựa trên mốc số lượng.
 */
const getTier = (count) => {
    if (count >= 15) return 15;
    if (count >= 10) return 10;
    if (count >= 5) return 5;
    return 0;
};

/**
 * Tính toán mức giảm cuốn chiếu dựa trên lịch sử mua.
 */
export const calculateTieredDiscount = (cartItems, previousValidCount) => {
    const items = [...cartItems].map(item => ({ ...item, isFromCart: true }));
    
    // Tách khóa có phí và miễn phí
    const paidItems = items.filter(item => (item.priceDiscount ?? item.price) > 0);
    const freeItems = items.filter(item => (item.priceDiscount ?? item.price) === 0);
    
    // Sắp xếp khóa có phí giảm dần theo giá
    paidItems.sort((a, b) => (b.priceDiscount ?? b.price) - (a.priceDiscount ?? a.price));
    
    let currentCount = previousValidCount;
    let totalTieredDiscount = 0;
    let tieredTotalAmount = 0;
    
    paidItems.forEach(item => {
        currentCount += 1;
        const tierPct = getTier(currentCount);
        
        const basePrice = item.priceDiscount ?? item.price;
        const discountAmt = Math.round((basePrice * tierPct) / 100);
        
        item.tieredDiscountPercentage = tierPct;
        item.tieredDiscountAmount = discountAmt;
        item.tieredFinalPrice = basePrice - discountAmt;
        
        totalTieredDiscount += discountAmt;
        tieredTotalAmount += item.tieredFinalPrice;
    });
    
    freeItems.forEach(item => {
        item.tieredDiscountPercentage = 0;
        item.tieredDiscountAmount = 0;
        item.tieredFinalPrice = 0;
    });
    
    // Ghép lại theo thứ tự ban đầu để trả về
    const resultItems = cartItems.map(origItem => {
        // Tìm bên paid hoặc free
        const processed = paidItems.find(p => p.course._id ? p.course._id.toString() === origItem.course._id.toString() : p.course.toString() === origItem.course.toString()) || 
                          freeItems.find(f => f.course._id ? f.course._id.toString() === origItem.course._id.toString() : f.course.toString() === origItem.course.toString());
        return {
            ...origItem,
            tieredDiscountPercentage: processed.tieredDiscountPercentage,
            tieredDiscountAmount: processed.tieredDiscountAmount,
            tieredFinalPrice: processed.tieredFinalPrice
        };
    });
    
    return {
        items: resultItems,
        totalTieredDiscount,
        tieredTotalAmount
    };
};

/**
 * So sánh và chọn ra mức giảm giá tốt nhất, kết hợp cờ forceCoupon nếu người dùng ép buộc dùng Coupon.
 */
export const evaluateBestDiscount = (tieredResult, couponPreview, forceCoupon = false) => {
    const couponDiscount = couponPreview ? (couponPreview.discountAmount || 0) : 0;
    const tieredDiscount = tieredResult.totalTieredDiscount;
    
    // Nếu có forceCoupon = true, bắt buộc chọn coupon. Ngược lại, so sánh cái nào lớn hơn thì lấy.
    const useCoupon = forceCoupon ? !!couponPreview : (couponDiscount > tieredDiscount);
    
    const finalItems = tieredResult.items.map(item => ({ ...item }));
    
    if (useCoupon && couponDiscount > 0) {
        // Chọn Coupon -> Hủy Tiered, phân bổ coupon
        const paidItems = finalItems.filter(item => (item.priceDiscount ?? item.price) > 0);
        
        // Tính tổng giá trị gốc của các item có phí
        const totalBasePaid = paidItems.reduce((sum, item) => sum + (item.priceDiscount ?? item.price), 0);
        
        let remainingCouponDiscount = couponDiscount;
        
        paidItems.forEach((item, index) => {
            const basePrice = item.priceDiscount ?? item.price;
            item.discountPercentage = 0; // Hủy Tiered
            
            let itemCouponDiscount = 0;
            // Ở item cuối cùng, trừ phần dư để chống lệch do làm tròn
            if (index === paidItems.length - 1) {
                itemCouponDiscount = remainingCouponDiscount;
            } else {
                itemCouponDiscount = Math.round((basePrice / totalBasePaid) * couponDiscount);
                remainingCouponDiscount -= itemCouponDiscount;
            }
            
            item.finalPrice = Math.max(0, basePrice - itemCouponDiscount);
            item.appliedDiscountAmount = itemCouponDiscount; // Bổ sung để show nếu cần
        });
        
        freeItemsProcessor(finalItems);
        
        return {
            items: finalItems,
            totalDiscount: couponDiscount,
            finalTotalAmount: couponPreview.amountAfterPromo,
            appliedType: 'coupon',
            couponId: couponPreview.promotionId
        };
    } else {
        // Chọn Tiered -> Hủy Coupon
        finalItems.forEach(item => {
            item.discountPercentage = item.tieredDiscountPercentage;
            item.finalPrice = item.tieredFinalPrice;
            item.appliedDiscountAmount = item.tieredDiscountAmount;
        });
        
        return {
            items: finalItems,
            totalDiscount: tieredDiscount,
            finalTotalAmount: tieredResult.tieredTotalAmount, // Chưa cộng tax
            appliedType: 'tiered',
            couponId: null
        };
    }
};

const freeItemsProcessor = (items) => {
    items.forEach(item => {
        if ((item.priceDiscount ?? item.price) === 0) {
            item.discountPercentage = 0;
            item.finalPrice = 0;
            item.appliedDiscountAmount = 0;
        }
    });
};
