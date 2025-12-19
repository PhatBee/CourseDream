import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { sendReport, resetReportState } from '../../features/report/reportSlice';

const REPORT_REASONS = [
  "Nội dung không phù hợp",
  "Spam hoặc quảng cáo",
  "Vi phạm chính sách",
  "Ý khác"
];

const ReportModalMobile = ({ visible, onClose, type, targetId, isEnrolled }) => {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector(state => state.report);

  useEffect(() => {
    if (success) {
      Toast.show({ type: 'success', text1: 'Báo cáo đã được gửi!' });
      onClose();
      dispatch(resetReportState());
      setReason('');
      setDetail('');
    }
  }, [success, onClose, dispatch]);

  const handleSend = async () => {
    if (!isEnrolled) {
      Toast.show({ type: 'error', text1: 'Bạn cần ghi danh để sử dụng chức năng báo cáo.' });
      return;
    }
    if (!reason || (reason + detail).trim().length < 10) {
      Toast.show({ type: 'error', text1: 'Vui lòng chọn lý do và nhập tối thiểu 10 ký tự!' });
      return;
    }
    dispatch(sendReport({
      type,
      targetId,
      reason: reason + (detail ? `\n${detail}` : "")
    }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/30">
        <View className="bg-white rounded-xl p-6 w-11/12 max-w-lg">
          <Text className="text-xl font-bold mb-4">Báo cáo lạm dụng</Text>
          <Text className="text-gray-600 mb-4 text-sm">
            Vui lòng chọn lý do và mô tả chi tiết vấn đề bạn muốn báo cáo.
          </Text>
          <Text className="font-semibold mb-2">Loại vấn đề</Text>
          {REPORT_REASONS.map((r, idx) => (
            <TouchableOpacity
              key={idx}
              className={`mb-2 px-3 py-2 rounded ${reason === r ? 'bg-rose-100' : 'bg-gray-100'}`}
              onPress={() => setReason(r)}
            >
              <Text className={reason === r ? 'text-rose-600 font-bold' : 'text-gray-700'}>{r}</Text>
            </TouchableOpacity>
          ))}
          <Text className="font-semibold mb-2">Thông tin về vấn đề</Text>
          <TextInput
            className="border rounded px-3 py-2 mb-4"
            value={detail}
            onChangeText={setDetail}
            placeholder="Mô tả chi tiết vấn đề bạn muốn báo cáo"
            multiline
            numberOfLines={3}
          />
          {error && <Text className="text-red-500 mb-2">{error}</Text>}
          <View className="flex-row justify-end gap-2">
            <TouchableOpacity className="px-5 py-2 rounded bg-gray-200" onPress={onClose}>
              <Text>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-5 py-2 rounded font-semibold text-white bg-rose-500"
              onPress={handleSend}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text>Gửi</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ReportModalMobile;