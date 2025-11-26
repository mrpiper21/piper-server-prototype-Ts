import mongoose from 'mongoose';
import User from "./src/models/user.model.js";
import { UserRole } from "./src/models/shared/enums.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const setupDatabase = async () => {
	try {
		// Connect to MongoDB
		await mongoose.connect(
			process.env.MONGODB_URI || "mongodb://localhost:27017/printer-management"
		);
		console.log("Connected to MongoDB");

		// Check if admin user already exists
		const existingUser = await User.findOne({ email: "admin@example.com" });
		if (existingUser) {
			console.log("Admin user already exists");
			return;
		}

		// Create default admin user
		const adminUser = new User({
			email: "admin@example.com",
			password: "admin123",
			name: "System Administrator",
			role: UserRole.ADMIN,
		});

		await adminUser.save();
		console.log("✅ Admin user created successfully");
		console.log("Email: admin@example.com");
		console.log("Password: admin123");

		console.log("\n🎉 Database setup completed successfully!");
		console.log("\nDefault admin created:");
		console.log("1. Admin: admin@example.com / admin123");
	} catch (error) {
		console.error("Error setting up database:", error);
	} finally {
		await mongoose.disconnect();
		console.log("Disconnected from MongoDB");
	}
};

// Run the setup
setupDatabase();
