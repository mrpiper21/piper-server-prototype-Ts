import type { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User, { UserRole, type Permission } from '../models/user.model.js';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
        permissions: Permission[];
      };
    }
  }
}

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { email, password, name, role = UserRole.CUSTOMER } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
        return;
      }

      // Create new user
      const user = new User({
        email,
        password,
        name,
        role
      });

      await user.save();

      // Generate token
      const token = user.generateAuthToken();

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { email, password } = req.body;

      // Find user with password
      const user = await User.findOne({ email, isActive: true }).select('+password');
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = user.generateAuthToken();

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.user?.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { name, email } = req.body;
      const userId = req.user?.userId;

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Check if email is being changed and if it's already taken
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          res.status(409).json({
            success: false,
            message: 'Email already in use'
          });
          return;
        }
        user.email = email;
      }

      if (name) {
        user.name = name;
      }

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Change password
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.userId;

      const user = await User.findById(userId).select('+password');
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
        return;
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Logout user (client-side token removal)
   */
  static async logout(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  }

  /**
   * Refresh token
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const user = await User.findById(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const token = user.generateAuthToken();

      res.json({
        success: true,
        data: {
          token
        }
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Verify token middleware
   */
  static verifyToken = (req: Request, res: Response, next: any): void => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Access token required'
        });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      req.user = decoded;
      next();
    } catch (error) {
      res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  };

  /**
   * Check permission middleware
   */
  static checkPermission = (permission: Permission) => {
    return (req: Request, res: Response, next: any): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!req.user.permissions.includes(permission)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    };
  };

  /**
   * Check role middleware
   */
  static checkRole = (roles: UserRole[]) => {
    return (req: Request, res: Response, next: any): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient role privileges'
        });
        return;
      }

      next();
    };
  };
}
