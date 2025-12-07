import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole, Permission, ROLE_PERMISSIONS } from './shared/enums.js';

// User interface (for Admins/Print Stations)
export interface IUser extends Document {
	_id: string;
	email: string;
	password: string;
	name: string;
	role: UserRole.ADMIN;
	location: {
		latitude: number;
		longitude: number;
		address: string;
	};
	businessName: string;
	businessPhone: string;
	businessCoverImage?: string;
	paystackSubaccountCode?: string;
	websiteUrl?: string;
	rating?: mongoose.Types.ObjectId;
	workingHours?: {
		day: string;
		isOpen: boolean;
		openTime?: string;
		closeTime?: string;
	}[];
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
		name: {
			type: String,
			required: [true, "Name is required"],
			trim: true,
			maxlength: [100, "Name cannot exceed 100 characters"],
		},
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
		businessName: {
			type: String,
			required: false,
		},
		websiteUrl: {
			type: String,
			required: false,
		},
		businessPhone: {
			type: String,
			required: false,
		},
		paystackSubaccountCode: {
			type: String,
			required: false,
		},
		businessCoverImage: {
			type: String,
			required: false,
		},
		rating: {
			type: Schema.Types.ObjectId,
			ref: "Rating",
			required: false,
			default: null,
		},
		workingHours: [
			{
				day: {
					type: String,
					enum: [
						"monday",
						"tuesday",
						"wednesday",
						"thursday",
						"friday",
						"saturday",
						"sunday",
					],
					required: true,
				},
				isOpen: {
					type: Boolean,
					default: false,
				},
				openTime: {
					type: String,
					required: false,
					match: [
						/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
						"Invalid time format. Use HH:mm",
					],
				},
				closeTime: {
					type: String,
					required: false,
					match: [
						/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
						"Invalid time format. Use HH:mm",
					],
				},
			},
		],
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

// Indexes for better query performance
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
// Note: email index is already created by unique: true constraint

// Pre-save middleware to hash password
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

// Static method to create user (admin)
userSchema.statics.createUser = async function (userData: {
	email: string;
	password: string;
	name: string;
}) {
	const user = new this({
		...userData,
		role: UserRole.ADMIN,
	});

	await user.save();
	return user;
};

// Static method to get all users (admins)
userSchema.statics.getAllUsers = function () {
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
	createUser(userData: {
		email: string;
		password: string;
		name: string;
	}): Promise<IUser>;
	getAllUsers(): Promise<IUser[]>;
}

// Create and export the model
// Collection name is "User" to maintain data consistency
const User = mongoose.model<IUser, IUserModel>("User", userSchema);

export default User;
