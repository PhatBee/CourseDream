import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { X, Calendar, CreditCard, Award, CheckCircle2 } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { extendEnrollmentThunk } from '../../features/enrollment/enrollmentSlice';
import Toast from 'react-native-toast-message';

const CourseExtensionModalMobile = ({ visible, onClose, enrollment }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector(state => state.enrollment);
  const [selectedPkg, setSelectedPkg] = useState('2weeks');

  if (!enrollment || !enrollment.course) return null;

  const { course, extensionCount = 0 } = enrollment;
  const durationInWeeks = course.durationInWeeks || 12;
  const basePrice = course.priceDiscount > 0 ? course.priceDiscount : (course.price || 0);

  // Tính toán gói - GIỮ NGUYÊN SỐ THẬP PHÂN (KHÔNG LÀM TRÒN)
  let packages = [
    {
      id: '2weeks',
      name: 'Gói 2 tuần',
      duration: '2 tuần',
      price: basePrice * (2 / durationInWeeks),
      desc: 'Hoàn thành nốt bài học còn dang dở'
    },
    {
      id: '4weeks',
      name: 'Gói 1 tháng',
      duration: '4 tuần',
      price: (basePrice * (4 / durationInWeeks)) * 0.95,
      desc: 'Ưu đãi tiết kiệm 5%'
    },
    {
      id: 'full',
      name: 'Gói trọn vẹn',
      duration: `${durationInWeeks} tuần`,
      price: basePrice * 0.7,
      desc: `Ưu đãi 30% - Bằng thời gian gốc`
    }
  ];

  // Logic: Nếu khóa học gốc chỉ có 1 tháng (4 tuần) -> Chỉ hiện 2 gói
  if (durationInWeeks <= 4) {
    packages = packages.filter(p => p.id !== 'full');
  }

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleConfirm = async () => {
    const pkgId = extensionCount === 0 ? '2weeks' : selectedPkg;
    try {
      await dispatch(extendEnrollmentThunk({ enrollmentId: enrollment._id, packageId: pkgId })).unwrap();
      Toast.show({ type: 'success', text1: 'Gia hạn thành công!' });
      onClose();
    } catch (error) { /* Đã xử lý ở Slice */ }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/60 px-4">
        <View className="bg-white w-full max-h-[80%] rounded-3xl overflow-hidden">
          {/* Header */}
          <View className="flex-row justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">Gia hạn khóa học</Text>
              <Text className="text-xs text-gray-500" numberOfLines={1}>{course.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isLoading}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-5">
            {extensionCount === 0 ? (
              <View className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 items-center">
                <Award size={48} color="#10b981" />
                <Text className="text-emerald-800 font-bold mt-2 text-center">Quà tặng lần đầu!</Text>
                <Text className="text-emerald-700 text-center text-sm mt-1">
                  Bạn nhận được <Text className="font-bold">2 tuần học MIỄN PHÍ</Text> cho lần gia hạn này.
                </Text>
              </View>
            ) : (
              <View>
                <Text className="text-gray-600 text-sm mb-4">Vui lòng chọn gói gia hạn:</Text>
                {packages.map((pkg) => (
                  <TouchableOpacity
                    key={pkg.id}
                    onPress={() => setSelectedPkg(pkg.id)}
                    className={`flex-row justify-between items-center p-4 mb-3 border-2 rounded-2xl ${
                      selectedPkg === pkg.id ? 'border-rose-500 bg-rose-50' : 'border-gray-100'
                    }`}
                  >
                    <View className="flex-1">
                      <Text className="font-bold text-gray-900">{pkg.name}</Text>
                      <Text className="text-[10px] text-gray-500 mt-1">{pkg.desc}</Text>
                    </View>
                    <View className="items-end">
                      <Text className={`font-bold ${selectedPkg === pkg.id ? 'text-rose-600' : 'text-gray-900'}`}>
                        {formatPrice(pkg.price)}
                      </Text>
                      <Text className="text-[10px] text-gray-400">+{pkg.duration}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View className="p-5 border-t border-gray-100 flex-row gap-3">
            <TouchableOpacity onPress={onClose} className="flex-1 py-3 rounded-xl border border-gray-200">
              <Text className="text-center font-bold text-gray-600">Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleConfirm}
              disabled={isLoading}
              className="flex-2 bg-rose-500 py-3 rounded-xl flex-row justify-center items-center px-6"
            >
              {isLoading ? <ActivityIndicator color="white" size="small" /> : (
                <>
                  <CreditCard size={18} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-bold">Xác nhận</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CourseExtensionModalMobile;