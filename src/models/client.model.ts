import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Client interface
export interface IClient extends Document {
  _id: string;
  email: string;
  password: string;
  fullName: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  phoneNumber: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User schema
const clientSchema = new Schema<IClient>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    maxlength: [15, 'Phone number cannot exceed 15 characters']
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
// Note: email index is already created by unique: true constraint
clientSchema.index({ role: 1 });
clientSchema.index({ isActive: 1 });

// Pre-save middleware to hash password
clientSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
  if (this.password && /^\$2[aby]\$\d+\$/.test(this.password)) {
    // Password is already hashed, don't hash again
    return next();
  }
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware to set permissions based on rol

// Instance method to compare password
clientSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
clientSchema.methods.generateAuthToken = function(): string {
  const payload = {
    userId: this._id,
    email: this.email,
    role: this.role,
    permissions: this.permissions
  };
  
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  } as jwt.SignOptions);
};



// Static method to find user by email (including password)
clientSchema.statics.findByEmailWithPassword = function(email: string) {
  return this.findOne({ email, isActive: true }).select('+password');
};

// Create and export the model
const Client = mongoose.model<IClient>('Client', clientSchema);

export default Client;
