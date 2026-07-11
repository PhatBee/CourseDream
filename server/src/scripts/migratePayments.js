import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Payment from '../modules/payment/payment.model.js';
import Course from '../modules/course/course.model.js';

const migratePayments = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully!");

    // Tìm tất cả payment có status success mà mảng items rỗng hoặc null
    const payments = await Payment.find({
      status: 'success',
      $or: [
        { items: { $exists: false } },
        { items: { $size: 0 } },
        { items: null }
      ]
    });

    console.log(`Found ${payments.length} successful payments with empty items. Starting migration...`);

    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];
      console.log(`[${i + 1}/${payments.length}] Processing Payment ID: ${payment._id}, OrderId: ${payment.orderId}, Amount: ${payment.amount}`);

      if (!payment.courses || payment.courses.length === 0) {
        console.log(`⚠️ Payment ${payment._id} has no courses, skipping.`);
        continue;
      }

      // Lấy thông tin các khóa học
      const coursesData = await Course.find({ _id: { $in: payment.courses } });
      if (coursesData.length === 0) {
        console.log(`⚠️ Courses for Payment ${payment._id} not found in DB, skipping.`);
        continue;
      }

      const totalCoursePrice = coursesData.reduce((sum, c) => sum + (c.priceDiscount ?? c.price ?? 0), 0);
      const totalAmount = payment.amount ?? 0;

      const newItems = [];
      let remainingAmount = totalAmount;

      coursesData.forEach((course, idx) => {
        const cPrice = course.priceDiscount ?? course.price ?? 0;
        let itemFinalPrice = 0;

        if (totalCoursePrice > 0) {
          if (idx === coursesData.length - 1) {
            itemFinalPrice = remainingAmount;
          } else {
            itemFinalPrice = Math.round((cPrice / totalCoursePrice) * totalAmount);
            remainingAmount -= itemFinalPrice;
          }
        }

        const netPrice = Math.round(itemFinalPrice / 1.1);
        const vatAmount = itemFinalPrice - netPrice;
        const instructorShare = Math.round(netPrice * 0.7);
        const adminShare = netPrice - instructorShare;

        newItems.push({
          course: course._id,
          originalPrice: course.price ?? 0,
          discountPercentage: course.priceDiscount && course.price ? Math.round(((course.price - course.priceDiscount) / course.price) * 100) : 0,
          discountAmount: (course.price ?? 0) - (course.priceDiscount ?? course.price ?? 0),
          netPrice,
          vatAmount,
          finalPrice: itemFinalPrice,
          instructorShare,
          adminShare,
          appliedType: 'none'
        });
      });

      payment.items = newItems;
      await payment.save();
      console.log(`✅ Migrated Payment ID: ${payment._id} with ${newItems.length} items.`);
    }

    console.log("All payments have been migrated successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migratePayments();
