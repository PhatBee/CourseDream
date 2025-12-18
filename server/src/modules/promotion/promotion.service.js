import Course from "../course/course.model.js";
import Promotion from "./promotion.model.js"; // Import trực tiếp để tránh dynamic import

// Hàm preview (chỉ tính giá, không trừ lượt)
export const previewPromotion = async (promotion, courseId, userId) => {
  const now = new Date();
  if (!promotion.isActive) {
    throw new Error("Mã khuyến mãi không còn hoạt động");
  }
  if (now < promotion.startDate || now > promotion.endDate) {
    throw new Error("Mã khuyến mãi đã hết hạn hoặc chưa bắt đầu");
  }

  const course = await Course.findById(courseId);
  if (!course) throw new Error("Khóa học không tồn tại");

  // Không trust price từ client: Lấy từ DB
  const price = course.priceDiscount;

  if (price < promotion.minPrice) {
    throw new Error(`Cần mua từ ${promotion.minPrice}đ để dùng mã này`);
  }

  // Chặn instructor dùng mã cho khóa của mình (nếu có instructor)
  if (course.instructor && course.instructor.equals(userId)) {
    throw new Error("Không thể dùng mã cho khóa học của chính bạn");
  }

  // Kiểm tra áp dụng cho course/category
  if (["category", "category+course"].includes(promotion.appliesTo)) {
    const courseCategories = Array.isArray(course.categories)
      ? course.categories
      : [course.category];
    const matchCategory = promotion.categories?.some(catId =>
      courseCategories.some(courseCat =>
        courseCat.equals ? courseCat.equals(catId) : courseCat.toString() === catId.toString()
      )
    );
    if (promotion.appliesTo === "category" && !matchCategory) {
      throw new Error("Mã này không áp dụng cho danh mục của khóa học");
    }
    if (promotion.appliesTo === "category+course" && !matchCategory) {
      const matchCourse = promotion.courses?.some(cId => course._id.equals(cId));
      if (!matchCourse) {
        throw new Error("Mã này không áp dụng cho danh mục hoặc khóa học này");
      }
    }
  }
  if (promotion.appliesTo === "course") {
    const matchCourse = promotion.courses?.some(cId => course._id.equals(cId));
    if (!matchCourse) {
      throw new Error("Mã này chỉ áp dụng cho một số khóa học cụ thể");
    }
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
  let discountedPrice = price;
  if (promotion.discountType === "percent") {
    discountedPrice = price * (1 - promotion.discountValue / 100);
  } else if (promotion.discountType === "fixed") {
    discountedPrice = price - promotion.discountValue;
  }
  discountedPrice = Math.max(0, Math.round(discountedPrice));

  return {
    originalPrice: price,
    discountedPrice,
    discountValue: promotion.discountValue,
    discountType: promotion.discountType,
    promotionId: promotion._id, // Trả về để dùng ở commit
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
  return await Promotion.find().sort({ createdAt: -1 });
};