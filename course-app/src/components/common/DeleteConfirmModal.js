import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Trash2, X } from "lucide-react-native";

/**
 * DeleteConfirmModal – Mobile equivalent của RemoveModal (web)
 * Props:
 *   visible     {boolean}  - Trạng thái hiển thị modal
 *   onClose     {function} - Callback khi đóng / hủy
 *   onConfirm   {function} - Callback khi xác nhận xóa
 *   title       {string}   - Tiêu đề popup (default: "Xóa mục này")
 *   message     {string}   - Nội dung cảnh báo
 *   isDeleting  {boolean}  - Trạng thái đang xử lý (hiện spinner)
 *   confirmLabel{string}   - Nhãn nút xác nhận (default: "Xóa")
 *   cancelLabel {string}   - Nhãn nút hủy (default: "Hủy")
 */
const DeleteConfirmModal = ({
  visible,
  onClose,
  onConfirm,
  title = "Xóa mục này",
  message = "Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác.",
  isDeleting = false,
  confirmLabel = "Xóa",
  cancelLabel = "Hủy",
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={!isDeleting ? onClose : undefined}
    >
      {/* Overlay */}
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}
        onPress={!isDeleting ? onClose : undefined}
      >
        {/* Card – stopPropagation để click bên trong không đóng modal */}
        <Pressable
          style={{ width: "100%", maxWidth: 380 }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 28,
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            {/* Nút X góc phải */}
            <TouchableOpacity
              onPress={onClose}
              disabled={isDeleting}
              style={{ position: "absolute", top: 16, right: 16, padding: 4 }}
            >
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Icon thùng rác */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "#FEF2F2",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Trash2 size={30} color="#EF4444" />
            </View>

            {/* Tiêu đề */}
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#111827",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              {title}
            </Text>

            {/* Nội dung cảnh báo */}
            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 28,
              }}
            >
              {message}
            </Text>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
              {/* Nút Hủy */}
              <TouchableOpacity
                onPress={onClose}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 50,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  opacity: isDeleting ? 0.5 : 1,
                }}
              >
                <Text style={{ fontWeight: "600", color: "#374151", fontSize: 15 }}>
                  {cancelLabel}
                </Text>
              </TouchableOpacity>

              {/* Nút Xác nhận Xóa */}
              <TouchableOpacity
                onPress={onConfirm}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 50,
                  backgroundColor: "#EF4444",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isDeleting ? 0.7 : 1,
                  shadowColor: "#EF4444",
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ fontWeight: "bold", color: "#fff", fontSize: 15 }}>
                    {confirmLabel}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default DeleteConfirmModal;
