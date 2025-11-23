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

    useEffect(() => { dispatch(getWishlist()); }, [dispatch]);

    useEffect(() => {
        setDisplayItems(prev => {
            if (prev.length === 0 && reduxItems.length > 0) return reduxItems;
            const existingIds = new Set(prev.map(item => item._id));
            const newItems = reduxItems.filter(item => !existingIds.has(item._id));
            return newItems.length > 0 ? [...prev, ...newItems] : prev;
        });
    }, [reduxItems]);

    const handleToggleItem = (courseId) => {
        const isCurrentlyInWishlist = reduxItems.some(item => item._id === courseId);
        if (isCurrentlyInWishlist) dispatch(removeFromWishlist(courseId));
        else dispatch(addToWishlist(courseId));
    };

    const handleConfirmClear = async () => {
        setIsDeleting(true);
        try {
            await dispatch(clearWishlist());
            setIsRemoveModalOpen(false);
            setDisplayItems([]);
            setCurrentPage(1);
        } catch (error) { console.error("Failed:", error); } 
        finally { setIsDeleting(false); }
    };

    // Loading State
    if (isLoading && displayItems.length === 0) return <div className="flex justify-center h-64"><Spinner /></div>;

    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 md:p-8 min-h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 text-left">Wishlist</h2>
                    <p className="text-sm text-gray-500 mt-1">Courses you have saved for later</p>
                </div>

                {reduxItems.length > 0 && (
                    <button
                        onClick={() => setIsRemoveModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                    >
                        <Trash2 size={18} />
                        Clear All
                    </button>
                )}
            </div>

            {/* Content */}
            {displayItems.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                        {displayItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((course) => {
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

                    {/* Pagination */}
                    <div className="mt-8">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(displayItems.length / ITEMS_PER_PAGE)}
                            onPageChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        />
                    </div>
                </>
            ) : (
                // Empty State
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <HeartOff size={40} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Your wishlist is empty</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">Looks like you haven't added any courses yet. Browse our catalog to find something you like!</p>
                    <a href="/courses" className="inline-flex px-6 py-3 bg-rose-500 text-white rounded-full font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200">
                        Explore Courses
                    </a>
                </div>
            )}

            <RemoveModal
                isOpen={isRemoveModalOpen}
                onClose={() => setIsRemoveModalOpen(false)}
                onConfirm={handleConfirmClear}
                title="Clear Wishlist"
                message="Are you sure you want to remove all items?"
                confirmLabel="Yes, Clear All"
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default WishlistPage;