import type { Request, Response } from 'express';
import User, { UserRole, Permission } from '../models/user.model.js';
import { validationResult } from 'express-validator';

export class UserController {
  /**
   * Get all users (Admin only)
   */
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const { role, isActive, page = 1, limit = 10, search } = req.query;
      
      // Build query
      const query: any = {};
      
      if (role) {
        query.role = role;
      }
      
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Calculate pagination
      const skip = (Number(page) - 1) * Number(limit);
      
      // Get users with pagination
      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
      
      // Get total count
      const total = await User.countDocuments(query);
      
      res.json({
        success: true,
        data: {
          users,
          pagination: {
            current: Number(page),
            pages: Math.ceil(total / Number(limit)),
            total,
            limit: Number(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id).select('-password');
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Create new user (Admin only)
   */
  static async createUser(req: Request, res: Response): Promise<void> {
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

      const {
				email,
				password,
				name,
				role = UserRole.CLERK,
				permissions,
			} = req.body;

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
        role,
        permissions: permissions || []
      });

      await user.save();

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update user (Admin only)
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { email, name, role, permissions, isActive } = req.body;

      const user = await User.findById(id);
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

      if (name) user.name = name;
      if (role) user.role = role;
      if (permissions) user.permissions = permissions;
      if (isActive !== undefined) user.isActive = isActive;

      await user.save();

      res.json({
        success: true,
        message: 'User updated successfully',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete user (Admin only)
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Prevent admin from deleting themselves
      if (req.user?.userId === id) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Soft delete - set isActive to false
      user.isActive = false;
      await user.save();

      res.json({
        success: true,
        message: 'User deactivated successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Reset user password (Admin only)
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(req: Request, res: Response): Promise<void> {
    try {
      const { role } = req.params;
      
      if (!Object.values(UserRole).includes(role as UserRole)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
        return;
      }

      const users = await User.find({ role, isActive: true }).select('-password');
      
      res.json({
        success: true,
        data: { users }
      });
    } catch (error) {
      console.error('Get users by role error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get user statistics (Admin only)
   */
  static async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const totalUsers = await User.countDocuments({ isActive: true });
      const usersByRole = await User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);
      
      const recentUsers = await User.find({ isActive: true })
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        success: true,
        data: {
          totalUsers,
          usersByRole,
          recentUsers
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Bulk update user roles (Admin only)
   */
  static async bulkUpdateRoles(req: Request, res: Response): Promise<void> {
    try {
      const { userIds, role } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'User IDs array is required'
        });
        return;
      }

      if (!Object.values(UserRole).includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
        return;
      }

      const result = await User.updateMany(
        { _id: { $in: userIds } },
        { role }
      );

      res.json({
        success: true,
        message: `${result.modifiedCount} users updated successfully`,
        data: {
          modifiedCount: result.modifiedCount
        }
      });
    } catch (error) {
      console.error('Bulk update roles error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
