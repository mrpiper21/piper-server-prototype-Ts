import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import printerRoutes from './routes/printer.route.js';
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import clientRoutes from "./routes/client.route.js";
import multer from "multer";
import mongoose from "mongoose";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
import { connectDB } from "./db/connection.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import { startKeepAlive } from "./utils/keepAlive.js";

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
	cors({
		origin: [
			"http://localhost:5174",
			"http://localhost:5173",
			"https://piper-client-phi.vercel.app",
		],
		credentials: false,
	})
);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Database connection
connectDB();

// Routes
app.use("/api/print", printerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
	res.json({
		success: true,
		message: "Printer Management System API is running",
		timestamp: new Date().toISOString(),
		version: "1.0.0",
	});
});

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
	if (error instanceof multer.MulterError) {
		if (error.code === "LIMIT_FILE_SIZE") {
			return res.status(400).json({
				success: false,
				message: "File too large. Maximum size is 50MB",
			});
		}
	}

	res.status(500).json({
		success: false,
		message: error.message || "Internal Server Error",
	});
});

// 404 handler
app.use("*", (req: Request, res: Response) => {
	res.status(404).json({
		success: false,
		message: "Route not found",
	});
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
	console.log(
		`🚀 Printer Management System API server running on port ${PORT}`
	);
	console.log(`Environment: ${process.env.NODE_ENV}`);
	
	// Start keep-alive to prevent Render free tier spin-down
	// Pass server instance for cleanup on shutdown
	startKeepAlive(server);
});
