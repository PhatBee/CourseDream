import React, { useState, useEffect } from "react";

import { 
  Lock, 
  ShieldAlert, 
  FileQuestion, 
  Timer, 
  ServerCrash, 
  WifiOff, 
  Wrench, 
  RefreshCw, 
  Home, 
  ArrowLeft 
} from "lucide-react";

export default function ErrorPage({ status = 404, message = "", onRetry }) {
  const navigateTo = (path) => {
    if (path === -1) {
      window.history.back(); // Quay lại trang trước bằng history của trình duyệt
    } else {
      window.location.href = path; // Chuyển hướng trang native
    }
  };

  const numericStatus = Number(status);
  
  // Đối với lỗi 429 (Spam requests), ta thiết lập countdown đếm ngược
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (numericStatus !== 429) return;
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [numericStatus]);

  // Cấu hình UI/UX chi tiết cho từng loại lỗi
  const getErrorConfig = () => {
    switch (numericStatus) {
      case 401:
        return {
          icon: <Lock className="w-8 h-8 text-rose-500" />,
          title: "Phiên làm việc đã kết thúc",
          description: message || "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục học tập nhé!",
          primaryCTA: {
            text: "Đăng nhập ngay",
            action: () => navigateTo("/login"),
            icon: <Lock className="w-4 h-4 mr-2" />
          },
          secondaryCTA: {
            text: "Trở về trang chủ",
            action: () => navigateTo("/")
          }
        };

      case 403:
        return {
          icon: <ShieldAlert className="w-8 h-8 text-amber-500" />,
          title: "Không thể truy cập nội dung này",
          description: message || "Tài khoản của bạn hiện tại không có quyền truy cập vào đường dẫn hoặc tài nguyên này. Nếu có nhầm lẫn, vui lòng liên hệ admin.",
          primaryCTA: {
            text: "Quay lại trang chủ",
            action: () => navigateTo("/"),
            icon: <Home className="w-4 h-4 mr-2" />
          },
          secondaryCTA: {
            text: "Đăng nhập tài khoản khác",
            action: () => navigateTo("/login")
          }
        };

      case 429:
        return {
          icon: <Timer className="w-8 h-8 text-amber-500" />,
          title: "Bạn đang thao tác quá nhanh",
          description: message || "Hệ thống ghi nhận quá nhiều yêu cầu liên tiếp từ thiết bị của bạn. Xin hãy tạm nghỉ tay một lát để máy chủ của chúng tôi thở nhé!",
          primaryCTA: {
            text: countdown > 0 ? `Thử lại sau ${countdown}s` : "Thử lại ngay",
            action: onRetry || (() => window.location.reload()),
            disabled: countdown > 0,
            icon: <RefreshCw className={`w-4 h-4 mr-2 ${countdown > 0 ? "" : "animate-spin"}`} />
          },
          secondaryCTA: {
            text: "Về trang chủ",
            action: () => navigateTo("/")
          }
        };

      case 500:
        return {
          icon: <ServerCrash className="w-8 h-8 text-rose-500" />,
          title: "Hệ thống đang gặp sự cố nhỏ",
          description: message || "Máy chủ đang gặp một chút sự cố kỹ thuật nội bộ. Đội ngũ kỹ sư của Dream đang tích cực khắc phục sự cố này. Xin lỗi bạn vì sự gián đoạn!",
          primaryCTA: {
            text: "Thử lại",
            action: onRetry || (() => window.location.reload()),
            icon: <RefreshCw className="w-4 h-4 mr-2" />
          },
          secondaryCTA: {
            text: "Quay lại trang chủ",
            action: () => navigateTo("/")
          }
        };

      case 502:
      case 504:
        return {
          icon: <WifiOff className="w-8 h-8 text-gray-500" />,
          title: "Kết nối mạng không ổn định",
          description: message || "Không thể kết nối đến máy chủ do mạng chập chờn hoặc hết hạn thời gian phản hồi. Bạn hãy kiểm tra lại kết nối Wifi/4G của mình nhé.",
          primaryCTA: {
            text: "Thử lại kết nối",
            action: onRetry || (() => window.location.reload()),
            icon: <RefreshCw className="w-4 h-4 mr-2" />
          },
          secondaryCTA: {
            text: "Về trang chủ",
            action: () => navigateTo("/")
          }
        };

      case 503:
        return {
          icon: <Wrench className="w-8 h-8 text-amber-500" />,
          title: "Hệ thống đang bảo trì",
          description: message || "Nhằm nâng cấp hiệu năng và đem lại trải nghiệm học tập mượt mà nhất, Dream đang thực hiện bảo trì định kỳ. Chúng tôi sẽ sớm hoạt động lại!",
          primaryCTA: {
            text: "Kiểm tra lại",
            action: onRetry || (() => window.location.reload()),
            icon: <RefreshCw className="w-4 h-4 mr-2" />
          },
          secondaryCTA: {
            text: "Quay về trang chủ",
            action: () => navigateTo("/")
          }
        };

      case 404:
      default:
        return {
          icon: <FileQuestion className="w-8 h-8 text-rose-500" />,
          title: "Trang không tồn tại",
          description: message || "Đường dẫn bạn truy cập không chính xác hoặc nội dung này đã được di chuyển hoặc xóa khỏi hệ thống. Cùng tiếp tục hành trình học tập ở trang chủ nhé!",
          primaryCTA: {
            text: "Trở về trang chủ",
            action: () => navigateTo("/"),
            icon: <Home className="w-4 h-4 mr-2" />
          },
          secondaryCTA: {
            text: "Quay lại trang trước",
            action: () => navigateTo(-1),
            icon: <ArrowLeft className="w-4 h-4 mr-2" />
          }
        };
    }
  };

  const config = getErrorConfig();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Khối bọc thiết kế Premium căn giữa */}
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 p-8 shadow-xl relative z-10 flex flex-col items-center text-center">
        
        {/* Khối Icon lồng trong vòng tròn kép */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gray-100 rounded-full scale-150 opacity-50 blur-sm"></div>
          <div className="relative w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shadow-inner">
            {config.icon}
          </div>
        </div>

        {/* Mã lỗi & Tiêu đề */}
        <span className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">
          Mã Lỗi: {numericStatus}
        </span>
        <h2 className="text-2xl font-extrabold text-gray-950 mb-3 tracking-tight">
          {config.title}
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          {config.description}
        </p>

        {/* Khu vực CTA Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={config.primaryCTA.action}
            disabled={config.primaryCTA.disabled}
            className={`w-full flex items-center justify-center py-3.5 px-6 rounded-2xl text-sm font-semibold transition-all duration-300 shadow-md ${
              config.primaryCTA.disabled
                ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-rose-200/50 active:scale-[0.98] hover:scale-[1.01]"
            }`}
          >
            {config.primaryCTA.icon}
            {config.primaryCTA.text}
          </button>

          {config.secondaryCTA && (
            <button
              onClick={config.secondaryCTA.action}
              className="w-full flex items-center justify-center py-3.5 px-6 rounded-2xl text-sm font-medium text-gray-600 border border-gray-200/80 bg-white/50 hover:bg-gray-50 active:scale-[0.98] transition-all duration-200"
            >
              {config.secondaryCTA.icon}
              {config.secondaryCTA.text}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}