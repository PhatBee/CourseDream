import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js"
import adminRoutes from "./modules/admin/admin.routes.js";
import categoryRoutes from "./modules/category/category.routes.js";
import courseRoutes from "./modules/course/course.routes.js";
// import enrollmentRoutes from "./modules/enrollment/enrollment.routes.js";
// import paymentRoutes from "./modules/payment/payment.routes.js";
import progressRoutes from "./modules/progress/progress.routes.js";
// import reviewRoutes from "./modules/review/review.routes.js";
import wishlistRoutes from "./modules/wishlist/wishlist.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import { verifyToken } from "./middlewares/auth.middleware.js"
import enrollmentRoutes from "./modules/enrollment/enrollment.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import reviewRoutes from "./modules/review/review.routes.js";
import instructorRoutes from "./modules/instructor/instructor.routes.js";

const app = express();

// CORS CONFIG
const allowedOrigins = ["http://localhost:5173"];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// MIDDLEWARES
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));


// routes
app.use("/api/auth", authRoutes);
app.use("/api/users", verifyToken, userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/courses", courseRoutes);
// app.use("/api/enrollments", enrollmentRoutes);
// app.use("/api/payments", paymentRoutes);
app.use("/api/progress", progressRoutes);
// app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", verifyToken, wishlistRoutes);
app.use("/api/cart", verifyToken, cartRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/instructor", instructorRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("ERROR:", err);
  res.status(err.status || 500).json({
    message: err.message || "Server Error",
  });
});

export default app;