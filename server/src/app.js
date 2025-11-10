import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./modules/auth/auth.routes.js";
// import categoryRoutes from "./modules/category/category.routes.js";
// import courseRoutes from "./modules/course/course.routes.js";
// import enrollmentRoutes from "./modules/enrollment/enrollment.routes.js";
// import paymentRoutes from "./modules/payment/payment.routes.js";
// import progressRoutes from "./modules/progress/progress.routes.js";
// import reviewRoutes from "./modules/review/review.routes.js";
// import wishlistRoutes from "./modules/wishlist/wishlist.routes.js";


const app = express();

app.use(express.json());
app.use(cors(
    {
        origin: 'http://localhost:5173',
        credential: true
    }
));
app.use(morgan("dev"));


app.use("/api/auth", authRoutes);
// app.use("/api/categories", categoryRoutes);
// app.use("/api/courses", courseRoutes);
// app.use("/api/enrollments", enrollmentRoutes);
// app.use("/api/payments", paymentRoutes);
// app.use("/api/progress", progressRoutes);
// app.use("/api/reviews", reviewRoutes);
// app.use("/api/wishlist", wishlistRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("ERROR:", err);
  res.status(err.status || 500).json({
    message: err.message || "Server Error",
  });
});

export default app;