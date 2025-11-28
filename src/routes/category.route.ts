import { Router } from "express";
import {
	createCategory,
	getCategoryByAdminId,
	updateCategory,
	deleteCategory,
	getCategoryById,
} from "../controllers/category.controller.js";
import { AuthController } from "../controllers/auth.controller.js";

const router = Router();

router.post("/", AuthController.verifyToken, createCategory);
router.get("/admin/:adminId", getCategoryByAdminId);
router.get("/:id", getCategoryById);
router.put("/admin/:id", AuthController.verifyToken, updateCategory);
router.delete("/admin/:id", AuthController.verifyToken, deleteCategory);

export default router;