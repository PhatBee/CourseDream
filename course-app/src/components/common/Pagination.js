import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5; // Số trang hiển thị tối đa

        if (totalPages <= maxVisible) {
            // Hiển thị tất cả nếu ít hơn maxVisible
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Logic hiển thị với dấu ...
            if (currentPage <= 3) {
                // Đầu danh sách
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                // Cuối danh sách
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                // Giữa danh sách
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }

        return pages;
    };

    const pages = getPageNumbers();

    return (
        <View className="flex-row items-center justify-center py-6 px-4">
            {/* Previous Button */}
            <TouchableOpacity
                onPress={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`w-10 h-10 rounded-lg items-center justify-center mr-2 ${currentPage === 1 ? 'bg-gray-100' : 'bg-white border border-gray-200'
                    }`}
            >
                <ChevronLeft size={20} color={currentPage === 1 ? '#9ca3af' : '#374151'} />
            </TouchableOpacity>

            {/* Page Numbers */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ alignItems: 'center' }}
                className="flex-1 mx-2"
            >
                {pages.map((page, index) => {
                    if (page === '...') {
                        return (
                            <View key={`ellipsis-${index}`} className="w-10 h-10 items-center justify-center">
                                <Text className="text-gray-400 font-medium">...</Text>
                            </View>
                        );
                    }

                    const isActive = page === currentPage;

                    return (
                        <TouchableOpacity
                            key={page}
                            onPress={() => onPageChange(page)}
                            className={`w-10 h-10 rounded-lg items-center justify-center mx-1 ${isActive
                                    ? 'bg-rose-500'
                                    : 'bg-white border border-gray-200'
                                }`}
                        >
                            <Text
                                className={`font-semibold ${isActive ? 'text-white' : 'text-gray-700'
                                    }`}
                            >
                                {page}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Next Button */}
            <TouchableOpacity
                onPress={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`w-10 h-10 rounded-lg items-center justify-center ml-2 ${currentPage === totalPages ? 'bg-gray-100' : 'bg-white border border-gray-200'
                    }`}
            >
                <ChevronRight
                    size={20}
                    color={currentPage === totalPages ? '#9ca3af' : '#374151'}
                />
            </TouchableOpacity>
        </View>
    );
};

export default Pagination;
