import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import {
  sendReport,
  resetReportState,
} from "../../features/report/reportSlice";
import { AlertTriangle, X, ChevronDown } from "lucide-react-native";

const REASON_OPTIONS = {
  course: [
    {
      value: "INAPPROPRIATE_CONTENT",
      label: "Nội dung khóa học không phù hợp",
    },
    { value: "COPYRIGHT_VIOLATION", label: "Vi phạm bản quyền" },
    { value: "FRAUD", label: "Lừa đảo / Sai sự thật" },
    { value: "SPAM", label: "Spam hoặc quảng cáo" },
    { value: "OTHER", label: "Khác" },
  ],
  discussion: [
    { value: "INAPPROPRIATE_CONTENT", label: "Vi phạm chính sách cộng đồng" },
    { value: "HARASSMENT", label: "Hành vi không phù hợp / Quấy rối" },
    { value: "SPAM", label: "Nội dung rác / Quảng cáo" },
    { value: "OTHER", label: "Khác" },
  ],
  reply: [
    { value: "INAPPROPRIATE_CONTENT", label: "Vi phạm chính sách cộng đồng" },
    { value: "HARASSMENT", label: "Hành vi không phù hợp / Quấy rối" },
    { value: "SPAM", label: "Nội dung rác / Quảng cáo" },
    { value: "OTHER", label: "Khác" },
  ],
};

const ReportModalMobile = ({
  visible,
  onClose,
  type = "course",
  targetId,
  isEnrolled,
}) => {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.report);

  const currentReasons = REASON_OPTIONS[type] || REASON_OPTIONS.course;

  useEffect(() => {
    if (success) {
      Toast.show({ type: "success", text1: "Báo cáo thành công!" });
      handleClose();
    }
  }, [success]);

  const handleClose = () => {
    onClose();
    dispatch(resetReportState());
    setReason("");
    setDetail("");
    setIsDropdownOpen(false);
  };

  const handleSend = async () => {
    if (!isEnrolled) {
      Toast.show({
        type: "error",
        text1: "Bạn cần ghi danh để sử dụng chức năng báo cáo.",
      });
      return;
    }
    if (!reason) {
      Toast.show({
        type: "error",
        text1: "Vui lòng chọn loại vấn đề muốn báo cáo!",
      });
      return;
    }
    // Web backend expect: reason là value, detail là description
    dispatch(
      sendReport({
        type,
        targetId,
        reason: reason,
        detail: detail,
      }),
    );
  };

  const getReasonLabel = (value) => {
    const option = currentReasons.find((r) => r.value === value);
    return option ? option.label : "-- Vui lòng chọn một lý do --";
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50 p-4">
        <View className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
          {/* Nút Đóng Góc Phải */}
          <TouchableOpacity
            className="absolute top-4 right-4 z-10 p-1 bg-white/20 rounded-full"
            onPress={handleClose}
          >
            <X size={24} color="#FFF" />
          </TouchableOpacity>

          {/* Header Báo Cáo - Đồng bộ Modal Web */}
          <View className="bg-rose-500 pt-8 pb-6 px-6 items-center justify-center">
            <View className="bg-white/20 p-3 rounded-full mb-3">
              <AlertTriangle size={36} color="#FFF" />
            </View>
            <Text className="text-white text-2xl font-bold">
              Báo cáo lạm dụng
            </Text>
            <Text className="text-rose-100 text-sm mt-1 text-center">
              Giúp chúng tôi duy trì môi trường học tập an toàn.
            </Text>
          </View>

          {/* Body Báo Cáo */}
          <View className="p-6">
            <Text className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Loại vấn đề <Text className="text-rose-500">*</Text>
            </Text>

            {/* Custom Select/Dropdown */}
            <View className="mb-5 relative z-20">
              <TouchableOpacity
                className={`flex-row justify-between items-center w-full border ${isDropdownOpen ? "border-rose-400" : "border-gray-300"} rounded-xl px-4 py-3 bg-white`}
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <Text className={reason ? "text-gray-700" : "text-gray-400"}>
                  {getReasonLabel(reason)}
                </Text>
                <ChevronDown size={20} color="#9ca3af" />
              </TouchableOpacity>

              {/* Dropdown Options */}
              {isDropdownOpen && (
                <View className="absolute top-full left-0 right-0 bg-white border border-gray-200 mt-1 rounded-xl shadow-lg z-50 max-h-48 overflow-hidden">
                  <ScrollView nestedScrollEnabled>
                    {currentReasons.map((r, idx) => (
                      <TouchableOpacity
                        key={idx}
                        className={`px-4 py-3 border-b border-gray-100 ${reason === r.value ? "bg-rose-50" : "bg-white"}`}
                        onPress={() => {
                          setReason(r.value);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <Text
                          className={
                            reason === r.value
                              ? "text-rose-600 font-bold"
                              : "text-gray-700"
                          }
                        >
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <Text className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Chi tiết bổ sung
            </Text>
            <TextInput
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-700 bg-white mb-6"
              value={detail}
              onChangeText={setDetail}
              placeholder="Vui lòng cung cấp thêm ngữ cảnh cho quản trị viên..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {error && (
              <View className="flex-row items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle size={18} color="#dc2626" />
                <Text className="text-red-600 text-sm font-medium flex-1">
                  {error}
                </Text>
              </View>
            )}

            <View className="flex-row gap-3 pt-2">
              <TouchableOpacity
                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 justify-center items-center"
                onPress={handleClose}
                disabled={loading}
              >
                <Text className="font-semibold text-gray-700">Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 px-4 rounded-xl bg-gray-900 justify-center items-center flex-row gap-2"
                onPress={handleSend}
                disabled={loading || isDropdownOpen}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="font-bold text-white">Gửi báo cáo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ReportModalMobile;
