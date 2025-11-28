import { Router } from "express";
import { createCategory, getCategoryByAdminId, updateCategory, deleteCategory } from "../controllers/category.controller.js";
import { AuthController } from "../controllers/auth.controller.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(AuthController.verifyToken);

router.post("/", createCategory);
router.get("/admin/:adminId", getCategoryByAdminId);
router.put("/admin/:id", updateCategory);
router.delete("/admin/:id", deleteCategory);

export default router;