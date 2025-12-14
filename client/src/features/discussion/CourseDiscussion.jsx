import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDiscussions, addDiscussion, replyDiscussion } from "./discussionSlice";
import Spinner from "../../components/common/Spinner";
import { FaUserCircle, FaFlag } from "react-icons/fa";
import ReportModal from "../../components/common/ReportModal";
import toast from "react-hot-toast";
import Pagination from "../../components/common/Pagination";
import { sendReport, resetReportState } from "../../features/report/reportSlice";

const DISCUSSION_REPORT_REASONS = [
  "Hành vi không phù hợp",
  "Nội dung rác",
  "Vi phạm chính sách cộng đồng",
  "Spam hoặc quảng cáo",
  "Ý khác"
];

const CourseDiscussion = ({ courseId, user, isEnrolled, isInstructor }) => {
  const dispatch = useDispatch();
  const { discussions, pagination, loading } = useSelector(state => state.discussion);
  const { success, error } = useSelector(state => state.report);
  const [newContent, setNewContent] = useState("");
  const [replyContent, setReplyContent] = useState({});
  const [page, setPage] = useState(1);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDiscussionId, setReportDiscussionId] = useState(null);
  const [reportReplyOpen, setReportReplyOpen] = useState(false);
  const [reportReplyId, setReportReplyId] = useState(null);

  useEffect(() => {
    if (courseId) {
      dispatch(fetchDiscussions({ courseId, page, limit: 10 }));
    }
  }, [courseId, page, dispatch]);

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
    if (!newContent.trim()) return;
    await dispatch(addDiscussion({ courseId, content: newContent }));
    setNewContent("");
    setPage(1);
    dispatch(fetchDiscussions({ courseId, page: 1, limit: 10 }));
  };

  const handleReply = async (discussionId) => {
    if (!replyContent[discussionId]?.trim()) return;
    await dispatch(replyDiscussion({ discussionId, content: replyContent[discussionId] }));
    setReplyContent({ ...replyContent, [discussionId]: "" });
    dispatch(fetchDiscussions({ courseId, page, limit: 10 }));
  };

  const openReportPopup = (discussionId) => {
    setReportDiscussionId(discussionId);
    setReportOpen(true);
  };

  const handleReportSubmit = (reason, detail) => {
    dispatch(sendReport({
      type: "discussion",
      targetId: reportDiscussionId,
      reason: reason + (detail ? `\n${detail}` : "")
    }));
  };

  const openReportReplyPopup = (replyId) => {
    setReportReplyId(replyId);
    setReportReplyOpen(true);
  };

  const handleReportReplySubmit = (reason, detail) => {
    dispatch(sendReport({
      type: "reply",
      targetId: reportReplyId,
      reason: reason + (detail ? `\n${detail}` : "")
    }));
  };

  const canDiscuss = isEnrolled || isInstructor;

  if (loading) return <Spinner />;

  return (
    <div className="mt-10">
      <h3 className="text-2xl font-bold mb-6 text-left">Thảo luận khóa học</h3>
      {!canDiscuss && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded">
          Bạn cần ghi danh khóa học để tham gia thảo luận.
        </div>
      )}
      {/* Ô nhập thảo luận mới */}
      <form onSubmit={handleCreateDiscussion} className="flex items-start gap-3 mb-8">
        <div className="pt-2">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <FaUserCircle className="w-10 h-10 text-gray-400" />
          )}
        </div>
        <div className="flex-1">
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="Nhập chủ đề thảo luận của bạn"
            required
            disabled={!canDiscuss}
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base bg-white disabled:bg-gray-100"
            rows={2}
            style={{ minHeight: 44 }}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              className="inline-flex items-center px-6 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-md shadow-rose-200 transition disabled:bg-gray-400"
              disabled={!canDiscuss || !newContent.trim()}
            >
              Gửi
            </button>
          </div>
        </div>
      </form>

      {/* Danh sách thảo luận */}
      <div className="space-y-6 text-left">
        {discussions.length === 0 && (
          <div className="text-gray-500 italic">Chưa có thảo luận nào.</div>
        )}
        {discussions.map(discussion => (
          <div
            key={discussion._id}
            className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition group"
          >
            <div className="flex items-center gap-4 mb-2">
              {discussion.author?.avatar ? (
                <img src={discussion.author.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <FaUserCircle className="w-10 h-10 text-gray-400" />
              )}
              <div>
                <div className="font-semibold text-base">{discussion.author?.name || "Ẩn danh"}</div>
                <div className="text-xs text-gray-500">{new Date(discussion.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <div className="ml-14 text-gray-900 text-base mb-2 whitespace-pre-line">{discussion.content}</div>
            {/* Replies */}
            <div className="ml-14 space-y-3">
              {discussion.replies?.map(reply => (
                <div key={reply._id} className="flex items-start gap-2 border-l-4 border-gray-200 pl-4 py-2 bg-gray-50 rounded group-hover:bg-gray-100">
                  {reply.author?.avatar ? (
                    <img src={reply.author.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover mt-1" />
                  ) : (
                    <FaUserCircle className="w-8 h-8 text-gray-400 mt-1" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{reply.author?.name || "Ẩn danh"}</span>
                      <span className="text-xs text-gray-400">{new Date(reply.createdAt).toLocaleString()}</span>
                      {/* Lá cờ sát ngày tháng năm */}
                      {/* <button
                        className="ml-2 text-gray-400 hover:text-red-500"
                        title="Báo cáo bình luận"
                        onClick={() => openReportReplyPopup(reply._id)}
                      >
                        <FaFlag />
                      </button> */}
                      {reply.author?._id !== user?._id && (
                        <button
                          className="ml-2 text-gray-400 hover:text-red-500"
                          title="Báo cáo bình luận"
                          onClick={() => openReportReplyPopup(reply._id)}
                        >
                          <FaFlag />
                        </button>
                      )}
                    </div>
                    <div className="text-gray-800 text-sm">{reply.content}</div>
                  </div>
                </div>
              ))}
              {/* Ô nhập trả lời */}
              <form
                className="flex items-start gap-2 mt-2"
                onSubmit={e => {
                  e.preventDefault();
                  handleReply(discussion._id);
                }}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover mt-1" />
                ) : (
                  <FaUserCircle className="w-8 h-8 text-gray-400 mt-1" />
                )}
                <input
                  type="text"
                  value={replyContent[discussion._id] || ""}
                  onChange={e => setReplyContent({ ...replyContent, [discussion._id]: e.target.value })}
                  placeholder="Trả lời thảo luận..."
                  disabled={!canDiscuss}
                  className="border border-gray-300 rounded-full px-4 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
                />
                <button
                  className="inline-flex items-center px-4 py-1.5 rounded-full font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-md shadow-rose-200 transition ml-2 disabled:bg-gray-400"
                  disabled={!canDiscuss || !replyContent[discussion._id]?.trim()}
                  type="submit"
                >
                  Gửi
                </button>
              </form>
              {!canDiscuss && (
                <div className="text-xs text-yellow-600 mt-1">Bạn cần ghi danh để trả lời thảo luận.</div>
              )}
            </div>
            {/* lá cờ báo cáo thảo luận */}
            {discussion.author?._id !== user?._id && (
              <button
                className="ml-auto text-gray-400 hover:text-red-500"
                title="Báo cáo thảo luận"
                onClick={() => openReportPopup(discussion._id)}
              >
                <FaFlag />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Phân trang */}
      <Pagination
        currentPage={page}
        totalPages={pagination?.totalPages || 1}
        onPageChange={setPage}
      />

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