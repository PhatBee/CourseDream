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
  Gift,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { getDiscussionById } from "../../api/discussionApi";
import toast from "react-hot-toast";

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
    case "reward_voucher":
      return { icon: Gift, bg: "bg-amber-100", text: "text-amber-600" };
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

  const [warningDetailPopup, setWarningDetailPopup] = useState(null);

  useEffect(() => {
    if (open) dispatch(getNotifications());
  }, [open, dispatch]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        if (!warningDetailPopup) onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, warningDetailPopup]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      dispatch(markNotificationAsRead(notification._id));
    }

    const { type, metadata } = notification;

    // YÊU CẦU: Nếu là báo cáo (warning), luôn mở popup để xem chi tiết
    if (type === "warning" || metadata?.isDeleted) {
      setWarningDetailPopup(notification);
      return;
    }

    switch (type) {
      case "reply":
        if (
          metadata?.courseSlug &&
          metadata?.lessonId &&
          metadata?.discussionId
        ) {
          try {
            // Pre-fetch check: Nếu thảo luận không tồn tại, sẽ ném ra lỗi 404
            await getDiscussionById(metadata.discussionId);
            // Nếu tồn tại, nhảy vào trang học
            navigate(
              `/courses/${metadata.courseSlug}/learn/lecture/${metadata.lessonId}?discussionId=${metadata.discussionId}${metadata.replyId ? `&replyId=${metadata.replyId}` : ""}`,
            );
          } catch {
            // Nếu không tìm thấy, đá về trang overview và báo lỗi ngay, tránh load trang VideoPlayer
            toast.error("Không tìm thấy thảo luận. Thảo luận này có thể đã bị xóa.");
            navigate(`/courses/${metadata.courseSlug}/overview`);
          }
        }
        break;
      case "report":
        if (metadata?.reportId) {
          navigate(`/admin/reports?reportId=${metadata.reportId}`);
        } else {
          navigate("/admin/reports");
        }
        break;
      case "system":
        if (metadata?.url) navigate(metadata.url);
        break;
      case "reminder_learning":
        if (metadata?.courseSlug)
          navigate(`/courses/${metadata.courseSlug}/learn`);
        break;
      case "reward_voucher":
        navigate("/profile/dashboard");
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
                            className={`text-[13px] whitespace-pre-line mt-1 leading-relaxed text-justify ${
                              !n.read
                                ? "text-gray-700"
                                : "text-gray-500 line-clamp-2"
                            }`}
                          >
                            {n.message}
                          </div>
                          
                          {n.type === "warning" && n.metadata?.reportReasonLabel && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                               <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase">
                                 {n.metadata.reportReasonLabel}
                               </span>
                            </div>
                          )}

                          <p className="text-[11px] text-gray-400 mt-2 font-medium text-justify">
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

      {/* === MODAL POPUP HIỂN THỊ CHI TIẾT WARNING/REPORT (SỬ DỤNG PORTAL) === */}
      {warningDetailPopup &&
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
                    {warningDetailPopup.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setWarningDetailPopup(null);
                    onClose();
                  }}
                  className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2.5 rounded-full transition-colors shadow-sm ml-auto"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body Popup được phân tách nội dung */}
              <div className="px-6 py-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  {/* Row 1: Lý do */}
                  <div className="flex items-start gap-4">
                     <div className="w-[120px] shrink-0 text-[13px] font-bold text-gray-500 uppercase mt-1">Lý do vi phạm</div>
                     <div className="flex-1">
                        <span className="inline-block px-3 py-1 bg-rose-100 text-rose-700 font-bold rounded-lg text-[13px] border border-rose-200">
                           {warningDetailPopup.metadata?.reportReasonLabel || "Vi phạm tiêu chuẩn cộng đồng"}
                        </span>
                     </div>
                  </div>

                  {/* Row 2: Nội dung gốc & Link */}
                  <div className="flex items-start gap-4">
                     <div className="w-[120px] shrink-0 text-[13px] font-bold text-gray-500 uppercase mt-1">
                        {(warningDetailPopup.metadata?.targetType === "course" || (!warningDetailPopup.metadata?.targetType && warningDetailPopup.metadata?.courseSlug && !warningDetailPopup.metadata?.discussionId))
                           ? "Khóa học"
                           : (warningDetailPopup.metadata?.targetType === "discussion" || (!warningDetailPopup.metadata?.targetType && warningDetailPopup.metadata?.discussionId && !warningDetailPopup.metadata?.replyId))
                           ? "Thảo luận"
                           : (warningDetailPopup.metadata?.targetType === "reply" || (!warningDetailPopup.metadata?.targetType && warningDetailPopup.metadata?.replyId))
                           ? "Bình luận"
                           : "Nội dung"}
                     </div>
                     <div className="flex-1 min-w-0">
                        {(() => {
                           const m = warningDetailPopup.metadata;
                           const isCourse = m?.targetType === "course" || (!m?.targetType && m?.courseSlug && !m?.discussionId);
                           const isDiscussion = m?.targetType === "discussion" || (!m?.targetType && m?.discussionId && !m?.replyId);
                           const isReply = m?.targetType === "reply" || (!m?.targetType && m?.replyId);

                           if (isCourse) {
                              return m?.isDeleted ? (
                                <span className="text-[15px] font-bold text-gray-500 line-through">
                                  {m?.originalContent?.replace("Khóa học: ", "") || "Khóa học"}
                                </span>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setWarningDetailPopup(null);
                                    onClose();
                                    navigate(`/courses/${m?.courseSlug}`);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 font-medium underline decoration-blue-300 underline-offset-2 break-words block text-[14px] text-justify"
                                >
                                  {m?.originalContent?.replace("Khóa học: ", "") || "Đi đến khóa học"}
                                </button>
                              );
                           } else {
                              return (
                                 <div>
                                    <div className="bg-gray-100 p-3 rounded-lg text-sm border border-gray-200 italic shadow-sm whitespace-pre-line break-words text-justify">
                                      "{m?.originalContent}"
                                    </div>
                                    
                                    {!m?.isDeleted && (
                                       <button
                                         onClick={() => {
                                            setWarningDetailPopup(null);
                                            onClose();
                                            navigate(`/courses/${m?.courseSlug}/learn/lecture/${m?.lessonId}?discussionId=${m?.discussionId}${isReply ? `&replyId=${m?.replyId}` : ""}`);
                                         }}
                                         className="inline-block mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors text-left"
                                       >
                                          {isDiscussion ? "Thảo luận gốc " : "Bình luận gốc "}
                                       </button>
                                    )}
                                 </div>
                              );
                           }
                        })()}
                     </div>
                  </div>

                  {/* Ghi chú Admin */}
                  {warningDetailPopup.metadata?.adminNote && (
                     <div className="flex items-start gap-4 pt-4 border-t border-gray-100">
                        <div className="w-[120px] shrink-0 text-[13px] font-bold text-gray-500 uppercase mt-1">Ghi chú</div>
                        <div className="flex-1">
                           <div className="text-[14px] font-medium text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200 text-justify">
                             {warningDetailPopup.metadata.adminNote}
                           </div>
                        </div>
                     </div>
                  )}

                  {warningDetailPopup.metadata?.isDeleted && (
                     <p className="text-xs text-rose-500 font-medium italic mt-2 text-right">
                       ** Nội dung vi phạm đã bị gỡ bỏ khỏi hệ thống.
                     </p>
                  )}
                </div>
              </div>

              {/* Footer Popup */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/70 flex justify-end items-center">
                <button
                  onClick={() => {
                    setWarningDetailPopup(null);
                    onClose();
                  }}
                  className="px-6 py-2 bg-gray-900 hover:bg-black text-white text-[14px] font-bold rounded-lg transition-transform hover:scale-[1.02] shadow-md"
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
