import express from "express";
import { addToWishlist, removeFromWishlist, getWishlist } from "./wishlist.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/:courseId", verifyToken, addToWishlist);
router.delete("/:courseId", verifyToken, removeFromWishlist);
router.get("/", verifyToken, getWishlist);

export default router;