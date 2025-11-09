import { body, param, query } from 'express-validator';
import { UserRole, Permission } from '../models/user.model.js';

export const authValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('role')
      .optional()
      .isIn(Object.values(UserRole))
      .withMessage('Invalid role')
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email')
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
  ]
};

export const userValidation = {
  createUser: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('role')
      .isIn(Object.values(UserRole))
      .withMessage('Invalid role'),
    body('permissions')
      .optional()
      .isArray()
      .withMessage('Permissions must be an array'),
    body('permissions.*')
      .optional()
      .isIn(Object.values(Permission))
      .withMessage('Invalid permission')
  ],

  updateUser: [
    param('id')
      .isMongoId()
      .withMessage('Invalid user ID'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('role')
      .optional()
      .isIn(Object.values(UserRole))
      .withMessage('Invalid role'),
    body('permissions')
      .optional()
      .isArray()
      .withMessage('Permissions must be an array'),
    body('permissions.*')
      .optional()
      .isIn(Object.values(Permission))
      .withMessage('Invalid permission'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],

  getUserById: [
    param('id')
      .isMongoId()
      .withMessage('Invalid user ID')
  ],

  deleteUser: [
    param('id')
      .isMongoId()
      .withMessage('Invalid user ID')
  ],

  resetPassword: [
    param('id')
      .isMongoId()
      .withMessage('Invalid user ID'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
  ],

  getUsersByRole: [
    param('role')
      .isIn(Object.values(UserRole))
      .withMessage('Invalid role')
  ],

  getAllUsers: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('role')
      .optional()
      .isIn(Object.values(UserRole))
      .withMessage('Invalid role'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters')
  ],

  bulkUpdateRoles: [
    body('userIds')
      .isArray({ min: 1 })
      .withMessage('User IDs array is required'),
    body('userIds.*')
      .isMongoId()
      .withMessage('Invalid user ID'),
    body('role')
      .isIn(Object.values(UserRole))
      .withMessage('Invalid role')
  ]
};

export const clientValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('phoneNumber')
      .trim()
      .isLength({ min: 10, max: 15 })
      .withMessage('Phone number must be between 10 and 15 characters')
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .withMessage('Please provide a valid phone number')
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  updateProfile: [
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('phoneNumber')
      .optional()
      .trim()
      .isLength({ min: 10, max: 15 })
      .withMessage('Phone number must be between 10 and 15 characters')
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .withMessage('Please provide a valid phone number')
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
  ],

  createClient: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('phoneNumber')
      .trim()
      .isLength({ min: 10, max: 15 })
      .withMessage('Phone number must be between 10 and 15 characters')
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .withMessage('Please provide a valid phone number')
  ],

  updateClient: [
    param('id')
      .isMongoId()
      .withMessage('Invalid client ID'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('phoneNumber')
      .optional()
      .trim()
      .isLength({ min: 10, max: 15 })
      .withMessage('Phone number must be between 10 and 15 characters')
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .withMessage('Please provide a valid phone number'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],

  getClientById: [
    param('id')
      .isMongoId()
      .withMessage('Invalid client ID')
  ],

  deleteClient: [
    param('id')
      .isMongoId()
      .withMessage('Invalid client ID')
  ],

  getAllClients: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters')
  ]
};
