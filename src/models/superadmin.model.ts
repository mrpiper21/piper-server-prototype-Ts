import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole, Permission, ROLE_PERMISSIONS } from './shared/enums.js';

// SuperAdmin interface
export interface ISuperAdmin extends Document {
	_id: string;
	email: string;
	password: string;
	name: string;
	role: UserRole.SUPERADMIN;
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

// SuperAdmin schema
const superAdminSchema = new Schema<ISuperAdmin>(
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
		role: {
			type: String,
			enum: [UserRole.SUPERADMIN],
			required: [true, "Role is required"],
			default: UserRole.SUPERADMIN,
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

// Hash password before saving
superAdminSchema.pre('save', async function (next) {
	if (!this.isModified('password')) {
		return next();
	}
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

// Set permissions based on role before saving
superAdminSchema.pre('save', function (next) {
	if (this.isNew || this.isModified('role')) {
		this.permissions = ROLE_PERMISSIONS[UserRole.SUPERADMIN];
	}
	next();
});

// Indexes for better query performance
superAdminSchema.index({ role: 1 });
superAdminSchema.index({ isActive: 1 });
superAdminSchema.index({ email: 1 });

// Instance method to compare password
superAdminSchema.methods.comparePassword = async function (
	candidatePassword: string
): Promise<boolean> {
	return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
superAdminSchema.methods.generateAuthToken = function (): string {
	const payload: any = {
		superAdminId: this._id,
		email: this.email,
		role: UserRole.SUPERADMIN,
		permissions: this.permissions,
	};

	const secret = process.env.JWT_SECRET || "fallback-secret";
	return jwt.sign(payload, secret, {
		expiresIn: process.env.JWT_EXPIRE || "7d",
	} as jwt.SignOptions);
};

// Instance method to check permissions
superAdminSchema.methods.hasPermission = function (permission: Permission): boolean {
	return this.permissions.includes(permission);
};

// Instance method to return superadmin without sensitive data
superAdminSchema.methods.toJSON = function () {
	const superAdminObject = this.toObject();
	delete superAdminObject.password;
	delete superAdminObject.__v;
	return superAdminObject;
};

// Static method to find superadmin by email (including password)
superAdminSchema.statics.findByEmailWithPassword = function (email: string) {
	return this.findOne({ email, isActive: true }).select("+password");
};

// Define interface for static methods
interface ISuperAdminModel extends mongoose.Model<ISuperAdmin> {
	findByEmailWithPassword(email: string): Promise<ISuperAdmin | null>;
}

// Create and export the model
const SuperAdmin = mongoose.model<ISuperAdmin, ISuperAdminModel>("SuperAdmin", superAdminSchema);

export default SuperAdmin;

