// client/src/features/review/ReviewList.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchReviews,
  toggleLike,
  removeReview,
  replyToReview,
} from "./reviewSlice";
import Spinner from "../../components/common/Spinner";
import StarRating from "../../components/common/StarRating";
import { ThumbsUp, Trash2, MessageCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import Avatar from "../../components/common/Avatar";

const ReviewList = ({ courseId, instructorId }) => {
  const dispatch = useDispatch();
  const { reviews, loading } = useSelector((state) => state.review);
  const currentUser = useSelector((state) => state.auth?.user);

  const [replyOpen, setReplyOpen] = useState({});
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (courseId) dispatch(fetchReviews({ courseId }));
  }, [courseId, dispatch]);

  const handleLike = (reviewId, reviewOwnerId) => {
    if (!currentUser) return toast.error("Vui lòng đăng nhập để thao tác");
    if (currentUser._id === reviewOwnerId)
      return toast.error("Bạn không thể like đánh giá của chính mình");
    dispatch(toggleLike(reviewId));
  };

  const handleDelete = async (reviewId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) {
      try {
        await dispatch(removeReview(reviewId)).unwrap();
        toast.success("Xóa thành công");
      } catch (error) {
        toast.error("Lỗi khi xóa");
      }
    }
  };

  const handleReplySubmit = async (reviewId) => {
    try {
      await dispatch(replyToReview({ reviewId, comment: replyText })).unwrap();
      toast.success("Đã gửi phản hồi");
      setReplyOpen((prev) => ({ ...prev, [reviewId]: false }));
      setReplyText("");
    } catch {
      toast.error("Lỗi khi gửi phản hồi");
    }
  };

  if (loading) return <Spinner />;
  if (!reviews || !reviews.length)
    return (
      <div className="text-gray-500 italic">
        Chưa có đánh giá nào cho khóa học này.
      </div>
    );

  return (
    <div className="space-y-6 text-left">
      <h5 className="text-xl font-semibold text-gray-800">Học viên phản hồi</h5>
      {reviews.map((review) => (
        <div key={review._id} className="flex gap-4 border-b pb-5">
          <Avatar
            src={review.student?.avatar}
            alt={review.student?.name}
            className="w-12 h-12 rounded-full border border-gray-200"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">
                  {review.student?.name}
                </span>
                <span className="text-xs flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle size={12} /> Đã mua khóa học
                </span>
                {review.isEdited && (
                  <span className="text-xs text-gray-400 italic">
                    (Đã chỉnh sửa)
                  </span>
                )}
              </div>

              {/* Nút xóa (Chỉ chủ sở hữu hoặc admin thấy) */}
              {(currentUser?._id === review.student?._id ||
                currentUser?.role === "admin") && (
                <button
                  onClick={() => handleDelete(review._id)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 my-1">
              <StarRating rating={review.rating} readOnly />
              <span className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>

            <p className="text-sm text-gray-700 mt-2 mb-3">{review.comment}</p>

            {/* Thanh công cụ tương tác */}
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => handleLike(review._id, review.student?._id)}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  review.likedUsers?.includes(currentUser?._id)
                    ? "text-rose-500 font-medium"
                    : "text-gray-500 hover:text-rose-500"
                }`}
              >
                <ThumbsUp size={14} />
                <span>Hữu ích ({review.likesCount || 0})</span>
              </button>

              {currentUser?._id &&
                instructorId &&
                String(currentUser._id) ===
                  String(
                    typeof instructorId === "object"
                      ? instructorId?._id
                      : instructorId,
                  ) &&
                (!review.instructorReply ||
                  !review.instructorReply.comment) && (
                  <button
                    onClick={() =>
                      setReplyOpen((p) => ({
                        ...p,
                        [review._id]: !p[review._id],
                      }))
                    }
                    className="flex items-center gap-1 text-xs text-rose-500 hover:underline"
                  >
                    <MessageCircle size={14} /> Phản hồi
                  </button>
                )}
            </div>

            {/* Khung nhập phản hồi cho Giảng viên */}
            {replyOpen[review._id] && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-rose-500"
                  placeholder="Nhập nội dung phản hồi..."
                />
                <button
                  onClick={() => handleReplySubmit(review._id)}
                  className="bg-rose-500 text-white px-3 py-1.5 rounded text-sm hover:bg-rose-600"
                >
                  Gửi
                </button>
              </div>
            )}

            {/* Hiển thị phản hồi của giảng viên (nếu có) */}
            {review.instructorReply && review.instructorReply.comment && (
              <div className="mt-4 bg-gray-50 p-4 rounded-lg border-l-4 border-rose-500 ml-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-gray-800">
                    Phản hồi từ giảng viên
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(
                      review.instructorReply.repliedAt,
                    ).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {review.instructorReply.comment}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
