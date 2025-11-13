/**
 * Database Functions - Complete Import Reference
 *
 * This file provides a centralized import for all database functions.
 * Import this file anywhere you need database access.
 *
 * Usage:
 * import * as Database from '../utils/databaseImports';
 *
 * Then use: Database.createUser(), Database.getUserByEmail(), etc.
 */

// Import all database functions
import {
    clearResetToken,
    createUser,
    getAllUsers,
    getDatabase,
    getUserByEmail,
    initDatabase,
    saveResetToken,
    updateUserPassword,
    verifyResetToken
} from './database';

// Import all password utility functions
import {
    comparePassword,
    generateResetToken,
    getPasswordStrength,
    hashPassword,
    validateEmail,
    validatePassword
} from './passwordUtils';

// Re-export all database functions
export {
    clearResetToken, comparePassword,
    // User Management Functions
    createUser, generateResetToken, getAllUsers, getDatabase, getPasswordStrength, getUserByEmail,
    // Password Utility Functions
    hashPassword,
    // Database Core Functions
    initDatabase,
    // Password Reset Functions
    saveResetToken, updateUserPassword, validateEmail,
    validatePassword, verifyResetToken
};

// Default export as an object for convenience
export default {
  // Database Core
  initDatabase,
  getDatabase,

  // User Management
  createUser,
  getUserByEmail,
  updateUserPassword,
  getAllUsers,

  // Password Reset
  saveResetToken,
  verifyResetToken,
  clearResetToken,

  // Password Utils
  hashPassword,
  comparePassword,
  validateEmail,
  validatePassword,
  getPasswordStrength,
  generateResetToken
};
