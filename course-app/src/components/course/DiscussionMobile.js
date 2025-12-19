import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, FlatList, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDiscussions, addDiscussion, replyDiscussion, resetDiscussionState } from '../../features/discussion/discussionSlice';
import Toast from 'react-native-toast-message';
import ReportModalMobile from '../common/ReportModalMobile';
import { Flag } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Thêm dòng này

const DiscussionMobile = ({ courseId, isEnrolled, user, highlightReplyId: propHighlightReplyId }) => {
  const insets = useSafeAreaInsets(); // Lấy thông tin vùng an toàn
  const dispatch = useDispatch();
  const { discussions, loading } = useSelector(state => state.discussion);
  const [newContent, setNewContent] = useState('');
  const [replyContent, setReplyContent] = useState({});
  const [page, setPage] = useState(1);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportTargetId, setReportTargetId] = useState('');
  const flatListRef = useRef(null);
  const [pendingScrollIdx, setPendingScrollIdx] = useState(null);
  const [highlightReplyId, setHighlightReplyId] = useState(propHighlightReplyId);

  useEffect(() => {
    if (courseId) {
      dispatch(fetchDiscussions({ courseId }));
    }
  }, [courseId, dispatch]);

  // Khi propHighlightReplyId thay đổi (từ NotificationScreen), cập nhật state
  useEffect(() => {
    setHighlightReplyId(propHighlightReplyId);
  }, [propHighlightReplyId]);

  // Khi discussions hoặc highlightReplyId thay đổi, xác định discussion chứa reply cần highlight
  useEffect(() => {
    if (highlightReplyId && discussions.length > 0) {
      const idx = discussions.findIndex(d =>
        d.replies?.some(r => r._id === highlightReplyId)
      );
      if (idx !== -1) setPendingScrollIdx(idx);
    }
  }, [highlightReplyId, discussions]);

  // Scroll khi FlatList render xong
  const handleContentSizeChange = () => {
    if (pendingScrollIdx !== null && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToIndex({ index: pendingScrollIdx, animated: true });
        setPendingScrollIdx(null);
      }, 100);
    }
  };

  const handleCreateDiscussion = async () => {
    if (!newContent.trim()) return;
    await dispatch(addDiscussion({ courseId, content: newContent }));
    setNewContent('');
    dispatch(fetchDiscussions({ courseId, page: 1, limit: 10 }));
    setPage(1);
    Toast.show({ type: 'success', text1: 'Đã gửi thảo luận!' });
  };

  const handleReply = async (discussionId) => {
    if (!replyContent[discussionId]?.trim()) return;
    await dispatch(replyDiscussion({ discussionId, content: replyContent[discussionId] }));
    setReplyContent({ ...replyContent, [discussionId]: '' });
    dispatch(fetchDiscussions({ courseId }));
    Toast.show({ type: 'success', text1: 'Đã gửi trả lời!' });
  };

  const openReport = (type, id) => {
    setReportType(type);
    setReportTargetId(id);
    setReportVisible(true);
  };

  const canDiscuss = isEnrolled || (user && user.role === 'instructor');

  // Hàm bỏ highlight khi nhấn vào màn hình
  const handleScreenPress = () => {
    setHighlightReplyId(null);
    Keyboard.dismiss();
  };

  if (loading) return (
    <View className="py-8 items-center">
      <ActivityIndicator size="large" color="#e11d48" />
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={handleScreenPress}>
      <View className="px-4 flex-1">
        <Text className="text-lg font-bold mb-2">Thảo luận khóa học</Text>
        {!canDiscuss && (
          <View className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <Text className="text-yellow-700">Bạn cần ghi danh khóa học để tham gia thảo luận.</Text>
          </View>
        )}
        {/* Ô nhập thảo luận mới */}
        <View className="flex-row items-start mb-4">
          <TextInput
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white"
            placeholder="Nhập chủ đề thảo luận của bạn"
            value={newContent}
            onChangeText={setNewContent}
            editable={canDiscuss}
            multiline
          />
          <TouchableOpacity
            className="ml-2 bg-rose-500 px-4 py-2 rounded-lg"
            onPress={handleCreateDiscussion}
            disabled={!canDiscuss || !newContent.trim()}
          >
            <Text className="text-white font-bold">Gửi</Text>
          </TouchableOpacity>
        </View>
        {/* Danh sách thảo luận */}
        <FlatList
          ref={flatListRef}
          data={discussions}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View className="mb-4 bg-white rounded-lg p-3 border border-gray-100">
              <View className="flex-row items-center mb-1">
                <Text className="font-semibold">{item.author?.name || 'Ẩn danh'}</Text>
                <Text className="ml-2 text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</Text>
                {/* Lá cờ báo cáo thảo luận */}
                {user?._id && item.author?._id !== user._id && (
                  <TouchableOpacity
                    onPress={() => openReport('discussion', item._id)}
                    className="ml-2"
                    accessibilityLabel="Báo cáo thảo luận"
                  >
                    <Flag size={16} color="#e11d48" />
                  </TouchableOpacity>
                )}
              </View>
              <Text className="text-gray-800 mb-2">{item.content}</Text>
              {/* Replies */}
              {item.replies?.map((reply, idx) => {
                const isHighlight = reply._id === highlightReplyId;
                return (
                  <View
                    key={reply._id}
                    className={`ml-4 mb-2 rounded p-2 flex-row items-center ${isHighlight ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-gray-50'}`}
                    style={isHighlight ? { shadowColor: '#FFD700', shadowOpacity: 0.5, shadowRadius: 4 } : {}}
                  >
                    <View className="flex-1">
                      <Text className="font-semibold text-sm">{reply.author?.name || 'Ẩn danh'}</Text>
                      <Text className="text-xs text-gray-400">{new Date(reply.createdAt).toLocaleString()}</Text>
                      <Text className="text-gray-700">{reply.content}</Text>
                    </View>
                    {/* Lá cờ báo cáo reply */}
                    {user?._id && reply.author?._id !== user._id && (
                      <TouchableOpacity
                        onPress={() => openReport('reply', reply._id)}
                        className="ml-2"
                        accessibilityLabel="Báo cáo bình luận"
                      >
                        <Flag size={15} color="#e11d48" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
              {/* Ô nhập trả lời */}
              {canDiscuss && (
                <View className="flex-row items-center mt-2">
                  <TextInput
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1 bg-white"
                    placeholder="Trả lời thảo luận..."
                    value={replyContent[item._id] || ''}
                    onChangeText={text => setReplyContent({ ...replyContent, [item._id]: text })}
                    multiline
                    onFocus={() => setHighlightReplyId(null)} // Bỏ highlight khi focus vào input
                  />
                  <TouchableOpacity
                    className="ml-2 bg-rose-500 px-3 py-1.5 rounded-lg"
                    onPress={() => handleReply(item._id)}
                    disabled={!replyContent[item._id]?.trim()}
                  >
                    <Text className="text-white font-bold">Gửi</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={<Text className="text-gray-500 text-center mt-4">Chưa có thảo luận nào.</Text>}
          contentContainerStyle={{
            paddingBottom: insets.bottom, // Thêm padding dưới theo vùng an toàn
          }}
          onContentSizeChange={handleContentSizeChange}
        />

        <ReportModalMobile
          visible={reportVisible}
          onClose={() => setReportVisible(false)}
          type={reportType}
          targetId={reportTargetId}
          isEnrolled={isEnrolled} // <-- THÊM DÒNG NÀY
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default DiscussionMobile;