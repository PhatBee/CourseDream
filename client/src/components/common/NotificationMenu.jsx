import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../features/notification/notificationSlice";
import {
  Loader2,
  X,
  Bell,
  ShieldAlert,
  MessageCircle,
  BookOpen,
  Info,
  CheckCircle2,
  BellOff,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

// Helper lấy Icon và Màu sắc tương ứng với từng loại thông báo
const getNotificationUI = (type) => {
  switch (type) {
    case "warning":
      return { icon: ShieldAlert, bg: "bg-rose-100", text: "text-rose-600" };
    case "report":
      return {
        icon: AlertTriangle,
        bg: "bg-orange-100",
        text: "text-orange-500",
      };
    case "reply":
      return { icon: MessageCircle, bg: "bg-blue-100", text: "text-blue-500" };
    case "reminder_learning":
      return { icon: BookOpen, bg: "bg-indigo-100", text: "text-indigo-500" };
    case "system":
    default:
      return { icon: Info, bg: "bg-gray-100", text: "text-gray-500" };
  }
};

const NotificationMenu = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, loading } = useSelector((state) => state.notification);
  const menuRef = useRef();

  const [deletedPopup, setDeletedPopup] = useState(null);

  useEffect(() => {
    if (open) dispatch(getNotifications());
  }, [open, dispatch]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        if (!deletedPopup) onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, deletedPopup]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      dispatch(markNotificationAsRead(notification._id));
    }

    const { type, metadata } = notification;

    if (metadata?.isDeleted) {
      setDeletedPopup(notification);
      return;
    }

    switch (type) {
      case "warning":
        if (
          metadata?.courseSlug &&
          metadata?.lessonId &&
          metadata?.discussionId
        ) {
          navigate(
            `/courses/${metadata.courseSlug}/learn/lecture/${metadata.lessonId}?discussionId=${metadata.discussionId}${metadata.replyId ? `&replyId=${metadata.replyId}` : ""}`,
          );
        } else if (metadata?.courseSlug) {
          navigate(`/courses/${metadata.courseSlug}`);
        }
        break;
      case "report":
        navigate("/admin/reports");
        break;
      case "system":
        if (metadata?.url) navigate(metadata.url);
        break;
      case "reply":
        if (
          metadata?.courseSlug &&
          metadata?.lessonId &&
          metadata?.discussionId
        ) {
          navigate(
            `/courses/${metadata.courseSlug}/learn/lecture/${metadata.lessonId}?discussionId=${metadata.discussionId}${metadata.replyId ? `&replyId=${metadata.replyId}` : ""}`,
          );
        }
        break;
      case "reminder_learning":
        if (metadata?.courseSlug)
          navigate(`/courses/${metadata.courseSlug}/learn`);
        break;
      default:
        break;
    }

    onClose && onClose();
  };

  return (
    <>
      {open ? (
        <div
          ref={menuRef}
          // Sử dụng shadow-2xl, border mềm mại và thanh cuộn đẹp
          className="absolute right-full top-0 mr-3 w-[400px] max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-gray-700" />
              <span className="font-bold text-gray-800">Thông báo</span>
            </div>
            <button
              className="group flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
              onClick={() => dispatch(markAllNotificationsAsRead())}
            >
              <CheckCircle2 size={14} className="group-hover:text-blue-600" />
              Đánh dấu đã đọc
            </button>
          </div>

          {/* Body List */}
          <div className="overflow-y-auto p-2 scroll-smooth">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-sm text-gray-500">
                <Loader2 className="animate-spin text-blue-500" size={24} />
                Đang tải thông báo...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <BellOff size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-700 font-medium">
                  Bạn chưa có thông báo nào
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Khi có hoạt động mới, thông báo sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {notifications.map((n) => {
                  const { icon: Icon, bg, text } = getNotificationUI(n.type);
                  return (
                    <li
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        n.read
                          ? "bg-white border-transparent hover:bg-gray-50"
                          : "bg-blue-50/40 border-blue-50 hover:bg-blue-50/80"
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        {/* Icon Block */}
                        <div
                          className={`mt-0.5 w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center ${bg} ${text}`}
                        >
                          <Icon size={18} />
                        </div>
                        {/* Content Block */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p
                              className={`text-sm ${
                                !n.read
                                  ? "font-bold text-gray-900"
                                  : "font-medium text-gray-700"
                              } line-clamp-1`}
                            >
                              {n.title}
                            </p>
                            {/* Blue dot for unread */}
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                            )}
                          </div>

                          <div
                            className={`text-[13px] whitespace-pre-line mt-1 leading-relaxed ${
                              !n.read
                                ? "text-gray-700"
                                : "text-gray-500 line-clamp-2"
                            }`}
                          >
                            {n.message}
                          </div>

                          <p className="text-[11px] text-gray-400 mt-2 font-medium">
                            {new Date(n.createdAt).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {/* === MODAL POPUP HIỂN THỊ NỘI DUNG ĐÃ BỊ XÓA (SỬ DỤNG PORTAL) === */}
      {deletedPopup &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 transition-all">
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl p-0 w-full max-w-[600px] relative max-h-[90vh] flex flex-col transform scale-100">
              {/* Header Popup */}
              <div className="bg-rose-50 px-6 py-5 flex items-center gap-4 border-b border-rose-100">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white text-rose-600 shadow-sm flex-shrink-0">
                  <ShieldAlert size={26} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    Chi tiết xử lý vi phạm
                  </h3>
                  <p className="text-sm font-semibold text-rose-600 truncate">
                    {deletedPopup.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDeletedPopup(null);
                    onClose();
                  }}
                  className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2.5 rounded-full transition-colors shadow-sm ml-auto"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body Popup được phân tách nội dung */}
              <div className="px-6 py-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-5">
                  {/* Ý 1: Nội dung vi phạm do user Báo Cáo */}
                  <div>
                    <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                      Lý do hệ thống tiếp nhận
                    </h4>
                    <p className="text-base text-rose-700 font-semibold bg-rose-50 border border-rose-200 rounded-lg p-3">
                      {deletedPopup.metadata?.reportReasonLabel ||
                        "Vi phạm tiêu chuẩn cộng đồng"}
                    </p>
                  </div>

                  {/* Ý 2: Ghi chú của Admin (nếu có) sang ý mới */}
                  {deletedPopup.metadata?.adminNote && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                        Ghi chú từ quản trị viên
                      </h4>
                      <p className="text-[15px] font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-4">
                        {deletedPopup.metadata.adminNote}
                      </p>
                    </div>
                  )}

                  {/* Ý 3: Hiển thị đầy đủ bài thảo luận, khóa học bị gỡ bỏ */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                      Nội dung đã đăng tải
                    </h4>
                    <div className="text-[14px] text-gray-700 whitespace-pre-line bg-gray-50 p-4 py-5 rounded-lg border border-gray-200 shadow-inner leading-relaxed max-h-[30vh] overflow-y-auto">
                      {deletedPopup.metadata?.originalContent ||
                        deletedPopup.message}
                    </div>
                    <p className="text-xs text-gray-400 font-medium italic mt-2 text-right">
                      ** Việc vi phạm nhiều lần có thể dẫn tới khóa tài khoản
                      vĩnh viễn.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Popup */}
              <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/70 flex justify-end">
                <button
                  onClick={() => {
                    setDeletedPopup(null);
                    onClose();
                  }}
                  className="px-7 py-2.5 bg-gray-900 hover:bg-black text-white text-[15px] font-bold rounded-lg transition-transform hover:scale-[1.02] shadow-md"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default NotificationMenu;
