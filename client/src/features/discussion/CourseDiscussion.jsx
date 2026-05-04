import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDiscussions,
  addDiscussion,
  voteDiscussion,
  deleteDiscussion,
} from "./discussionSlice";
import Spinner from "../../components/common/Spinner";
import {
  FaUserCircle,
  FaThumbsUp,
  FaCheck,
  FaTrash,
  FaFlag,
} from "react-icons/fa";
import ReportModal from "../../components/common/ReportModal";
import toast from "react-hot-toast";
import Pagination from "../../components/common/Pagination";
import {
  sendReport,
  resetReportState,
} from "../../features/report/reportSlice";
import DiscussionModal from "./DiscussionModal";
import { useLocation } from "react-router-dom";

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
  const location = useLocation();

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [page, setPage] = useState(1);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDiscussionId, setReportDiscussionId] = useState(null);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);

  // Load Thảo Luận khi Bài giảng (lectureId) thay đổi
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
    }
    if (error) {
      toast.error(error);
      dispatch(resetReportState());
    }
  }, [success, error, dispatch]);

  const canDiscuss = isEnrolled || isInstructor;

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

  const handleVote = async (discussionId, targetType, targetId = null) => {
    if (!canDiscuss) return toast.error("Vui lòng ghi danh để vote!");
    await dispatch(voteDiscussion({ discussionId, targetType, targetId }));
    dispatch(fetchDiscussions({ courseId, lectureId, page, limit: 10 }));
  };

  const handleDeleteDiscussion = async (discussionId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài thảo luận này?")) {
      await dispatch(deleteDiscussion(discussionId));
      toast.success("Đã xóa thảo luận.");
      dispatch(fetchDiscussions({ courseId, lectureId, page, limit: 10 }));
    }
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

  // Callback hàm để con DiscussionModal gọi mỗi khi có câu trả lời mới (Update answerCount)
  const refreshParent = () => {
    dispatch(fetchDiscussions({ courseId, lectureId, page, limit: 10 }));
  };

  // Lắng nghe URL Params để Scroll & Mở Modal
  useEffect(() => {
    if (!loading && discussions.length > 0) {
      const params = new URLSearchParams(location.search);
      const focusDiscussionId = params.get("discussionId");
      const focusReplyId = params.get("replyId");

      if (focusDiscussionId) {
        // Tự động mở Modal nếu có replyId (tức là báo cáo bình luận bên trong)
        if (focusReplyId && !selectedDiscussion) {
          const itemToOpen = discussions.find(
            (d) => d._id === focusDiscussionId,
          );
          if (itemToOpen) {
            setSelectedDiscussion(itemToOpen);
          }
        }
        // Scroll đến Thảo luận gốc
        else if (!focusReplyId) {
          setTimeout(() => {
            const el = document.getElementById(
              `discussion-${focusDiscussionId}`,
            );
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              // Highlight nhẹ
              el.classList.add("ring-2", "ring-rose-400", "bg-rose-50");
              setTimeout(
                () =>
                  el.classList.remove("ring-2", "ring-rose-400", "bg-rose-50"),
                3000,
              );
            }
          }, 500); // Đợi render xong
        }
      }
    }
  }, [location.search, discussions, loading]);

  if (loading && discussions.length === 0)
    return (
      <div className="py-10 flex justify-center">
        <Spinner color="border-rose-500" />
      </div>
    );

  return (
    <div className="w-full text-left">
      {!canDiscuss && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl text-sm">
          Bạn cần ghi danh khóa học để tham gia hỏi đáp bài giảng này.
        </div>
      )}

      {/* FORM TẠO */}
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
            disabled={!canDiscuss}
            className="w-full px-4 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white disabled:bg-gray-100 transition-shadow"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Mô tả chi tiết khó khăn bạn đang gặp phải tại bài học này..."
            disabled={!canDiscuss}
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none bg-white disabled:bg-gray-100 transition-shadow"
            rows={3}
          />
          <div className="flex justify-end gap-2 mt-1">
            <button
              type="submit"
              disabled={
                !canDiscuss || !newContent.trim() || newTitle.trim().length < 5
              }
              className="inline-flex items-center px-6 py-2.5 text-sm rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:bg-gray-300 disabled:text-gray-50 disabled:cursor-not-allowed"
            >
              Gửi Câu Hỏi
            </button>
          </div>
        </div>
      </form>

      {/* DANH SÁCH BÌNH LUẬN */}
      <div className="space-y-6 mt-8">
        {discussions.map((item) => (
          <div
            key={item._id}
            id={`discussion-${item._id}`}
            className="p-5 border border-gray-200 rounded-xl bg-white shadow-sm hover:border-gray-300 transition-all group"
          >
            <div className="flex gap-4">
              <div className="pt-1">
                {item.author?.avatar ? (
                  <img
                    src={item.author.avatar}
                    alt="avatar"
                    className="w-12 h-12 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <FaUserCircle className="text-gray-300 w-12 h-12" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <div className="font-bold text-gray-900 flex gap-2 items-center">
                    {item.author?.name}
                    {item.author?.role === "instructor" && (
                      <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-xs uppercase border border-rose-200">
                        Giảng viên
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  {new Date(item.createdAt).toLocaleString("vi-VN")}
                </div>

                <h4
                  onClick={() => setSelectedDiscussion(item)}
                  className="text-lg font-bold text-gray-600 mt-2 mb-1.5 hover:text-gray-700 cursor-pointer"
                >
                  {item.title}
                </h4>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {item.content}
                </p>

                {item.bestAnswerId && (
                  <div className="mb-4 bg-green-50/70 border border-green-200 rounded-lg p-4 relative ml-4">
                    <div className="absolute -left-[17px] top-4 w-[16px] h-px bg-green-200"></div>
                    <div className="absolute -left-[17px] top-4 -bottom-4 w-px bg-green-200"></div>
                    <div className="flex gap-2 items-center text-green-700 font-bold text-xs uppercase mb-2">
                      <FaCheck /> Câu Trả Lời Hay Nhất
                    </div>
                    <div className="flex gap-2">
                      {item.bestAnswerId.author?.avatar ? (
                        <img
                          src={item.bestAnswerId.author.avatar}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <FaUserCircle className="text-gray-300 w-8 h-8" />
                      )}
                      <div>
                        <span className="font-semibold text-gray-800 text-sm block">
                          {item.bestAnswerId.author?.name}
                        </span>
                        <span className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                          {item.bestAnswerId.content}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-5 mt-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleVote(item._id, "DISCUSSION")}
                    className={`flex items-center gap-1.5 font-bold text-sm ${item.upvotedBy?.includes(user?._id) ? "text-rose-600" : "text-gray-500 hover:text-gray-800"}`}
                  >
                    <FaThumbsUp /> {item.upvoteCount} Hữu ích
                  </button>

                  <button
                    onClick={() => setSelectedDiscussion(item)}
                    className="flex items-center justify-center bg-gray-100 hover:bg-rose-50 text-gray-700 hover:text-rose-600 py-1.5 px-4 rounded-full text-sm font-semibold border border-transparent hover:border-rose-100"
                  >
                    Xem / Trả lời ({item.answerCount})
                  </button>

                  {/* Nút Phụ Trợ (Xóa/Báo cáo) */}
                  <div className="ml-auto flex items-center gap-3">
                    {user?._id === item.author?._id || isInstructor ? (
                      <button
                        onClick={() => handleDeleteDiscussion(item._id)}
                        className="text-gray-400 hover:text-red-500 text-sm flex gap-1 items-center px-2"
                      >
                        <FaTrash /> Xóa
                      </button>
                    ) : (
                      <button
                        onClick={() => openReportPopup(item._id)}
                        className="text-gray-400 hover:text-rose-500 text-sm flex gap-1 items-center px-2"
                      >
                        <FaFlag /> Báo cáo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            page={page}
            setPage={setPage}
            totalPages={pagination.totalPages}
          />
        </div>
      )}

      {selectedDiscussion && (
        <DiscussionModal
          discussion={selectedDiscussion}
          user={user}
          isInstructor={isInstructor}
          onClose={() => setSelectedDiscussion(null)}
          refreshParent={refreshParent}
          onReport={() => openReportPopup(selectedDiscussion._id)}
        />
      )}

      {reportOpen && (
        <ReportModal
          open={reportOpen}
          type="discussion"
          onClose={() => setReportOpen(false)}
          onSubmit={handleReportSubmit}
          title="Báo cáo thảo luận"
          loading={loading}
        />
      )}
    </div>
  );
};
export default CourseDiscussion;
