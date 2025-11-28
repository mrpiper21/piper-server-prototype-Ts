import { type Request, type Response } from "express";
import categoryModel from "../models/category.model.js";

export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name, unitPrice, description } = req.body;
        const adminId = req.user?.userId;
        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const category = new categoryModel({ name, unitPrice, description, adminId });
        await category.save();
        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category,
        });
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

export const getCategoryByAdminId = async (req: Request, res: Response) => {
    try {
        const { adminId } = req.params;
        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const categories = await categoryModel.find({ adminId });
        res.status(200).json({
            success: true,
            message: "Categories fetched successfully",
            data: categories,
            count: categories.length,
        });
    } catch (error) {
        console.error("Error fetching category by admin id:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

export const getCategoryById = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const category = await categoryModel.findById(id);
		res.status(200).json({
			success: true,
			message: "Category fetched successfully",
			data: category,
		});
	} catch (error) {
		console.error("Error fetching category by id:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, unitPrice, description } = req.body;
        const adminId = req.user?.userId;
        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const category = await categoryModel.findByIdAndUpdate(id, { name, unitPrice, description }, { new: true });
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category,
        });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = req.user?.userId;
        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const category = await categoryModel.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
            data: category,
        });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}