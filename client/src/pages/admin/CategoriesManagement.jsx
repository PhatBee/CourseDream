import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../features/categories/categorySlice';
import { Search, Plus, Filter, Tag, BookOpen } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import ActionMenu from '../../components/admin/common/ActionMenu';
import RemoveModal from '../../components/common/RemoveModal';
import CategoryModal from '../../components/admin/category/CategoryModal';
import { toast } from 'react-hot-toast';

const CategoriesManagement = () => {
  const dispatch = useDispatch();
  const { items: categories, pagination, isLoading } = useSelector((state) => state.categories);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'courseCount', direction: 'desc' });

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 1. Fetch Data
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(getCategories({
        page: currentPage,
        search: searchTerm,
        sortBy: sortConfig.key,
        order: sortConfig.direction
      }));
    }, 500);
    return () => clearTimeout(timer);
  }, [dispatch, currentPage, searchTerm, sortConfig]);

  // 2. Handlers
  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc'
    });
  };

  const openCreateModal = () => {
    setSelectedCategory(null);
    setIsEditModalOpen(true);
  };

  const openEditModal = (cat) => {
    setSelectedCategory(cat);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (cat) => {
    if (cat.courseCount > 0) {
      toast.error(`Cannot delete! This category has ${cat.courseCount} active courses.`);
      return;
    }
    setSelectedCategory(cat);
    setIsDeleteModalOpen(true);
  };

  const handleSaveCategory = async (formData) => {
    if (selectedCategory) {
      await dispatch(updateCategory({ id: selectedCategory._id, data: formData }));
    } else {
      await dispatch(createCategory(formData));
    }
    setIsEditModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedCategory) {
      await dispatch(deleteCategory(selectedCategory._id));
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 shadow-sm transition-all hover:shadow-md"
        >
          <Plus size={20} /> Add New Category
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
        </div>

        {/* Sort Button (Optional) */}
        <button
          onClick={() => handleSort('courseCount')}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-colors font-medium text-sm
            ${sortConfig.key === 'courseCount' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}
          `}
        >
          <Filter size={18} />
          {sortConfig.direction === 'desc' ? 'Most Courses' : 'Least Courses'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Category Name</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4 text-center">Courses</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-gray-50/50 transition-colors group">

                  {/* Name + Icon */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-lg font-bold border border-rose-100">
                        {cat.icon || cat.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{cat.name}</p>
                      </div>
                    </div>
                  </td>

                  {/* Slug */}
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                    /{cat.slug}
                  </td>

                  {/* Course Count */}
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium
                      ${cat.courseCount > 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}
                    `}>
                      <BookOpen size={14} className="mr-1.5" />
                      {cat.courseCount}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Tag size={18} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(cat)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <div className="w-4 h-4 border-2 border-current rounded-sm flex items-center justify-center">
                          <div className="w-2 h-[2px] bg-current transform rotate-45"></div>
                          <div className="w-2 h-[2px] bg-current transform -rotate-45 absolute"></div>
                        </div>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {categories.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-400">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 pb-6">
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onConfirm={handleSaveCategory}
        initialData={selectedCategory}
        isEditing={!!selectedCategory}
      />

      <RemoveModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Category?"
        message={`Are you sure you want to delete "${selectedCategory?.name}"?`}
        confirmLabel="Yes, Delete"
      />
    </div>
  );
};

export default CategoriesManagement;