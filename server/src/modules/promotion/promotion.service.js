import Course from "../course/course.model.js";
import Promotion from "./promotion.model.js"; // Import trực tiếp để tránh dynamic import

// Hàm preview (tính toán cho mảng courseIds trong giỏ hàng)
export const previewPromotion = async (promotion, courseIds, userId) => {
  const now = new Date();
  if (!promotion.isActive) {
    throw new Error("Mã khuyến mãi không còn hoạt động");
  }
  if (now < promotion.startDate || now > promotion.endDate) {
    throw new Error("Mã khuyến mãi đã hết hạn hoặc chưa bắt đầu");
  }

  if (!Array.isArray(courseIds)) courseIds = [courseIds];

  const courses = await Course.find({ _id: { $in: courseIds } }).populate('categories');
  if (courses.length === 0) throw new Error("Khóa học không tồn tại");

  let originalPrice = 0;
  let eligiblePrice = 0;

  for (const course of courses) {
    const price = course.priceDiscount ?? course.price ?? 0;
    originalPrice += price;
  }

  if (originalPrice < promotion.minPrice) {
    throw new Error(`Đơn hàng phải từ ${promotion.minPrice}đ để dùng mã này`);
  }

  let eligibleCourses = [];
  for (const course of courses) {
    // Chặn instructor dùng mã cho khóa của mình
    if (course.instructor && course.instructor.equals(userId)) continue;

    let isEligible = false;
    if (promotion.appliesTo === "all") isEligible = true;
    else if (promotion.appliesTo === "course") {
      if (promotion.courses?.some(cId => course._id.equals(cId))) isEligible = true;
    } else if (promotion.appliesTo === "category") {
      const courseCats = Array.isArray(course.categories) ? course.categories : [course.category];
      if (promotion.categories?.some(catId => courseCats.some(cCat => cCat && (cCat.equals ? cCat.equals(catId) : cCat.toString() === catId.toString())))) isEligible = true;
    } else if (promotion.appliesTo === "category+course") {
      const courseCats = Array.isArray(course.categories) ? course.categories : [course.category];
      if (promotion.courses?.some(cId => course._id.equals(cId)) || 
          promotion.categories?.some(catId => courseCats.some(cCat => cCat && (cCat.equals ? cCat.equals(catId) : cCat.toString() === catId.toString())))) {
          isEligible = true;
      }
    }

    if (isEligible) {
      eligiblePrice += (course.priceDiscount ?? course.price ?? 0);
      eligibleCourses.push(course);
    }
  }

  if (eligibleCourses.length === 0) {
    throw new Error("Mã này không áp dụng cho các khóa học trong đơn hàng");
  }

  // Kiểm tra tổng lượt (chỉ check, không update)
  if (promotion.maxUsage > 0 && promotion.totalUsed >= promotion.maxUsage) {
    throw new Error("Mã khuyến mãi đã hết lượt sử dụng");
  }

  // Kiểm tra lượt user (chỉ check, không update)
  let userUsage = promotion.usersUsed.find((u) => u.user.equals(userId));
  const userCount = userUsage ? userUsage.count : 0;
  if (promotion.maxUsagePerUser > 0 && userCount >= promotion.maxUsagePerUser) {
    throw new Error("Bạn đã dùng hết lượt sử dụng mã này");
  }

  // Tính giá sau giảm
  let discountAmount = 0;
  let itemDiscounts = [];

  if (promotion.discountType === "percent") {
    discountAmount = Math.round(eligiblePrice * (promotion.discountValue / 100));
    
    // Tính cho từng item
    for (const course of eligibleCourses) {
       const p = course.priceDiscount ?? course.price ?? 0;
       const d = Math.round(p * (promotion.discountValue / 100));
       itemDiscounts.push({
          courseId: course._id.toString(),
          originalPrice: p,
          discountedPrice: p - d,
          discountAmount: d
       });
    }
  } else if (promotion.discountType === "fixed") {
    discountAmount = Math.min(promotion.discountValue, eligiblePrice);
    
    // Tính phân bổ cho từng item
    let remainingDiscount = discountAmount;
    for (let i = 0; i < eligibleCourses.length; i++) {
       const course = eligibleCourses[i];
       const p = course.priceDiscount ?? course.price ?? 0;
       
       let d = 0;
       if (i === eligibleCourses.length - 1) {
           d = remainingDiscount; // Item cuối gánh phần dư
       } else {
           d = eligiblePrice > 0 ? Math.round(discountAmount * (p / eligiblePrice)) : 0;
           remainingDiscount -= d;
       }
       
       itemDiscounts.push({
          courseId: course._id.toString(),
          originalPrice: p,
          discountedPrice: p - d,
          discountAmount: d
       });
    }
  }

  let discountedPrice = originalPrice - discountAmount;
  if (discountedPrice < 0) discountedPrice = 0;

  return {
    originalPrice,
    discountedPrice,
    discountAmount,
    discountValue: promotion.discountValue,
    discountType: promotion.discountType,
    promotionId: promotion._id, // Trả về để dùng ở commit
    itemDiscounts,
    message: "Áp dụng mã khuyến mãi thành công (preview)!",
  };
};

// Hàm commit (trừ lượt sau payment success, atomic)
export const commitPromotion = async (promotionId, userId) => {
  const promotion = await Promotion.findById(promotionId);
  if (!promotion || !promotion.isActive) {
    throw new Error("Mã khuyến mãi không tồn tại hoặc không hoạt động");
  }

  // Atomic update cho totalUsed
  let updated = await Promotion.findOneAndUpdate(
    {
      _id: promotion._id,
      $or: [
        { maxUsage: 0 },
        { totalUsed: { $lt: promotion.maxUsage } }
      ]
    },
    { $inc: { totalUsed: 1 } },
    { new: true }
  );

  if (!updated) {
    throw new Error("Mã đã hết lượt sử dụng hoặc có lỗi");
  }

  // Atomic update cho usersUsed (sử dụng arrayFilters)
  updated = await Promotion.findOneAndUpdate(
    { _id: promotion._id },
    {
      $inc: { "usersUsed.$[user].count": 1 }
    },
    {
      new: true,
      arrayFilters: [{ "user.user": userId }]
    }
  );

  // Nếu user chưa tồn tại, thêm mới
  if (!updated.usersUsed.find(u => u.user.equals(userId))) {
    updated = await Promotion.findByIdAndUpdate(
      promotion._id,
      { $push: { usersUsed: { user: userId, count: 1 } } },
      { new: true }
    );
  }

  return { message: "Đã trừ lượt sử dụng thành công!", promotion: updated };
};

// CRUD admin (giữ nguyên)
export const createPromotion = async (data) => new Promotion(data).save();

export const updatePromotion = async (id, data) => {
  const updated = await Promotion.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!updated) throw new Error("Không tìm thấy mã khuyến mãi");
  return updated;
};

export const deletePromotion = async (id) => {
  const updated = await Promotion.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!updated) throw new Error("Không tìm thấy mã khuyến mãi");
  return { message: "Đã chuyển mã sang trạng thái không hoạt động", promotion: updated };
};

export const getAllPromotions = async () => {
  const now = new Date();
  await Promotion.updateMany(
    { endDate: { $lt: now }, isActive: true },
    { $set: { isActive: false } }
  );
  return await Promotion.find().sort({ createdAt: -1 });
};