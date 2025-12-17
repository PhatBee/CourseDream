import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "../../features/promotion/promotionSlice";
import { Plus, Tag, Trash2, Edit } from "lucide-react";
import RemoveModal from "../../components/common/RemoveModal";
import { getCategories } from "../../features/categories/categorySlice";
import { getAllCourses } from "../../features/course/courseSlice";

const PromotionsManagement = () => {
  const dispatch = useDispatch();
  const { items: promotions, isLoading } = useSelector(
    (state) => state.promotion
  );

  // Lấy từ Redux
  const categories = useSelector((state) => state.categories.items) || [];
  const courses = useSelector((state) => state.course.items) || [];

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percent",
    discountValue: 0,
    appliesTo: "all",
    startDate: "",
    endDate: "",
    isActive: true,
    categories: [],
    courses: [],
    minPrice: 0,
    maxUsage: 0,
    maxUsagePerUser: 0,
  });

  useEffect(() => {
    dispatch(fetchPromotions());
  }, [dispatch]);

  // Khi mở modal, nếu chưa có dữ liệu thì fetch
  useEffect(() => {
    if (isEditModalOpen) {
      if (!categories.length) dispatch(getCategories());
      if (!courses.length) dispatch(getAllCourses());
    }
  }, [isEditModalOpen, dispatch, categories.length, courses.length]);

  const openCreateModal = () => {
    setSelectedPromotion(null);
    setFormData({
      code: "",
      discountType: "percent",
      discountValue: 0,
      appliesTo: "all",
      startDate: "",
      endDate: "",
      isActive: true,
      categories: [],
      courses: [],
      minPrice: 0,
      maxUsage: 0,
      maxUsagePerUser: 0,
    });
    setIsEditModalOpen(true);
  };

  const openEditModal = (promo) => {
    setSelectedPromotion(promo);
    setFormData({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      appliesTo: promo.appliesTo,
      startDate: promo.startDate?.slice(0, 10),
      endDate: promo.endDate?.slice(0, 10),
      isActive: promo.isActive,
      categories: promo.categories || [],
      courses: promo.courses || [],
      minPrice: promo.minPrice || 0,
      maxUsage: promo.maxUsage || 0,
      maxUsagePerUser: promo.maxUsagePerUser || 0,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (promo) => {
    setSelectedPromotion(promo);
    setIsDeleteModalOpen(true);
  };

  const handleSavePromotion = async (e) => {
    e.preventDefault();
    if (selectedPromotion) {
      await dispatch(updatePromotion({ id: selectedPromotion._id, formData }));
    } else {
      await dispatch(createPromotion(formData));
    }
    setIsEditModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedPromotion) {
      await dispatch(deletePromotion(selectedPromotion._id));
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 font-inter">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 shadow-sm transition-all hover:shadow-md"
        >
          <Plus size={20} /> Thêm mã giảm giá
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Mã</th>
                <th className="px-6 py-4">Loại</th>
                <th className="px-6 py-4">Giá trị</th>
                <th className="px-6 py-4">Áp dụng</th>
                <th className="px-6 py-4">Bắt đầu</th>
                <th className="px-6 py-4">Kết thúc</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {promotions.map((promo) => (
                <tr
                  key={promo._id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="px-6 py-4 font-bold">{promo.code}</td>
                  <td className="px-6 py-4">
                    {promo.discountType === "percent" ? "Phần trăm" : "Số tiền"}
                  </td>
                  <td className="px-6 py-4">
                    {promo.discountValue}
                    {promo.discountType === "percent" ? "%" : "đ"}
                  </td>
                  <td className="px-6 py-4">{promo.appliesTo}</td>
                  <td className="px-6 py-4">
                    {new Date(promo.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(promo.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        promo.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {promo.isActive ? "Hoạt động" : "Ngừng"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEditModal(promo)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <Tag size={18} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(promo)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {promotions.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-400">
                    Không có mã giảm giá nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal tạo/sửa */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 space-y-4 overflow-y-auto max-h-[90vh]"
            onSubmit={handleSavePromotion}
          >
            <h3 className="text-lg font-bold mb-2">
              {selectedPromotion ? "Sửa mã giảm giá" : "Thêm mã giảm giá"}
            </h3>

            {/* PHẦN 1: Thông tin cơ bản */}
            {/* Hàng 1: Mã giảm giá, Loại giảm giá, Giá trị */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Mã giảm giá</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Mã giảm giá"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, code: e.target.value }))
                  }
                  required
                  disabled={!!selectedPromotion}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Loại giảm giá</label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={formData.discountType}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, discountType: e.target.value }))
                  }
                >
                  <option value="percent">%</option>
                  <option value="fixed">VNĐ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Giá trị</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  type="number"
                  min={0}
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, discountValue: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            {/* Hàng 2: Áp dụng cho, Ngày bắt đầu, Ngày kết thúc */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              <div>
                <label className="block text-sm font-medium mb-1">Áp dụng cho</label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={formData.appliesTo}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, appliesTo: e.target.value }))
                  }
                >
                  <option value="all">Tất cả</option>
                  <option value="category">Danh mục</option>
                  <option value="course">Khóa học</option>
                  <option value="category+course">Danh mục + Khóa học</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, startDate: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, endDate: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            {/* Hàng 3: Kích hoạt */}
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, isActive: e.target.checked }))
                }
                id="isActive"
              />
              <label htmlFor="isActive" className="ml-2 cursor-pointer select-none">
                Kích hoạt
              </label>
            </div>

            {/* PHẦN 2: Chọn danh mục */}
            {["category", "category+course"].includes(formData.appliesTo) && (
              <div>
                <div className="font-semibold text-rose-600 mb-2">
                  Chọn danh mục áp dụng
                </div>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border rounded p-2 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
                  {Array.isArray(categories) &&
                    categories.map((cat) => (
                      <label
                        key={cat._id}
                        className="flex items-center gap-2 cursor-pointer py-1 px-2 hover:bg-gray-100 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(cat._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((f) => ({
                                ...f,
                                categories: [...f.categories, cat._id],
                              }));
                            } else {
                              setFormData((f) => ({
                                ...f,
                                categories: f.categories.filter(
                                  (id) => id !== cat._id
                                ),
                              }));
                            }
                          }}
                        />
                        <span>{cat.name}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            {/* PHẦN 3: Chọn khóa học */}
            {["course", "category+course"].includes(formData.appliesTo) && (
              <div>
                <div className="font-semibold text-rose-600 mb-2">
                  Chọn khóa học áp dụng
                </div>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                  {Array.isArray(courses) &&
                    courses.map((course) => (
                      <label
                        key={course._id}
                        className="flex items-center gap-2 cursor-pointer py-1 px-2 hover:bg-gray-100 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.courses.includes(course._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((f) => ({
                                ...f,
                                courses: [...f.courses, course._id],
                              }));
                            } else {
                              setFormData((f) => ({
                                ...f,
                                courses: f.courses.filter(
                                  (id) => id !== course._id
                                ),
                              }));
                            }
                          }}
                        />
                        <span>{course.title}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            {/* PHẦN 4: Điều kiện áp dụng */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Giá tối thiểu áp dụng
                  </label>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    type="number"
                    min={0}
                    value={formData.minPrice}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, minPrice: Number(e.target.value) }))
                    }
                    placeholder="Nhập giá tối thiểu"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {formData.minPrice > 0
                      ? formData.minPrice.toLocaleString("vi-VN") + "₫"
                      : "0₫ (Không giới hạn)"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Số lượng mã tối đa
                  </label>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    type="number"
                    min={0}
                    value={formData.maxUsage}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, maxUsage: Number(e.target.value) }))
                    }
                    placeholder="0 = Không giới hạn"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {formData.maxUsage > 0
                      ? `${formData.maxUsage} lượt`
                      : "0 (Không giới hạn)"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Số lượt mỗi user được dùng
                  </label>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    type="number"
                    min={0}
                    value={formData.maxUsagePerUser}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, maxUsagePerUser: Number(e.target.value) }))
                    }
                    placeholder="0 = Không giới hạn"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {formData.maxUsagePerUser > 0
                      ? `${formData.maxUsagePerUser} lượt/user`
                      : "0 (Không giới hạn)"}
                  </div>
                </div>
              </div>
            </div>

            {/* Nút */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-100 text-gray-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-rose-600 text-white font-bold hover:bg-rose-700"
              >
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal xác nhận xóa */}
      <RemoveModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa mã giảm giá?"
        message={`Bạn chắc chắn muốn xóa mã "${selectedPromotion?.code}"?`}
        confirmLabel="Xóa"
      />
    </div>
  );
};

export default PromotionsManagement;
