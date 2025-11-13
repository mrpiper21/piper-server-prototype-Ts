import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// User roles enum
export enum UserRole {
	ADMIN = "admin",
	CLERK = "clerk",
}

// User permissions enum
export enum Permission {
	// Admin permissions
	MANAGE_USERS = "manage_users",
	VIEW_ANALYTICS = "view_analytics",
	MANAGE_SYSTEM = "manage_system",
	VIEW_ALL_JOBS = "view_all_jobs",

	// Clerk permissions
	MANAGE_JOBS = "manage_jobs",
	SUBMIT_PRINTS = "submit_prints",
	VIEW_AGENTS = "view_agents",

	// Manager permissions
	VIEW_REPORTS = "view_reports",
	MANAGE_AGENTS = "manage_agents",

	// Technician permissions
	MAINTAIN_PRINTERS = "maintain_printers",
	VIEW_LOGS = "view_logs",

	// Customer permissions
	SUBMIT_JOBS = "submit_jobs",
	VIEW_OWN_JOBS = "view_own_jobs",
}

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
	[UserRole.ADMIN]: [
		Permission.MANAGE_USERS,
		Permission.VIEW_ANALYTICS,
		Permission.MANAGE_SYSTEM,
		Permission.VIEW_ALL_JOBS,
		Permission.MANAGE_JOBS,
		Permission.SUBMIT_PRINTS,
		Permission.VIEW_AGENTS,
		Permission.VIEW_REPORTS,
		Permission.MANAGE_AGENTS,
		Permission.MAINTAIN_PRINTERS,
		Permission.VIEW_LOGS,
	],
	[UserRole.CLERK]: [
		Permission.MANAGE_JOBS,
		Permission.SUBMIT_PRINTS,
		// Permission.VIEW_AGENTS,
		Permission.VIEW_OWN_JOBS,
		Permission.MANAGE_USERS,
	],
};

// User interface (for Admins only)
export interface IUser extends Document {
	_id: string;
	email: string;
	password: string;
	name: string;
	role: UserRole.ADMIN; // Users are only admins now
	location: {
		latitude: number;
		longitude: number;
		address: string;
	};
	permissions: Permission[];
	isActive: boolean;
	lastLogin?: Date;
	createdAt: Date;
	updatedAt: Date;

	// Methods
	comparePassword(candidatePassword: string): Promise<boolean>;
	generateAuthToken(): string;
	hasPermission(permission: Permission): boolean;
	toJSON(): any;
}

// User schema
const userSchema = new Schema<IUser>(
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
		role: {
			type: String,
			enum: [UserRole.ADMIN],
			required: [true, "Role is required"],
			default: UserRole.ADMIN,
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

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ adminId: 1 });
userSchema.pre("save", async function (next) {
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

// Pre-save middleware to set permissions based on role
userSchema.pre("save", function (next) {
	// Admins always get all permissions
	if (
		this.isModified("role") ||
		!this.permissions ||
		this.permissions.length === 0
	) {
		this.permissions = ROLE_PERMISSIONS[UserRole.ADMIN];
	}
	next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (
	candidatePassword: string
): Promise<boolean> {
	return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function (): string {
	const payload: any = {
		userId: this._id,
		email: this.email,
		role: UserRole.ADMIN,
		permissions: this.permissions,
	};

	const secret = process.env.JWT_SECRET || "fallback-secret";
	return jwt.sign(payload, secret, {
		expiresIn: process.env.JWT_EXPIRE || "7d",
	} as jwt.SignOptions);
};

// Instance method to check permissions
userSchema.methods.hasPermission = function (permission: Permission): boolean {
	return this.permissions.includes(permission);
};

// Instance method to return user without sensitive data
userSchema.methods.toJSON = function () {
	const userObject = this.toObject();
	delete userObject.password;
	delete userObject.__v;
	return userObject;
};

// Static method to find user by email (including password)
userSchema.statics.findByEmailWithPassword = function (email: string) {
	return this.findOne({ email, isActive: true }).select("+password");
};

// Static method to create admin user
userSchema.statics.createAdmin = async function (userData: {
	email: string;
	password: string;
	name: string;
}) {
	const admin = new this({
		...userData,
		role: UserRole.ADMIN,
	});

	await admin.save();
	return admin;
};

// Static method to get all admins
userSchema.statics.getAllAdmins = function () {
	return this.find({ role: UserRole.ADMIN, isActive: true }).select(
		"-password"
	);
};

// Virtual for user's full profile
userSchema.virtual("profile").get(function () {
	return {
		id: this._id,
		email: this.email,
		name: this.name,
		role: this.role,
		permissions: this.permissions,
		isActive: this.isActive,
		lastLogin: this.lastLogin,
		createdAt: this.createdAt,
	};
});

// Define interface for static methods
interface IUserModel extends mongoose.Model<IUser> {
	findByEmailWithPassword(email: string): Promise<IUser | null>;
	createAdmin(userData: {
		email: string;
		password: string;
		name: string;
	}): Promise<IUser>;
	getAllAdmins(): Promise<IUser[]>;
}

// Create and export the model
const User = mongoose.model<IUser, IUserModel>("User", userSchema);

export default User;
