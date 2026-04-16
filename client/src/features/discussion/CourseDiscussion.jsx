import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDiscussions,
  addDiscussion,
  replyDiscussion,
  voteDiscussion,
  markBestAnswer,
  deleteDiscussion,
} from "./discussionSlice";
import Spinner from "../../components/common/Spinner";
import {
  FaUserCircle,
  FaFlag,
  FaThumbsUp,
  FaCheck,
  FaTrash,
} from "react-icons/fa";
import ReportModal from "../../components/common/ReportModal";
import toast from "react-hot-toast";
import Pagination from "../../components/common/Pagination";
import {
  sendReport,
  resetReportState,
} from "../../features/report/reportSlice";

const DISCUSSION_REPORT_REASONS = [
  "Hành vi không phù hợp",
  "Nội dung rác",
  "Vi phạm chính sách cộng đồng",
  "Spam hoặc quảng cáo",
  "Ý khác",
];

const CourseDiscussion = ({
  courseId,
  lectureId,
  user,
  isEnrolled,
  isInstructor,
}) => {
  const dispatch = useDispatch();
  const { discussions, pagination, loading } = useSelector(
    (state) => state.discussion,
  );
  const { success, error } = useSelector((state) => state.report);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [replyContent, setReplyContent] = useState({});
  const [page, setPage] = useState(1);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDiscussionId, setReportDiscussionId] = useState(null);
  const [reportReplyOpen, setReportReplyOpen] = useState(false);
  const [reportReplyId, setReportReplyId] = useState(null);

  // Focus: Tải lại Thảo Luận khi Bài giảng (lectureId) thay đổi
  useEffect(() => {
    if (courseId && lectureId) {
      dispatch(fetchDiscussions({ courseId, lectureId, page, limit: 10 }));
    }
  }, [courseId, lectureId, page, dispatch]);

  useEffect(() => {
    if (success) {
      toast.success("Báo cáo của bạn đã được gửi!");
      dispatch(resetReportState());
      setReportOpen(false);
      setReportReplyOpen(false);
    }
    if (error) {
      toast.error(error);
      dispatch(resetReportState());
    }
  }, [success, error, dispatch]);

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || newTitle.trim().length < 5)
      return toast.error("Tiêu đề yêu cầu ít nhất 5 ký tự");
    if (!newContent.trim()) return toast.error("Nội dung không được để trống");

    await dispatch(
      addDiscussion({
        courseId,
        lectureId,
        title: newTitle,
        content: newContent,
      }),
    );
    setNewTitle("");
    setNewContent("");
    setPage(1);
    dispatch(fetchDiscussions({ courseId, lectureId, page: 1, limit: 10 }));
  };

  const handleReply = async (discussionId) => {
    if (!replyContent[discussionId]?.trim()) return;
    await dispatch(
      replyDiscussion({ discussionId, content: replyContent[discussionId] }),
    );
    setReplyContent({ ...replyContent, [discussionId]: "" });
    dispatch(fetchDiscussions({ courseId, lectureId, page, limit: 10 }));
  };

  const openReportPopup = (discussionId) => {
    setReportDiscussionId(discussionId);
    setReportOpen(true);
  };
  const handleReportSubmit = (reason, detail) => {
    dispatch(
      sendReport({
        type: "discussion",
        targetId: reportDiscussionId,
        reason: reason + (detail ? `\n${detail}` : ""),
      }),
    );
  };
  const openReportReplyPopup = (replyId) => {
    setReportReplyId(replyId);
    setReportReplyOpen(true);
  };
  const handleReportReplySubmit = (reason, detail) => {
    dispatch(
      sendReport({
        type: "reply",
        targetId: reportReplyId,
        reason: reason + (detail ? `\n${detail}` : ""),
      }),
    );
  };

  const canDiscuss = isEnrolled || isInstructor;

  // 1. Xử lý Vote
  const handleVote = async (discussionId, targetType, targetId = null) => {
    if (!canDiscuss) return toast.error("Vui lòng ghi danh để vote!");
    await dispatch(voteDiscussion({ discussionId, targetType, targetId }));
    dispatch(fetchDiscussions({ courseId, lectureId, page, limit: 10 }));
  };

  // 2. Đánh dấu Best Answer
  const handleMarkBestAnswer = async (discussionId, replyId) => {
    await dispatch(markBestAnswer({ discussionId, replyId }));
    toast.success("Đã đánh dấu câu trả lời hay nhất!");
    dispatch(fetchDiscussions({ courseId, lectureId, page, limit: 10 }));
  };

  // 3. Xóa câu hỏi thảo luận
  const handleDeleteDiscussion = async (discussionId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài thảo luận này?")) {
      await dispatch(deleteDiscussion(discussionId));
      toast.success("Đã xóa thảo luận.");
      dispatch(fetchDiscussions({ courseId, lectureId, page, limit: 10 }));
    }
  };

  if (loading)
    return (
      <div className="py-10 flex justify-center">
        <Spinner color="border-rose-500" />
      </div>
    );

  return (
    <div className="w-full">
      {!canDiscuss && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl text-sm">
          Bạn cần ghi danh khóa học để tham gia hỏi đáp bài giảng này.
        </div>
      )}

      {/* KHUNG TẠO THẢO LUẬN MỚI TRONG BÀI GIẢNG */}
      <form
        onSubmit={handleCreateDiscussion}
        className="flex items-start gap-4 mb-8 bg-gray-50 border border-gray-100 p-5 rounded-2xl"
      >
        <div className="pt-1 flex-shrink-0">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="avatar"
              className="w-11 h-11 rounded-full object-cover shadow-sm"
            />
          ) : (
            <FaUserCircle className="w-11 h-11 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Tiêu đề câu hỏi của bạn"
            required
            disabled={!canDiscuss}
            className="w-full px-4 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white disabled:bg-gray-100 transition-shadow"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Mô tả chi tiết khó khăn bạn đang gặp phải tại bài học này..."
            required
            disabled={!canDiscuss}
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none bg-white disabled:bg-gray-100 transition-shadow"
            rows={3}
          />
          <div className="flex justify-end gap-2 mt-1">
            <button
              type="submit"
              className="inline-flex items-center px-6 py-2.5 text-sm rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:bg-gray-300 disabled:text-gray-50 disabled:cursor-not-allowed"
              disabled={
                !canDiscuss || !newContent.trim() || newTitle.trim().length < 5
              }
            >
              Gửi Câu Hỏi
            </button>
          </div>
        </div>
      </form>

      {/* DANH SÁCH BÌNH LUẬN CỦA BÀI HỌC */}
      <div className="space-y-6">
        <h3 className="text-gray-800 font-bold text-lg mb-2">
          Hỏi đáp trong bài này ({pagination?.total || discussions.length})
        </h3>

        {discussions.length === 0 && (
          <div className="py-6 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 text-gray-500 text-sm">
            Chưa có ai đặt câu hỏi cho bài giảng này. Dễ hiểu quá chăng?
          </div>
        )}

        {discussions.map((discussion) => (
          <div
            key={discussion._id}
            id={`discussion-${discussion._id}`}
            className="bg-white text-left rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all group relative"
          >
            <div className="flex items-start gap-4 mb-3">
              {discussion.author?.avatar ? (
                <img
                  src={discussion.author.avatar}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <FaUserCircle className="w-10 h-10 text-gray-300" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-base leading-tight break-words text-left">
                  {discussion.title}
                </div>
                <div className="text-[13px] text-gray-500 mt-0.5 text-left">
                  <span className="font-medium text-gray-700">
                    {discussion.author?.name || "Học viên ẩn danh"}
                  </span>{" "}
                  • {new Date(discussion.createdAt).toLocaleString()}
                </div>
              </div>
              {discussion.author?._id !== user?._id && (
                <button
                  className="ml-2 text-gray-300 hover:text-red-500 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Báo cáo"
                  onClick={() => openReportPopup(discussion._id)}
                >
                  <FaFlag size={13} />
                </button>
              )}
            </div>

            <div className="ml-14 text-gray-700 text-left text-sm mb-5 leading-relaxed break-words">
              {discussion.content}
            </div>

            {/* BẮT ĐẦU THÊM: Các nút tương tác cho CÂU HỎI */}
            <div className="flex items-center gap-4 mt-3 ml-14 text-sm">
              <button
                onClick={() => handleVote(discussion._id, "DISCUSSION")}
                className={`flex items-center gap-1 font-medium transition-colors ${
                  discussion.upvotedBy?.includes(user?._id)
                    ? "text-rose-500"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                <FaThumbsUp size={14} />
                <span>{discussion.upvoteCount || 0}</span>
              </button>

              {(isInstructor || discussion.author?._id === user?._id) && (
                <button
                  onClick={() => handleDeleteDiscussion(discussion._id)}
                  className="text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                >
                  <FaTrash size={13} /> Xóa
                </button>
              )}
            </div>
            {/* KẾT THÚC THÊM */}

            {/* VÙNG TRẢ LỜI */}
            <div className="ml-14 flex flex-col gap-3">
              {discussion.replies?.map((reply) => (
                <div
                  key={reply._id}
                  className="flex flex-col gap-1 border-l-[3px] border-rose-100 pl-4 py-1 group/reply relative text-left"
                >
                  <div className="flex items-center gap-2">
                    {reply.author?.avatar ? (
                      <img
                        src={reply.author.avatar}
                        alt="avatar"
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <FaUserCircle className="w-6 h-6 text-gray-300" />
                    )}
                    <span className="font-bold text-gray-800 text-[13px]">
                      {reply.author?.name || "Học viên"}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(reply.createdAt).toLocaleDateString()}
                    </span>
                    {reply.isBestAnswer && (
                      <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px] ml-1 flex items-center gap-1">
                        ✓ Câu trả lời hay nhất
                      </span>
                    )}

                    {reply.author?._id !== user?._id && (
                      <button
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover/reply:opacity-100 transition-opacity ml-auto"
                        title="Báo cáo"
                        onClick={() => openReportReplyPopup(reply._id)}
                      >
                        <FaFlag size={12} />
                      </button>
                    )}
                  </div>
                  <div className="text-gray-700 text-sm ml-8 text-left leading-relaxed max-w-prose break-words">
                    {reply.content}
                  </div>

                  {/* BẮT ĐẦU THÊM: Các nút tương tác cho CÂU TRẢ LỜI */}
                  <div className="flex items-center gap-4 mt-1 mb-2 ml-8 text-xs">
                    <button
                      onClick={() =>
                        handleVote(discussion._id, "ANSWER", reply._id)
                      }
                      className={`flex items-center gap-1 font-medium transition-colors ${
                        reply.upvotedBy?.includes(user?._id)
                          ? "text-rose-500"
                          : "text-gray-400 hover:text-gray-700"
                      }`}
                    >
                      <FaThumbsUp size={12} />
                      <span>{reply.upvoteCount || 0}</span>
                    </button>

                    {(isInstructor || discussion.author?._id === user?._id) && (
                      <button
                        onClick={() =>
                          handleMarkBestAnswer(discussion._id, reply._id)
                        }
                        className={`flex items-center gap-1 font-medium transition-colors ${
                          reply.isBestAnswer
                            ? "text-red-400 hover:text-red-600" // Câu đang làm chuẩn -> Button màu đỏ báo hiệu: Xóa chuẩn
                            : "text-gray-400 hover:text-emerald-600" // Câu chưa làm chuẩn -> Đổi sang câu này
                        }`}
                      >
                        {reply.isBestAnswer ? (
                          <>
                            <span>✕ Bỏ chọn chuẩn</span>
                          </>
                        ) : (
                          <>
                            <FaCheck size={12} /> Câu trả lời hay nhất
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {/* KẾT THÚC THÊM */}
                </div>
              ))}

              {/* Form tạo trả lời */}
              <form
                className="flex items-center gap-3 mt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleReply(discussion._id);
                }}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="avatar"
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <FaUserCircle className="w-9 h-9 text-gray-300 flex-shrink-0" />
                )}
                <input
                  type="text"
                  value={replyContent[discussion._id] || ""}
                  onChange={(e) =>
                    setReplyContent({
                      ...replyContent,
                      [discussion._id]: e.target.value,
                    })
                  }
                  placeholder="Viết câu trả lời hoặc thảo luận thêm..."
                  disabled={!canDiscuss}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all disabled:bg-gray-100"
                />

                {/* NÚT "GỬI" ĐƯỢC CHUYỂN DESIGN GIỐNG NÚT TẠO CÂU HỎI */}
                <button
                  type="submit"
                  disabled={
                    !canDiscuss || !replyContent[discussion._id]?.trim()
                  }
                  className="inline-flex flex-shrink-0 items-center px-5 py-2.5 text-sm rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:bg-gray-300 disabled:text-gray-50 disabled:cursor-not-allowed"
                >
                  Gửi
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {/* Phân trang */}
      {pagination?.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Modal Báo cáo */}
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReportSubmit}
        reasons={DISCUSSION_REPORT_REASONS}
      />
      <ReportModal
        open={reportReplyOpen}
        onClose={() => setReportReplyOpen(false)}
        onSubmit={handleReportReplySubmit}
        reasons={DISCUSSION_REPORT_REASONS}
      />
    </div>
  );
};
export default CourseDiscussion;
