import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaTimes,
  FaThumbsUp,
  FaCheck,
  FaUserCircle,
  FaFlag,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import {
  getDiscussionReplies,
  replyToDiscussion,
  voteDiscussion,
  markBestAnswer,
} from "../../api/discussionApi";

// Tích hợp Report của hệ thống
import { sendReport, resetReportState } from "../report/reportSlice";
import ReportModal from "../../components/common/ReportModal";
import { useLocation } from "react-router-dom";
import Avatar from "../../components/common/Avatar";

const DiscussionModal = ({
  discussion,
  onClose,
  user,
  isInstructor,
  refreshParent,
  onReport, // Được truyền từ CourseDiscussion để báo cáo bài viết gốc
}) => {
  const dispatch = useDispatch();
  const {
    success,
    error: reportError,
    loading: reporting,
  } = useSelector((state) => state.report);

  const [replies, setReplies] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [replyInput, setReplyInput] = useState("");

  // Quản lý Modal báo cáo riêng cho Replies (Báo cáo câu trả lời)
  const [reportConfig, setReportConfig] = useState({
    open: false,
    targetId: null,
    type: null,
  });

  // Observer cho Infinite Scroll
  const observer = useRef();
  const lastReplyElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchReplies(nextPage);
            return nextPage;
          });
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  // Load Replies
  const fetchReplies = async (pageNumber) => {
    try {
      setLoading(true);
      const res = await getDiscussionReplies(discussion._id, pageNumber, 5);
      const data = res.data;

      if (data.replies.length < 5) setHasMore(false);

      setReplies((prev) =>
        pageNumber === 1 ? data.replies : [...prev, ...data.replies],
      );
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải bình luận");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplies(1);
  }, [discussion._id]);

  // Theo dõi trạng thái xử lý Report qua Redux
  useEffect(() => {
    if (success && reportConfig.open) {
      toast.success("Báo cáo của bạn đã được gửi!");
      dispatch(resetReportState());
      setReportConfig({ open: false, targetId: null, type: null });
    }
    if (reportError && reportConfig.open) {
      toast.error(reportError);
      dispatch(resetReportState());
    }
  }, [success, reportError, dispatch, reportConfig.open]);

  // Gửi Báo cáo (Dùng chung cho Reply)
  const handleReportSubmit = (reason, detail) => {
    dispatch(
      sendReport({
        type: reportConfig.type, // 'reply'
        targetId: reportConfig.targetId,
        reason,
        detail,
      }),
    );
  };

  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!replyInput.trim()) return toast.error("Vui lòng nhập nội dung!");

    try {
      setLoading(true);
      await replyToDiscussion(discussion._id, replyInput);
      setReplyInput("");
      setPage(1);
      setHasMore(true);
      await fetchReplies(1);
      refreshParent();
    } catch (err) {
      console.error(err);
      toast.error("Đăng câu trả lời thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleVoteReply = async (replyId) => {
    try {
      await voteDiscussion(discussion._id, "ANSWER", replyId);
      setReplies((prev) =>
        prev.map((r) => {
          if (r._id === replyId) {
            const hasVoted = r.upvotedBy?.includes(user?._id);
            return {
              ...r,
              upvotedBy: hasVoted
                ? r.upvotedBy.filter((id) => id !== user?._id)
                : [...(r.upvotedBy || []), user?._id],
              upvoteCount: hasVoted ? r.upvoteCount - 1 : r.upvoteCount + 1,
            };
          }
          return r;
        }),
      );
    } catch (err) {
      console.error(err);
      toast.error("Vote thất bại!");
    }
  };

  const handleMarkBestAnswer = async (replyId) => {
    try {
      await markBestAnswer(discussion._id, replyId);
      toast.success("Đã cập nhật câu trả lời hay nhất!");
      setPage(1);
      await fetchReplies(1);
      refreshParent();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi cập nhật best answer");
    }
  };

  // Component Skeleton
  const SkeletonReply = () => (
    <div className="p-4 rounded-xl border border-gray-100 bg-white animate-pulse">
      <div className="flex gap-3 mb-3">
        <div className="bg-gray-200 rounded-full w-8 h-8"></div>
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          <div className="h-2 bg-gray-100 rounded w-1/6"></div>
        </div>
      </div>
      <div className="space-y-2 ml-11">
        <div className="h-3 bg-gray-100 rounded"></div>
        <div className="h-3 bg-gray-100 rounded w-5/6"></div>
      </div>
    </div>
  );

  // Logic Scroll đến Reply cụ thể nếu có replyId trong URL query
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const replyId = params.get("replyId");

    // Nếu có replyId và mảng replies đã được nạp xong -> Scroll
    if (replyId && replies.length > 0 && !loading) {
      setTimeout(() => {
        const el = document.getElementById(`reply-${replyId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-rose-400", "bg-rose-50"); // Tạo hiệu ứng Highlight chớp nhoáng
          setTimeout(
            () => el.classList.remove("ring-2", "ring-rose-400", "bg-rose-50"),
            3000,
          );
        }
      }, 600); // Delay 600ms để đảm bảo rằng các phần tử đã được nạp xong
    }
  }, [location.search, replies, loading]);

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative text-left">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-rose-300 flex-shrink-0 rounded-t-2xl">
            <h3 className="font-bold text-gray-800">Chi tiết Thảo luận</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-rose-500 rounded-full bg-white shadow-sm transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          {/* Body (Scrollable) */}
          <div
            className="p-5 overflow-y-auto flex-1 flex flex-col gap-6 custom-scrollbar bg-gray-50"
            id="scrollable-modal"
          >
            {/* Discussion Box Tĩnh ở Trên */}
            <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm text-left">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3 text-left">
                  {discussion.author?.avatar ? (
                    <Avatar
                      src={discussion.author.avatar}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover shadow-sm"
                    />
                  ) : (
                    <FaUserCircle className="text-gray-300 w-10 h-10" />
                  )}
                  <div>
                    <div className="font-semibold text-gray-800">
                      {discussion.author?.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(discussion.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Nút Báo cáo Thảo luận */}
                {user && onReport && user._id !== discussion.author?._id && (
                  <button
                    onClick={onReport}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-rose-500 bg-gray-50 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                    title="Báo cáo vi phạm cho thảo luận này"
                  >
                    <FaFlag /> Báo cáo
                  </button>
                )}
              </div>

              <h4 className="text-lg font-bold text-gray-600 mb-2">
                {discussion.title}
              </h4>
              <p className="text-gray-600 whitespace-pre-wrap">
                {discussion.content}
              </p>
            </div>

            <hr className="border-gray-200" />

            <h4 className="font-semibold text-gray-800 -mb-2 text-left">
              Câu trả lời ({discussion.answerCount})
            </h4>

            {replies.length === 0 && !loading && (
              <div className="text-center text-sm text-gray-400 py-4">
                Chưa có câu trả lời nào. Hãy là người đầu tiên!
              </div>
            )}

            {/* Danh sách Replies */}
            {replies.map((reply, index) => {
              const isLastReply = replies.length === index + 1;
              return (
                <div
                  ref={isLastReply ? lastReplyElementRef : null}
                  key={reply._id}
                  id={`reply-${reply._id}`}
                  className={`p-4 rounded-xl border relative group ${reply.isBestAnswer ? "bg-green-50 border-green-200 shadow-sm" : "bg-white border-gray-100"} transition-all text-left`}
                >
                  {reply.isBestAnswer && (
                    <div className="flex items-center justify-start gap-1.5 text-green-700 font-bold text-xs mb-3 bg-green-100 w-fit px-3 py-1 rounded-full">
                      <FaCheck /> CÂU TRẢ LỜI HAY NHẤT
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-3 text-left">
                      {reply.author?.avatar ? (
                        <Avatar
                          src={reply.author.avatar}
                          alt="avatar"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <FaUserCircle className="text-gray-300 w-8 h-8" />
                      )}
                      <div>
                        <div className="font-semibold text-sm text-gray-700">
                          {reply.author?.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(reply.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Nút báo cáo Reply cụ thể */}
                    {user && user._id !== reply.author?._id && (
                      <button
                        onClick={() =>
                          setReportConfig({
                            open: true,
                            targetId: reply._id,
                            type: "reply",
                          })
                        }
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2 py-1 text-[11px] text-gray-400 hover:text-rose-500 bg-gray-50 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100"
                      >
                        <FaFlag /> Báo cáo
                      </button>
                    )}
                  </div>

                  <p className="text-gray-700 text-sm ml-11 mb-3 whitespace-pre-wrap">
                    {reply.content}
                  </p>

                  <div className="ml-11 flex justify-start gap-4 items-center">
                    <button
                      onClick={() => handleVoteReply(reply._id)}
                      className={`flex items-center gap-1 text-xs font-semibold ${reply.upvotedBy?.includes(user?._id) ? "text-rose-600" : "text-gray-500 hover:text-gray-800"}`}
                    >
                      <FaThumbsUp /> {reply.upvoteCount} Upvote
                    </button>

                    {(isInstructor || discussion.author?._id === user?._id) && (
                      <button
                        onClick={() => handleMarkBestAnswer(reply._id)}
                        className="text-xs font-semibold text-gray-500 hover:text-green-600 transition-colors"
                      >
                        {reply.isBestAnswer
                          ? "Bỏ bình chọn"
                          : "Bình chọn"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="space-y-4">
                <SkeletonReply />
                <SkeletonReply />
              </div>
            )}
          </div>

          {/* Footer: Trả lời */}
          <form
            onSubmit={handlePostReply}
            className="flex-shrink-0 p-4 bg-white border-t border-gray-100 flex gap-3 rounded-b-2xl items-end relative"
          >
            {user?.avatar ? (
              <Avatar
                src={user.avatar}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <FaUserCircle className="text-gray-300 w-10 h-10" />
            )}
            <textarea
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-200 focus:outline-none custom-scrollbar resize-none h-[50px] text-left"
              placeholder="Nhập câu trả lời của bạn..."
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
            />
            <button
              disabled={loading}
              type="submit"
              className="bg-rose-500 text-white px-5 py-2.5 rounded-xl font-bold h-[50px] shadow-md hover:bg-rose-600 hover:shadow-lg transition-all disabled:opacity-50"
            >
              Gửi
            </button>
          </form>
        </div>
      </div>

      {/* Render Component ReportModal Nằm Độc Lập Bên Ngoài Để Không Xung Đột z-index */}
      {reportConfig.open && (
        <ReportModal
          open={reportConfig.open}
          onClose={() =>
            setReportConfig({ open: false, targetId: null, type: null })
          }
          onSubmit={handleReportSubmit}
          type={reportConfig.type}
          loading={reporting}
        />
      )}
    </>
  );
};

export default DiscussionModal;
