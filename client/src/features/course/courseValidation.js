/**
 * courseValidation.js
 * Centralized validation logic cho khóa học.
 * Trả về { isValid, errors, firstErrorStep, errorFields } với:
 *   - errors: Array<{ message, step }>  — dùng để navigate & toast
 *   - errorFields: Record<fieldKey, message> — dùng để highlight field cụ thể trong Step
 *
 * MAPPING THỰC TẾ (theo cấu trúc Step components):
 *   Step 1 – Step1_CourseInfo : title, categories, shortDescription, learnOutcomes
 *   Step 2 – Step2_Media      : thumbnail
 *   Step 3 – Step3_Curriculum : sections (ít nhất 1 section, mỗi section ≥ 1 lecture)
 *   Step 4 – Step4_Details    : requirements
 *   Step 5 – Step5_Pricing    : (không có field bắt buộc)
 */

export const validateCourse = (courseData, mode = 'submit') => {
  const errors = [];
  const errorFields = {}; // { fieldKey: errorMessage }
  const isDraft = mode === 'draft';

  // ─── STEP 1 – Course Information ────────────────────────────────────────
  if (!courseData.title?.trim()) {
    const msg = isDraft
      ? 'Vui lòng nhập tên khóa học để lưu nháp.'
      : 'Vui lòng nhập tên khóa học.';
    errors.push({ message: msg, step: 1 });
    errorFields.title = msg;
  }

  if (!isDraft) {
    if (!courseData.categories || courseData.categories.length === 0) {
      const msg = 'Vui lòng chọn ít nhất 1 danh mục.';
      errors.push({ message: msg, step: 1 });
      errorFields.categories = msg;
    }

    if (!courseData.shortDescription?.trim()) {
      const msg = 'Vui lòng nhập mô tả ngắn (Short Description) cho khóa học.';
      errors.push({ message: msg, step: 1 });
      errorFields.shortDescription = msg;
    }

    const learnOutcomes = (courseData.learnOutcomes || []).filter(r => r?.trim());
    if (learnOutcomes.length === 0) {
      const msg = 'Vui lòng thêm ít nhất 1 mục "Học viên sẽ học được".';
      errors.push({ message: msg, step: 1 });
      errorFields.learnOutcomes = msg;
    }
  }

  // ─── STEP 2 – Media ─────────────────────────────────────────────────────
  if (!isDraft) {
    const hasThumbnail = courseData.thumbnailUrl || courseData.thumbnail || courseData.thumbnailPreview;
    if (!hasThumbnail) {
      const msg = 'Vui lòng upload ảnh bìa (thumbnail) khóa học.';
      errors.push({ message: msg, step: 2 });
      errorFields.thumbnail = msg;
    }
  }

  // ─── STEP 3 – Curriculum ─────────────────────────────────────────────────
  if (!isDraft) {
    const sections = courseData.sections || [];
    if (sections.length === 0) {
      const msg = 'Khóa học cần ít nhất 1 section (chương học).';
      errors.push({ message: msg, step: 3 });
      errorFields.sections = msg;
    } else {
      const emptySection = sections.find(s => !s.lectures || s.lectures.length === 0);
      if (emptySection) {
        const msg = `Section "${emptySection.title || '(Chưa đặt tên)'}" cần có ít nhất 1 bài học.`;
        errors.push({ message: msg, step: 3 });
        errorFields.sections = msg;
      }
    }
  }

  // ─── STEP 4 – Additional Details ─────────────────────────────────────────
  if (!isDraft) {
    const requirements = (courseData.requirements || []).filter(r => r?.trim());
    if (requirements.length === 0) {
      const msg = 'Vui lòng thêm ít nhất 1 yêu cầu trước khi học (Requirements).';
      errors.push({ message: msg, step: 4 });
      errorFields.requirements = msg;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    firstErrorStep: errors.length > 0 ? errors[0].step : null,
    errorFields, // { title, categories, shortDescription, learnOutcomes, thumbnail, sections, requirements }
  };
};
