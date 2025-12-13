import { useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const ReportModal = ({ open, onClose, onSubmit, reasons }) => {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const { error, loading } = useSelector(state => state.report);
  if (!open) return null;

  const handleSend = () => {
    if (!reason) {
      toast.error("Vui lòng chọn lý do báo cáo!");
      return;
    }
    onSubmit(reason, detail);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div className="bg-white rounded-xl p-8 w-full max-w-2xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-4">Báo cáo lạm dụng</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Nhân viên sẽ xem xét nội dung bị gắn cờ để xác định xem có vi phạm điều khoản dịch vụ hoặc nguyên tắc cộng đồng hay không.
        </p>
        <label className="text-left block mb-2 font-semibold">Loại vấn đề</label>
        <select
          className="w-full border rounded px-3 py-3 mb-6 text-base"
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
        >
          <option value="">Chọn một vấn đề</option>
          {reasons.map((r, idx) => (
            <option key={idx} value={r}>{r}</option>
          ))}
        </select>
        <label className="text-left block mb-2 font-semibold">Thông tin về vấn đề</label>
        <textarea
          className="w-full border rounded px-3 py-3 mb-6 text-base"
          rows={4}
          value={detail}
          onChange={e => setDetail(e.target.value)}
          placeholder="Mô tả chi tiết vấn đề bạn muốn báo cáo"
        />
        {error && (
          <div className="text-red-500 text-sm mb-2">{error}</div>
        )}
        <div className="flex justify-end gap-2">
          <button className="px-5 py-2 rounded bg-gray-200 text-base" onClick={onClose}>Hủy</button>
          <button
            className="px-5 py-2 rounded font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-md shadow-rose-200 text-base transition"
            onClick={handleSend}
            disabled={!!error || loading}
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};
export default ReportModal;