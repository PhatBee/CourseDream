// server/src/modules/promotion/promotion.validation.js
export function promotionPreSave(next) {
  if (this.startDate >= this.endDate) {
    return next(new Error("startDate phải trước endDate"));
  }
  if (this.appliesTo === "all") {
    this.categories = [];
    this.courses = [];
  }
  if (this.appliesTo === "category" && this.categories.length === 0) {
    return next(new Error("categories là bắt buộc khi appliesTo = category"));
  }
  if (this.appliesTo === "course" && this.courses.length === 0) {
    return next(new Error("courses là bắt buộc khi appliesTo = course"));
  }
  if (
    this.appliesTo === "category+course" &&
    (this.categories.length === 0 || this.courses.length === 0)
  ) {
    return next(
      new Error(
        "categories và courses là bắt buộc khi appliesTo = category+course"
      )
    );
  }
  next();
}
