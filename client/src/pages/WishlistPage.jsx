import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getWishlist, clearWishlist, removeFromWishlist, addToWishlist } from '../features/wishlist/wishlistSlice';
import CourseCard from '../components/common/CourseCard';
import Pagination from '../components/common/Pagination';
import RemoveModal from '../components/common/RemoveModal';
import { Trash2, HeartOff } from 'lucide-react';
import Spinner from '../components/common/Spinner';

const ITEMS_PER_PAGE = 6;

const WishlistPage = () => {
    const dispatch = useDispatch();
    const { items: reduxItems, isLoading } = useSelector((state) => state.wishlist);

    const [displayItems, setDisplayItems] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        dispatch(getWishlist());
    }, [dispatch]);

    useEffect(() => {
        setDisplayItems(prev => {
            if (prev.length === 0 && reduxItems.length > 0) {
                return reduxItems;
            }

            const existingIds = new Set(prev.map(item => item._id));
            const newItems = reduxItems.filter(item => !existingIds.has(item._id));

            if (newItems.length > 0) {
                return [...prev, ...newItems];
            }

            return prev;
        });
    }, [reduxItems]);

    // --- Logic Phân trang ---
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = displayItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(displayItems.length / ITEMS_PER_PAGE);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handlers cho Modal
    const handleOpenClearModal = () => setIsRemoveModalOpen(true);
    const handleCloseModal = () => setIsRemoveModalOpen(false);

    const handleToggleItem = (courseId) => {
        const isCurrentlyInWishlist = reduxItems.some(item => item._id === courseId);
        if (isCurrentlyInWishlist) {
            dispatch(removeFromWishlist(courseId));
        }else {
            dispatch(addToWishlist(courseId));
        }
    };

    const handleConfirmClear = async () => {
        setIsDeleting(true);
        try {
            await dispatch(clearWishlist());
            setIsRemoveModalOpen(false);
            setDisplayItems([]);
            setCurrentPage(1);
        } catch (error) {
            console.error("Failed to clear wishlist:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading && displayItems.length === 0) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                    Wishlist <span className="text-gray-500 text-lg font-normal">({reduxItems.length})</span>
                </h2>

                {/* Nút Remove All chỉ hiện khi còn item thực trong Redux */}
                {reduxItems.length > 0 && (
                    <button
                        onClick={handleOpenClearModal}
                        className="flex items-center text-rose-500 hover:text-rose-700 text-sm font-medium transition-colors px-3 py-2 rounded-lg hover:bg-rose-50"
                    >
                        <Trash2 size={16} className="mr-1.5" />
                        Remove All
                    </button>
                )}
            </div>

            {/* Content */}
            {displayItems.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeIn">
                        {currentItems.map((course) => {
                            const isLiked = reduxItems.some(item => item._id === course._id);
                            
                            return (
                                <CourseCard
                                    key={course._id}
                                    course={course}
                                    isWishlistPage={true}
                                    isLiked={isLiked}
                                    onToggleWishlist={() => handleToggleItem(course._id)}
                                />
                            );
                        })}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            ) : (
                // Empty State
                <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300 animate-fadeIn">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-gray-50 rounded-full">
                            <HeartOff size={40} className="text-gray-400" />
                        </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Your wishlist is empty</h3>
                    <p className="text-gray-500 mt-1 mb-6">Explore courses and add them to your wishlist.</p>
                    <a href="/courses" className="px-6 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium inline-block">
                        Explore Coursess
                    </a>
                </div>
            )}

            <RemoveModal
                isOpen={isRemoveModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmClear}
                title="Clear Wishlist"
                message="Are you sure you want to remove all courses from your wishlist? This action cannot be undone."
                confirmLabel="Yes, Clear All"
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default WishlistPage;