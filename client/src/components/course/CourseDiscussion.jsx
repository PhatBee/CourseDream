import { useEffect, useState } from "react";
import { getDiscussionsByCourse, createDiscussion, replyToDiscussion } from "../../api/discussionApi";
import Spinner from "../common/Spinner";
import { FaUserCircle } from "react-icons/fa";

const CourseDiscussion = ({ courseId, user, isEnrolled }) => {
  const [discussions, setDiscussions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [replyContent, setReplyContent] = useState({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    getDiscussionsByCourse(courseId, page, 10)
      .then(res => {
        setDiscussions(res.data.discussions);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  }, [courseId, page]);

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    await createDiscussion(courseId, newContent);
    setNewContent("");
    setPage(1);
    getDiscussionsByCourse(courseId, 1, 10).then(res => {
      setDiscussions(res.data.discussions);
      setPagination(res.data.pagination);
    });
  };

  const handleReply = async (discussionId) => {
    if (!replyContent[discussionId]?.trim()) return;
    await replyToDiscussion(discussionId, replyContent[discussionId]);
    setReplyContent({ ...replyContent, [discussionId]: "" });
    getDiscussionsByCourse(courseId, page, 10).then(res => {
      setDiscussions(res.data.discussions);
      setPagination(res.data.pagination);
    });
  };

  if (loading) return <Spinner />;

  return (
    <div className="mt-10">
      <h3 className="text-2xl font-bold mb-6 text-left">Thảo luận khóa học</h3>
      {!isEnrolled && (
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
            disabled={!isEnrolled}
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base bg-white disabled:bg-gray-100"
            rows={2}
            style={{ minHeight: 44 }}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              className="inline-flex items-center px-6 py-2 rounded-full font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:bg-gray-400"
              disabled={!isEnrolled || !newContent.trim()}
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
                <div
                  key={reply._id}
                  className="flex items-start gap-2 border-l-4 border-gray-200 pl-4 py-2 bg-gray-50 rounded group-hover:bg-gray-100"
                >
                  {reply.author?.avatar ? (
                    <img src={reply.author.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover mt-1" />
                  ) : (
                    <FaUserCircle className="w-8 h-8 text-gray-400 mt-1" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{reply.author?.name || "Ẩn danh"}</span>
                      <span className="text-xs text-gray-400">{new Date(reply.createdAt).toLocaleString()}</span>
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
                  disabled={!isEnrolled}
                  className="border border-gray-300 rounded-full px-4 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
                />
                <button
                  className="inline-flex items-center px-4 py-1.5 rounded-full font-semibold text-white bg-blue-600 hover:bg-blue-700 transition ml-2 disabled:bg-gray-400"
                  disabled={!isEnrolled || !replyContent[discussion._id]?.trim()}
                  type="submit"
                >
                  Gửi
                </button>
              </form>
              {!isEnrolled && (
                <div className="text-xs text-yellow-600 mt-1">Bạn cần ghi danh để trả lời thảo luận.</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Phân trang */}
      <div className="mt-8 flex gap-2 justify-center">
        {Array.from({ length: pagination.totalPages || 1 }, (_, i) => (
          <button
            key={i}
            className={`px-3 py-1 rounded-full font-semibold ${
              page === i + 1
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-blue-600 hover:text-white transition"
            }`}
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CourseDiscussion;