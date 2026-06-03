import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "../../features/promotion/promotionSlice";
import { Plus, Tag, Trash2, Edit, X, CheckCircle, Search } from "lucide-react";
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

  const [categorySearch, setCategorySearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()));
  const filteredCourses = courses.filter(c => c.title.toLowerCase().includes(courseSearch.toLowerCase()));

  useEffect(() => {
    dispatch(fetchPromotions());
  }, [dispatch]);

  // Khi mở modal, nếu chưa có dữ liệu thì fetch
  const [hasFetchedAll, setHasFetchedAll] = useState(false);
  useEffect(() => {
    if (isEditModalOpen && !hasFetchedAll) {
      dispatch(getCategories({ limit: 1000 }));
      dispatch(getAllCourses({ limit: 1000 }));
      setHasFetchedAll(true);
    }
  }, [isEditModalOpen, dispatch, hasFetchedAll]);

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
              {promotions.map((promo) => {
                const isInactive = !promo.isActive;
                return (
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
                    <td className="px-6 py-4">
                      {promo.appliesTo === "all" ? "Tất cả khóa học" :
                       promo.appliesTo === "category" ? "Danh mục" :
                       promo.appliesTo === "course" ? "Khóa học" :
                       promo.appliesTo === "category+course" ? "Danh mục & Khóa học" : promo.appliesTo}
                    </td>
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
                          !isInactive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {!isInactive ? "Hoạt động" : "Ngừng"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(promo)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={isInactive ? "Xem chi tiết" : "Sửa"}
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
                );
              })}
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
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-scaleIn relative flex flex-col max-h-[90vh]">
            <button
              type="button"
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1.5 transition-all z-10"
              onClick={() => setIsEditModalOpen(false)}
            >
              <X size={22} />
            </button>

            {(() => {
              const isFormDisabled = !formData.isActive;
              return (
                <form
                  className="flex flex-col h-full max-h-[90vh]"
                  onSubmit={handleSavePromotion}
                >
                  {/* Header */}
                  <div className="bg-gray-900 p-6 flex items-center gap-4 text-white shrink-0">
                    <div className="bg-rose-500/20 p-3 rounded-xl">
                      <Tag size={28} className="text-rose-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-wide text-white">
                        {selectedPromotion ? "Sửa mã giảm giá" : "Thêm mã giảm giá mới"}
                      </h2>
                      <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                        Trạng thái: 
                        {selectedPromotion ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm inline-flex items-center gap-1 ${
                            !isFormDisabled ? "bg-green-500 text-white" : "bg-gray-500 text-white"
                          }`}>
                            {!isFormDisabled ? "Hoạt động" : "Ngưng hoạt động"}
                          </span>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm inline-flex items-center gap-1 ${
                            !isFormDisabled ? "bg-blue-500 text-white" : "bg-gray-500 text-white"
                          }`}>
                            {!isFormDisabled ? "Tạo mới" : "Tạo mới (Ngưng)"}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Cột trái: Thông tin cơ bản */}
                      <div className="space-y-6">
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Thông tin chung</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Mã giảm giá</label>
                              <input
                                className={`w-full border shadow-sm border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all ${(!!selectedPromotion || isFormDisabled) ? "bg-gray-100 text-gray-500" : "bg-white"}`}
                                placeholder="Nhập mã (VD: SUMMER2024)"
                                value={formData.code}
                                onChange={(e) => setFormData((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                                required
                                disabled={!!selectedPromotion || isFormDisabled}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Loại giảm giá</label>
                                <select
                                  className={`w-full border shadow-sm border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all ${isFormDisabled ? "bg-gray-100 text-gray-500" : "bg-white cursor-pointer"}`}
                                  value={formData.discountType}
                                  onChange={(e) => setFormData((f) => ({ ...f, discountType: e.target.value }))}
                                  disabled={isFormDisabled}
                                >
                                  <option value="percent">Phần trăm (%)</option>
                                  <option value="fixed">Số tiền (VNĐ)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Giá trị</label>
                                <input
                                  className={`w-full border shadow-sm border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all ${isFormDisabled ? "bg-gray-100 text-gray-500" : "bg-white"}`}
                                  type="number"
                                  min={0}
                                  value={formData.discountValue}
                                  onChange={(e) => setFormData((f) => ({ ...f, discountValue: e.target.value }))}
                                  required
                                  disabled={isFormDisabled}
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Ngày bắt đầu</label>
                                <input
                                  className={`w-full border shadow-sm border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all ${isFormDisabled ? "bg-gray-100 text-gray-500" : "bg-white"}`}
                                  type="date"
                                  value={formData.startDate}
                                  onChange={(e) => setFormData((f) => ({ ...f, startDate: e.target.value }))}
                                  required
                                  disabled={isFormDisabled}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Ngày kết thúc</label>
                                <input
                                  className={`w-full border shadow-sm border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all ${isFormDisabled ? "bg-gray-100 text-gray-500" : "bg-white"}`}
                                  type="date"
                                  value={formData.endDate}
                                  onChange={(e) => setFormData((f) => ({ ...f, endDate: e.target.value }))}
                                  required
                                  disabled={isFormDisabled}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Điều kiện sử dụng</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Giá trị đơn hàng tối thiểu</label>
                              <div className="relative">
                                <input
                                  className={`w-full border shadow-sm border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all pr-12 ${isFormDisabled ? "bg-gray-100 text-gray-500" : "bg-white"}`}
                                  type="number"
                                  min={0}
                                  value={formData.minPrice}
                                  onChange={(e) => setFormData((f) => ({ ...f, minPrice: Number(e.target.value) }))}
                                  disabled={isFormDisabled}
                                  placeholder="Nhập giá tối thiểu (0 = Không giới hạn)"
                                />
                                <span className="absolute right-4 top-2.5 text-gray-400 text-sm font-medium">VNĐ</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tổng số lượt dùng</label>
                                <input
                                  className={`w-full border shadow-sm border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all ${isFormDisabled ? "bg-gray-100 text-gray-500" : "bg-white"}`}
                                  type="number"
                                  min={0}
                                  value={formData.maxUsage}
                                  onChange={(e) => setFormData((f) => ({ ...f, maxUsage: Number(e.target.value) }))}
                                  disabled={isFormDisabled}
                                  placeholder="0 = Không giới hạn"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Số lượt cho mỗi User</label>
                                <input
                                  className={`w-full border shadow-sm border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all ${isFormDisabled ? "bg-gray-100 text-gray-500" : "bg-white"}`}
                                  type="number"
                                  min={0}
                                  value={formData.maxUsagePerUser}
                                  onChange={(e) => setFormData((f) => ({ ...f, maxUsagePerUser: Number(e.target.value) }))}
                                  disabled={isFormDisabled}
                                  placeholder="0 = Không giới hạn"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cột phải: Áp dụng cho */}
                      <div className="space-y-6">
                        <div className="bg-white rounded-xl p-5 border border-indigo-100 shadow-sm ring-1 ring-indigo-50 h-full flex flex-col">
                          <h3 className="text-lg font-bold text-indigo-900 mb-4 border-b pb-2 flex items-center gap-2">
                            Phạm vi áp dụng
                          </h3>
                          
                          <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Đối tượng áp dụng</label>
                            <select
                              className={`w-full border shadow-sm border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all ${isFormDisabled ? "bg-gray-100 text-gray-500" : "bg-white cursor-pointer"}`}
                              value={formData.appliesTo}
                              onChange={(e) => setFormData((f) => ({ ...f, appliesTo: e.target.value }))}
                              disabled={isFormDisabled}
                            >
                              <option value="all">Tất cả khóa học</option>
                              <option value="category">Chỉ danh mục cụ thể</option>
                              <option value="course">Chỉ khóa học cụ thể</option>
                              <option value="category+course">Danh mục & Khóa học</option>
                            </select>
                          </div>

                          {/* Chọn danh mục */}
                          {["category", "category+course"].includes(formData.appliesTo) && (
                            <div className="mb-4 flex-1 flex flex-col">
                              <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-bold text-indigo-500 uppercase">Danh mục áp dụng</label>
                                {!isFormDisabled && filteredCategories.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const allIds = filteredCategories.map(c => c._id);
                                      const isAllSelected = allIds.every(id => formData.categories.includes(id));
                                      if (isAllSelected) {
                                        setFormData(f => ({ ...f, categories: f.categories.filter(id => !allIds.includes(id)) }));
                                      } else {
                                        setFormData(f => ({ ...f, categories: [...new Set([...f.categories, ...allIds])] }));
                                      }
                                    }}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                                  >
                                    {filteredCategories.every(c => formData.categories.includes(c._id)) ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                  </button>
                                )}
                              </div>
                              
                              <div className="relative mb-2">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                                <input
                                  type="text"
                                  placeholder="Tìm kiếm danh mục..."
                                  value={categorySearch}
                                  onChange={(e) => setCategorySearch(e.target.value)}
                                  disabled={isFormDisabled}
                                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 disabled:bg-gray-100 disabled:text-gray-500 transition-all"
                                />
                              </div>

                              <div className="flex-1 min-h-[120px] max-h-[200px] overflow-y-auto border border-gray-200 rounded-xl p-3 bg-gray-50 custom-scrollbar">
                                {filteredCategories.length > 0 ? filteredCategories.map((cat) => (
                                  <label key={cat._id} className={`flex items-center gap-3 py-2 px-3 rounded-lg mb-1 transition-colors ${isFormDisabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm"}`}>
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                                      checked={formData.categories.includes(cat._id)}
                                      disabled={isFormDisabled}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setFormData((f) => ({ ...f, categories: [...f.categories, cat._id] }));
                                        } else {
                                          setFormData((f) => ({ ...f, categories: f.categories.filter((id) => id !== cat._id) }));
                                        }
                                      }}
                                    />
                                    <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                                  </label>
                                )) : <div className="text-sm text-gray-500 text-center py-4 italic">Không tìm thấy danh mục</div>}
                              </div>
                            </div>
                          )}

                          {/* Chọn khóa học */}
                          {["course", "category+course"].includes(formData.appliesTo) && (
                            <div className="flex-1 flex flex-col mt-auto">
                              <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-bold text-indigo-500 uppercase">Khóa học áp dụng</label>
                                {!isFormDisabled && filteredCourses.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const allIds = filteredCourses.map(c => c._id);
                                      const isAllSelected = allIds.every(id => formData.courses.includes(id));
                                      if (isAllSelected) {
                                        setFormData(f => ({ ...f, courses: f.courses.filter(id => !allIds.includes(id)) }));
                                      } else {
                                        setFormData(f => ({ ...f, courses: [...new Set([...f.courses, ...allIds])] }));
                                      }
                                    }}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                                  >
                                    {filteredCourses.every(c => formData.courses.includes(c._id)) ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                  </button>
                                )}
                              </div>

                              <div className="relative mb-2">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                                <input
                                  type="text"
                                  placeholder="Tìm kiếm khóa học..."
                                  value={courseSearch}
                                  onChange={(e) => setCourseSearch(e.target.value)}
                                  disabled={isFormDisabled}
                                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 disabled:bg-gray-100 disabled:text-gray-500 transition-all"
                                />
                              </div>

                              <div className="flex-1 min-h-[120px] max-h-[200px] overflow-y-auto border border-gray-200 rounded-xl p-3 bg-gray-50 custom-scrollbar">
                                {filteredCourses.length > 0 ? filteredCourses.map((course) => (
                                  <label key={course._id} className={`flex items-start gap-3 py-2 px-3 rounded-lg mb-1 transition-colors ${isFormDisabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm"}`}>
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                                      checked={formData.courses.includes(course._id)}
                                      disabled={isFormDisabled}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setFormData((f) => ({ ...f, courses: [...f.courses, course._id] }));
                                        } else {
                                          setFormData((f) => ({ ...f, courses: f.courses.filter((id) => id !== course._id) }));
                                        }
                                      }}
                                    />
                                    <span className="text-sm font-medium text-gray-700 leading-tight">{course.title}</span>
                                  </label>
                                )) : <div className="text-sm text-gray-500 text-center py-4 italic">Không tìm thấy khóa học</div>}
                              </div>
                            </div>
                          )}

                          {/* Kích hoạt */}
                          <div className="mt-4 pt-4 border-t border-indigo-100">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                                checked={formData.isActive}
                                onChange={(e) => setFormData((f) => ({ ...f, isActive: e.target.checked }))}
                              />
                              <span className={`text-sm font-bold ${formData.isActive ? "text-green-700" : "text-gray-500"}`}>
                                {formData.isActive ? "Đang kích hoạt mã giảm giá này" : "Bật kích hoạt mã giảm giá này"}
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-white p-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold transition-colors"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      className={`px-6 py-2.5 rounded-xl text-white font-bold transition-all shadow-lg flex items-center gap-2 ${
                        formData.isActive 
                          ? "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-200" 
                          : "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 shadow-gray-200"
                      }`}
                    >
                      <CheckCircle size={18} />
                      {selectedPromotion ? "Lưu Thay Đổi" : "Tạo Mã"}
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
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
