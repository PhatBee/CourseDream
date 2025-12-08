// src/modules/promotion/promotion.service.js
import Course from "../course/course.model.js"; // adjust path nếu cần

export const applyPromotionLogic = async (promotion, courseId, price, userId) => {
  const now = new Date();

  // 1. Kiểm tra thời gian
  if (now < promotion.startDate || now > promotion.endDate) {
    throw new Error("Mã khuyến mãi đã hết hạn hoặc chưa bắt đầu");
  }

  // 2. Kiểm tra giá tối thiểu
  if (price < promotion.minPrice) {
    throw new Error(`Cần mua từ ${promotion.minPrice}đ để dùng mã này`);
  }

  // 3. Kiểm tra áp dụng cho course/category
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Khóa học không tồn tại");

  if (promotion.appliesTo === "category") {
    // Nếu course có mảng categories
    const courseCategories = Array.isArray(course.categories)
      ? course.categories
      : [course.category];
    const match = courseCategories.some(cat =>
      cat.equals ? cat.equals(promotion.category) : cat.toString() === promotion.category.toString()
    );
    if (!match) {
      throw new Error("Mã này không áp dụng cho danh mục của khóa học");
    }
  }
  if (promotion.appliesTo === "course" && !course._id.equals(promotion.course)) {
    throw new Error("Mã này chỉ áp dụng cho một khóa học cụ thể");
  }

  // 4. Kiểm tra tổng lượt dùng
  if (promotion.maxUsage > 0 && promotion.totalUsed >= promotion.maxUsage) {
    throw new Error("Mã khuyến mãi đã hết lượt sử dụng");
  }

  // 5. Kiểm tra lượt dùng của user
  let userUsage = promotion.usersUsed.find((u) => u.user.equals(userId));
  if (!userUsage) {
    userUsage = { user: userId, count: 0 };
    promotion.usersUsed.push(userUsage);
  }
  if (promotion.maxUsagePerUser > 0 && userUsage.count >= promotion.maxUsagePerUser) {
    throw new Error("Bạn đã dùng hết lượt sử dụng mã này");
  }

  // 6. Tính giá sau giảm
  let discountedPrice = price;
  if (promotion.discountType === "percent") {
    discountedPrice = price * (1 - promotion.discountValue / 100);
  } else if (promotion.discountType === "fixed") {
    discountedPrice = price - promotion.discountValue;
  }
  discountedPrice = Math.max(0, Math.round(discountedPrice));

  // 7. Cập nhật lượt dùng
  promotion.totalUsed += 1;
  userUsage.count += 1;
  await promotion.save();

  return {
    originalPrice: price,
    discountedPrice,
    discountValue: promotion.discountValue,
    discountType: promotion.discountType,
    message: "Áp dụng mã khuyến mãi thành công!",
  };
};

// Các hàm CRUD admin (gọi trực tiếp từ controller)
export const createPromotion = async (data) => new (await import("../promotion/promotion.model.js")).default(data).save();
export const updatePromotion = async (id, data) => {
  const Promotion = (await import("../promotion/promotion.model.js")).default;
  const updated = await Promotion.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!updated) throw new Error("Không tìm thấy mã khuyến mãi");
  return updated;
};
export const deletePromotion = async (id) => {
  const Promotion = (await import("../promotion/promotion.model.js")).default;
  const result = await Promotion.findByIdAndDelete(id);
  if (!result) throw new Error("Không tìm thấy mã khuyến mãi");
  return { message: "Xóa thành công" };
};
export const getAllPromotions = async () => {
  const Promotion = (await import("../promotion/promotion.model.js")).default;
  return await Promotion.find().sort({ createdAt: -1 });
};