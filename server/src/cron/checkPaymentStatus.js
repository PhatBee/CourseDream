import cron from "node-cron";
import Payment from "../modules/payment/payment.model.js";

export default function checkPaymentStatus() {
    cron.schedule("*/5 * * * *", async () => {
        console.log("[Cron] Checking pending VNPAY, MOMO payments...");

        // Thời gian quá hạn: 15 phút
        const expiredTime = new Date(Date.now() - 15 * 60 * 1000);

        // Lấy các payment pending quá 15 phút
        const pendingPayments = await Payment.find({
            status: "pending",
            createdAt: { $lt: expiredTime }
        });

        if (pendingPayments.length === 0) return;

        console.log(`Found ${pendingPayments.length} expired pending payments.`);

        for (const payment of pendingPayments) {
            try {
                payment.status = "failed";
                payment.responseCode = "11";
                await payment.save();

                console.log(`→ Payment ${payment.orderId} marked as FAILED (timeout).`);
            } catch (err) {
                console.error(`Error updating payment ${payment.orderId}:`, err);
            }
        }
    });
}