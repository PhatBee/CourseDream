import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "../../features/notification/notificationSlice";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotificationMenu = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, loading } = useSelector((state) => state.notification);
  const menuRef = useRef();

  useEffect(() => {
    if (open) dispatch(getNotifications());
  }, [open, dispatch]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  // Hàm xử lý khi click vào 1 thông báo
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      dispatch(markNotificationAsRead(notification._id));
    }
    // Nếu là thông báo reply, chuyển hướng đến detail course và cuộn xuống thảo luận
    if (notification.type === "reply" && notification.relatedId && notification.courseSlug) {
      navigate(`/courses/${notification.courseSlug}?discussionId=${notification.relatedId}`);
      onClose && onClose();
    }
  };

  return open ? (
    <div
      ref={menuRef}
      className="absolute right-full top-0 mr-2 w-96 max-h-96 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg p-3 z-50"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-800">Thông báo</span>
        <button
          className="text-xs text-blue-600 hover:underline"
          onClick={() => dispatch(markAllNotificationsAsRead())}
        >
          Đánh dấu tất cả đã đọc
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-gray-500 py-8">Không có thông báo nào.</div>
      ) : (
        <ul>
          {notifications.map((n) => (
            <li
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className={`p-2 rounded mb-1 cursor-pointer transition-colors ${
                n.read ? "bg-gray-50" : "bg-yellow-50 font-semibold hover:bg-yellow-100"
              }`}
            >
              <div className="text-sm">{n.title}</div>
              {/* Nếu là thông báo xử lý báo cáo */}
              {n.type === "report" ? (
                <div className="text-xs text-gray-600 whitespace-pre-line">
                  {n.message.split("\n").map((line, idx) => <div key={idx}>{line}</div>)}
                </div>
              ) : (
                <div className="text-xs text-gray-600">{n.message}</div>
              )}
              <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString("vi-VN")}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  ) : null;
};

export default NotificationMenu;