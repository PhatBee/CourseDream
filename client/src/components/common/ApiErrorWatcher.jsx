import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { clearApiError } from "../../features/error/errorSlice";
import ErrorPage from "../../pages/ErrorPage";

export default function ApiErrorWatcher({ children }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { apiError } = useSelector((state) => state.error);

  // Tự động xóa trạng thái lỗi khi chuyển trang (URL thay đổi)
  // để tránh việc kẹt ở màn hình lỗi khi người dùng tìm cách điều hướng đi nơi khác.
  useEffect(() => {
    if (apiError) {
      dispatch(clearApiError());
    }
  }, [location.pathname, dispatch]);

  const handleRetry = () => {
    dispatch(clearApiError());
    // Tải lại trang hiện tại để kích hoạt lại các API call trong useEffect
    window.location.reload();
  };

  if (apiError) {
    return (
      <ErrorPage
        status={apiError.status}
        message={apiError.message}
        onRetry={handleRetry}
      />
    );
  }

  return children;
}
