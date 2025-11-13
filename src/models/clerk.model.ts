import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Permission, ROLE_PERMISSIONS, UserRole } from "./user.model.js";

// Clerk interface
export interface IClerk extends Document {
	_id: string;
	email: string;
	password: string;
	name: string;
	adminId: mongoose.Types.ObjectId; // Reference to admin who created this clerk
	location: {
		latitude: number;
		longitude: number;
		address: string;
	};
	permissions: Permission[]; // Custom permissions granted by admin
	isActive: boolean;
	isTemporaryPassword: boolean; // Flag to indicate if password needs to be changed
	lastLogin?: Date;
	createdAt: Date;
	updatedAt: Date;

	// Methods
	comparePassword(candidatePassword: string): Promise<boolean>;
	generateAuthToken(): string;
	hasPermission(permission: Permission): boolean;
	toJSON(): any;
}

// Clerk schema
const clerkSchema = new Schema<IClerk>(
	{
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
			match: [
				/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
				"Please enter a valid email",
			],
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [6, "Password must be at least 6 characters"],
			select: false,
		},
		location: {
			latitude: {
				type: Number,
				required: false,
			},
			longitude: {
				type: Number,
				required: false,
			},
			address: {
				type: String,
				required: false,
			},
		},
		name: {
			type: String,
			required: [true, "Name is required"],
			trim: true,
			maxlength: [100, "Name cannot exceed 100 characters"],
		},
		adminId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User", // Reference to Admin (User model)
			required: [true, "Admin ID is required"],
			index: true,
		},
		permissions: [
			{
				type: String,
				enum: Object.values(Permission),
			},
		],
		isActive: {
			type: Boolean,
			default: true,
		},
		isTemporaryPassword: {
			type: Boolean,
			default: true,
		},
		lastLogin: {
			type: Date,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Indexes for better query performance
clerkSchema.index({ adminId: 1 });
clerkSchema.index({ isActive: 1 });
clerkSchema.index({ email: 1 });

// Pre-save middleware to hash password
clerkSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	try {
		// Hash password with cost of 12
		const salt = await bcrypt.genSalt(12);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error as Error);
	}
});

// Pre-save middleware to set default permissions if none provided
clerkSchema.pre("save", function (next) {
	// If permissions are not set or empty, use default clerk permissions
	if (!this.permissions || this.permissions.length === 0) {
		this.permissions = ROLE_PERMISSIONS[UserRole.CLERK];
	}
	next();
});

// Instance method to compare password
clerkSchema.methods.comparePassword = async function (
	candidatePassword: string
): Promise<boolean> {
	return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
clerkSchema.methods.generateAuthToken = function (): string {
	const payload: any = {
		clerkId: this._id,
		email: this.email,
		role: UserRole.CLERK,
		permissions: this.permissions,
		adminId: this.adminId.toString(), // Include adminId for job filtering
	};

	const secret = process.env.JWT_SECRET || "fallback-secret";
	return jwt.sign(payload, secret, {
		expiresIn: process.env.JWT_EXPIRE || "7d",
	} as jwt.SignOptions);
};

// Instance method to check permissions
clerkSchema.methods.hasPermission = function (permission: Permission): boolean {
	return this.permissions.includes(permission);
};

// Instance method to return clerk without sensitive data
clerkSchema.methods.toJSON = function () {
	const clerkObject = this.toObject();
	delete clerkObject.password;
	delete clerkObject.__v;
	return clerkObject;
};

// Static method to find clerk by email (including password)
clerkSchema.statics.findByEmailWithPassword = function (email: string) {
	return this.findOne({ email, isActive: true }).select("+password");
};

// Static method to get clerks by admin ID
clerkSchema.statics.getClerksByAdmin = function (
	adminId: mongoose.Types.ObjectId
) {
	return this.find({ adminId, isActive: true }).select("-password");
};

// Virtual for clerk's full profile
clerkSchema.virtual("profile").get(function () {
	return {
		id: this._id,
		email: this.email,
		name: this.name,
		role: UserRole.CLERK,
		permissions: this.permissions,
		isActive: this.isActive,
		lastLogin: this.lastLogin,
		createdAt: this.createdAt,
		adminId: this.adminId,
	};
});

// Define interface for static methods
interface IClerkModel extends mongoose.Model<IClerk> {
	findByEmailWithPassword(email: string): Promise<IClerk | null>;
	getClerksByAdmin(adminId: mongoose.Types.ObjectId): Promise<IClerk[]>;
}

// Create and export the model
const Clerk = mongoose.model<IClerk, IClerkModel>("Clerk", clerkSchema);

export default Clerk;

