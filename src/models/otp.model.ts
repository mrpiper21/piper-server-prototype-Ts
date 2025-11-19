import mongoose, { Document, Schema } from 'mongoose';

// OTP interface
export interface IOTP extends Document {
  _id: string;
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
  isValid(): boolean;
}

// OTP schema
const otpSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
      index: true,
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
      length: [6, 'OTP must be 6 digits'],
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL index for auto-deletion
    },
    verified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
      max: [5, 'Maximum verification attempts exceeded'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
otpSchema.index({ email: 1, verified: 1 });
otpSchema.index({ email: 1, expiresAt: 1 });

// Static method to find valid OTP by email
otpSchema.statics.findValidOTP = function(email: string) {
  return this.findOne({
    email,
    verified: false,
    expiresAt: { $gt: new Date() },
  });
};

// Static method to find verified OTP by email
otpSchema.statics.findVerifiedOTP = function(email: string) {
  return this.findOne({
    email,
    verified: true,
    expiresAt: { $gt: new Date() },
  });
};

// Instance method to check if OTP is expired
otpSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

// Instance method to check if OTP is valid (not expired and not verified)
otpSchema.methods.isValid = function(): boolean {
  return !this.verified && !this.isExpired() && this.attempts < 5;
};

// Model interface
export interface IOTPModel extends mongoose.Model<IOTP> {
  findValidOTP(email: string): Promise<IOTP | null>;
  findVerifiedOTP(email: string): Promise<IOTP | null>;
}

const OTP = mongoose.model<IOTP, IOTPModel>('OTP', otpSchema);

export default OTP;

